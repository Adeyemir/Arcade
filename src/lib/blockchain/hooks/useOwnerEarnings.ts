import { useReadContract } from "wagmi";
import { RENTAL_MANAGER_ABI, RENTAL_MANAGER_ADDRESS } from "../contracts/RentalManager";
import { arc } from "../arc";
import { formatEther } from "viem";

/**
 * Hook to get total earnings for an agent owner
 * Reads directly from contract's ownerEarnings mapping
 */
export function useOwnerEarnings(ownerAddress?: string) {
  // Get owner earnings from contract
  const { data: earnings, isLoading } = useReadContract({
    address: RENTAL_MANAGER_ADDRESS,
    abi: RENTAL_MANAGER_ABI,
    functionName: "getOwnerEarnings",
    args: ownerAddress ? [ownerAddress as `0x${string}`] : undefined,
    chainId: arc.id,
    query: {
      enabled: !!ownerAddress,
      refetchInterval: 10000, // Refetch every 10 seconds for real-time updates
    },
  });

  // Get platform fee percentage
  const { data: platformFeePercent } = useReadContract({
    address: RENTAL_MANAGER_ADDRESS,
    abi: RENTAL_MANAGER_ABI,
    functionName: "PLATFORM_FEE_PERCENT",
    chainId: arc.id,
  });

  const totalEarnings = earnings ? formatEther(earnings) : "0";

  return {
    totalEarnings,
    totalEarningsRaw: earnings,
    isLoading,
    platformFeePercent: platformFeePercent ? Number(platformFeePercent) / 100 : 5,
  };
}

/**
 * Hook to get earnings for a specific agent
 * Reads directly from contract's agentEarnings mapping
 */
export function useAgentEarnings(agentId: number) {
  // Get agent earnings from contract
  const { data: earnings, isLoading: earningsLoading } = useReadContract({
    address: RENTAL_MANAGER_ADDRESS,
    abi: RENTAL_MANAGER_ABI,
    functionName: "getAgentEarnings",
    args: [BigInt(agentId)],
    chainId: arc.id,
    query: {
      refetchInterval: 10000, // Refetch every 10 seconds
    },
  });

  // Get rental count for this agent
  const { data: rentalIds } = useReadContract({
    address: RENTAL_MANAGER_ADDRESS,
    abi: RENTAL_MANAGER_ABI,
    functionName: "getAgentRentals",
    args: [BigInt(agentId)],
    chainId: arc.id,
    query: {
      refetchInterval: 10000,
    },
  });

  const formattedEarnings = earnings ? formatEther(earnings) : "0";
  const rentalCount = rentalIds?.length || 0;

  return {
    earnings: formattedEarnings,
    earningsRaw: earnings,
    rentalCount,
    isLoading: earningsLoading,
  };
}
