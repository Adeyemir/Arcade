"use client";

import { useState } from "react";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { ARCADE_REGISTRY_ABI, ARCADE_REGISTRY_ADDRESS } from "@/lib/blockchain/contracts/ArcadeRegistry";

interface DelistAgentModalProps {
  agentId: number;
  agentName: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function DelistAgentModal({
  agentId,
  agentName,
  isOpen,
  onClose,
  onSuccess,
}: DelistAgentModalProps) {
  const [isDelisting, setIsDelisting] = useState(false);

  const { data: hash, writeContract, error } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  // Handle successful delisting
  if (isSuccess && isDelisting) {
    setIsDelisting(false);
    if (onSuccess) {
      onSuccess();
    }
    onClose();
  }

  const handleDelist = async () => {
    try {
      setIsDelisting(true);
      writeContract({
        address: ARCADE_REGISTRY_ADDRESS,
        abi: ARCADE_REGISTRY_ABI,
        functionName: "delistAgent",
        args: [BigInt(agentId)],
      });
    } catch (err) {
      console.error("Error delisting agent:", err);
      setIsDelisting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <h2 className="text-2xl font-bold text-slate-900 mb-4">
          Permanently Delist Agent
        </h2>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-yellow-800 font-medium mb-2">
            ⚠️ Warning: This action is permanent
          </p>
          <p className="text-sm text-yellow-700">
            Once delisted, <strong>{agentName}</strong> cannot be relisted.
            This agent will be permanently removed from the marketplace.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-red-800">
              Error: {error.message}
            </p>
          </div>
        )}

        <div className="mb-6">
          <p className="text-sm text-slate-600">
            Agent ID: <span className="font-mono font-semibold">#{agentId}</span>
          </p>
          <p className="text-sm text-slate-600">
            Name: <span className="font-semibold">{agentName}</span>
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={isConfirming || isDelisting}
            className="flex-1 px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleDelist}
            disabled={isConfirming || isDelisting}
            className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-lg font-medium transition-colors disabled:cursor-not-allowed"
          >
            {isConfirming || isDelisting ? (
              <span className="flex items-center justify-center gap-2">
                <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                {isConfirming ? "Confirming..." : "Delisting..."}
              </span>
            ) : (
              "Permanently Delist"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
