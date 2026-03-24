import { NextRequest, NextResponse } from "next/server";
import { createPublicClient, createWalletClient, http, type Hex } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { arc } from "@/lib/blockchain/arc";
import {
  XCROW_ROUTER_ABI,
  XCROW_ROUTER_ADDRESS,
  XCROW_ESCROW_ABI,
  XCROW_ESCROW_ADDRESS,
} from "@/lib/blockchain/contracts/XcrowRouter";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const CRON_SECRET = process.env.CRON_SECRET;

const publicClient = createPublicClient({ chain: arc, transport: http() });

function getWalletClient() {
  const pk = process.env.ARC_PRIVATE_KEY;
  if (!pk) throw new Error("ARC_PRIVATE_KEY not set");
  const account = privateKeyToAccount(
    (pk.startsWith("0x") ? pk : `0x${pk}`) as Hex
  );
  return createWalletClient({ account, chain: arc, transport: http() });
}

export async function POST(req: NextRequest) {
  // Optional auth — if CRON_SECRET is set, require it
  if (CRON_SECRET) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    // Get settlement window from contract
    const settlementWindow = await publicClient.readContract({
      address: XCROW_ESCROW_ADDRESS,
      abi: XCROW_ESCROW_ABI,
      functionName: "settlementWindow",
    }) as bigint;

    // Fetch all jobs in "Completed" status (3) from Supabase
    // These are candidates — we check on-chain if their window has expired
    const { data: completedJobs, error } = await supabase
      .from("jobs")
      .select("job_id")
      .not("output_text", "is", null);

    if (error) {
      return NextResponse.json({ error: "Supabase query failed", details: error.message }, { status: 500 });
    }

    if (!completedJobs?.length) {
      return NextResponse.json({ status: "ok", settled: 0, message: "No candidate jobs" });
    }

    const wallet = getWalletClient();
    const now = BigInt(Math.floor(Date.now() / 1000));
    const results: { jobId: string; status: string; txHash?: string; error?: string }[] = [];

    for (const row of completedJobs) {
      const jobId = BigInt(row.job_id);

      try {
        // Read job on-chain
        const job = await publicClient.readContract({
          address: XCROW_ESCROW_ADDRESS,
          abi: XCROW_ESCROW_ABI,
          functionName: "getJob",
          args: [jobId],
        }) as {
          status: number;
          proofSubmittedAt: bigint;
        };

        // Only settle if: status=3 (Completed), proof submitted, window expired
        if (
          job.status !== 3 ||
          job.proofSubmittedAt === BigInt(0) ||
          now < job.proofSubmittedAt + settlementWindow
        ) {
          results.push({ jobId: row.job_id, status: "skipped" });
          continue;
        }

        // Call autoSettleViaRouter
        const txHash = await wallet.writeContract({
          address: XCROW_ROUTER_ADDRESS,
          abi: XCROW_ROUTER_ABI,
          functionName: "autoSettleViaRouter",
          args: [jobId],
        });

        await publicClient.waitForTransactionReceipt({ hash: txHash });
        results.push({ jobId: row.job_id, status: "settled", txHash });
        console.log(`[auto-settle] Settled job ${row.job_id}: ${txHash}`);
      } catch (e: any) {
        const msg = e?.shortMessage || e?.message || "Unknown error";
        console.error(`[auto-settle] Failed job ${row.job_id}:`, msg);
        results.push({ jobId: row.job_id, status: "failed", error: msg });
      }
    }

    const settledCount = results.filter((r) => r.status === "settled").length;
    return NextResponse.json({ status: "ok", settled: settledCount, results });
  } catch (err: any) {
    console.error("[auto-settle] Unhandled error:", err);
    return NextResponse.json({ error: err.message || "Internal error" }, { status: 500 });
  }
}
