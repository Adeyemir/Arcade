import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { RENTAL_MANAGER_ABI, RENTAL_MANAGER_ADDRESS } from "../contracts/RentalManager";
import { arc } from "../arc";
import { parseEther, formatEther } from "viem";

// Types
export type Rental = {
  rentalId: bigint;
  agentId: bigint;
  renter: `0x${string}`;
  agentOwner: `0x${string}`;
  startTime: bigint;
  endTime: bigint;
  hoursRented: bigint;
  totalCost: bigint;
  isActive: boolean;
  completed: boolean;
};

/**
 * Hook to rent an agent
 */
export function useRentAgent() {
  const { data: hash, writeContractAsync, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const rentAgent = async (agentId: bigint, hours: bigint, totalCostInEther: string) => {

    const value = parseEther(totalCostInEther);


    try {
      const result = await writeContractAsync({
        address: RENTAL_MANAGER_ADDRESS,
        abi: RENTAL_MANAGER_ABI,
        functionName: "rentAgent",
        args: [agentId, hours],
        value,
        chainId: arc.id,
      });

      return result;
    } catch (err: any) {
      console.error("\nwriteContractAsync FAILED!");
      console.error("  - Error type:", err.name);
      console.error("  - Error message:", err.message);

      // Try to extract revert reason
      if (err.message.includes("Agent is not listed")) {
        console.error("  - Revert reason: Agent is not listed");
      } else if (err.message.includes("Agent does not exist")) {
        console.error("  - Revert reason: Agent does not exist");
      } else if (err.message.includes("Insufficient payment")) {
        console.error("  - Revert reason: Insufficient payment");
        console.error("  - You sent:", value.toString(), "wei");
      } else if (err.message.includes("Cannot rent your own agent")) {
        console.error("  - Revert reason: Cannot rent your own agent");
      } else if (err.data) {
        console.error("  - Error data:", err.data);
      }

      console.error("  - Full error:", err);
      throw err;
    }
  };

  return { rentAgent, isPending, isConfirming, isSuccess, error, hash };
}

/**
 * Hook to end a rental
 */
export function useEndRental() {
  const { data: hash, writeContractAsync, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const endRental = async (rentalId: bigint) => {
    return writeContractAsync({
      address: RENTAL_MANAGER_ADDRESS,
      abi: RENTAL_MANAGER_ABI,
      functionName: "endRental",
      args: [rentalId],
      chainId: arc.id,
    });
  };

  return { endRental, isPending, isConfirming, isSuccess, error, hash };
}

/**
 * Hook to get rental details by ID
 */
export function useRental(rentalId: bigint) {
  const { data, isLoading, error, refetch } = useReadContract({
    address: RENTAL_MANAGER_ADDRESS,
    abi: RENTAL_MANAGER_ABI,
    functionName: "getRental",
    args: [rentalId],
    chainId: arc.id,
  });

  return {
    data: data as Rental | undefined,
    isLoading,
    error,
    refetch,
  };
}

/**
 * Hook to get all rental IDs for a user
 */
export function useUserRentals(userAddress?: `0x${string}`) {
  const { data, isLoading, error, refetch } = useReadContract({
    address: RENTAL_MANAGER_ADDRESS,
    abi: RENTAL_MANAGER_ABI,
    functionName: "getUserRentals",
    args: userAddress ? [userAddress] : undefined,
    chainId: arc.id,
    query: {
      enabled: !!userAddress,
    },
  });

  return {
    data: data as bigint[] | undefined,
    isLoading,
    error,
    refetch,
  };
}

/**
 * Hook to get all rental IDs for an agent
 */
export function useAgentRentals(agentId: bigint) {
  const { data, isLoading, error, refetch } = useReadContract({
    address: RENTAL_MANAGER_ADDRESS,
    abi: RENTAL_MANAGER_ABI,
    functionName: "getAgentRentals",
    args: [agentId],
    chainId: arc.id,
  });

  return {
    data: data as bigint[] | undefined,
    isLoading,
    error,
    refetch,
  };
}

/**
 * Hook to check if a rental is currently active
 */
export function useIsRentalActive(rentalId: bigint) {
  const { data, isLoading, error, refetch } = useReadContract({
    address: RENTAL_MANAGER_ADDRESS,
    abi: RENTAL_MANAGER_ABI,
    functionName: "isRentalActive",
    args: [rentalId],
    chainId: arc.id,
  });

  return {
    isActive: data as boolean | undefined,
    isLoading,
    error,
    refetch,
  };
}

/**
 * Hook to get platform fee percentage
 */
export function usePlatformFee() {
  const { data, isLoading, error } = useReadContract({
    address: RENTAL_MANAGER_ADDRESS,
    abi: RENTAL_MANAGER_ABI,
    functionName: "PLATFORM_FEE_PERCENT",
    chainId: arc.id,
  });

  return {
    feePercent: data as bigint | undefined,
    isLoading,
    error,
  };
}
