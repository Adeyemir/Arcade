"use client";

import { useState, useEffect } from "react";
import { formatEther } from "viem";
import { X, Clock, DollarSign, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAgent } from "@/lib/blockchain/hooks/useArcadeRegistry";
import { useRentAgent, usePlatformFee } from "@/lib/blockchain/hooks/useRentalManager";

interface ExtendRentalModalProps {
  agentId: bigint;
  currentEndTime: Date;
  onClose: () => void;
  onSuccess: () => void;
}

export function ExtendRentalModal({
  agentId,
  currentEndTime,
  onClose,
  onSuccess,
}: ExtendRentalModalProps) {
  const [extensionHours, setExtensionHours] = useState(24);
  const { data: agent } = useAgent(Number(agentId));
  const { feePercent } = usePlatformFee();
  const {
    rentAgent,
    isPending,
    isConfirming,
    isSuccess,
    error,
    hash,
  } = useRentAgent();

  // Handle successful transaction
  useEffect(() => {
    if (isSuccess) {
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 2000);
    }
  }, [isSuccess, onSuccess, onClose]);

  if (!agent) {
    return null;
  }

  const agentData = agent as any;
  const pricePerHour = formatEther(agentData.pricePerHour);
  const totalCost = (parseFloat(pricePerHour) * extensionHours).toFixed(4);
  const platformFee = feePercent
    ? (parseFloat(totalCost) * Number(feePercent) / 10000).toFixed(4)
    : "0";
  const finalCost = (parseFloat(totalCost) + parseFloat(platformFee)).toFixed(4);

  const handleExtend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (extensionHours <= 0) return;

    try {
      await rentAgent(agentId, BigInt(extensionHours), finalCost);
    } catch (err) {
      console.error("Failed to extend rental:", err);
    }
  };

  const newEndTime = new Date(currentEndTime.getTime() + extensionHours * 60 * 60 * 1000);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-slate-900">
            Extend Rental
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
            disabled={isPending || isConfirming}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success State */}
        {isSuccess && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-emerald-900">
                  Rental Extended
                </p>
                <p className="text-xs text-emerald-700 mt-1">
                  Transaction confirmed. Your rental has been extended.
                </p>
                {hash && (
                  <p className="text-xs text-emerald-600 mt-1 font-mono">
                    {hash.slice(0, 10)}...{hash.slice(-8)}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-900">Transaction Failed</p>
                <p className="text-xs text-red-700 mt-1">
                  {error.message || "An error occurred"}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Pending/Confirming State */}
        {(isPending || isConfirming) && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-3">
              <Loader2 className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5 animate-spin" />
              <div>
                <p className="text-sm font-medium text-blue-900">
                  {isPending
                    ? "Awaiting wallet confirmation..."
                    : "Transaction confirming..."}
                </p>
                {hash && (
                  <p className="text-xs text-blue-700 mt-1 font-mono">
                    {hash.slice(0, 10)}...{hash.slice(-8)}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Agent Info */}
        <div className="mb-6 p-4 bg-slate-50 rounded-lg">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-sm">
                A{agentId.toString()}
              </span>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                Agent #{agentId.toString()}
              </h3>
              <p className="text-xs text-slate-600">
                {pricePerHour} ARC/hour
              </p>
            </div>
          </div>
          <div className="text-xs text-slate-600 space-y-1">
            <p>Current expiry: {currentEndTime.toLocaleString()}</p>
            <p className="text-blue-600 font-medium">
              New expiry: {newEndTime.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Extension Form */}
        <form onSubmit={handleExtend} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-900 mb-2">
              Extension Duration (hours)
            </label>
            <div className="relative">
              <input
                type="number"
                value={extensionHours}
                onChange={(e) => setExtensionHours(Math.max(1, parseInt(e.target.value) || 1))}
                min="1"
                max="720"
                className="w-full px-4 py-2.5 text-sm text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={isPending || isConfirming}
              />
              <Clock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Min: 1 hour, Max: 720 hours (30 days)
            </p>
          </div>

          {/* Cost Breakdown */}
          <div className="bg-slate-50 rounded-lg p-4 space-y-2 text-sm">
            <div className="flex justify-between text-slate-700">
              <span>Rental Cost ({extensionHours}h)</span>
              <span className="font-medium">{totalCost} ARC</span>
            </div>
            <div className="flex justify-between text-slate-700">
              <span>Platform Fee ({feePercent ? Number(feePercent) / 100 : 0}%)</span>
              <span className="font-medium">{platformFee} ARC</span>
            </div>
            <div className="border-t border-slate-200 pt-2 flex justify-between text-slate-900 font-semibold">
              <span>Total</span>
              <span>{finalCost} ARC</span>
            </div>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isPending || isConfirming || extensionHours <= 0}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
          >
            {isPending || isConfirming ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Extending...
              </>
            ) : (
              <>
                <Clock className="w-4 h-4 mr-2" />
                Extend Rental
              </>
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
