"use client";

import { useState, useEffect, useMemo } from "react";
import { useAccount } from "wagmi";
import { formatEther } from "viem";
import Link from "next/link";
import { useOwnerEarnings, useAgentEarnings } from "@/lib/blockchain/hooks/useOwnerEarnings";
import {
  Bot,
  Clock,
  DollarSign,
  ExternalLink,
  Settings,
  BarChart3,
  Calendar,
  Activity,
  Wallet,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { ConnectWallet } from "@/components/ConnectWallet";
import { useOwnerAgents, useAgent } from "@/lib/blockchain/hooks/useArcadeRegistry";
import { useUserRentals, useRental, type Rental } from "@/lib/blockchain/hooks/useRentalManager";
import {
  useClientJobs,
  useAgentJobs,
  useJob,
  useAcceptJob,
  useRejectJob,
  useCompleteJob,
  useSettleJob,
  useCancelJob,
  useSubmitFeedback,
  JOB_STATUS,
} from "@/lib/blockchain/hooks/useXcrowRouter";
import { supabase, ArcadeJob } from "@/lib/supabase/client";
import { AgentManageModal } from "@/components/AgentManageModal";
import { DelistAgentModal } from "@/components/DelistAgentModal";
import { ExtendRentalModal } from "@/components/ExtendRentalModal";
import { SimpleBarChart } from "@/components/SimpleBarChart";
import { WithdrawEarningsModal } from "@/components/WithdrawEarningsModal";

// Custom hook to calculate rental statistics
function useRentalStats(rentalIds?: string[]): [number] {
  const [activeRentals, setActiveRentals] = useState(0);

  // Fetch all rentals
  const rentals = useMemo(() => {
    if (!rentalIds || rentalIds.length === 0) return [];
    return rentalIds;
  }, [rentalIds]);

  useEffect(() => {
    if (!rentals || rentals.length === 0) {
      setActiveRentals(0);
      return;
    }

    // This is a simplified calculation
    // In production, you'd fetch each rental and check isActive status
    const active = 0; // Would need to fetch and check each rental's isActive status

    setActiveRentals(active);
  }, [rentals]);

  return [activeRentals];
}

export default function DashboardPage() {
  const { address, isConnected } = useAccount();
  const [activeTab, setActiveTab] = useState<"agents" | "rentals" | "xcrow">("agents");
  const [mounted, setMounted] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);

  // Fetch user's owned agents with error handling
  const {
    data: ownedAgentIdsRaw,
    error: agentsError
  } = useOwnerAgents(address);

  // Fetch user's rentals with error handling
  const {
    data: rentalIdsRaw,
    error: rentalsError
  } = useUserRentals(address);

  // Convert BigInt arrays to number/string arrays immediately to avoid serialization issues
  const ownedAgentIds = ownedAgentIdsRaw?.map(id => Number(id));
  const rentalIds = rentalIdsRaw?.map(id => id.toString());

  // Get owner earnings for withdraw modal
  const { totalEarnings } = useOwnerEarnings(address);

  // Ensure consistent server/client rendering
  useEffect(() => {
    setMounted(true);
  }, []);

  // Show loading state on server and initial client render
  if (!mounted) {
    return (
      <main className="min-h-screen bg-slate-50 py-8">
        <div className="container max-w-7xl mx-auto px-4 sm:px-6">
          <div className="animate-pulse">
            <div className="h-10 bg-slate-200 rounded w-64 mb-2"></div>
            <div className="h-6 bg-slate-200 rounded w-96 mb-8"></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-white border border-slate-200 rounded-xl p-6 h-32"></div>
              ))}
            </div>
          </div>
        </div>
      </main>
    );
  }

  // Error state (blockchain read errors) — only show if wallet is connected
  if (address && (agentsError || rentalsError)) {
    console.error('Dashboard data fetch error:');
    if (agentsError) {
      console.error('Agents error:', agentsError.message || agentsError);
      console.error('Full error:', agentsError);
    }
    if (rentalsError) {
      console.error('Rentals error:', rentalsError.message || rentalsError);
      console.error('Full error:', rentalsError);
    }

    return (
      <main className="min-h-screen bg-slate-50 py-8">
        <div className="container max-w-7xl mx-auto px-4 sm:px-6">
          <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-2xl font-semibold text-slate-900 mb-2">
              Unable to Load Dashboard
            </h2>
            <p className="text-slate-600 mb-2">
              There was an error connecting to the blockchain.
            </p>
            {(agentsError || rentalsError) && (
              <div className="mt-4 p-4 bg-slate-50 rounded-lg border border-slate-200 text-left max-w-2xl mx-auto">
                <p className="text-xs font-mono text-slate-700 mb-2">Error details:</p>
                {agentsError && (
                  <p className="text-xs font-mono text-red-600 mb-1">
                    Agents: {agentsError.message || String(agentsError)}
                  </p>
                )}
                {rentalsError && (
                  <p className="text-xs font-mono text-red-600">
                    Rentals: {rentalsError.message || String(rentalsError)}
                  </p>
                )}
              </div>
            )}
            <p className="text-sm text-slate-500 mt-4 mb-6">
              Please check your network connection and contract addresses.
            </p>
            <Button
              onClick={() => window.location.reload()}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Reload Page
            </Button>
          </div>
        </div>
      </main>
    );
  }

  // Not connected state (only shown after mount)
  if (!isConnected) {
    return (
      <main className="min-h-screen bg-slate-50 py-8">
        <div className="container max-w-7xl mx-auto px-4 sm:px-6">
          <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
            <Bot className="w-16 h-16 text-slate-400 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-slate-900 mb-2">
              Connect Your Wallet
            </h2>
            <p className="text-slate-600 mb-6">
              Please connect your wallet to view your dashboard
            </p>
            <div className="flex justify-center">
              <ConnectWallet />
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 py-8">
      <div className="container max-w-7xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-semibold text-slate-900 mb-2">
            My Dashboard
          </h1>
          <p className="text-sm sm:text-base text-slate-600">
            Manage your agents and rental activity
          </p>
        </div>

        {/* Stats Cards */}
        <StatsSection
          ownedAgentIds={ownedAgentIds}
          rentalIds={rentalIds}
          onWithdrawClick={() => setShowWithdrawModal(true)}
        />

        {/* Tabs */}
        <div className="mb-6">
          <div className="bg-white border border-slate-200 rounded-lg p-1 inline-flex gap-1">
            <button
              onClick={() => setActiveTab("agents")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === "agents"
                  ? "bg-blue-600 text-white"
                  : "text-slate-700 hover:bg-slate-50"
              }`}
            >
              My Agents ({ownedAgentIds?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab("rentals")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === "rentals"
                  ? "bg-blue-600 text-white"
                  : "text-slate-700 hover:bg-slate-50"
              }`}
            >
              My Rentals ({rentalIds?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab("xcrow")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === "xcrow"
                  ? "bg-blue-600 text-white"
                  : "text-slate-700 hover:bg-slate-50"
              }`}
            >
              Xcrow Jobs
            </button>
          </div>
        </div>

        {/* Analytics Chart - Show for agents tab */}
        {activeTab === "agents" && ownedAgentIds?.length ? (
          <div className="mb-6">
            <SimpleBarChart
              title="Agent Performance"
              data={[
                { label: "Total Agents", value: ownedAgentIds.length, color: "bg-gradient-to-r from-blue-500 to-blue-600" },
                { label: "Listed Agents", value: 0, color: "bg-gradient-to-r from-emerald-500 to-emerald-600" },
                { label: "Total Rentals", value: 0, color: "bg-gradient-to-r from-purple-500 to-purple-600" },
              ]}
            />
          </div>
        ) : null}

        {/* Content */}
        {activeTab === "agents" && (
          <MyAgentsSection ownedAgentIds={ownedAgentIds} />
        )}
        {activeTab === "rentals" && <MyRentalsSection rentalIds={rentalIds} />}
        {activeTab === "xcrow" && <XcrowJobsSection address={address} />}
      </div>

      {/* Withdraw Earnings Modal */}
      <WithdrawEarningsModal
        isOpen={showWithdrawModal}
        onClose={() => setShowWithdrawModal(false)}
        availableBalance={totalEarnings || "0"}
      />
    </main>
  );
}

// Stats Section Component
function StatsSection({
  ownedAgentIds,
  rentalIds,
  onWithdrawClick,
}: {
  ownedAgentIds?: number[];
  rentalIds?: string[];
  onWithdrawClick: () => void;
}) {
  const { address } = useAccount();
  const totalAgents = ownedAgentIds?.length || 0;
  const totalRentals = rentalIds?.length || 0;

  // Get real earnings from contract
  const { totalEarnings, isLoading: earningsLoading } = useOwnerEarnings(address);

  // Calculate active rentals
  const [activeRentals] = useRentalStats(rentalIds);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
      {/* Total Agents */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-slate-600">Total Agents</span>
          <Bot className="w-5 h-5 text-blue-600" />
        </div>
        <p className="text-2xl sm:text-3xl font-bold text-slate-900">{totalAgents}</p>
        <p className="text-xs text-slate-500 mt-1">Agents you own</p>
      </div>

      {/* Active Rentals */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-slate-600">Active Rentals</span>
          <Activity className="w-5 h-5 text-emerald-600" />
        </div>
        <p className="text-2xl sm:text-3xl font-bold text-slate-900">{activeRentals}</p>
        <p className="text-xs text-slate-500 mt-1">Currently renting</p>
      </div>

      {/* Total Rentals */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-slate-600">Total Rentals</span>
          <Calendar className="w-5 h-5 text-purple-600" />
        </div>
        <p className="text-2xl sm:text-3xl font-bold text-slate-900">{totalRentals}</p>
        <p className="text-xs text-slate-500 mt-1">All time</p>
      </div>

      {/* Total Revenue */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-slate-600">Total Revenue</span>
          <DollarSign className="w-5 h-5 text-cyan-600" />
        </div>
        {earningsLoading ? (
          <div className="animate-pulse">
            <div className="h-8 bg-slate-200 rounded w-24 mb-2"></div>
          </div>
        ) : (
          <>
            <p className="text-2xl sm:text-3xl font-bold text-slate-900">
              {parseFloat(totalEarnings).toFixed(4)}
            </p>
            <p className="text-xs text-slate-500 mt-1">ARC earned</p>
            <Button
              onClick={onWithdrawClick}
              className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white text-sm py-2"
              disabled={parseFloat(totalEarnings) === 0}
            >
              <Wallet className="w-4 h-4 mr-2" />
              Withdraw Earnings
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

// My Agents Section Component
function MyAgentsSection({ ownedAgentIds }: { ownedAgentIds?: number[] }) {
  if (!ownedAgentIds || ownedAgentIds.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
        <Bot className="w-16 h-16 text-slate-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-slate-900 mb-2">
          No Agents Yet
        </h3>
        <p className="text-slate-600 mb-6">
          List your first AI agent to start earning on the marketplace
        </p>
        <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white">
          <Link href="/list-agent">List Your First Agent</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {ownedAgentIds.map((agentId) => (
        <AgentCard key={agentId} agentId={agentId} />
      ))}
    </div>
  );
}

// Individual Agent Card Component
function AgentCard({ agentId }: { agentId: number }) {
  const [showManageModal, setShowManageModal] = useState(false);
  const [showDelistModal, setShowDelistModal] = useState(false);
  const { data: agent, refetch, error } = useAgent(agentId);

  // Get earnings for this specific agent
  const { earnings: agentEarnings, rentalCount } = useAgentEarnings(agentId);

  // Error state
  if (error) {
    console.error(`Failed to load agent ${agentId}:`, error);
    return (
      <div className="bg-white border border-red-200 rounded-xl p-6">
        <p className="text-sm text-red-600">Failed to load agent data</p>
      </div>
    );
  }

  // Loading state
  if (!agent) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-6 animate-pulse">
        <div className="h-6 bg-slate-200 rounded w-1/3 mb-4"></div>
        <div className="h-4 bg-slate-200 rounded w-1/2"></div>
      </div>
    );
  }

  const agentData = agent as any;
  const pricePerHour = formatEther(agentData.pricePerHour);

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-6 hover:shadow-lg transition-shadow">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* Left: Agent Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl overflow-hidden flex items-center justify-center flex-shrink-0">
              {agentData.imageUrl ? (
                <img
                  src={agentData.imageUrl}
                  alt={agentData.name || `Agent #${agentId.toString()}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-white font-bold text-sm sm:text-base">
                  A{agentId.toString()}
                </span>
              )}
            </div>
            <div className="min-w-0">
              <h3 className="text-base sm:text-lg font-semibold text-slate-900">
                {agentData.name || `Agent #${agentId.toString()}`}
              </h3>
              {agentData.category && (
                <p className="text-xs text-slate-500 mt-0.5">{agentData.category}</p>
              )}
              <div className="flex items-center gap-2 mt-1">
                <span
                  className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                    agentData.isListed
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-slate-100 text-slate-700"
                  }`}
                >
                  {agentData.isListed ? "Listed" : "Unlisted"}
                </span>
                <span className="text-sm text-slate-600">
                  {pricePerHour} ARC/hr
                </span>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="mt-3">
            <p className="text-xs text-slate-500 mb-1">Description</p>
            <p className="text-sm text-slate-700">
              {agentData.description || "No description available"}
            </p>
          </div>

          {/* Agent Earnings */}
          <div className="mt-3 grid grid-cols-2 gap-3">
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-2">
              <p className="text-xs text-emerald-600 mb-1">Total Earnings</p>
              <p className="text-lg font-bold text-emerald-900">
                {parseFloat(agentEarnings).toFixed(4)} ARC
              </p>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-2">
              <p className="text-xs text-blue-600 mb-1">Rentals</p>
              <p className="text-lg font-bold text-blue-900">{rentalCount}</p>
            </div>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex sm:flex-col gap-2 sm:gap-3">
          <Button
            variant="outline"
            size="sm"
            asChild
            className="flex-1 sm:flex-none text-xs sm:text-sm"
          >
            <Link href={`/agent/${agentId.toString()}`}>
              <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5" />
              View
            </Link>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowManageModal(true)}
            className="flex-1 sm:flex-none text-xs sm:text-sm"
          >
            <Settings className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5" />
            Manage
          </Button>
          {agentData.isListed && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDelistModal(true)}
              className="flex-1 sm:flex-none text-xs sm:text-sm text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5" />
              Delist
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            asChild
            className="flex-1 sm:flex-none text-xs sm:text-sm"
          >
            <Link href={`/agent/${agentId.toString()}/analytics`}>
              <BarChart3 className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5" />
              Stats
            </Link>
          </Button>
        </div>
      </div>

      {/* Manage Modal */}
      {showManageModal && (
        <AgentManageModal
          agentId={BigInt(agentId)}
          currentPrice={agentData.pricePerHour}
          isListed={agentData.isListed}
          onClose={() => setShowManageModal(false)}
          onSuccess={() => refetch()}
        />
      )}

      {/* Delist Modal */}
      {showDelistModal && (
        <DelistAgentModal
          agentId={agentId}
          agentName={agentData.name}
          isOpen={showDelistModal}
          onClose={() => setShowDelistModal(false)}
          onSuccess={() => refetch()}
        />
      )}
    </div>
  );
}

// My Rentals Section Component
function MyRentalsSection({ rentalIds }: { rentalIds?: string[] }) {
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "expired" | "completed">("all");
  const [sortBy, setSortBy] = useState<"newest" | "oldest">("newest");

  if (!rentalIds || rentalIds.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
        <Clock className="w-16 h-16 text-slate-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-slate-900 mb-2">
          No Rentals Yet
        </h3>
        <p className="text-slate-600 mb-6">
          Browse the marketplace to rent your first AI agent
        </p>
        <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white">
          <Link href="/">Browse Marketplace</Link>
        </Button>
      </div>
    );
  }

  // Sort rental IDs (they're already strings, so parse them for comparison)
  const sortedRentalIds = [...rentalIds].sort((a, b) => {
    const numA = parseInt(a);
    const numB = parseInt(b);
    if (sortBy === "newest") {
      return numB - numA;
    } else {
      return numA - numB;
    }
  });

  return (
    <div className="space-y-4">
      {/* Filter and Sort Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Filter by Status */}
          <div className="flex-1">
            <label className="text-xs font-medium text-slate-700 mb-2 block">
              Filter by Status
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="w-full px-3 py-2 text-sm text-slate-900 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Rentals</option>
              <option value="active">Active Only</option>
              <option value="expired">Expired Only</option>
              <option value="completed">Completed Only</option>
            </select>
          </div>

          {/* Sort by Date */}
          <div className="flex-1">
            <label className="text-xs font-medium text-slate-700 mb-2 block">
              Sort by Date
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full px-3 py-2 text-sm text-slate-900 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
            </select>
          </div>
        </div>
      </div>

      {/* Rental Cards */}
      {sortedRentalIds.map((rentalId) => (
        <RentalCard
          key={rentalId}
          rentalId={rentalId}
          filterStatus={filterStatus}
        />
      ))}
    </div>
  );
}

// Individual Rental Card Component
function RentalCard({
  rentalId,
  filterStatus = "all",
}: {
  rentalId: string;
  filterStatus?: "all" | "active" | "expired" | "completed";
}) {
  const [showExtendModal, setShowExtendModal] = useState(false);
  const { data: rental, refetch, error } = useRental(BigInt(rentalId));
  const { data: agent } = useAgent(rental ? Number((rental as Rental).agentId) : 0);

  // Error state
  if (error) {
    console.error(`Failed to load rental ${rentalId}:`, error);
    return (
      <div className="bg-white border border-red-200 rounded-xl p-6">
        <p className="text-sm text-red-600">Failed to load rental data</p>
      </div>
    );
  }

  // Loading state
  if (!rental) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-6 animate-pulse">
        <div className="h-6 bg-slate-200 rounded w-1/3 mb-4"></div>
        <div className="h-4 bg-slate-200 rounded w-1/2"></div>
      </div>
    );
  }

  const rentalData = rental as Rental;
  const totalCost = formatEther(rentalData.totalCost);
  const startDate = new Date(Number(rentalData.startTime) * 1000);
  const endDate = new Date(Number(rentalData.endTime) * 1000);
  const isActive = rentalData.isActive && !rentalData.completed;
  const now = Date.now();
  const hasEnded = now > endDate.getTime();

  // Determine status
  const status = isActive && !hasEnded ? "active" : hasEnded ? "expired" : "completed";

  // Filter logic
  if (filterStatus !== "all" && status !== filterStatus) {
    return null;
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-6 hover:shadow-lg transition-shadow">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        {/* Left: Rental Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl overflow-hidden flex items-center justify-center flex-shrink-0">
              {(agent as any)?.imageUrl ? (
                <img
                  src={(agent as any).imageUrl}
                  alt={(agent as any)?.name || `Agent #${rentalData.agentId.toString()}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-white font-bold text-sm sm:text-base">
                  {(agent as any)?.name?.charAt(0).toUpperCase() || 'A'}
                </span>
              )}
            </div>
            <div className="min-w-0">
              <h3 className="text-base sm:text-lg font-semibold text-slate-900">
                {(agent as any)?.name || `Agent #${rentalData.agentId.toString()}`}
              </h3>
              {(agent as any)?.category && (
                <p className="text-xs text-slate-500 mt-0.5">{(agent as any).category}</p>
              )}
              <div className="flex items-center gap-2 mt-1">
                <span
                  className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                    isActive && !hasEnded
                      ? "bg-emerald-100 text-emerald-700"
                      : hasEnded
                      ? "bg-amber-100 text-amber-700"
                      : "bg-slate-100 text-slate-700"
                  }`}
                >
                  {isActive && !hasEnded
                    ? "Active"
                    : hasEnded
                    ? "Expired"
                    : "Completed"}
                </span>
                <span className="text-sm text-slate-600">
                  {rentalData.hoursRented.toString()}h rental
                </span>
              </div>
            </div>
          </div>

          {/* Rental Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-slate-500 mb-1">Start Time</p>
              <p className="text-slate-900 font-medium">
                {startDate.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-slate-500 mb-1">End Time</p>
              <p className="text-slate-900 font-medium">
                {endDate.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-slate-500 mb-1">Total Cost</p>
              <p className="text-slate-900 font-medium">{totalCost} ARC</p>
            </div>
            <div>
              <p className="text-slate-500 mb-1">Rental ID</p>
              <p className="text-slate-900 font-mono text-xs">
                #{rentalId}
              </p>
            </div>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex sm:flex-col gap-2">
          <Button
            variant="outline"
            size="sm"
            asChild
            className="flex-1 sm:flex-none text-xs sm:text-sm"
          >
            <Link href={`/agent/${rentalData.agentId.toString()}`}>
              <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5" />
              View Agent
            </Link>
          </Button>
          {isActive && !hasEnded && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowExtendModal(true)}
              className="flex-1 sm:flex-none text-xs sm:text-sm text-amber-700 border-amber-200 hover:bg-amber-50"
            >
              <Clock className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5" />
              Extend
            </Button>
          )}
        </div>
      </div>

      {/* Extend Rental Modal */}
      {showExtendModal && (
        <ExtendRentalModal
          agentId={rentalData.agentId}
          currentEndTime={endDate}
          onClose={() => setShowExtendModal(false)}
          onSuccess={() => refetch()}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Xcrow Jobs Section
// ---------------------------------------------------------------------------

function XcrowJobsSection({ address }: { address: `0x${string}` | undefined }) {
  const [activeView, setActiveView] = useState<"client" | "agent">("client");

  const { jobIds: clientJobIds, isLoading: clientLoading, refetch: refetchClient } = useClientJobs(address);
  const { jobIds: agentJobIds, isLoading: agentLoading, refetch: refetchAgent } = useAgentJobs(address);

  return (
    <div className="space-y-4">
      {/* View toggle */}
      <div className="bg-white border border-slate-200 rounded-xl p-4">
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setActiveView("client")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeView === "client"
                ? "bg-blue-100 text-blue-700 border border-blue-200"
                : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            Jobs I Created ({clientJobIds.length})
          </button>
          <button
            onClick={() => setActiveView("agent")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeView === "agent"
                ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            Jobs Assigned to Me
          </button>
        </div>

      </div>

      {/* Client jobs list */}
      {activeView === "client" && (
        <div className="space-y-3">
          {clientLoading ? (
            <div className="bg-white border border-slate-200 rounded-xl p-6 animate-pulse">
              <div className="h-5 bg-slate-200 rounded w-1/3 mb-3" />
              <div className="h-4 bg-slate-200 rounded w-1/2" />
            </div>
          ) : clientJobIds.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
              <DollarSign className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-600 font-medium">No jobs created yet</p>
              <p className="text-sm text-slate-400 mt-1">Hire an agent via Xcrow on any agent page</p>
            </div>
          ) : (
            clientJobIds.map((jobId) => (
              <XcrowJobCard key={jobId.toString()} jobId={jobId} role="client" onRefetch={refetchClient} />
            ))
          )}
        </div>
      )}

      {/* Agent jobs list */}
      {activeView === "agent" && (
        <div className="space-y-3">
          {agentLoading ? (
            <div className="bg-white border border-slate-200 rounded-xl p-6 animate-pulse">
              <div className="h-5 bg-slate-200 rounded w-1/3 mb-3" />
              <div className="h-4 bg-slate-200 rounded w-1/2" />
            </div>
          ) : agentJobIds.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
              <Bot className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-600 font-medium">No jobs assigned to your wallet</p>
              <p className="text-sm text-slate-400 mt-1">Jobs will appear here when a client hires your agent</p>
            </div>
          ) : (
            agentJobIds.map((jobId) => (
              <XcrowJobCard key={jobId.toString()} jobId={jobId} role="agent" onRefetch={refetchAgent} />
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Individual Xcrow Job Card
// ---------------------------------------------------------------------------

const STATUS_STYLES: Record<string, string> = {
  Created:    "bg-yellow-100 text-yellow-700",
  Accepted:   "bg-blue-100 text-blue-700",
  InProgress: "bg-indigo-100 text-indigo-700",
  Completed:  "bg-emerald-100 text-emerald-700",
  Settled:    "bg-green-100 text-green-700",
  Disputed:   "bg-red-100 text-red-700",
  Cancelled:  "bg-slate-100 text-slate-500",
  Refunded:   "bg-slate-100 text-slate-500",
  Expired:    "bg-slate-100 text-slate-500",
};

function XcrowJobCard({
  jobId,
  role,
  onRefetch,
}: {
  jobId: bigint;
  role: "client" | "agent";
  onRefetch: () => void;
}) {
  const { job, isLoading, error, refetch: refetchJob } = useJob(jobId);
  const accept = useAcceptJob();
  const reject = useRejectJob();
  const complete = useCompleteJob();
  const settle = useSettleJob();
  const cancel = useCancelJob();
  const feedback = useSubmitFeedback();
  const [reviewStars, setReviewStars] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [txErr, setTxErr] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [showCancelInput, setShowCancelInput] = useState(false);
  const [arcadeJob, setArcadeJob] = useState<ArcadeJob | null>(null);

  // Fetch task details from Supabase — poll every 5s until output arrives
  useEffect(() => {
    const fetchJob = async () => {
      const { data } = await supabase
        .from("jobs")
        .select("*")
        .eq("job_id", jobId.toString())
        .single();
      if (data) setArcadeJob(data as ArcadeJob);
    };

    fetchJob();

    // Keep polling while output is not yet available and job is not settled/cancelled
    const interval = setInterval(async () => {
      const { data } = await supabase
        .from("jobs")
        .select("*")
        .eq("job_id", jobId.toString())
        .single();
      if (data) {
        setArcadeJob(data as ArcadeJob);
        // Stop polling once output arrives
        if (data.output_text || data.output_files) clearInterval(interval);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [jobId]);

  // Refetch after any tx confirms
  useEffect(() => { if (accept.isSuccess)  { refetchJob(); onRefetch(); } }, [accept.isSuccess]);
  useEffect(() => { if (reject.isSuccess)  { refetchJob(); onRefetch(); } }, [reject.isSuccess]);
  useEffect(() => { if (complete.isSuccess) { refetchJob(); onRefetch(); } }, [complete.isSuccess]);
  useEffect(() => { if (settle.isSuccess)  { refetchJob(); onRefetch(); } }, [settle.isSuccess]);
  useEffect(() => { if (cancel.isSuccess)  { refetchJob(); onRefetch(); } }, [cancel.isSuccess]);
  useEffect(() => { if (feedback.isSuccess) { setReviewSubmitted(true); setShowReviewForm(false); } }, [feedback.isSuccess]);

  if (isLoading) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-6 animate-pulse">
        <div className="h-5 bg-slate-200 rounded w-1/3 mb-3" />
        <div className="h-4 bg-slate-200 rounded w-1/2" />
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="bg-white border border-red-200 rounded-xl p-4">
        <p className="text-sm text-red-600">Failed to load job #{jobId.toString()}</p>
      </div>
    );
  }

  const statusLabel = JOB_STATUS[job.status as keyof typeof JOB_STATUS] ?? "Unknown";
  const statusStyle = STATUS_STYLES[statusLabel] ?? "bg-slate-100 text-slate-500";
  const amountUsdc = (Number(job.amount) / 1e6).toFixed(2);
  const agentPayout = ((Number(job.amount) - Number(job.platformFee)) / 1e6).toFixed(2);
  const deadline = new Date(Number(job.deadline) * 1000).toLocaleString();
  const isBusy =
    accept.isPending || accept.isConfirming ||
    reject.isPending || reject.isConfirming ||
    complete.isPending || complete.isConfirming ||
    settle.isPending || settle.isConfirming ||
    cancel.isPending || cancel.isConfirming;

  const handleAccept = async () => {
    setTxErr(null);
    try {
      await accept.acceptJob(jobId);
      // After accepting, call the agent's endpoint if one is set
      if (arcadeJob?.agent_endpoint) {
        const payload = {
          job_id: jobId.toString(),
          task_type: arcadeJob.task_type,
          task_text: arcadeJob.task_text ?? null,
          task_files: arcadeJob.task_files ?? [],
          client_address: arcadeJob.client_address,
          agent_address: arcadeJob.agent_address,
        };
        try {
          const res = await fetch(arcadeJob.agent_endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
          if (res.ok) {
            const output = await res.json();
            // Save agent output to Supabase
            await supabase
              .from("jobs")
              .update({
                output_text: output.output_text ?? null,
                output_files: output.output_files ?? null,
              })
              .eq("job_id", jobId.toString());
            setArcadeJob((prev) =>
              prev
                ? { ...prev, output_text: output.output_text ?? null, output_files: output.output_files ?? null }
                : prev
            );
          }
        } catch {
          // Agent endpoint call failed — job is still accepted on-chain
        }
      }
    } catch (e: any) { setTxErr(e?.shortMessage || e?.message || "Failed"); }
  };

  const handleReject = async () => {
    setTxErr(null);
    try { await reject.rejectJob(jobId); }
    catch (e: any) { setTxErr(e?.shortMessage || e?.message || "Failed"); }
  };

  const handleComplete = async () => {
    setTxErr(null);
    try { await complete.completeJob(jobId); }
    catch (e: any) { setTxErr(e?.shortMessage || e?.message || "Failed"); }
  };

  const handleSettle = async () => {
    setTxErr(null);
    try { await settle.settleJob(jobId); }
    catch (e: any) { setTxErr(e?.shortMessage || e?.message || "Failed"); }
  };

  const handleCancel = async () => {
    setTxErr(null);
    try { await cancel.cancelJob(jobId); }
    catch (e: any) { setTxErr(e?.shortMessage || e?.message || "Failed"); }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-semibold text-slate-900">Job #{job.jobId.toString()}</span>
            <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${statusStyle}`}>
              {statusLabel}
            </span>
          </div>
          <p className="text-xs text-slate-500">Agent ID: {job.agentId.toString()}</p>
          <p className="text-xs text-slate-500">Deadline: {deadline}</p>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-lg font-bold text-slate-900">{amountUsdc} USDC</p>
          <p className="text-xs text-slate-400">Fee: {(Number(job.platformFee) / 1e6).toFixed(2)} USDC</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs mb-3">
        <div>
          <p className="text-slate-400 mb-0.5">Agent Wallet</p>
          <p className="font-mono text-slate-700 truncate">{job.agentWallet}</p>
        </div>
        <div>
          <p className="text-slate-400 mb-0.5">Agent Payout</p>
          <p className="font-mono text-slate-700">{agentPayout} USDC</p>
        </div>
      </div>

      {/* Task details from Supabase */}
      {arcadeJob?.task_text && (
        <div className="mb-3 p-3 bg-slate-50 border border-slate-200 rounded-lg">
          <p className="text-xs font-medium text-slate-500 mb-1">Task</p>
          <p className="text-sm text-slate-800 whitespace-pre-wrap">{arcadeJob.task_text}</p>
          {arcadeJob.task_files && arcadeJob.task_files.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {arcadeJob.task_files.map((url, i) => (
                <a
                  key={i}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 underline truncate max-w-[160px]"
                >
                  Attachment {i + 1}
                </a>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Agent output from Supabase */}
      {arcadeJob?.output_text && (
        <div className="mb-3 p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-xs font-medium text-green-700 mb-1">Agent Output</p>
          <p className="text-sm text-slate-800 whitespace-pre-wrap">{arcadeJob.output_text}</p>
          {arcadeJob.output_files && arcadeJob.output_files.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {arcadeJob.output_files.map((url, i) => (
                <a
                  key={i}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-green-700 underline truncate max-w-[160px]"
                >
                  Output file {i + 1}
                </a>
              ))}
            </div>
          )}
        </div>
      )}

      {/* CLIENT ACTIONS */}
      {role === "client" && (
        <div className="pt-2 border-t border-slate-100 space-y-2">
          {/* Status 0: can cancel and get refund */}
          {job.status === 0 && !showCancelInput && (
            <button
              onClick={() => setShowCancelInput(true)}
              disabled={isBusy}
              className="w-full py-2 text-sm font-medium text-red-600 border border-red-200 hover:bg-red-50 rounded-lg transition-colors"
            >
              Cancel Job &amp; Get Refund
            </button>
          )}
          {job.status === 0 && showCancelInput && (
            <div className="space-y-2">
              <textarea
                rows={2}
                placeholder="Reason for cancelling (optional)"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleCancel}
                  disabled={isBusy}
                  className="flex-1 py-2 text-sm font-medium bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white rounded-lg transition-colors"
                >
                  {cancel.isPending || cancel.isConfirming ? "Cancelling…" : `Confirm Cancel · Refund ${amountUsdc} USDC`}
                </button>
                <button
                  onClick={() => setShowCancelInput(false)}
                  className="px-3 py-2 text-sm text-slate-600 border border-slate-200 hover:bg-slate-50 rounded-lg"
                >
                  Back
                </button>
              </div>
            </div>
          )}

          {/* Status 1/2: job accepted or in progress — client waiting */}
          {(job.status === 1 || job.status === 2) && (
            <div className="py-2 text-sm text-center text-blue-700 bg-blue-50 border border-blue-200 rounded-lg">
              Agent is working on this job…
            </div>
          )}

          {/* Status 3: agent marked complete — release payment */}
          {job.status === 3 && (
            <button
              onClick={handleSettle}
              disabled={isBusy}
              className="w-full py-2 text-sm font-medium bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white rounded-lg transition-colors"
            >
              {settle.isPending || settle.isConfirming ? "Releasing…" : `Release Payment · ${agentPayout} USDC to agent`}
            </button>
          )}

          {/* Status 4: settled */}
          {job.status === 4 && (
            <div className="space-y-3">
              <div className="py-2 text-sm text-center text-green-700 bg-green-50 border border-green-200 rounded-lg">
                Payment released ✓
              </div>
              {role === "client" && !reviewSubmitted && (
                <div>
                  {!showReviewForm ? (
                    <button
                      onClick={() => setShowReviewForm(true)}
                      className="w-full py-2 text-sm font-medium text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
                    >
                      ⭐ Leave a Review
                    </button>
                  ) : (
                    <div className="border border-slate-200 rounded-lg p-4 space-y-3 bg-slate-50">
                      <p className="text-sm font-medium text-slate-700">Rate this agent</p>
                      <div className="flex gap-2">
                        {[1,2,3,4,5].map(s => (
                          <button key={s} onClick={() => setReviewStars(s)}
                            className={`text-2xl transition-transform hover:scale-110 ${s <= reviewStars ? "opacity-100" : "opacity-30"}`}>
                            ⭐
                          </button>
                        ))}
                      </div>
                      <textarea
                        value={reviewComment}
                        onChange={e => setReviewComment(e.target.value)}
                        placeholder="Optional comment…"
                        rows={2}
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 bg-white placeholder:text-slate-400"
                      />
                      {feedback.error && (
                        <p className="text-xs text-red-600">{(feedback.error as Error).message?.slice(0,120)}</p>
                      )}
                      <div className="flex gap-2">
                        <button
                          onClick={async () => {
                            try { await feedback.submitFeedback(jobId, reviewStars, reviewComment); }
                            catch (e: any) { console.error(e); }
                          }}
                          disabled={feedback.isPending || feedback.isConfirming}
                          className="flex-1 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                        >
                          {feedback.isPending || feedback.isConfirming ? "Submitting…" : "Submit Review"}
                        </button>
                        <button onClick={() => setShowReviewForm(false)}
                          className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-100">
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
              {role === "client" && reviewSubmitted && (
                <div className="py-2 text-sm text-center text-blue-700 bg-blue-50 border border-blue-200 rounded-lg">
                  Review submitted ✓
                </div>
              )}
            </div>
          )}

          {/* Status 6: cancelled */}
          {job.status === 6 && (
            <div className="py-2 text-sm text-center text-slate-600 bg-slate-50 border border-slate-200 rounded-lg">
              Job cancelled · {amountUsdc} USDC refunded
            </div>
          )}
        </div>
      )}

      {/* AGENT ACTIONS */}
      {role === "agent" && (
        <div className="flex gap-2 pt-2 border-t border-slate-100">
          {job.status === 0 && (
            <>
              <button
                onClick={handleAccept}
                disabled={isBusy}
                className="flex-1 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-lg transition-colors"
              >
                {accept.isPending || accept.isConfirming ? "Accepting…" : "Accept"}
              </button>
              <button
                onClick={handleReject}
                disabled={isBusy}
                className="flex-1 py-2 text-sm font-medium border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50 rounded-lg transition-colors"
              >
                {reject.isPending || reject.isConfirming ? "Rejecting…" : "Reject"}
              </button>
            </>
          )}
          {(job.status === 1 || job.status === 2) && (
            <button
              onClick={handleComplete}
              disabled={isBusy}
              className="flex-1 py-2 text-sm font-medium bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white rounded-lg transition-colors"
            >
              {complete.isPending || complete.isConfirming ? "Completing…" : "Mark as Complete"}
            </button>
          )}
          {job.status === 3 && (
            <div className="flex-1 py-2 text-sm text-center text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg">
              Done — waiting for client to release payment
            </div>
          )}
          {job.status === 4 && (
            <div className="flex-1 py-2 text-sm text-center text-green-700 bg-green-50 border border-green-200 rounded-lg">
              Payment received ✓
            </div>
          )}
          {job.status === 6 && (
            <div className="flex-1 py-2 text-sm text-center text-slate-500 bg-slate-50 border border-slate-200 rounded-lg">
              Job rejected — client refunded
            </div>
          )}
        </div>
      )}

      {txErr && (
        <p className="mt-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {txErr}
        </p>
      )}
    </div>
  );
}
