"use client";

import { useState, useEffect } from "react";
import { formatEther } from "viem";
import { X, DollarSign, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUpdateAgentPrice, useUnlistAgent } from "@/lib/blockchain/hooks/useArcadeRegistry";

interface AgentManageModalProps {
  agentId: bigint;
  currentPrice: bigint;
  isListed: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AgentManageModal({
  agentId,
  currentPrice,
  isListed,
  onClose,
  onSuccess,
}: AgentManageModalProps) {
  const [newPrice, setNewPrice] = useState(formatEther(currentPrice));
  const [activeAction, setActiveAction] = useState<"price" | "unlist" | null>(null);

  const {
    updatePrice,
    isPending: isPriceUpdatePending,
    isConfirming: isPriceUpdateConfirming,
    isSuccess: isPriceUpdateSuccess,
    error: priceUpdateError,
    hash: priceUpdateHash,
  } = useUpdateAgentPrice();

  const {
    unlistAgent,
    isPending: isUnlistPending,
    isConfirming: isUnlistConfirming,
    isSuccess: isUnlistSuccess,
    error: unlistError,
    hash: unlistHash,
  } = useUnlistAgent();

  // Handle successful transactions
  useEffect(() => {
    if (isPriceUpdateSuccess || isUnlistSuccess) {
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 2000);
    }
  }, [isPriceUpdateSuccess, isUnlistSuccess, onSuccess, onClose]);

  const handleUpdatePrice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPrice || parseFloat(newPrice) <= 0) return;

    setActiveAction("price");
    try {
      await updatePrice(Number(agentId), newPrice);
    } catch (err) {
      console.error("Failed to update price:", err);
    }
  };

  const handleUnlist = async () => {
    setActiveAction("unlist");
    try {
      await unlistAgent(Number(agentId));
    } catch (err) {
      console.error("Failed to unlist agent:", err);
    }
  };

  const isProcessing = isPriceUpdatePending || isPriceUpdateConfirming || isUnlistPending || isUnlistConfirming;
  const error = priceUpdateError || unlistError;
  const hash = priceUpdateHash || unlistHash;
  const isSuccess = isPriceUpdateSuccess || isUnlistSuccess;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-slate-900">
            Manage Agent #{agentId.toString()}
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
            disabled={isProcessing}
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
                  {activeAction === "price" ? "Price Updated!" : "Agent Unlisted!"}
                </p>
                <p className="text-xs text-emerald-700 mt-1">
                  Transaction confirmed. Refreshing...
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
        {isProcessing && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-3">
              <Loader2 className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5 animate-spin" />
              <div>
                <p className="text-sm font-medium text-blue-900">
                  {isPriceUpdatePending || isUnlistPending
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

        {/* Update Price Section */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-slate-900 mb-3">Update Price</h3>
          <form onSubmit={handleUpdatePrice} className="space-y-3">
            <div>
              <label className="block text-xs text-slate-600 mb-2">
                Current Price: {formatEther(currentPrice)} ARC/hr
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={newPrice}
                  onChange={(e) => setNewPrice(e.target.value)}
                  placeholder="New price per hour"
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-2.5 text-sm text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={isProcessing}
                />
                <DollarSign className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              </div>
            </div>
            <Button
              type="submit"
              disabled={
                isProcessing ||
                !newPrice ||
                parseFloat(newPrice) <= 0 ||
                parseFloat(newPrice) === parseFloat(formatEther(currentPrice))
              }
              className="w-full bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
            >
              {isPriceUpdatePending || isPriceUpdateConfirming ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Price"
              )}
            </Button>
          </form>
        </div>

        {/* Divider */}
        <div className="border-t border-slate-200 my-6"></div>

        {/* Unlist Section */}
        <div>
          <h3 className="text-sm font-semibold text-slate-900 mb-2">Unlist Agent</h3>
          <p className="text-xs text-slate-600 mb-3">
            Remove your agent from the marketplace. You can re-list it anytime.
          </p>
          <Button
            onClick={handleUnlist}
            disabled={isProcessing || !isListed}
            variant="outline"
            className="w-full border-red-200 text-red-700 hover:bg-red-50 disabled:opacity-50"
          >
            {isUnlistPending || isUnlistConfirming ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Unlisting...
              </>
            ) : (
              "Unlist Agent"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
