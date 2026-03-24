import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createHmac } from "crypto";
import { createPublicClient, createWalletClient, http, type Hex } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { arc } from "@/lib/blockchain/arc";
import {
  XCROW_ROUTER_ABI,
  XCROW_ROUTER_ADDRESS,
  XCROW_ESCROW_ABI,
  XCROW_ESCROW_ADDRESS,
} from "@/lib/blockchain/contracts/XcrowRouter";
import type { OutputType, OutputMetadata } from "@/lib/supabase/client";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const MAX_ATTEMPTS = 3;
const HMAC_SECRET = process.env.ARCADE_HMAC_SECRET;

const publicClient = createPublicClient({ chain: arc, transport: http() });

function getWalletClient() {
  const pk = process.env.ARC_PRIVATE_KEY;
  if (!pk) throw new Error("ARC_PRIVATE_KEY not set");
  const account = privateKeyToAccount(
    (pk.startsWith("0x") ? pk : `0x${pk}`) as Hex
  );
  return createWalletClient({ account, chain: arc, transport: http() });
}

/** Sign a request body with HMAC-SHA256 */
function signPayload(body: string, timestamp: number): string {
  if (!HMAC_SECRET) return "";
  return createHmac("sha256", HMAC_SECRET)
    .update(`${timestamp}.${body}`)
    .digest("hex");
}

/** Detect output_type from agent response fields */
function detectOutputType(result: Record<string, unknown>): OutputType {
  if (typeof result.output_type === "string") {
    const t = result.output_type as string;
    if (["text", "code", "file", "media", "json"].includes(t)) return t as OutputType;
  }

  const hasFiles = Array.isArray(result.output_files ?? result.files);
  const hasCode = !!(result.code || result.language);

  if (hasCode) return "code";

  if (hasFiles) {
    const files = (result.output_files ?? result.files) as string[];
    const mediaExts = /\.(mp4|webm|mov|mp3|wav|ogg|png|jpg|jpeg|gif|webp|svg)$/i;
    const allMedia = files.length > 0 && files.every((f) => mediaExts.test(f));
    return allMedia ? "media" : "file";
  }

  const text = (result.output_text || result.output || result.result || result.response || result.text) as string | undefined;
  if (text) {
    try {
      const parsed = JSON.parse(text);
      if (typeof parsed === "object" && parsed !== null) return "json";
    } catch {}
  }

  return "text";
}

/** Extract metadata from agent response */
function extractMetadata(result: Record<string, unknown>): OutputMetadata | null {
  const meta: OutputMetadata = {};
  if (typeof result.language === "string") meta.language = result.language;
  if (Array.isArray(result.mime_types)) meta.mimeTypes = result.mime_types;
  if (Array.isArray(result.labels)) meta.labels = result.labels;
  if (result.metadata && typeof result.metadata === "object") {
    Object.assign(meta, result.metadata);
  }
  return Object.keys(meta).length > 0 ? meta : null;
}

