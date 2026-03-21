import { useState, useEffect } from "react";
import { supabase } from "./client";

export function useAgentStarRating(agentAddress: string | undefined) {
  const [avgStars, setAvgStars] = useState<number | null>(null);
  const [reviewCount, setReviewCount] = useState(0);

  useEffect(() => {
    if (!agentAddress) return;
    supabase
      .from("reviews")
      .select("stars")
      .eq("agent_address", agentAddress.toLowerCase())
      .then(({ data }) => {
        if (!data || data.length === 0) return;
        const avg = data.reduce((sum: number, r: { stars: number }) => sum + r.stars, 0) / data.length;
        setAvgStars(avg);
        setReviewCount(data.length);
      });
  }, [agentAddress]);

  return { avgStars, reviewCount };
}
