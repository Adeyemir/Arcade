"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Briefcase, XCircle, Paperclip, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAccount } from "wagmi";
import {
  useHireAgent,
  useCancelJob,
} from "@/lib/blockchain/hooks/useXcrowRouter";
import { supabase, TaskType } from "@/lib/supabase/client";

interface JobLifecycleProps {
  agentWallet: `0x${string}`;
  taskDescription: string;
  deadlineSeconds?: number;
  erc8004AgentId?: bigint;
  agentEndpoint?: string | null;
  /** Input types the agent supports e.g. ["text", "image"] */
  supportedInputTypes?: string[];
  /** Minimum USDC amount the agent will accept per task */
  minPriceUsdc?: string;
}

type Step = "idle" | "hiring" | "awaiting_completion" | "done";
type ExecPhase = "queued" | "running" | "delivered" | "settling" | "settled" | "failed";

const PINATA_JWT = process.env.NEXT_PUBLIC_PINATA_JWT!;

async function uploadFileToIPFS(file: File): Promise<string> {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
    method: "POST",
    headers: { Authorization: `Bearer ${PINATA_JWT}` },
    body: fd,
  });
  if (!res.ok) throw new Error("Failed to upload file to IPFS");
  const data = await res.json();
  return `https://ipfs.io/ipfs/${data.IpfsHash}`;
}

