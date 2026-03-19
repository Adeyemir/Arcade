"use client";

import { useState, useEffect } from "react";
import { Loader2, Briefcase, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAccount } from "wagmi";
import {
  useHireAgent,
  useCancelJob,
} from "@/lib/blockchain/hooks/useXcrowRouter";

interface JobLifecycleProps {
  /** The agent's owner wallet address from the Arcade registry */
  agentWallet: `0x${string}`;
  taskDescription: string;
  /** Deadline in seconds from now (default 24 h) */
  deadlineSeconds?: number;
  /** ERC-8004 agentId for reputation tracking (from IPFS metadata) */
  erc8004AgentId?: bigint;
}

type Step = "idle" | "hiring" | "awaiting_completion" | "done";

export function JobLifecycle({
  agentWallet,
  taskDescription,
  deadlineSeconds = 86400,
  erc8004AgentId = BigInt(0),
}: JobLifecycleProps) {
  const { address, isConnected } = useAccount();

  const [amountUsdc, setAmountUsdc] = useState("");
  const [step, setStep] = useState<Step>("idle");
  const [jobId, setJobId] = useState<bigint | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const hire = useHireAgent();
  const cancel = useCancelJob();

  useEffect(() => {
    if (hire.jobId !== null && jobId === null) {
      setJobId(hire.jobId);
    }
  }, [hire.jobId]);

  const isBusy = hire.isPending || hire.isConfirming || cancel.isPending || cancel.isConfirming;

  const handleHire = async () => {
    if (!address) return;
    setErr(null);
    setStep("hiring");
    try {
      const deadline = BigInt(Math.floor(Date.now() / 1000) + deadlineSeconds);
      await hire.hireAgent(address, agentWallet, amountUsdc, taskDescription, deadline, erc8004AgentId);
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
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">
            USDC Amount
          </label>
          <input
            type="number"
            min="1"
            step="0.01"
            placeholder="e.g. 10"
            value={amountUsdc}
            onChange={(e) => setAmountUsdc(e.target.value)}
            className="w-full px-3 py-2 text-sm text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
        </div>
      )}

      {step === "idle" && (
        <Button
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium"
          onClick={handleHire}
          disabled={isBusy || !amountUsdc || isNaN(parseFloat(amountUsdc)) || parseFloat(amountUsdc) <= 0}
        >
          <Briefcase className="mr-2 h-4 w-4" />
          Hire Agent via Xcrow
        </Button>
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
            Job created{jobId !== null ? ` (#${jobId.toString()})` : ""}. Waiting for agent to complete…
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

      {step === "done" && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-xs text-green-800 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
          Payment confirmed.
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
