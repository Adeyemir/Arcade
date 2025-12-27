import { useReadContract, useReadContracts, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseEther } from "viem";
import {
  ARCADE_REGISTRY_ABI,
  ARCADE_REGISTRY_ADDRESS,
} from "../contracts/ArcadeRegistry";
import { arc } from "../arc";

export interface Agent {
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

/**
 * Hook to read a single agent by ID
 */
export function useAgent(agentId: number) {
  return useReadContract({
    address: ARCADE_REGISTRY_ADDRESS,
    abi: ARCADE_REGISTRY_ABI,
    functionName: "getAgent",
    args: [BigInt(agentId)],
    chainId: arc.id,
  });
}

/**
 * Hook to get all agents owned by an address
 */
export function useOwnerAgents(ownerAddress?: string) {
  return useReadContract({
    address: ARCADE_REGISTRY_ADDRESS,
    abi: ARCADE_REGISTRY_ABI,
    functionName: "getOwnerAgents",
    args: ownerAddress ? [ownerAddress as `0x${string}`] : undefined,
    chainId: arc.id,
  });
}

/**
 * Hook to read multiple agents at once
 * @param agentIds Array of agent IDs to fetch
 */
export function useAgents(agentIds: number[]) {
  const contracts = agentIds.map((id) => ({
    address: ARCADE_REGISTRY_ADDRESS,
    abi: ARCADE_REGISTRY_ABI,
    functionName: "getAgent",
    args: [BigInt(id)],
    chainId: arc.id,
  }));

  return useReadContracts({
    contracts,
  });
}

/**
 * Helper function to format agent data from contract
 */
export function formatAgent(agent: Agent) {
  return {
    agentId: Number(agent.agentId),
    owner: agent.owner,
    pricePerHour: agent.pricePerHour.toString(),
    metadataHash: agent.metadataHash,
    isListed: agent.isListed,
  };
}

/**
 * Hook to list a new agent
 */
export function useListAgent() {
  const { data: hash, writeContractAsync, isPending, error } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const listAgent = async (
    name: string,
    description: string,
    category: string,
    pricePerHour: string,
    metadataHash: string = "",
    imageUrl: string = ""
  ) => {
    // Convert price to wei (ARC tokens have 18 decimals)
    const priceInWei = parseEther(pricePerHour);

    return writeContractAsync({
      address: ARCADE_REGISTRY_ADDRESS,
      abi: ARCADE_REGISTRY_ABI,
      functionName: "listAgent",
      args: [name, description, category, priceInWei, metadataHash, imageUrl],
      chainId: arc.id,
    });
  };

  return {
    listAgent,
    isPending,
    isConfirming,
    isSuccess,
    error,
    hash,
  };
}

/**
 * Hook to unlist an agent
 */
export function useUnlistAgent() {
  const { data: hash, writeContractAsync, isPending, error } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const unlistAgent = async (agentId: number) => {
    return writeContractAsync({
      address: ARCADE_REGISTRY_ADDRESS,
      abi: ARCADE_REGISTRY_ABI,
      functionName: "unlistAgent",
      args: [BigInt(agentId)],
      chainId: arc.id,
    });
  };

  return {
    unlistAgent,
    isPending,
    isConfirming,
    isSuccess,
    error,
    hash,
  };
}

/**
 * Hook to update agent price
 */
export function useUpdateAgentPrice() {
  const { data: hash, writeContractAsync, isPending, error } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const updatePrice = async (agentId: number, newPricePerHour: string) => {
    const priceInWei = parseEther(newPricePerHour);

    return writeContractAsync({
      address: ARCADE_REGISTRY_ADDRESS,
      abi: ARCADE_REGISTRY_ABI,
      functionName: "updateAgentPrice",
      args: [BigInt(agentId), priceInWei],
      chainId: arc.id,
    });
  };

  return {
    updatePrice,
    isPending,
    isConfirming,
    isSuccess,
    error,
    hash,
  };
}

/**
 * Hook to update agent metadata (name, description, category)
 */
export function useUpdateAgentMetadata() {
  const { data: hash, writeContractAsync, isPending, error } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const updateMetadata = async (
    agentId: number,
    name: string,
    description: string,
    category: string,
    imageUrl: string
  ) => {
    return writeContractAsync({
      address: ARCADE_REGISTRY_ADDRESS,
      abi: ARCADE_REGISTRY_ABI,
      functionName: "updateAgentMetadata",
      args: [BigInt(agentId), name, description, category, imageUrl],
      chainId: arc.id,
    });
  };

  return {
    updateMetadata,
    isPending,
    isConfirming,
    isSuccess,
    error,
    hash,
  };
}
