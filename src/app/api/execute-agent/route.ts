import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { job_id } = body;

    if (!job_id) {
      return NextResponse.json({ error: "job_id is required" }, { status: 400 });
    }

    // Fetch the job from Supabase to get agent_endpoint and task data
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

    // Already has output — don't call again
    if (job.output_text || job.output_files) {
      return NextResponse.json({ status: "already_completed", output_text: job.output_text });
    }

    // Call the agent's HTTP endpoint server-side (no CORS issues)
    console.log(`[execute-agent] Calling ${job.agent_endpoint} for job ${job_id}`);

    const agentRes = await fetch(job.agent_endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        job_id: job.job_id,
        task_text: job.task_text,
        task_files: job.task_files,
        task_type: job.task_type,
        client_address: job.client_address,
        agent_address: job.agent_address,
      }),
      signal: AbortSignal.timeout(120_000), // 2 minute timeout
    });

    if (!agentRes.ok) {
      const errText = await agentRes.text().catch(() => "unknown");
      console.error(`[execute-agent] Agent returned ${agentRes.status}: ${errText}`);
      return NextResponse.json(
        { error: `Agent endpoint returned ${agentRes.status}`, details: errText },
        { status: 502 }
      );
    }

    const result = await agentRes.json();
    console.log(`[execute-agent] Agent response for job ${job_id}:`, result);

    // Normalize the response — agents may use different field names
    const outputText =
      result.output_text || result.output || result.result || result.response || result.text || null;
    const outputFiles = result.output_files || result.files || null;

    if (!outputText && !outputFiles) {
      return NextResponse.json(
        { error: "Agent returned no output", raw: result },
        { status: 502 }
      );
    }

    // Save agent output to Supabase
    const { error: updateErr } = await supabase
      .from("jobs")
      .update({ output_text: outputText, output_files: outputFiles })
      .eq("job_id", job_id);

    if (updateErr) {
      console.error(`[execute-agent] Supabase update failed:`, updateErr);
      return NextResponse.json(
        { error: "Failed to save output", details: updateErr.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ status: "ok", output_text: outputText, output_files: outputFiles });
  } catch (err: any) {
    console.error("[execute-agent] Unhandled error:", err);
    return NextResponse.json(
      { error: err.message || "Internal error" },
      { status: 500 }
    );
  }
}
