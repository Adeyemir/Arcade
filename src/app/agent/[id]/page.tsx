"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAgent } from "@/lib/blockchain/hooks/useArcadeRegistry";
import { useAccount } from "wagmi";
import { Button } from "@/components/ui/button";
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, CheckCircle2, Clock, DollarSign, User, Shield } from "lucide-react";
import { ReputationBadge } from "@/components/ReputationBadge";
import { JobLifecycle } from "@/components/JobLifecycle";
import { useAgentMetrics } from "@/lib/blockchain/hooks/useAgentMetrics";

export default function AgentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const agentId = params.id as string;
  const { address, isConnected } = useAccount();

  const [erc8004AgentId, setErc8004AgentId] = useState<bigint | null>(null);
  const [agentEndpoint, setAgentEndpoint] = useState<string | null>(null);
  const [supportedInputTypes, setSupportedInputTypes] = useState<string[]>(["text"]);
  const [minPriceUsdc, setMinPriceUsdc] = useState<string | null>(null);

  const { data: agent, isLoading, error } = useAgent(parseInt(agentId));

  // Fetch IPFS metadata to get the real ERC-8004 agentId, endpoint, and min price
  useEffect(() => {
    const metadataHash = (agent as any)?.metadataHash;
    if (!metadataHash || !metadataHash.startsWith("https://")) return;
    fetch(metadataHash)
      .then((r) => r.json())
      .then((meta) => {
        if (meta?.erc8004AgentId) setErc8004AgentId(BigInt(meta.erc8004AgentId));
        if (meta?.apiEndpoint) setAgentEndpoint(meta.apiEndpoint);
        if (Array.isArray(meta?.input_types)) setSupportedInputTypes(meta.input_types);
        if (meta?.min_price_usdc) setMinPriceUsdc(meta.min_price_usdc);
      })
      .catch(() => {});
  }, [(agent as any)?.metadataHash]);

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
              <p className="text-sm text-gray-500">Agent ID: {agentId}</p>
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6 order-1">
            {/* Agent Header */}
            <div className="bg-gradient-to-r from-slate-100 to-blue-50 border border-slate-200 rounded-xl p-4 sm:p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row items-start gap-4">
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
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
                    <h1 className="text-xl sm:text-2xl font-semibold text-slate-900">
                      {agent.name || `Agent #${agentId}`}
                    </h1>
                    {agent.isListed ? (
                      <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 text-xs font-medium rounded-full flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                        Active
                      </span>
                    ) : (
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
                  <div className="flex items-center gap-2 text-slate-600">
                    <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                    <span className="text-xs sm:text-sm">Owner:</span>
                    <code className="text-xs sm:text-sm bg-slate-100 px-2 py-0.5 rounded font-mono text-slate-700">
                      {agent.owner.slice(0, 6)}...{agent.owner.slice(-4)}
                    </code>
                  </div>
                </div>

                {isOwner && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg border border-blue-200 self-start">
                    <Shield className="w-4 h-4" />
                    <span className="text-sm font-medium">You own this</span>
                  </div>
                )}
              </div>
            </div>

            {/* Description */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 sm:p-6">
              <h3 className="text-xs sm:text-sm font-semibold text-slate-900 mb-2">Description</h3>
              <div className="text-xs sm:text-sm text-slate-700 bg-white border border-slate-100 p-2 sm:p-3 rounded-lg">
                {agent.description || "No description available"}
              </div>
            </div>

            {/* Performance Metrics */}
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
                    <span className="text-xs sm:text-sm font-medium">Active Jobs</span>
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

            {/* Technical Details */}
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
                        <dd className="text-xs sm:text-sm font-mono text-slate-900">0x02b0...E3a4</dd>
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
                      <ReputationBadge agentId={erc8004AgentId ?? BigInt(0)} />
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar - Hire Section */}
          <div className="lg:col-span-1 order-2">
            <div className="lg:sticky lg:top-20 bg-white border-2 border-blue-200 rounded-xl shadow-sm overflow-hidden">
              <CardHeader className="bg-gradient-to-br from-blue-600 to-blue-500 text-white p-4 sm:p-6">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="h-4 w-4 sm:h-5 sm:w-5" />
                  <CardTitle className="text-base sm:text-lg">Hire This Agent</CardTitle>
                </div>
                <CardDescription className="text-blue-50 text-xs sm:text-sm">
                  Pay per task via Xcrow USDC escrow
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4 sm:pt-6 p-4 sm:p-6">
                <div className="space-y-4 sm:space-y-6">
                  {/* Pricing */}
                  {minPriceUsdc && (
                    <div className="text-center py-3 sm:py-4 bg-slate-50 rounded-lg">
                      <p className="text-xs sm:text-sm text-slate-600 mb-1">Minimum per task</p>
                      <p className="text-3xl sm:text-4xl font-bold text-slate-900">
                        ${minPriceUsdc}
                        <span className="text-base sm:text-lg text-slate-600 ml-1">USDC</span>
                      </p>
                    </div>
                  )}

                  {/* Job Lifecycle */}
                  <JobLifecycle
                    agentWallet={agent.owner as `0x${string}`}
                    taskDescription={agent.description || `Task for agent #${agentId}`}
                    erc8004AgentId={erc8004AgentId ?? BigInt(0)}
                    agentEndpoint={agentEndpoint}
                    supportedInputTypes={supportedInputTypes}
                    minPriceUsdc={minPriceUsdc ?? undefined}
                  />

                  {/* What's Included */}
                  <div className="pt-4 border-t space-y-2">
                    <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-3">
                      What's Included
                    </p>
                    <div className="flex items-start gap-2 text-xs sm:text-sm text-gray-600">
                      <CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>USDC held in escrow until task is complete</span>
                    </div>
                    <div className="flex items-start gap-2 text-xs sm:text-sm text-gray-600">
                      <CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Cancel and reclaim funds if unsatisfied</span>
                    </div>
                    <div className="flex items-start gap-2 text-xs sm:text-sm text-gray-600">
                      <CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>On-chain settlement via Xcrow protocol</span>
                    </div>
                    <div className="flex items-start gap-2 text-xs sm:text-sm text-gray-600">
                      <CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Agent output verified and stored on-chain</span>
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
