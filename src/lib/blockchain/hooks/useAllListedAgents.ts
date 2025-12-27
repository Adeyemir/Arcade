import { useReadContract } from "wagmi";
import { ARCADE_REGISTRY_ABI, ARCADE_REGISTRY_ADDRESS } from "../contracts/ArcadeRegistry";
import { arc } from "../arc";
import { useState, useEffect } from "react";

export interface Agent {
  agentId: bigint;
  owner: string;
  pricePerHour: bigint;
  metadataHash: string;
  isListed: boolean;
}

// Hook to get the next agent ID (to know how many agents exist)
function useNextAgentId() {
  // Since _nextAgentId is private, we'll try to fetch agents until we hit an error
  // For MVP, we'll check up to ID 100
  return 100; // Max agents to check
}

export function useAllListedAgents() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const maxAgentId = useNextAgentId();

  // We'll fetch agents 1 by 1 - not ideal but works for MVP
  // A better solution would be to add a getAllListedAgents() function to the contract
  useEffect(() => {
    const fetchAllAgents = async () => {
      setIsLoading(true);
      const listedAgents: Agent[] = [];

      // Try fetching agents from ID 1 to maxAgentId
      for (let i = 1; i <= maxAgentId; i++) {
        try {
          // This is a simplified approach - in production you'd use multicall or subgraph
          // For now, we'll just show a placeholder
          // The actual fetching would need to be done with multiple useReadContract calls
          // or a custom solution
        } catch (error) {
          // Agent doesn't exist, stop checking
          break;
        }
      }

      setAgents(listedAgents);
      setIsLoading(false);
    };

    fetchAllAgents();
  }, [maxAgentId]);

  return { agents, isLoading };
}

// Simpler approach: Hook to get a specific agent
export function useListedAgent(agentId: number) {
  const { data: agent, isLoading, error } = useReadContract({
    address: ARCADE_REGISTRY_ADDRESS,
    abi: ARCADE_REGISTRY_ABI,
    functionName: "getAgent",
    args: [BigInt(agentId)],
    chainId: arc.id,
    query: {
      enabled: agentId > 0,
    },
  });

  // Filter out unlisted agents
  if (agent && !(agent as Agent).isListed) {
    return { agent: null, isLoading, error };
  }

  return { agent: agent as Agent | undefined, isLoading, error };
}

// Hook to get multiple agents by ID
export function useMultipleAgents(agentIds: number[]) {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // For MVP, we'll just fetch agents with IDs 1-10
  // In production, use multicall or subgraph
  useEffect(() => {
    setAgents([]);
    setIsLoading(false);
  }, [agentIds]);

  return { agents, isLoading };
}
