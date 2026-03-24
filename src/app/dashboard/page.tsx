"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import Link from "next/link";
import { useAgentEarnings } from "@/lib/blockchain/hooks/useOwnerEarnings";
import {
  Bot,
  DollarSign,
  ExternalLink,
  Settings,
  BarChart3,
  Activity,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { ConnectWallet } from "@/components/ConnectWallet";
import { useOwnerAgents, useAgent } from "@/lib/blockchain/hooks/useArcadeRegistry";
import {
  useClientJobs,
  useAgentJobs,
  useJob,
  useCancelJob,
  useSubmitFeedback,
  useDisputeJob,
  useAgentXcrowEarnings,
  JOB_STATUS,
} from "@/lib/blockchain/hooks/useXcrowRouter";
import { supabase, ArcadeJob } from "@/lib/supabase/client";
import { AgentManageModal } from "@/components/AgentManageModal";
import { DelistAgentModal } from "@/components/DelistAgentModal";
import { SimpleBarChart } from "@/components/SimpleBarChart";

/** Whether the job has any output ready */
function hasOutput(job: ArcadeJob | null): boolean {
  if (!job) return false;
  return !!(job.output_text || (job.output_files && job.output_files.length > 0));
}

export default function DashboardPage() {
  const { address, isConnected } = useAccount();
  const [activeTab, setActiveTab] = useState<"agents" | "xcrow">("agents");
  const [mounted, setMounted] = useState(false);


  // Fetch user's owned agents with error handling
  const {
    data: ownedAgentIdsRaw,
    error: agentsError
  } = useOwnerAgents(address);

  // Convert BigInt arrays to number/string arrays immediately to avoid serialization issues
  const ownedAgentIds = ownedAgentIdsRaw?.map(id => Number(id));



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
  if (address && agentsError) {
    console.error('Dashboard data fetch error:');
    console.error('Agents error:', agentsError.message || agentsError);

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
            <div className="mt-4 p-4 bg-slate-50 rounded-lg border border-slate-200 text-left max-w-2xl mx-auto">
              <p className="text-xs font-mono text-slate-700 mb-2">Error details:</p>
              <p className="text-xs font-mono text-red-600 mb-1">
                {agentsError.message || String(agentsError)}
              </p>
            </div>
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
            Manage your agents and Xcrow jobs
          </p>
        </div>

        {/* Stats Cards */}
        <StatsSection
          ownedAgentIds={ownedAgentIds}
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
        {activeTab === "xcrow" && <XcrowJobsSection address={address} />}
      </div>

    </main>
  );
}

// Stats Section Component
function StatsSection({
  ownedAgentIds,
}: {
  ownedAgentIds?: number[];
}) {
  const { address } = useAccount();
  const totalAgents = ownedAgentIds?.length || 0;

  // Total USDC earned from settled Xcrow jobs
  const { totalUsdc, jobCount, isLoading: earningsLoading } = useAgentXcrowEarnings(address);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8">
      {/* Total Agents */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-slate-600">Total Agents</span>
          <Bot className="w-5 h-5 text-blue-600" />
        </div>
        <p className="text-2xl sm:text-3xl font-bold text-slate-900">{totalAgents}</p>
        <p className="text-xs text-slate-500 mt-1">Agents you own</p>
      </div>

      {/* Xcrow Jobs */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-slate-600">Xcrow Jobs</span>
          <Activity className="w-5 h-5 text-emerald-600" />
        </div>
        <p className="text-2xl sm:text-3xl font-bold text-slate-900">{earningsLoading ? "…" : jobCount}</p>
        <p className="text-xs text-slate-500 mt-1">Jobs completed</p>
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
              {totalUsdc.toFixed(2)} <span className="text-base font-medium text-slate-500">USDC</span>
            </p>
            <p className="text-xs text-slate-500 mt-1">From settled jobs</p>
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
            [...clientJobIds].sort((a, b) => (a > b ? -1 : 1)).map((jobId) => (
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
            [...agentJobIds].sort((a, b) => (a > b ? -1 : 1)).map((jobId) => (
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

// ---------------------------------------------------------------------------
// Smart output renderer — audit JSON gets a formatted report, plain text
// falls back to a simple pre-wrap display.
// ---------------------------------------------------------------------------

const SEVERITY_STYLES: Record<string, string> = {
  Critical:      "bg-red-100 text-red-700 border border-red-200",
  High:          "bg-orange-100 text-orange-700 border border-orange-200",
  Medium:        "bg-yellow-100 text-yellow-700 border border-yellow-200",
  Low:           "bg-blue-100 text-blue-700 border border-blue-200",
  Informational: "bg-slate-100 text-slate-600 border border-slate-200",
};

const VERDICT_STYLES: Record<string, string> = {
  "Do not deploy":      "bg-red-100 text-red-700",
  "Deploy with caution": "bg-yellow-100 text-yellow-700",
  "Safe to deploy":     "bg-green-100 text-green-700",
};

function AuditReport({ report }: { report: { findings: any[]; summary: any } }) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const { findings, summary } = report;
  const verdictStyle = VERDICT_STYLES[summary.verdict] ?? "bg-slate-100 text-slate-600";
  const riskPct = Math.min(100, Math.max(0, summary.overall_risk_score));
  const riskColor = riskPct >= 75 ? "bg-red-500" : riskPct >= 50 ? "bg-yellow-500" : "bg-green-500";

  return (
    <div className="mb-3 border border-green-200 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="bg-green-50 px-4 py-3 flex items-center justify-between gap-3">
        <span className="text-xs font-semibold text-green-700">Audit Report</span>
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${verdictStyle}`}>
          {summary.verdict}
        </span>
      </div>

      {/* Risk score bar */}
      <div className="px-4 py-3 border-b border-green-100 bg-white">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-slate-500">Risk Score</span>
          <span className="text-xs font-bold text-slate-700">{riskPct}/100</span>
        </div>
        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
          <div className={`h-full rounded-full ${riskColor}`} style={{ width: `${riskPct}%` }} />
        </div>
        {summary.overview && (
          <p className="mt-2 text-xs text-slate-600">{summary.overview}</p>
        )}
      </div>

      {/* Findings */}
      <div className="divide-y divide-slate-100 bg-white">
        {findings.map((f: any) => (
          <div key={f.id} className="px-4 py-2">
            <button
              className="w-full flex items-center gap-2 text-left"
              onClick={() => setExpanded(expanded === f.id ? null : f.id)}
            >
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${SEVERITY_STYLES[f.severity] ?? "bg-slate-100 text-slate-600"}`}>
                {f.severity.toUpperCase()}
              </span>
              <span className="text-xs font-medium text-slate-800 flex-1">{f.title}</span>
              <span className="text-[10px] text-slate-400">{f.id}</span>
              <span className="text-slate-300 text-xs">{expanded === f.id ? "▲" : "▼"}</span>
            </button>
            {expanded === f.id && (
              <div className="mt-2 space-y-1.5 pl-2 border-l-2 border-slate-100">
                <p className="text-xs text-slate-700">{f.description}</p>
                {f.location && (
                  <p className="text-[11px] text-slate-400"><span className="font-medium">Location:</span> {f.location}</p>
                )}
                {f.recommendation && (
                  <p className="text-[11px] text-slate-500"><span className="font-medium">Fix:</span> {f.recommendation}</p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Counts */}
      <div className="bg-slate-50 px-4 py-2 flex gap-3 text-[11px] text-slate-500 border-t border-slate-100">
        {summary.critical > 0 && <span className="text-red-600 font-medium">{summary.critical} Critical</span>}
        {summary.high > 0 && <span className="text-orange-600 font-medium">{summary.high} High</span>}
        {summary.medium > 0 && <span>{summary.medium} Medium</span>}
        {summary.low > 0 && <span>{summary.low} Low</span>}
        {summary.informational > 0 && <span>{summary.informational} Info</span>}
      </div>
    </div>
  );
}

function AgentOutputDisplay({ job }: { job: ArcadeJob }) {
  const { output_type, output_text, output_files, output_metadata } = job;
  const labels = output_metadata?.labels as string[] | undefined;

  // Audit report special case (legacy JSON format)
  if (output_text) {
    try {
      const parsed = JSON.parse(output_text);
      if (parsed?.findings && parsed?.summary) return <AuditReport report={parsed} />;
    } catch {}
  }

  return (
    <div className="mb-3 p-3 bg-green-50 border border-green-200 rounded-lg space-y-2">
      <p className="text-xs font-medium text-green-700">
        Agent Output
        {output_type !== "text" && (
          <span className="ml-1.5 px-1.5 py-0.5 bg-green-100 rounded text-[10px] uppercase tracking-wide">
            {output_type}
          </span>
        )}
      </p>

      {/* Code output */}
      {output_type === "code" && output_text && (
        <pre className="p-3 bg-slate-900 text-green-300 text-xs rounded-lg overflow-x-auto">
          <code>{output_text}</code>
        </pre>
      )}

      {/* JSON output */}
      {output_type === "json" && output_text && (
        <pre className="p-3 bg-slate-50 border border-slate-200 text-xs text-slate-800 rounded-lg overflow-x-auto">
          {(() => { try { return JSON.stringify(JSON.parse(output_text), null, 2); } catch { return output_text; } })()}
        </pre>
      )}

      {/* Plain text output (for text, file, media types that also have text) */}
      {output_type !== "code" && output_type !== "json" && output_text && (
        <p className="text-sm text-slate-800 whitespace-pre-wrap">{output_text}</p>
      )}

      {/* Media output — images, video, audio */}
      {output_files && output_files.length > 0 && output_type === "media" && (
        <div className="grid gap-2">
          {output_files.map((url, i) => {
            const mime = (output_metadata?.mimeTypes as string[] | undefined)?.[i] ?? "";
            const label = labels?.[i] ?? `Output ${i + 1}`;
            if (mime.startsWith("image/") || /\.(png|jpg|jpeg|gif|webp|svg)$/i.test(url)) {
              return (
                <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                  <img src={url} alt={label} className="max-w-full max-h-64 rounded-lg border border-green-200" />
                </a>
              );
            }
            if (mime.startsWith("video/") || /\.(mp4|webm|mov)$/i.test(url)) {
              return (
                <video key={i} controls className="max-w-full max-h-64 rounded-lg">
                  <source src={url} type={mime || undefined} />
                </video>
              );
            }
            if (mime.startsWith("audio/") || /\.(mp3|wav|ogg)$/i.test(url)) {
              return <audio key={i} controls src={url} className="w-full" />;
            }
            return (
              <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                className="text-xs text-green-700 underline truncate max-w-[200px]">
                {label}
              </a>
            );
          })}
        </div>
      )}

      {/* File downloads (non-media) */}
      {output_files && output_files.length > 0 && output_type !== "media" && (
        <div className="flex flex-wrap gap-2">
          {output_files.map((url, i) => (
            <a key={i} href={url} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-2 py-1 text-xs text-green-700 bg-green-100 hover:bg-green-200 rounded-md transition-colors truncate max-w-[200px]">
              {labels?.[i] ?? `File ${i + 1}`}
            </a>
          ))}
        </div>
      )}

      {/* Language badge for code */}
      {output_type === "code" && output_metadata?.language && (
        <p className="text-[10px] text-slate-500 uppercase tracking-wide">
          Language: {output_metadata.language as string}
        </p>
      )}
    </div>
  );
}

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
  const cancel = useCancelJob();
  const feedback = useSubmitFeedback();
  const dispute = useDisputeJob();
  const [reviewStars, setReviewStars] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [txErr, setTxErr] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [showCancelInput, setShowCancelInput] = useState(false);
  const [disputeReason, setDisputeReason] = useState("");
  const [showDisputeInput, setShowDisputeInput] = useState(false);
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
  useEffect(() => { if (cancel.isSuccess)  { refetchJob(); onRefetch(); } }, [cancel.isSuccess]);
  useEffect(() => { if (dispute.isSuccess) { refetchJob(); onRefetch(); setShowDisputeInput(false); } }, [dispute.isSuccess]);
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
    cancel.isPending || cancel.isConfirming ||
    dispute.isPending || dispute.isConfirming;

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
            <span className="text-sm font-semibold text-slate-900">
              {arcadeJob?.task_text
                ? arcadeJob.task_text.slice(0, 60) + (arcadeJob.task_text.length > 60 ? "…" : "")
                : `Job #${job.jobId.toString()}`}
            </span>
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
      {hasOutput(arcadeJob) && arcadeJob && (
        <AgentOutputDisplay job={arcadeJob} />
      )}

      {/* Execution error + retry */}
      {arcadeJob?.execution_status === "failed" && (
        <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg space-y-2">
          <p className="text-xs font-medium text-red-700">Agent execution failed</p>
          <p className="text-xs text-red-600">{arcadeJob.execution_error}</p>
          <p className="text-[10px] text-red-400">Attempt {arcadeJob.execution_attempts} of 3</p>
          {arcadeJob.execution_attempts < 3 && (
            <button
              onClick={async () => {
                try {
                  const res = await fetch("/api/execute-agent", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ job_id: jobId.toString(), retry: true }),
                  });
                  const result = await res.json();
                  if (!res.ok) console.error("[Xcrow] Retry failed:", result);
                } catch (e) {
                  console.error("[Xcrow] Retry request failed:", e);
                }
              }}
              className="w-full py-1.5 text-xs font-medium text-red-700 border border-red-300 rounded-lg hover:bg-red-100 transition-colors"
            >
              Retry execution
            </button>
          )}
        </div>
      )}

      {/* Execution running indicator */}
      {arcadeJob?.execution_status === "running" && !hasOutput(arcadeJob) && (
        <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-xs text-blue-700 animate-pulse">Agent is processing your task…</p>
        </div>
      )}

      {/* CLIENT ACTIONS */}
      {role === "client" && (
        <div className="pt-2 border-t border-slate-100 space-y-2">
          {/* Status 2: InProgress — agent is working, client can cancel */}
          {job.status === 2 && !showCancelInput && (
            <div className="space-y-2">
              <div className="py-2 text-sm text-center text-blue-700 bg-blue-50 border border-blue-200 rounded-lg">
                Agent is working on this job…
              </div>
              <button
                onClick={() => setShowCancelInput(true)}
                disabled={isBusy}
                className="w-full py-2 text-sm font-medium text-red-600 border border-red-200 hover:bg-red-50 rounded-lg transition-colors"
              >
                Cancel Job &amp; Get Refund
              </button>
            </div>
          )}
          {job.status === 2 && showCancelInput && (
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

          {/* Status 3: completed — settling automatically, client can dispute */}
          {job.status === 3 && (
            <div className="space-y-2">
              <div className="py-2 text-sm text-center text-blue-700 bg-blue-50 border border-blue-200 rounded-lg">
                Agent delivered — settling payment automatically…
              </div>
              {/* Dispute button + form */}
              {!showDisputeInput ? (
                <button
                  onClick={() => setShowDisputeInput(true)}
                  disabled={isBusy}
                  className="w-full py-2 text-sm font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                >
                  Dispute Job
                </button>
              ) : (
                <div className="border border-red-200 rounded-lg p-3 space-y-2 bg-red-50">
                  <p className="text-xs font-medium text-red-700">Why are you disputing this job?</p>
                  <textarea
                    value={disputeReason}
                    onChange={(e) => setDisputeReason(e.target.value)}
                    placeholder="Describe the issue — e.g. output is wrong, incomplete, or not what was requested…"
                    rows={3}
                    className="w-full px-3 py-2 text-sm border border-red-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-red-500 text-slate-900 bg-white placeholder:text-slate-400"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={async () => {
                        if (!disputeReason.trim()) { setTxErr("Please provide a reason for the dispute"); return; }
                        setTxErr(null);
                        try { await dispute.disputeJob(jobId, disputeReason.trim()); }
                        catch (e: any) { setTxErr(e?.shortMessage || e?.message || "Dispute failed"); }
                      }}
                      disabled={isBusy || !disputeReason.trim()}
                      className="flex-1 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                    >
                      {dispute.isPending || dispute.isConfirming ? "Submitting…" : "Submit Dispute"}
                    </button>
                    <button
                      onClick={() => { setShowDisputeInput(false); setDisputeReason(""); }}
                      className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-100"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
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
                            try { await feedback.submitFeedback(jobId, reviewStars, reviewComment, job.agentId, job.agentWallet, arcadeJob?.client_address ?? ""); }
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

          {/* Status 5: disputed */}
          {job.status === 5 && (
            <div className="py-2 px-3 text-sm text-center text-red-700 bg-red-50 border border-red-200 rounded-lg">
              Job disputed — awaiting resolution by platform owner
            </div>
          )}

          {/* Status 6: cancelled */}
          {job.status === 6 && (
            <div className="py-2 text-sm text-center text-slate-600 bg-slate-50 border border-slate-200 rounded-lg">
              Job cancelled · {amountUsdc} USDC refunded
            </div>
          )}

          {/* Status 7: refunded */}
          {job.status === 7 && (
            <div className="py-2 text-sm text-center text-slate-600 bg-slate-50 border border-slate-200 rounded-lg">
              Job refunded · {amountUsdc} USDC returned to client
            </div>
          )}
        </div>
      )}

      {/* AGENT STATUS */}
      {role === "agent" && (
        <div className="flex gap-2 pt-2 border-t border-slate-100">
          {job.status === 2 && (
            hasOutput(arcadeJob) ? (
              <div className="flex-1 py-2 text-sm text-center text-blue-700 bg-blue-50 border border-blue-200 rounded-lg">
                Output delivered — settling payment…
              </div>
            ) : (
              <div className="flex-1 py-2 text-sm text-center text-slate-600 bg-slate-50 border border-slate-200 rounded-lg">
                Agent is executing task…
              </div>
            )
          )}
          {job.status === 3 && (
            <div className="flex-1 py-2 text-sm text-center text-blue-700 bg-blue-50 border border-blue-200 rounded-lg">
              Job completed — payment settling…
            </div>
          )}
          {job.status === 4 && (
            <div className="flex-1 py-2 text-sm text-center text-green-700 bg-green-50 border border-green-200 rounded-lg">
              Payment received ✓
            </div>
          )}
          {job.status === 5 && (
            <div className="flex-1 py-2 text-sm text-center text-red-700 bg-red-50 border border-red-200 rounded-lg">
              Job disputed by client — awaiting resolution
            </div>
          )}
          {job.status === 6 && (
            <div className="flex-1 py-2 text-sm text-center text-slate-500 bg-slate-50 border border-slate-200 rounded-lg">
              Job rejected — client refunded
            </div>
          )}
          {job.status === 7 && (
            <div className="flex-1 py-2 text-sm text-center text-slate-500 bg-slate-50 border border-slate-200 rounded-lg">
              Job refunded to client
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
