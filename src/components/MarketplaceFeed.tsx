"use client";

import { useState, useMemo } from "react";
import { AgentCard } from "@/components/AgentCard";
import { Button } from "@/components/ui/button";

interface Agent {
  agentId: number;
  title: string;
  description: string;
  pricePerHour: string;
  uptime?: string;
  category?: string;
  owner: string;
  isVerified?: boolean;
  imageUrl?: string;
}

interface MarketplaceFeedProps {
  agents: Agent[];
}

export function MarketplaceFeed({ agents }: MarketplaceFeedProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  // Price filter is opt-in — only applied once the user moves the slider
  const [priceLimit, setPriceLimit] = useState<number | null>(null);

  const maxPrice = useMemo(() => {
    if (!agents || agents.length === 0) return 100;
    const max = Math.max(...agents.map((a) => parseFloat(a.pricePerHour) || 0));
    return max > 0 ? Math.ceil(max) : 100;
  }, [agents]);

  const uniqueCategories = useMemo(() => {
    const categories = new Set<string>(["All"]);
    agents?.forEach((agent) => {
      if (agent.category && agent.category.trim() !== "")
        categories.add(agent.category);
    });
    return Array.from(categories).sort((a, b) => {
      if (a === "All") return -1;
      if (b === "All") return 1;
      return a.localeCompare(b);
    });
  }, [agents]);

  const filteredAgents = useMemo(
    () =>
      agents.filter((agent) => {
        const q = searchQuery.toLowerCase();
        const matchesSearch =
          !q ||
          agent.title.toLowerCase().includes(q) ||
          agent.description.toLowerCase().includes(q);
        const matchesCategory =
          selectedCategory === "All" || agent.category === selectedCategory;
        const matchesPrice =
          priceLimit === null ||
          (parseFloat(agent.pricePerHour) || 0) <= priceLimit;
        const matchesVerified = !verifiedOnly || agent.isVerified;
        return matchesSearch && matchesCategory && matchesPrice && matchesVerified;
      }),
    [agents, searchQuery, selectedCategory, priceLimit, verifiedOnly]
  );

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCategory("All");
    setPriceLimit(null);
    setVerifiedOnly(false);
  };

  const sliderValue = priceLimit ?? maxPrice;

  return (
    <main className="min-h-screen bg-slate-50">
      {/* Hero Section */}
      <section className="bg-white border-b border-slate-200">
        <div className="container max-w-screen-2xl mx-auto px-6 py-16">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-5xl font-semibold text-slate-900 mb-4">
              Rent Autonomous Intelligence
            </h1>
            <p className="text-lg text-slate-600 mb-8">
              Secure, trustless AI agents powered by Arc Blockchain
            </p>
            <div className="relative max-w-2xl mx-auto">
              <input
                type="text"
                placeholder="Search agents by name or capability..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-6 py-4 text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent shadow-sm"
              />
              <svg
                className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="container max-w-screen-2xl mx-auto px-6 py-8">
        <div className="lg:hidden mb-4">
          <Button
            onClick={() => setIsMobileFilterOpen(true)}
            className="inline-flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-900 border border-slate-300 px-4 py-2 rounded-lg shadow-sm"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            Filters
          </Button>
        </div>

        <div className="flex gap-8">
          {/* Filter Sidebar */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="bg-white border border-slate-200 rounded-xl p-6 sticky top-20">
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4">
                Filters
              </h3>
              <div className="mb-6">
                <label className="text-sm font-medium text-slate-700 mb-2 block">Category</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {uniqueCategories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div className="mb-6">
                <label className="text-sm font-medium text-slate-700 mb-2 block">
                  Max Price (ARC/hr)
                </label>
                <div className="space-y-2">
                  <input type="range" min="0" max={maxPrice} value={sliderValue}
                    onChange={(e) => setPriceLimit(parseFloat(e.target.value))}
                    className="w-full accent-blue-600" />
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>0 ARC</span>
                    <span>{priceLimit === null ? "Any" : `${sliderValue} ARC`}</span>
                  </div>
                </div>
              </div>
              <div className="mb-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={verifiedOnly}
                    onChange={(e) => setVerifiedOnly(e.target.checked)}
                    className="w-4 h-4 text-blue-600 bg-white border-slate-300 rounded accent-blue-600" />
                  <span className="text-sm text-slate-700">Verified Developers Only</span>
                </label>
              </div>
              <div className="pt-4 border-t border-slate-200">
                <p className="text-xs text-slate-500">
                  Showing {filteredAgents.length} agent{filteredAgents.length !== 1 ? "s" : ""}
                </p>
              </div>
            </div>
          </aside>

          {/* Agent Grid */}
          <div className="flex-1">
            {filteredAgents.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-slate-500 text-lg">No agents found matching your criteria</p>
                <Button variant="ghost" onClick={clearFilters} className="mt-4">
                  Clear Filters
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredAgents.map((agent) => (
                  <AgentCard key={agent.agentId} {...agent} />
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Mobile Filter Drawer */}
      {isMobileFilterOpen && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setIsMobileFilterOpen(false)} />
          <aside className="fixed left-0 top-0 bottom-0 w-80 bg-white z-50 lg:hidden overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-slate-900">Filters</h3>
                <button onClick={() => setIsMobileFilterOpen(false)}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                  <svg className="w-6 h-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="mb-6">
                <label className="text-sm font-medium text-slate-700 mb-2 block">Category</label>
                <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {uniqueCategories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div className="mb-6">
                <label className="text-sm font-medium text-slate-700 mb-2 block">Max Price (ARC/hr)</label>
                <div className="space-y-2">
                  <input type="range" min="0" max={maxPrice} value={sliderValue}
                    onChange={(e) => setPriceLimit(parseFloat(e.target.value))}
                    className="w-full accent-blue-600" />
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>0 ARC</span>
                    <span>{priceLimit === null ? "Any" : `${sliderValue} ARC`}</span>
                  </div>
                </div>
              </div>
              <div className="mb-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={verifiedOnly}
                    onChange={(e) => setVerifiedOnly(e.target.checked)}
                    className="w-4 h-4 text-blue-600 bg-white border-slate-300 rounded accent-blue-600" />
                  <span className="text-sm text-slate-700">Verified Developers Only</span>
                </label>
              </div>
              <div className="pt-4 border-t border-slate-200">
                <p className="text-xs text-slate-500">
                  Showing {filteredAgents.length} agent{filteredAgents.length !== 1 ? "s" : ""}
                </p>
              </div>
              <div className="mt-6">
                <Button onClick={() => setIsMobileFilterOpen(false)}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg">
                  Apply Filters
                </Button>
              </div>
            </div>
          </aside>
        </>
      )}
    </main>
  );
}
