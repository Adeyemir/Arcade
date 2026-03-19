import { useWriteContract, usePublicClient } from "wagmi";
import { parseEventLogs } from "viem";
import {
  ERC8004_IDENTITY_ABI,
  ERC8004_IDENTITY_ADDRESS,
} from "../contracts/ERC8004";
import { arc } from "../arc";

/**
 * Register an agent on Arc's ERC-8004 IdentityRegistry.
 * Returns the minted ERC-8004 agentId parsed from the Transfer event.
 */
export function useRegisterERC8004() {
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient({ chainId: arc.id });

  const register = async (metadataURI: string): Promise<bigint> => {
    const hash = await writeContractAsync({
      address: ERC8004_IDENTITY_ADDRESS,
      abi: ERC8004_IDENTITY_ABI,
      functionName: "register",
      args: [metadataURI],
      chainId: arc.id,
    });

    const receipt = await publicClient!.waitForTransactionReceipt({ hash });

    // Parse the ERC-721 Transfer event — from=0x0 means mint
    const logs = parseEventLogs({
      abi: ERC8004_IDENTITY_ABI,
      eventName: "Transfer",
      logs: receipt.logs,
    });

    const mintLog = logs.find(
      (l) =>
        (l.args as { from: string }).from ===
        "0x0000000000000000000000000000000000000000"
    );

    if (!mintLog) throw new Error("ERC-8004 Transfer event not found in receipt");

    return (mintLog.args as { tokenId: bigint }).tokenId;
  };

  return { register };
}