export function JobLifecycle({
  agentWallet,
  taskDescription,
  deadlineSeconds = 86400,
  erc8004AgentId = BigInt(0),
  agentEndpoint,
  supportedInputTypes = ["text"],
  minPriceUsdc,
}: JobLifecycleProps) {
  const { address, isConnected } = useAccount();
  const router = useRouter();

  const [amountUsdc, setAmountUsdc] = useState(minPriceUsdc ?? "");
  const [taskText, setTaskText] = useState("");
  const [taskFiles, setTaskFiles] = useState<File[]>([]);
  const [step, setStep] = useState<Step>("idle");
  const [jobId, setJobId] = useState<bigint | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [execPhase, setExecPhase] = useState<ExecPhase>("queued");
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Holds task data between tx confirmation and Supabase save
  const pendingTask = useRef<{
    taskText: string;
    uploadedUrls: string[];
    taskType: TaskType;
  } | null>(null);

  // Pre-fill with minimum price once it loads from IPFS (async)
  useEffect(() => {
    if (minPriceUsdc && !amountUsdc) setAmountUsdc(minPriceUsdc);
  }, [minPriceUsdc]);

  const hire = useHireAgent();
  const cancel = useCancelJob();

  // Poll Supabase for execution progress while awaiting completion
  useEffect(() => {
    if (step !== "awaiting_completion" || jobId === null) return;
    setExecPhase("queued");

    const poll = setInterval(async () => {
      const { data } = await supabase
        .from("jobs")
        .select("execution_status, output_text, output_files")
        .eq("job_id", jobId.toString())
        .single();
      if (!data) return;

      if (data.execution_status === "running" && !data.output_text) {
        setExecPhase("running");
      } else if (data.execution_status === "completed" && (data.output_text || data.output_files)) {
        setExecPhase("settling");
        // Check if on-chain status is settled
        setTimeout(() => setExecPhase("settled"), 3000);
        clearInterval(poll);
      } else if (data.execution_status === "failed") {
        setExecPhase("failed");
        clearInterval(poll);
      }
    }, 2000);

    return () => clearInterval(poll);
  }, [step, jobId]);

  useEffect(() => {
    if (hire.jobId !== null && jobId === null) {
      setJobId(hire.jobId);
      // Save to Supabase now that we have the real jobId
      if (pendingTask.current && address) {
        const { taskText, uploadedUrls, taskType } = pendingTask.current;
        const row = {
          job_id: hire.jobId.toString(),
          task_text: taskText || null,
          task_files: uploadedUrls.length > 0 ? uploadedUrls : null,
          task_type: taskType,
          client_address: address.toLowerCase(),
          agent_address: agentWallet.toLowerCase(),
          agent_endpoint: agentEndpoint ?? null,
          output_type: "text" as const,
          output_text: null,
          output_files: null,
          output_metadata: null,
          execution_status: "pending" as const,
          execution_error: null,
          execution_attempts: 0,
        };
        console.log("[Xcrow] inserting job to Supabase", row);
        supabase.from("jobs").upsert(row, { onConflict: "job_id" }).then(async ({ error }) => {
          if (error) {
            console.error("[Xcrow] Supabase insert failed:", error);
            return;
          }
          console.log("[Xcrow] Supabase insert success for job", hire.jobId?.toString());

          // Trigger server-side agent execution via API route (avoids CORS)
          if (agentEndpoint) {
            console.log("[Xcrow] Triggering agent execution for job", hire.jobId?.toString());
            try {
              const res = await fetch("/api/execute-agent", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ job_id: hire.jobId?.toString() }),
              });
              const result = await res.json();
              if (res.ok) {
                console.log("[Xcrow] Agent execution complete:", result);
              } else {
                console.error("[Xcrow] Agent execution failed:", result);
              }
            } catch (execErr) {
              console.error("[Xcrow] Agent execution request failed:", execErr);
            }
          }
        });
        pendingTask.current = null;
      }
    }
  }, [hire.jobId]);

  const isBusy =
    hire.isPending || hire.isConfirming || cancel.isPending || cancel.isConfirming;

  const supportsFiles = supportedInputTypes.some((t) =>
    ["image", "audio", "video", "file"].includes(t)
  );

  const deriveTaskType = (): TaskType => {
    const hasFiles = taskFiles.length > 0;
    const hasText = taskText.trim().length > 0;
    if (hasFiles && hasText) return "multimodal";
    if (!hasFiles && hasText) return "text";
    if (hasFiles) {
      const mime = taskFiles[0].type;
      if (mime.startsWith("image/")) return "image";
      if (mime.startsWith("audio/")) return "audio";
      if (mime.startsWith("video/")) return "video";
      return "file";
    }
    return "text";
  };

  const handleHire = async () => {
    if (!address) return;
    if (!erc8004AgentId || erc8004AgentId === BigInt(0)) {
      setErr("Agent metadata is still loading. Please wait a moment and try again.");
      return;
    }
    if (!taskText.trim() && taskFiles.length === 0) {
      setErr("Describe what you need the agent to do.");
      return;
    }
    if (minPriceUsdc && parseFloat(amountUsdc) < parseFloat(minPriceUsdc)) {
      setErr(`Amount must be at least $${minPriceUsdc} USDC`);
      return;
    }
    setErr(null);
    setStep("hiring");

    try {
      // Upload any attached files to IPFS first
      const uploadedUrls: string[] = [];
      for (const file of taskFiles) {
        const url = await uploadFileToIPFS(file);
        uploadedUrls.push(url);
      }

      const textForHash = taskText.trim() || taskDescription;

      const deadline = BigInt(Math.floor(Date.now() / 1000) + deadlineSeconds);

      // Store task data in ref — useEffect saves to Supabase once jobId is confirmed
      pendingTask.current = {
        taskText: taskText.trim(),
        uploadedUrls,
        taskType: deriveTaskType(),
      };

      await hire.hireAgent(
        address,
        agentWallet,
        amountUsdc,
        textForHash,
        deadline,
        erc8004AgentId
      );

      setStep("awaiting_completion");
    } catch (e: any) {
      setErr(e?.shortMessage || e?.message || "Hire failed");
      setStep("idle");
    }
  };

  const handleCancel = async () => {
    if (jobId === null) return;
    setErr(null);
    try {
      await cancel.cancelJob(jobId);
      setJobId(null);
      setStep("idle");
    } catch (e: any) {
      setErr(e?.shortMessage || e?.message || "Cancel failed");
    }
  };

  const handleFileAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    setTaskFiles((prev) => [...prev, ...files]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  if (!isConnected) {
    return (
      <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-xs text-yellow-800">
        Connect your wallet to hire via Xcrow.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {step === "idle" && (
        <>
          {/* Task description input */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              What do you need this agent to do?
            </label>
            <textarea
              rows={4}
              placeholder="Describe your task in as much detail as possible..."
              value={taskText}
              onChange={(e) => setTaskText(e.target.value)}
              className="w-full px-3 py-2 text-sm text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {/* File attachments — only if agent supports them */}
          {supportsFiles && (
            <div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800"
              >
                <Paperclip className="h-3.5 w-3.5" />
                Attach files
              </button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={handleFileAdd}
              />
              {taskFiles.length > 0 && (
                <ul className="mt-2 space-y-1">
                  {taskFiles.map((f, i) => (
                    <li key={i} className="flex items-center gap-2 text-xs text-slate-600">
                      <span className="truncate max-w-[200px]">{f.name}</span>
                      <button
                        type="button"
                        onClick={() =>
                          setTaskFiles((prev) => prev.filter((_, idx) => idx !== i))
                        }
                      >
                        <X className="h-3 w-3 text-slate-400 hover:text-red-500" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* USDC amount */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              USDC Amount
            </label>
            <input
              type="number"
              {...(minPriceUsdc ? { min: minPriceUsdc } : {})}
              step="0.01"
              placeholder={minPriceUsdc ? `Minimum ${minPriceUsdc} USDC` : "Enter amount"}
              value={amountUsdc}
              onChange={(e) => setAmountUsdc(e.target.value)}
              className="w-full px-3 py-2 text-sm text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            {minPriceUsdc && amountUsdc && parseFloat(amountUsdc) < parseFloat(minPriceUsdc) && (
              <p className="mt-1 text-xs text-red-500">
                Amount must be at least ${minPriceUsdc} USDC
              </p>
            )}
          </div>

          <Button
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium"
            onClick={handleHire}
            disabled={
              isBusy ||
              !amountUsdc ||
              isNaN(parseFloat(amountUsdc)) ||
              parseFloat(amountUsdc) <= 0 ||
              (!!minPriceUsdc && parseFloat(amountUsdc) < parseFloat(minPriceUsdc))
            }
          >
            <Briefcase className="mr-2 h-4 w-4" />
            Hire Agent via Xcrow
          </Button>
        </>
      )}

      {step === "hiring" && (
        <Button className="w-full bg-blue-600 text-white font-medium" disabled>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          {hire.isPending ? "Sign in wallet…" : "Creating job…"}
        </Button>
      )}

      {step === "awaiting_completion" && (
        <div className="space-y-3">
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
            <p className="text-xs font-medium text-slate-700 mb-3">
              Job #{jobId?.toString()} — Live Progress
            </p>
            <div className="space-y-2">
              {[
                { key: "queued", label: "Task queued" },
                { key: "running", label: "Agent executing task" },
                { key: "settling", label: "Delivering output & settling payment" },
                { key: "settled", label: "Payment released" },
              ].map(({ key, label }, i) => {
                const phases: ExecPhase[] = ["queued", "running", "settling", "settled"];
                const currentIdx = phases.indexOf(execPhase);
                const stepIdx = phases.indexOf(key as ExecPhase);
                const isDone = stepIdx < currentIdx;
                const isActive = stepIdx === currentIdx;
                const isFailed = execPhase === "failed" && stepIdx === currentIdx;

                return (
                  <div key={key} className="flex items-center gap-2.5">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold ${
                      isDone ? "bg-green-500 text-white" :
                      isFailed ? "bg-red-500 text-white" :
                      isActive ? "bg-blue-500 text-white animate-pulse" :
                      "bg-slate-200 text-slate-400"
                    }`}>
                      {isDone ? "✓" : isFailed ? "!" : i + 1}
                    </div>
                    <span className={`text-xs ${
                      isDone ? "text-green-700" :
                      isFailed ? "text-red-600" :
                      isActive ? "text-blue-700 font-medium" :
                      "text-slate-400"
                    }`}>
                      {label}{isActive && !isFailed ? "…" : ""}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
          {execPhase !== "settled" && execPhase !== "settling" && (
            <Button
              variant="outline"
              className="w-full text-red-600 border-red-200 hover:bg-red-50"
              onClick={handleCancel}
              disabled={isBusy || jobId === null}
            >
              <XCircle className="mr-2 h-4 w-4" />
              Cancel Job &amp; Get Refund
            </Button>
          )}
          {execPhase === "settled" && (
            <Button
              className="w-full bg-green-600 hover:bg-green-700 text-white font-medium"
              onClick={() => router.push("/dashboard")}
            >
              View Output on Dashboard
            </Button>
          )}
        </div>
      )}

      {err && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800">
          {err}
        </div>
      )}
    </div>
  );
}
