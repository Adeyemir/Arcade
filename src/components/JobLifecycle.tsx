"use client";

import { useState, useEffect, useRef } from "react";
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

  const [amountUsdc, setAmountUsdc] = useState(minPriceUsdc ?? "");
  const [taskText, setTaskText] = useState("");
  const [taskFiles, setTaskFiles] = useState<File[]>([]);
  const [step, setStep] = useState<Step>("idle");
  const [jobId, setJobId] = useState<bigint | null>(null);
  const [err, setErr] = useState<string | null>(null);
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
          output_text: null,
          output_files: null,
        };
        console.log("[Xcrow] inserting job to Supabase", row);
        supabase.from("jobs").insert(row).then(({ error }) => {
          if (error) console.error("[Xcrow] Supabase insert failed:", error);
          else console.log("[Xcrow] Supabase insert success for job", hire.jobId?.toString());
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
              {minPriceUsdc && (
                <span className="ml-1 text-slate-400">(min ${minPriceUsdc})</span>
              )}
            </label>
            <input
              type="number"
              min={minPriceUsdc ?? "0.01"}
              step="0.01"
              placeholder={minPriceUsdc ? `Min $${minPriceUsdc}` : "e.g. 10"}
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
              (minPriceUsdc !== undefined && parseFloat(amountUsdc) < parseFloat(minPriceUsdc))
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
        <div className="space-y-2">
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-800">
            Job created{jobId !== null ? ` (#${jobId.toString()})` : ""}. Task sent to agent — waiting for completion.
          </div>
          <Button
            variant="outline"
            className="w-full text-red-600 border-red-200 hover:bg-red-50"
            onClick={handleCancel}
            disabled={isBusy || jobId === null}
          >
            <XCircle className="mr-2 h-4 w-4" />
            Cancel Job
          </Button>
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
