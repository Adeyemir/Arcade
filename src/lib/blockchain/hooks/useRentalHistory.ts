import { useReadContract } from "wagmi";
import { RENTAL_MANAGER_ABI, RENTAL_MANAGER_ADDRESS } from "../contracts/RentalManager";
import { arc } from "../arc";

export interface RentalRecord {
  agentId: bigint;
  renter: string;
  startTime: bigint;
  endTime: bigint;
  amountPaid: bigint;
  active: boolean;
}

export function useUserRentalHistory(userAddress?: string) {
  const { data: rentalHistory, isLoading, error, refetch } = useReadContract({
    address: RENTAL_MANAGER_ADDRESS,
    abi: RENTAL_MANAGER_ABI,
    functionName: "getUserRentalHistory",
    args: userAddress ? [userAddress as `0x${string}`] : undefined,
    chainId: arc.id,
    query: {
      enabled: !!userAddress,
      refetchInterval: 10000, // Refetch every 10 seconds
    },
  });

  return {
    rentalHistory: rentalHistory as RentalRecord[] | undefined,
    isLoading,
    error,
    refetch,
  };
}

export function useAgentRentalHistory(agentId?: number) {
  const { data: rentalHistory, isLoading, error, refetch } = useReadContract({
    address: RENTAL_MANAGER_ADDRESS,
    abi: RENTAL_MANAGER_ABI,
    functionName: "getAgentRentalHistory",
    args: agentId !== undefined ? [BigInt(agentId)] : undefined,
    chainId: arc.id,
    query: {
      enabled: agentId !== undefined,
      refetchInterval: 10000, // Refetch every 10 seconds
    },
  });

  return {
    rentalHistory: rentalHistory as RentalRecord[] | undefined,
    isLoading,
    error,
    refetch,
  };
}
