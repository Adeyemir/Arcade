"use client";

import { useParams, useRouter } from "next/navigation";
import { useAgent } from "@/lib/blockchain/hooks/useArcadeRegistry";
import { useAgentRentals } from "@/lib/blockchain/hooks/useRentalManager";
import { useAccount } from "wagmi";
import { formatEther } from "viem";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  TrendingUp,
  Clock,
  DollarSign,
  Users,
  Calendar,
  BarChart3,
  Activity,
} from "lucide-react";
import Link from "next/link";

export default function AgentAnalyticsPage() {
  const params = useParams();
  const router = useRouter();
  const agentId = params.id as string;
  const { address } = useAccount();

  const { data: agent, isLoading: agentLoading } = useAgent(parseInt(agentId));
  const { data: rentalIds, isLoading: rentalsLoading } = useAgentRentals(BigInt(agentId));

  if (agentLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="min-h-screen bg-slate-50 py-12">
        <div className="container max-w-4xl mx-auto px-6">
          <p className="text-red-600">Agent not found</p>
        </div>
      </div>
    );
  }

  const agentData = agent as any;
  const pricePerHour = formatEther(agentData.pricePerHour);
  const isOwner = address && agentData.owner.toLowerCase() === address.toLowerCase();

  // Calculate statistics
  const totalRentals = rentalIds?.length || 0;
  const totalRevenue = "0"; // Would need to fetch and sum all rental costs
  const avgRentalDuration = "0"; // Would need to calculate from rental data

  return (
    <main className="min-h-screen bg-slate-50 py-8">
      <div className="container max-w-6xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-4 text-blue-600 hover:text-blue-700"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>

          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row items-start gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0">
                <span className="text-white font-bold text-xl">A{agentId}</span>
              </div>
              <div className="flex-1">
                <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900 mb-2">
                  {agentData.name || `Agent #${agentId}`} Analytics
                </h1>
                {agentData.category && (
                  <p className="text-sm text-slate-600 mb-2">
                    <span className="font-medium">Category:</span> {agentData.category}
                  </p>
                )}
                <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    agentData.isListed
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-slate-100 text-slate-700"
                  }`}>
                    {agentData.isListed ? "Listed" : "Unlisted"}
                  </span>
                  <span>{pricePerHour} ARC/hr</span>
                  {isOwner && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                      You own this agent
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
          {/* Total Rentals */}
          <div className="bg-white border border-slate-200 rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-600">Total Rentals</span>
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-3xl font-bold text-slate-900">{totalRentals}</p>
            <p className="text-xs text-slate-500 mt-1">All time</p>
          </div>

          {/* Total Revenue */}
          <div className="bg-white border border-slate-200 rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-600">Total Revenue</span>
              <DollarSign className="w-5 h-5 text-emerald-600" />
            </div>
            <p className="text-3xl font-bold text-slate-900">{totalRevenue}</p>
            <p className="text-xs text-slate-500 mt-1">ARC earned</p>
          </div>

          {/* Avg Duration */}
          <div className="bg-white border border-slate-200 rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-600">Avg Duration</span>
              <Clock className="w-5 h-5 text-purple-600" />
            </div>
            <p className="text-3xl font-bold text-slate-900">{avgRentalDuration}</p>
            <p className="text-xs text-slate-500 mt-1">hours per rental</p>
          </div>

          {/* Utilization */}
          <div className="bg-white border border-slate-200 rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-600">Utilization</span>
              <Activity className="w-5 h-5 text-cyan-600" />
            </div>
            <p className="text-3xl font-bold text-slate-900">0%</p>
            <p className="text-xs text-slate-500 mt-1">Last 30 days</p>
          </div>
        </div>

        {/* Performance Chart Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Revenue Chart Placeholder */}
          <div className="bg-white border border-slate-200 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900">Revenue Trend</h3>
              <TrendingUp className="w-5 h-5 text-slate-400" />
            </div>
            <div className="h-64 flex items-center justify-center bg-slate-50 rounded-lg">
              <div className="text-center">
                <BarChart3 className="w-12 h-12 text-slate-400 mx-auto mb-2" />
                <p className="text-sm text-slate-600">Chart visualization</p>
                <p className="text-xs text-slate-500">Coming soon</p>
              </div>
            </div>
          </div>

          {/* Usage Chart Placeholder */}
          <div className="bg-white border border-slate-200 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900">Usage Pattern</h3>
              <Calendar className="w-5 h-5 text-slate-400" />
            </div>
            <div className="h-64 flex items-center justify-center bg-slate-50 rounded-lg">
              <div className="text-center">
                <BarChart3 className="w-12 h-12 text-slate-400 mx-auto mb-2" />
                <p className="text-sm text-slate-600">Chart visualization</p>
                <p className="text-xs text-slate-500">Coming soon</p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">
            Recent Rental Activity
          </h3>
          {totalRentals === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-slate-400 mx-auto mb-3" />
              <p className="text-slate-600">No rental activity yet</p>
              <p className="text-sm text-slate-500 mt-1">
                This agent hasn't been rented yet
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-slate-600">
                {totalRentals} rental{totalRentals !== 1 ? "s" : ""} recorded
              </p>
              {/* Would map through rentals here */}
              <div className="text-center py-8 text-slate-500 text-sm">
                Detailed rental list coming soon
              </div>
            </div>
          )}
        </div>

        {/* Owner Actions */}
        {isOwner && (
          <div className="mt-6 flex gap-3">
            <Button asChild variant="outline">
              <Link href={`/agent/${agentId}`}>
                View Agent Page
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/dashboard">
                Back to Dashboard
              </Link>
            </Button>
          </div>
        )}
      </div>
    </main>
  );
}
