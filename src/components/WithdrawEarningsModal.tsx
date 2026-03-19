"use client";

import { useState, useEffect } from "react";
import { useWithdrawEarnings } from "@/lib/blockchain/hooks/useWithdrawEarnings";
import { Button } from "@/components/ui/button";
import { X, Wallet, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

interface WithdrawEarningsModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableBalance: string;
}

export function WithdrawEarningsModal({
  isOpen,
  onClose,
  availableBalance,
}: WithdrawEarningsModalProps) {
  const { withdrawEarnings, isPending, isSuccess, error } = useWithdrawEarnings();
  const [showSuccess, setShowSuccess] = useState(false);

  // Handle successful withdrawal
  useEffect(() => {
    if (isSuccess) {
      setShowSuccess(true);
      setTimeout(() => {
        onClose();
        setShowSuccess(false);
      }, 3000);
    }
  }, [isSuccess, onClose]);

  if (!isOpen) return null;

  const estimatedGasFee = "0.001"; // Placeholder - you could calculate this dynamically
  const youllReceive = Math.max(0, parseFloat(availableBalance) - parseFloat(estimatedGasFee)).toFixed(4);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-lg max-w-md w-full border border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Wallet className="w-5 h-5 text-blue-600" />
            </div>
            <h2 className="text-xl font-semibold text-slate-900">Withdraw Earnings</h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
            disabled={isPending}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {showSuccess ? (
            <div className="text-center py-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-50 rounded-full mb-4">
                <CheckCircle2 className="w-8 h-8 text-emerald-500" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                Withdrawal Successful
              </h3>
              <p className="text-slate-600">
                Your earnings have been transferred to your wallet.
              </p>
            </div>
          ) : (
            <>
              {/* Balance Info */}
              <div className="space-y-4 mb-6">
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                  <p className="text-xs text-slate-500 mb-1">Available Balance</p>
                  <p className="text-2xl font-bold text-slate-900">{availableBalance} ARC</p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">Network Fee (estimate)</span>
                    <span className="text-slate-900 font-medium">~{estimatedGasFee} ARC</span>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                    <span className="text-slate-900 font-medium">You'll Receive</span>
                    <span className="text-lg font-bold text-emerald-600">~{youllReceive} ARC</span>
                  </div>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-red-800 font-medium">Transaction Failed</p>
                    <p className="text-xs text-red-600 mt-1">{error.message}</p>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button
                  onClick={onClose}
                  variant="outline"
                  className="flex-1 border-slate-200 text-slate-900 hover:bg-slate-100"
                  disabled={isPending}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => withdrawEarnings()}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                  disabled={isPending || parseFloat(availableBalance) === 0}
                >
                  {isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Withdrawing...
                    </>
                  ) : (
                    "Withdraw to Wallet"
                  )}
                </Button>
              </div>

              {/* Info */}
              <p className="text-xs text-slate-500 mt-4 text-center">
                Earnings will be sent to your connected wallet address
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
