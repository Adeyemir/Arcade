import { useReadContract } from "wagmi";
import {
  ERC8004_REPUTATION_ABI,
  ERC8004_REPUTATION_ADDRESS,
} from "../contracts/ERC8004";
import { arc } from "../arc";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ReputationSummary = {
  count: bigint;
  summaryValue: bigint;
  summaryValueDecimals: number;
  displayScore: number;
};

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

/**
 * Fetch aggregated ERC-8004 reputation for an agent.
 * First fetches all reviewer addresses via getClients, then passes them to
 * getSummary with empty tags to match all feedback regardless of tag.
 */
export function useAgentReputation(agentId: bigint) {
  // Step 1: get all addresses that have given feedback
  const { data: clients } = useReadContract({
    address: ERC8004_REPUTATION_ADDRESS,
    abi: ERC8004_REPUTATION_ABI,
    functionName: "getClients",
    args: [agentId],
    chainId: arc.id,
    query: { enabled: agentId > BigInt(0) },
  });

  const reviewers = (clients as `0x${string}`[] | undefined) ?? [];

  // Step 2: get summary — empty tags = match all feedback
  const { data, isLoading, error, refetch } = useReadContract({
    address: ERC8004_REPUTATION_ADDRESS,
    abi: ERC8004_REPUTATION_ABI,
    functionName: "getSummary",
    args: [agentId, reviewers, "", ""],
    chainId: arc.id,
    query: { enabled: agentId > BigInt(0) },
  });

  let summary: ReputationSummary | undefined;

  if (data) {
    const [count, summaryValue, summaryValueDecimals] = data as [bigint, bigint, number];

    const raw = summaryValue < BigInt(0) ? BigInt(0) : summaryValue;
    const divisor = summaryValueDecimals > 0 ? BigInt(10 ** summaryValueDecimals) : BigInt(1);
    const displayScore = Math.min(100, Number(raw / divisor));

    summary = { count, summaryValue, summaryValueDecimals, displayScore };
  }

  return { summary, isLoading, error, refetch };
}

/**
 * Get all addresses that have given feedback to an agent
 */
export function useAgentClients(agentId: bigint) {
  const { data, isLoading, error } = useReadContract({
    address: ERC8004_REPUTATION_ADDRESS,
    abi: ERC8004_REPUTATION_ABI,
    functionName: "getClients",
    args: [agentId],
    chainId: arc.id,
    query: { enabled: agentId > BigInt(0) },
  });

  return {
    clients: data as `0x${string}`[] | undefined,
    isLoading,
    error,
  };
}