/** Mark job as failed in Supabase */
async function markFailed(jobId: string, error: string, attempts: number) {
  await supabase
    .from("jobs")
    .update({ execution_status: "failed", execution_error: error, execution_attempts: attempts })
    .eq("job_id", jobId);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { job_id, retry } = body;

    if (!job_id) {
      return NextResponse.json({ error: "job_id is required" }, { status: 400 });
    }

    const { data: job, error: fetchErr } = await supabase
      .from("jobs")
      .select("*")
      .eq("job_id", job_id)
      .single();

    if (fetchErr || !job) {
      return NextResponse.json(
        { error: "Job not found", details: fetchErr?.message },
        { status: 404 }
      );
    }

    if (!job.agent_endpoint) {
      return NextResponse.json(
        { error: "Agent has no endpoint configured" },
        { status: 400 }
      );
    }

    // Already has output — don't call again (unless explicitly retrying a failed job)
    if ((job.output_text || job.output_files) && !retry) {
      return NextResponse.json({ status: "already_completed", output_text: job.output_text });
    }

    // Check max attempts
    const attempts = (job.execution_attempts ?? 0) + 1;
    if (attempts > MAX_ATTEMPTS) {
      return NextResponse.json(
        { error: `Max attempts (${MAX_ATTEMPTS}) exceeded`, attempts },
        { status: 429 }
      );
    }

    // Mark as running
    await supabase
      .from("jobs")
      .update({ execution_status: "running", execution_error: null, execution_attempts: attempts })
      .eq("job_id", job_id);

    console.log(`[execute-agent] Calling ${job.agent_endpoint} for job ${job_id} (attempt ${attempts})`);

    const payload = JSON.stringify({
      job_id: job.job_id,
      task_text: job.task_text,
      task_files: job.task_files,
      task_type: job.task_type,
      client_address: job.client_address,
      agent_address: job.agent_address,
    });
    const timestamp = Math.floor(Date.now() / 1000);
    const signature = signPayload(payload, timestamp);

    let agentRes: Response;
    try {
      agentRes = await fetch(job.agent_endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(signature && {
            "X-Arcade-Timestamp": timestamp.toString(),
            "X-Arcade-Signature": signature,
          }),
        },
        body: payload,
        signal: AbortSignal.timeout(120_000),
      });
    } catch (fetchError: any) {
      const msg = fetchError?.name === "TimeoutError"
        ? "Agent endpoint timed out (120s)"
        : `Agent endpoint unreachable: ${fetchError?.message || "unknown"}`;
      await markFailed(job_id, msg, attempts);
      return NextResponse.json({ error: msg, attempts }, { status: 502 });
    }

    if (!agentRes.ok) {
      const errText = await agentRes.text().catch(() => "unknown");
      const msg = `Agent returned ${agentRes.status}: ${errText.slice(0, 200)}`;
      console.error(`[execute-agent] ${msg}`);
      await markFailed(job_id, msg, attempts);
      return NextResponse.json({ error: msg, attempts }, { status: 502 });
    }

    let result: Record<string, unknown>;
    try {
      result = await agentRes.json();
    } catch {
      const msg = "Agent returned invalid JSON";
      await markFailed(job_id, msg, attempts);
      return NextResponse.json({ error: msg, attempts }, { status: 502 });
    }

    console.log(`[execute-agent] Agent response for job ${job_id}:`, result);

    const outputText =
      result.output_text || result.output || result.result || result.response || result.text ||
      (result.code ? result.code : null);
    const outputFiles = result.output_files || result.files || null;

    if (!outputText && !outputFiles) {
      const msg = "Agent returned no output";
      await markFailed(job_id, msg, attempts);
      return NextResponse.json({ error: msg, raw: result, attempts }, { status: 502 });
    }

    const outputType = detectOutputType(result);
    const outputMetadata = extractMetadata(result);

    const { error: updateErr } = await supabase
      .from("jobs")
      .update({
        output_type: outputType,
        output_text: outputText as string | null,
        output_files: outputFiles,
        output_metadata: outputMetadata,
        execution_status: "completed",
        execution_error: null,
        execution_attempts: attempts,
      })
      .eq("job_id", job_id);

    if (updateErr) {
      console.error(`[execute-agent] Supabase update failed:`, updateErr);
      return NextResponse.json(
        { error: "Failed to save output", details: updateErr.message },
        { status: 500 }
      );
    }

    // --- Server-side auto-complete + settle ---
    // Agent delivered output → complete the job → settle immediately
    let settleTxHash: string | undefined;
    try {
      const wallet = getWalletClient();
      const jobIdBigInt = BigInt(job_id);

      // 1. Complete the job
      console.log(`[execute-agent] Auto-completing job ${job_id}`);
      const completeTx = await wallet.writeContract({
        address: XCROW_ESCROW_ADDRESS,
        abi: XCROW_ESCROW_ABI,
        functionName: "completeJob",
        args: [jobIdBigInt],
      });
      await publicClient.waitForTransactionReceipt({ hash: completeTx });
      console.log(`[execute-agent] Job ${job_id} completed: ${completeTx}`);

      // 2. Settle immediately (same chain, no hook data)
      console.log(`[execute-agent] Auto-settling job ${job_id}`);
      const settleTx = await wallet.writeContract({
        address: XCROW_ROUTER_ADDRESS,
        abi: XCROW_ROUTER_ABI,
        functionName: "settleAndPay",
        args: [jobIdBigInt, 0, "0x"],
      });
      await publicClient.waitForTransactionReceipt({ hash: settleTx });
      settleTxHash = settleTx;
      console.log(`[execute-agent] Job ${job_id} settled: ${settleTx}`);
    } catch (settleErr: any) {
      // Non-fatal — output was saved, settlement can be retried manually
      console.error(`[execute-agent] Auto-settle failed for job ${job_id}:`, settleErr?.shortMessage || settleErr?.message);
    }

    return NextResponse.json({
      status: "ok",
      output_type: outputType,
      output_text: outputText,
      output_files: outputFiles,
      output_metadata: outputMetadata,
      attempts,
      settle_tx: settleTxHash,
    });
  } catch (err: any) {
    console.error("[execute-agent] Unhandled error:", err);
    return NextResponse.json(
      { error: err.message || "Internal error" },
      { status: 500 }
    );
  }
}
