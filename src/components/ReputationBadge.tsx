import { Star } from "lucide-react";
import { useAgentReputation } from "@/lib/blockchain/hooks/useERC8004Reputation";

interface ReputationBadgeProps {
  agentId: bigint;
  /** If true, show a compact inline badge instead of a full card row */
  compact?: boolean;
}

export function ReputationBadge({ agentId, compact = false }: ReputationBadgeProps) {
  const { summary, isLoading } = useAgentReputation(agentId);

  if (isLoading) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-slate-400">
        <Star className="w-3 h-3" />
        Loading…
      </span>
    );
  }

  if (!summary || summary.count === BigInt(0)) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-slate-400">
        <Star className="w-3 h-3" />
        No reviews
      </span>
    );
  }

  const score = summary.displayScore;
  const count = Number(summary.count);

  // Color based on score
  const color =
    score >= 75
      ? "text-emerald-600"
      : score >= 40
      ? "text-yellow-600"
      : "text-red-500";

  if (compact) {
    return (
      <span className={`inline-flex items-center gap-1 text-xs font-medium ${color}`}>
        <Star className="w-3 h-3 fill-current" />
        {score}/100
      </span>
    );
  }

  return (
    <div className="flex items-center justify-between py-3 px-4 border-b border-slate-100">
      <dt className="text-xs sm:text-sm font-medium text-slate-600 flex items-center gap-1.5">
        <Star className="w-3.5 h-3.5 text-yellow-500" />
        ERC-8004 Reputation
      </dt>
      <dd className={`text-xs sm:text-sm font-semibold ${color}`}>
        {score}/100{" "}
        <span className="font-normal text-slate-400">({count} review{count !== 1 ? "s" : ""})</span>
      </dd>
    </div>
  );
}
