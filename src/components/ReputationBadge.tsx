import { Star } from "lucide-react";
import { useAgentStarRating } from "@/lib/supabase/useAgentStarRating";

interface ReputationBadgeProps {
  agentId: bigint;
  agentAddress?: string;
  compact?: boolean;
}

export function ReputationBadge({ agentAddress, compact = false }: ReputationBadgeProps) {
  const { avgStars, reviewCount } = useAgentStarRating(agentAddress);

  if (!agentAddress || reviewCount === 0) {
    if (compact) {
      return (
        <span className="inline-flex items-center gap-1 text-xs text-slate-400">
          <Star className="w-3 h-3" />
          New
        </span>
      );
    }
    return (
      <div className="flex items-center justify-between py-3 px-4 border-b border-slate-100">
        <dt className="text-xs sm:text-sm font-medium text-slate-600 flex items-center gap-1.5">
          <Star className="w-3.5 h-3.5 text-yellow-500" />
          Rating
        </dt>
        <dd className="text-xs sm:text-sm text-slate-400">No reviews yet</dd>
      </div>
    );
  }

  const stars = avgStars ?? 0;
  const fullStars = Math.round(stars);

  if (compact) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-yellow-600">
        <Star className="w-3 h-3 fill-current" />
        {stars.toFixed(1)}
      </span>
    );
  }

  return (
    <div className="flex items-center justify-between py-3 px-4 border-b border-slate-100">
      <dt className="text-xs sm:text-sm font-medium text-slate-600 flex items-center gap-1.5">
        <Star className="w-3.5 h-3.5 text-yellow-500" />
        Rating
      </dt>
      <dd className="text-xs sm:text-sm font-semibold text-slate-900">
        {[1, 2, 3, 4, 5].map(i => (
          <span key={i} className={i <= fullStars ? "text-yellow-500" : "text-slate-300"}>★</span>
        ))}{" "}
        <span className="font-normal text-slate-500">{stars.toFixed(1)}</span>
      </dd>
    </div>
  );
}
