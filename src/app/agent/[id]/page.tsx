"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAgent } from "@/lib/blockchain/hooks/useArcadeRegistry";
import { usePlatformFee } from "@/lib/blockchain/hooks/useRentalManager";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { useQueryClient } from "@tanstack/react-query";
import { formatEther } from "viem";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, CheckCircle2, Clock, DollarSign, User, ExternalLink, Shield, Loader2 } from "lucide-react";
import { RENTAL_MANAGER_ABI, RENTAL_MANAGER_ADDRESS } from "@/lib/blockchain/contracts/RentalManager";
import { arc } from "@/lib/blockchain/arc";
import { ReputationBadge } from "@/components/ReputationBadge";
import { JobLifecycle } from "@/components/JobLifecycle";
import { useAgentMetrics } from "@/lib/blockchain/hooks/useAgentMetrics";

export default function AgentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const agentId = params.id as string;
  const { address, isConnected } = useAccount();
  const queryClient = useQueryClient();

  const [rentalHours, setRentalHours] = useState<number | string>('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [erc8004AgentId, setErc8004AgentId] = useState<bigint | null>(null);
  const [agentEndpoint, setAgentEndpoint] = useState<string | null>(null);
  const [supportedInputTypes, setSupportedInputTypes] = useState<string[]>(["text"]);

  const { data: agent, isLoading, error } = useAgent(parseInt(agentId));

  // Fetch IPFS metadata to get the real ERC-8004 agentId
  useEffect(() => {
    const metadataHash = (agent as any)?.metadataHash;
    if (!metadataHash || !metadataHash.startsWith("https://")) return;
    fetch(metadataHash)
      .then((r) => r.json())
      .then((meta) => {
        if (meta?.erc8004AgentId) setErc8004AgentId(BigInt(meta.erc8004AgentId));
        if (meta?.apiEndpoint) setAgentEndpoint(meta.apiEndpoint);
        if (Array.isArray(meta?.input_types)) setSupportedInputTypes(meta.input_types);
      })
      .catch(() => {});
  }, [(agent as any)?.metadataHash]);

  // Direct contract write - no custom hook
  const { data: hash, writeContractAsync, isPending, error: rentalError } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  // Invalidate queries after successful rental to refresh balances
  useEffect(() => {
    if (isSuccess) {
      // Invalidate all balance-related queries to force refresh
      queryClient.invalidateQueries({ queryKey: ["readContract"] });
      queryClient.invalidateQueries({ queryKey: ["balance"] });
    }
  }, [isSuccess, queryClient]);

  const { feePercent } = usePlatformFee();
  const { tasksCompleted, activeRentals, isLoading: metricsLoading } = useAgentMetrics(
    agent ? (agent as any).owner as `0x${string}` : undefined
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading agent details...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Check if agent exists (has non-zero owner address)
  const agentExists = agent && agent.owner !== "0x0000000000000000000000000000000000000000";

  if (error || !agent || !agentExists) {
    return (
      <div className="min-h-screen bg-white">
        <div className="container mx-auto px-4 py-8">
          <Button
            variant="ghost"
            onClick={() => router.push("/")}
            className="mb-6 text-blue-600 hover:text-blue-700"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Marketplace
          </Button>
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <p className="text-red-600 text-lg mb-2">Agent not found</p>
              <p className="text-gray-600 mb-4">
                This agent does not exist on the blockchain.
              </p>
              <p className="text-sm text-gray-500">
                Agent ID: {agentId}
              </p>
              <div className="mt-6">
                <Button
                  onClick={() => router.push("/list-agent")}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  List a New Agent
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const isOwner = address && agent.owner.toLowerCase() === address.toLowerCase();
  const pricePerHourEther = formatEther(agent.pricePerHour);

  // Calculate costs in wei (BigInt) to avoid precision issues
  // Use 0 if rentalHours is empty to avoid calculation errors
  const hoursForCalculation = rentalHours === '' ? 0 : Number(rentalHours);
  const totalCostWei = agent.pricePerHour * BigInt(hoursForCalculation);
  const totalCost = formatEther(totalCostWei); // Convert to string for display

  // Platform fee is deducted by contract, just show for info
  const platformFee = feePercent ? (parseFloat(totalCost) * Number(feePercent) / 10000).toFixed(4) : "0";

  // Debug logging

  // Handle rental - DIRECT IMPLEMENTATION
  const handleRent = async () => {

    // Validation
    if (!address) {
      console.error("No wallet connected");
      setShowError(true);
      return;
    }

    if (!agent) {
      console.error("No agent data");
      setShowError(true);
      return;
    }

    if (!agent.isListed) {
      console.error("Agent not listed");
      setShowError(true);
      return;
    }

    if (isOwner) {
      console.error("User is owner - cannot rent own agent");
      setShowError(true);
      return;
    }

    setShowSuccess(false);
    setShowError(false);

    // Calculate values
    const agentIdBigInt = BigInt(agentId);
    const hoursBigInt = BigInt(Number(rentalHours) || 1);
    const valueWei = totalCostWei;


    try {

      const txHash = await writeContractAsync({
        address: RENTAL_MANAGER_ADDRESS as `0x${string}`,
        abi: RENTAL_MANAGER_ABI,
        functionName: "rentAgent",
        args: [agentIdBigInt, hoursBigInt],
        value: valueWei,
        chainId: arc.id,
      });


      setShowSuccess(true);

    } catch (error: any) {
      console.error("Transaction failed");
      console.error("Error:", error);

      const errorMsg = error?.shortMessage || error?.message || "Unknown error";
      console.error("Error message:", errorMsg);

      setShowError(true);
    }
  };

  // Show success message when rental is confirmed
  if (isSuccess && !showSuccess) {
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 5000);
  }

  // Show error message
  if (rentalError && !showError) {
    setShowError(true);
    setTimeout(() => setShowError(false), 5000);
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-4 sm:py-8">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => router.push("/")}
          className="mb-4 sm:mb-6 text-blue-600 hover:text-blue-700"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Marketplace
        </Button>

        {/* Mobile: Stack vertically, Desktop: Side by side */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Main Content - Order 1 on mobile, Order 1 on desktop */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6 order-1">
            {/* Agent Header */}
            <div className="bg-gradient-to-r from-slate-100 to-blue-50 border border-slate-200 rounded-xl p-4 sm:p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row items-start gap-4">
                {/* Agent Avatar - More polished with shadow */}
                <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl overflow-hidden flex items-center justify-center shadow-lg flex-shrink-0">
                  {agent.imageUrl ? (
                    <img
                      src={agent.imageUrl}
                      alt={agent.name || `Agent #${agentId}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-white font-bold text-lg sm:text-xl">A{agentId}</span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  {/* Title row with animated badge */}
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
                    <h1 className="text-xl sm:text-2xl font-semibold text-slate-900">
                      {agent.name || `Agent #${agentId}`}
                    </h1>
                    {agent.isListed && (
                      <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 text-xs font-medium rounded-full flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                        Active
                      </span>
                    )}
                    {!agent.isListed && (
                      <span className="px-2.5 py-1 bg-slate-100 text-slate-600 text-xs font-medium rounded-full">
                        Unlisted
                      </span>
                    )}
                  </div>
                  {agent.category && (
                    <p className="text-sm text-slate-600 mb-2">
                      <span className="font-medium">Category:</span> {agent.category}
                    </p>
                  )}

                  {/* Owner with icon and styled chip */}
                  <div className="flex items-center gap-2 text-slate-600">
                    <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                    <span className="text-xs sm:text-sm">Owner:</span>
                    <code className="text-xs sm:text-sm bg-slate-100 px-2 py-0.5 rounded font-mono text-slate-700">
                      {agent.owner.slice(0, 6)}...{agent.owner.slice(-4)}
                    </code>
                  </div>
                </div>

                {/* Owner badge on right */}
                {isOwner && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg border border-blue-200 self-start">
                    <Shield className="w-4 h-4" />
                    <span className="text-sm font-medium">You own this</span>
                  </div>
                )}
              </div>
            </div>

            {/* Metadata and Description Card */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 sm:p-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-xs sm:text-sm font-semibold text-slate-900 mb-2">Description</h3>
                  <div className="text-xs sm:text-sm text-slate-700 bg-white border border-slate-100 p-2 sm:p-3 rounded-lg">
                    {agent.description || "No description available"}
                  </div>
                </div>
              </div>
            </div>

            {/* Agent Stats - Stack vertically on mobile, grid on tablet+ */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 sm:p-6">
              <h3 className="text-base sm:text-lg text-slate-900 font-semibold mb-4">Performance Metrics</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <div className="p-3 sm:p-4 bg-white border border-slate-100 rounded-lg">
                  <div className="flex items-center gap-2 text-emerald-600 mb-1">
                    <CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="text-xs sm:text-sm font-medium">Tasks Completed</span>
                  </div>
                  <p className="text-xl sm:text-2xl font-bold text-slate-900">
                    {metricsLoading ? "—" : tasksCompleted}
                  </p>
                  <p className="text-xs text-slate-600 mt-1">Total settled jobs</p>
                </div>
                <div className="p-3 sm:p-4 bg-white border border-slate-100 rounded-lg">
                  <div className="flex items-center gap-2 text-purple-600 mb-1">
                    <User className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="text-xs sm:text-sm font-medium">Active Rentals</span>
                  </div>
                  <p className="text-xl sm:text-2xl font-bold text-slate-900">
                    {metricsLoading ? "—" : activeRentals}
                  </p>
                  <p className="text-xs text-slate-600 mt-1">Currently running</p>
                </div>
                <div className="p-3 sm:p-4 bg-white border border-slate-100 rounded-lg">
                  <div className="flex items-center gap-2 text-blue-600 mb-1">
                    <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="text-xs sm:text-sm font-medium">ERC-8004 Score</span>
                  </div>
                  <ReputationBadge agentId={erc8004AgentId ?? BigInt(0)} compact />
                  <p className="text-xs text-slate-600 mt-1">On-chain reputation</p>
                </div>
              </div>
            </div>

            {/* Technical Details - Scrollable table on mobile */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 sm:p-6">
              <h3 className="text-base sm:text-lg text-slate-900 font-semibold mb-4">Technical Details</h3>
              <div className="bg-white border border-slate-100 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <div className="inline-block min-w-full align-middle">
                    <dl className="space-y-0">
                      <div className="flex justify-between py-3 px-4 border-b border-slate-100 min-w-[300px]">
                        <dt className="text-xs sm:text-sm font-medium text-slate-600">Agent ID</dt>
                        <dd className="text-xs sm:text-sm font-semibold text-slate-900">#{agentId}</dd>
                      </div>
                      <div className="flex justify-between py-3 px-4 border-b border-slate-100 min-w-[300px]">
                        <dt className="text-xs sm:text-sm font-medium text-slate-600">Blockchain</dt>
                        <dd className="text-xs sm:text-sm font-semibold text-slate-900">Arc Testnet</dd>
                      </div>
                      <div className="flex justify-between py-3 px-4 border-b border-slate-100 min-w-[300px]">
                        <dt className="text-xs sm:text-sm font-medium text-slate-600">Contract Address</dt>
                        <dd className="text-xs sm:text-sm font-mono text-slate-900">
                          0x02b0...E3a4
                        </dd>
                      </div>
                      <div className="flex justify-between py-3 px-4 border-b border-slate-100 min-w-[300px]">
                        <dt className="text-xs sm:text-sm font-medium text-slate-600">Listed Status</dt>
                        <dd className="text-xs sm:text-sm font-semibold text-slate-900">
                          {agent.isListed ? (
                            <span className="text-emerald-600">Active</span>
                          ) : (
                            <span className="text-red-600">Unlisted</span>
                          )}
                        </dd>
                      </div>
                      {/* ERC-8004 live reputation row */}
                      <ReputationBadge agentId={erc8004AgentId ?? BigInt(0)} />
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar - Rental Section - Order 2 on mobile (below main content), Order 2 on desktop (right side) */}
          <div className="lg:col-span-1 order-2">
            <div className="lg:sticky lg:top-20 bg-white border-2 border-blue-200 rounded-xl shadow-sm overflow-hidden">
              <CardHeader className="bg-gradient-to-br from-blue-600 to-blue-500 text-white p-4 sm:p-6">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="h-4 w-4 sm:h-5 sm:w-5" />
                  <CardTitle className="text-base sm:text-lg">Rent This Agent</CardTitle>
                </div>
                <CardDescription className="text-blue-50 text-xs sm:text-sm">
                  Pay only for the time you use
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4 sm:pt-6 p-4 sm:p-6">
                <div className="space-y-4 sm:space-y-6">
                  {/* Pricing */}
                  <div className="text-center py-3 sm:py-4 bg-gray-50 rounded-lg">
                    <p className="text-xs sm:text-sm text-gray-600 mb-1">Price per Hour</p>
                    <p className="text-3xl sm:text-4xl font-bold text-gray-900">
                      {pricePerHourEther}
                      <span className="text-base sm:text-lg text-gray-600 ml-1">ARC</span>
                    </p>
                  </div>

                  {/* Rental Calculator */}
                  <div className="space-y-3">
                    <label className="block">
                      <span className="text-xs sm:text-sm font-medium text-gray-700">Rental Duration (hours)</span>
                      <input
                        type="number"
                        min="1"
                        max="720"
                        value={rentalHours}
                        placeholder="Enter hours (1-720)"
                        className="mt-1 block w-full px-3 py-2 text-sm sm:text-base text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-slate-400 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        onChange={(e) => {
                          const value = e.target.value;
                          setRentalHours(value === '' ? '' : parseInt(value, 10));
                        }}
                      />
                    </label>
                    <div className="space-y-2 p-3 bg-gray-50 rounded-lg text-xs sm:text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Subtotal</span>
                        <span className="font-medium text-gray-900">{totalCost} ARC</span>
                      </div>
                      {feePercent && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Platform Fee ({Number(feePercent) / 100}%)</span>
                          <span className="font-medium text-gray-900">{platformFee} ARC</span>
                        </div>
                      )}
                      <div className="flex justify-between pt-2 border-t border-gray-200">
                        <span className="font-medium text-gray-700">Total Cost</span>
                        <span className="text-base sm:text-lg font-bold text-blue-600">{totalCost} ARC</span>
                      </div>
                    </div>
                  </div>

                  {/* Transaction Status */}
                  {showSuccess && hash && (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-xs sm:text-sm font-medium text-green-800 mb-1">Rental Successful!</p>
                      <p className="text-xs text-green-600 break-all">
                        Transaction: {hash.slice(0, 10)}...{hash.slice(-8)}
                      </p>
                    </div>
                  )}

                  {showError && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-xs sm:text-sm font-medium text-red-800">Rental Failed</p>
                      <p className="text-xs text-red-600">
                        {rentalError?.message || "Transaction failed. Please try again."}
                      </p>
                    </div>
                  )}

                  {isPending && (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-xs sm:text-sm text-blue-800">Waiting for wallet confirmation...</p>
                    </div>
                  )}

                  {isConfirming && (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-xs sm:text-sm text-blue-800">Transaction confirming on blockchain...</p>
                    </div>
                  )}

                  {/* Rent Button */}
                  {!isConnected ? (
                    <div className="text-center py-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-xs sm:text-sm text-yellow-800">Connect your wallet to rent</p>
                    </div>
                  ) : isOwner ? (
                    <div className="text-center py-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-xs sm:text-sm text-blue-800">You own this agent</p>
                    </div>
                  ) : !agent.isListed ? (
                    <div className="text-center py-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-xs sm:text-sm text-red-800">Agent is currently unlisted</p>
                    </div>
                  ) : (
                    <Button
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white py-5 sm:py-6 text-base sm:text-lg font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={handleRent}
                      disabled={!rentalHours || Number(rentalHours) < 1 || Number(rentalHours) > 720 || isPending || isConfirming}
                    >
                      {isPending || isConfirming ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        `Rent for ${totalCost} ARC`
                      )}
                    </Button>
                  )}

                  {/* Xcrow Job Lifecycle (USDC escrow via ERC-8004) */}
                  <div className="pt-4 border-t">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
                      Or hire via Xcrow (USDC Escrow)
                    </p>
                    <JobLifecycle
                      agentWallet={agent.owner as `0x${string}`}
                      taskDescription={agent.description || `Task for agent #${agentId}`}
                      erc8004AgentId={erc8004AgentId ?? BigInt(0)}
                      agentEndpoint={agentEndpoint}
                      supportedInputTypes={supportedInputTypes}
                    />
                  </div>

                  {/* Features */}
                  <div className="pt-4 border-t space-y-2">
                    <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-3">
                      What's Included
                    </p>
                    <div className="flex items-start gap-2 text-xs sm:text-sm text-gray-600">
                      <CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Full API access during rental period</span>
                    </div>
                    <div className="flex items-start gap-2 text-xs sm:text-sm text-gray-600">
                      <CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>99.9% uptime guarantee</span>
                    </div>
                    <div className="flex items-start gap-2 text-xs sm:text-sm text-gray-600">
                      <CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>On-chain rental agreement</span>
                    </div>
                    <div className="flex items-start gap-2 text-xs sm:text-sm text-gray-600">
                      <CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Automatic billing per hour</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
