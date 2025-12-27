import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { RENTAL_MANAGER_ABI, RENTAL_MANAGER_ADDRESS } from "../contracts/RentalManager";
import { arc } from "../arc";

export function useWithdrawEarnings() {
  const queryClient = useQueryClient();
  const {
    data: hash,
    writeContractAsync,
    isPending,
    error,
  } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  // Invalidate queries after successful withdrawal to refresh balances
  useEffect(() => {
    if (isSuccess) {
      // Invalidate all balance-related queries to force refresh
      queryClient.invalidateQueries({ queryKey: ["readContract"] });
      queryClient.invalidateQueries({ queryKey: ["balance"] });
    }
  }, [isSuccess, queryClient]);

  const withdrawEarnings = async () => {
    return writeContractAsync({
      address: RENTAL_MANAGER_ADDRESS,
      abi: RENTAL_MANAGER_ABI,
      functionName: "withdrawEarnings",
      chainId: arc.id,
    });
  };

  return {
    withdrawEarnings,
    isPending: isPending || isConfirming,
    isSuccess,
    error,
    hash,
  };
}
