"use client";

import { MarketplaceFeed } from "@/components/MarketplaceFeed";
import { useReadContract } from "wagmi";
import { ARCADE_REGISTRY_ABI, ARCADE_REGISTRY_ADDRESS } from "@/lib/blockchain/contracts/ArcadeRegistry";
import { arc } from "@/lib/blockchain/arc";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Bot } from "lucide-react";
import { formatEther } from "viem";

interface Agent {
  agentId: bigint;
  owner: string;
  name: string;
  description: string;
  category: string;
  pricePerHour: bigint;
  metadataHash: string;
  imageUrl: string;
  isListed: boolean;
}

const AGENTS_PER_PAGE = 100;

export default function Home() {
  const [page, setPage] = useState(0);
  const [allAgents, setAllAgents] = useState<any[]>([]);
  const [hasMoreAgents, setHasMoreAgents] = useState(true);

  // Get total agent count
  const { data: agentCount } = useReadContract({
    address: ARCADE_REGISTRY_ADDRESS,
    abi: ARCADE_REGISTRY_ABI,
    functionName: "getAgentCount",
    chainId: arc.id,
    query: {
      refetchOnWindowFocus: true,
      refetchInterval: 30000,
    },
  });

  // Fetch paginated agents
  const { data: paginatedAgents, isLoading, isSuccess } = useReadContract({
    address: ARCADE_REGISTRY_ADDRESS,
    abi: ARCADE_REGISTRY_ABI,
    functionName: "getAgentsPaginated",
    args: [BigInt(page * AGENTS_PER_PAGE), BigInt(AGENTS_PER_PAGE)],
    chainId: arc.id,
    query: {
      enabled: true,
      retry: false,
      refetchOnWindowFocus: true,
      refetchInterval: 30000,
      staleTime: 10000,
    },
  });

  // Process and append new agents when data loads
  useEffect(() => {
    if (isSuccess && paginatedAgents) {

      const agents = (paginatedAgents as Agent[])
        .filter((agent) => agent.isListed && agent.owner !== "0x0000000000000000000000000000000000000000")
        .map((agent) => ({
          agentId: Number(agent.agentId),
          title: agent.name || `Agent #${agent.agentId}`,
          description: agent.description || "No description available",
          category: agent.category,
          pricePerHour: formatEther(agent.pricePerHour),
          owner: agent.owner,
          isListed: agent.isListed,
          imageUrl: agent.imageUrl,
        }));

      if (page === 0) {
        // First page - replace all agents
        setAllAgents(agents);
      } else {
        // Subsequent pages - append to existing agents
        setAllAgents((prev) => [...prev, ...agents]);
      }

      // Check if there are more agents to load
      const totalAgents = agentCount ? Number(agentCount) : 0;
      const loadedCount = (page + 1) * AGENTS_PER_PAGE;
      setHasMoreAgents(loadedCount < totalAgents);
    }
  }, [isSuccess, paginatedAgents, page, agentCount]);

  const handleLoadMore = () => {
    setPage((p) => p + 1);
  };

  return (
    <main className="min-h-screen bg-slate-50">
      {isLoading && page === 0 ? (
        <div className="container max-w-7xl mx-auto px-4 py-8">
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-slate-600">Loading marketplace...</p>
            <p className="mt-2 text-xs text-slate-500">
              Contract: {ARCADE_REGISTRY_ADDRESS}
            </p>
          </div>
        </div>
      ) : allAgents.length === 0 && !isLoading ? (
        <div className="container max-w-7xl mx-auto px-4 py-8">
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-slate-100 rounded-full mb-6">
              <Bot className="w-10 h-10 text-slate-400" />
            </div>
            <h2 className="text-2xl font-semibold text-slate-900 mb-3">
              No Agents Listed Yet
            </h2>
            <p className="text-slate-600 mb-8 max-w-md mx-auto">
              The marketplace is ready for AI agents to be listed on the blockchain.
              Be the first to list your agent.
            </p>
            <Link
              href="/list-agent"
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-3 rounded-lg transition-colors shadow-sm"
            >
              <Bot className="w-5 h-5" />
              List Your Agent
            </Link>
            <div className="mt-12 pt-8 border-t border-slate-200 max-w-2xl mx-auto">
              <p className="text-sm text-slate-500">
                <strong>Contract Deployed:</strong> ArcadeRegistry at{" "}
                <code className="bg-slate-100 px-2 py-1 rounded text-xs">
                  {ARCADE_REGISTRY_ADDRESS}
                </code>
              </p>
              <p className="text-sm text-slate-500 mt-2">
                All agents listed will appear here automatically from the blockchain.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <>
          <MarketplaceFeed agents={allAgents} />
          {hasMoreAgents && (
            <div className="container max-w-7xl mx-auto px-4 pb-8">
              <div className="flex justify-center">
                <button
                  onClick={handleLoadMore}
                  disabled={isLoading}
                  className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 disabled:cursor-not-allowed text-white font-medium px-8 py-3 rounded-lg transition-colors shadow-sm"
                >
                  {isLoading && page > 0 ? (
                    <>
                      <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Loading...</span>
                    </>
                  ) : (
                    <>
                      <Bot className="w-5 h-5" />
                      <span>Load More Agents</span>
                    </>
                  )}
                </button>
              </div>
              <p className="text-center mt-4 text-sm text-slate-500">
                Showing {allAgents.length} of {agentCount ? Number(agentCount) : "..."} agents
              </p>
            </div>
          )}
        </>
      )}
    </main>
  );
}

