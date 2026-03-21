import {
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
  useSignTypedData,
  usePublicClient,
} from "wagmi";
import { useEffect, useState } from "react";
import { parseUnits, keccak256, encodePacked, parseEventLogs, parseSignature } from "viem";
import {
  XCROW_ROUTER_ABI,
  XCROW_ROUTER_ADDRESS,
  XCROW_ESCROW_ABI,
  XCROW_ESCROW_ADDRESS,
  USDC_ADDRESS,
  USDC_ABI,
} from "../contracts/XcrowRouter";
import { arc } from "../arc";

const USDC_DECIMALS = 6;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type PriceQuote = {
  agentId: bigint;
  baseRate: bigint;
  effectiveRate: bigint;
  reputationScore: bigint;
  multiplier: bigint;
  platformFee: bigint;
  totalCost: bigint;
  quotedAt: bigint;
};

// ---------------------------------------------------------------------------
// Read hooks
// ---------------------------------------------------------------------------

export function useAgentInfo(agentId: bigint) {
  const { data, isLoading, error, refetch } = useReadContract({
    address: XCROW_ROUTER_ADDRESS,
    abi: XCROW_ROUTER_ABI,
    functionName: "getAgentInfo",
    args: [agentId],
    chainId: arc.id,
    query: { enabled: agentId > BigInt(0) },
  });

  const info = data as [string, string, string] | undefined;
  return {
    owner: info?.[0] as `0x${string}` | undefined,
    wallet: info?.[1] as `0x${string}` | undefined,
    uri: info?.[2],
    isLoading,
    error,
    refetch,
  };
}

export function useXcrowQuote(agentId: bigint) {
  const { data, isLoading, error, refetch } = useReadContract({
    address: XCROW_ROUTER_ADDRESS,
    abi: XCROW_ROUTER_ABI,
    functionName: "getQuote",
    args: [agentId],
    chainId: arc.id,
    query: { enabled: agentId > BigInt(0) },
  });

  return { quote: data as PriceQuote | undefined, isLoading, error, refetch };
}

// ---------------------------------------------------------------------------
// Hire agent with EIP-2612 permit — one signature + one tx, no pre-approval
// ---------------------------------------------------------------------------

export function useHireAgent() {
  const { data: hash, writeContractAsync, isPending, error } = useWriteContract();
  const {
    isLoading: isConfirming,
    isSuccess,
    data: receipt,
  } = useWaitForTransactionReceipt({ hash });
  const { signTypedDataAsync } = useSignTypedData();
  const publicClient = usePublicClient({ chainId: arc.id });

  const hireAgent = async (
    owner: `0x${string}`,
    agentWallet: `0x${string}`,
    amountUsdc: string,
    taskDesc: string,
    deadlineSec: bigint,
    erc8004AgentId: bigint = BigInt(0)
  ) => {
    const amount = parseUnits(amountUsdc, USDC_DECIMALS);
    const taskHash = keccak256(encodePacked(["string"], [taskDesc]));
    const permitDeadline = deadlineSec;

    const nonce = await publicClient!.readContract({
      address: USDC_ADDRESS,
      abi: USDC_ABI,
      functionName: "nonces",
      args: [owner],
    });

    const signature = await signTypedDataAsync({
      domain: {
        name: "USDC",
        version: "2",
        chainId: arc.id,
        verifyingContract: USDC_ADDRESS,
      },
      types: {
        Permit: [
          { name: "owner", type: "address" },
          { name: "spender", type: "address" },
          { name: "value", type: "uint256" },
          { name: "nonce", type: "uint256" },
          { name: "deadline", type: "uint256" },
        ],
      },
      primaryType: "Permit",
      message: {
        owner,
        spender: XCROW_ROUTER_ADDRESS,
        value: amount,
        nonce,
        deadline: permitDeadline,
      },
    });

    const { v, r, s } = parseSignature(signature);

    return writeContractAsync({
      address: XCROW_ROUTER_ADDRESS,
      abi: XCROW_ROUTER_ABI,
      functionName: "hireAgentByWalletWithPermit",
      args: [agentWallet, amount, taskHash, deadlineSec, erc8004AgentId, permitDeadline, Number(v ?? 0), r as `0x${string}`, s as `0x${string}`],
      chainId: arc.id,
    });
  };

  // Parse jobId from the AgentHired event in the receipt
  let jobId: bigint | null = null;
  if (receipt) {
    try {
      const logs = parseEventLogs({
        abi: XCROW_ROUTER_ABI,
        eventName: "AgentHired",
        logs: receipt.logs,
      });
      if (logs.length > 0) {
        jobId = (logs[0].args as { jobId: bigint }).jobId;
      }
    } catch {}
  }

  return { hireAgent, isPending, isConfirming, isSuccess, jobId, error, hash };
}

// ---------------------------------------------------------------------------
// Settle (confirm payment)
// ---------------------------------------------------------------------------

export function useSettleJob() {
  const { data: hash, writeContractAsync, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const settleJob = async (jobId: bigint) => {
    return writeContractAsync({
      address: XCROW_ROUTER_ADDRESS,
      abi: XCROW_ROUTER_ABI,
      functionName: "settleAndPay",
      args: [jobId, 0, "0x"],
      chainId: arc.id,
    });
  };

  return { settleJob, isPending, isConfirming, isSuccess, error, hash };
}

// ---------------------------------------------------------------------------
// Cancel
// ---------------------------------------------------------------------------

export function useCancelJob() {
  const { data: hash, writeContractAsync, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const cancelJob = async (jobId: bigint) => {
    return writeContractAsync({
      address: XCROW_ROUTER_ADDRESS,
      abi: XCROW_ROUTER_ABI,
      functionName: "cancelJobViaRouter",
      args: [jobId],
      chainId: arc.id,
    });
  };

  return { cancelJob, isPending, isConfirming, isSuccess, error, hash };
}

// ---------------------------------------------------------------------------
// Job status enum (mirrors XcrowTypes.JobStatus)
// ---------------------------------------------------------------------------

export const JOB_STATUS = {
  0: "Created",
  1: "Accepted",
  2: "InProgress",
  3: "Completed",
  4: "Settled",
  5: "Disputed",
  6: "Cancelled",
  7: "Refunded",
  8: "Expired",
} as const;

export type Job = {
  jobId: bigint;
  agentId: bigint;
  agentChainId: number;
  client: `0x${string}`;
  agentWallet: `0x${string}`;
  amount: bigint;
  platformFee: bigint;
  taskHash: `0x${string}`;
  deadline: bigint;
  createdAt: bigint;
  settledAt: bigint;
  status: number;
  isCrossChain: boolean;
  destinationDomain: number;
};

// ---------------------------------------------------------------------------
// Read: jobs created by a client wallet (via AgentHired events on router)
// The escrow's clientJobs maps router address → jobs, not the user's address,
// so we scan router events instead.
// ---------------------------------------------------------------------------

export function useClientJobs(address: `0x${string}` | undefined) {
  const publicClient = usePublicClient({ chainId: arc.id });
  const [jobIds, setJobIds] = useState<bigint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetch = async (showSpinner = false) => {
    if (!address || !publicClient) return;
    if (showSpinner) setIsLoading(true);
    setError(null);
    try {
      const DEPLOY_BLOCK = BigInt(32718375); // XcrowRouter deployment block
      const CHUNK_SIZE = BigInt(9000);       // Arc testnet: 10k block limit per getLogs
      const latestBlock = await publicClient.getBlockNumber();

      const agentHiredEvent = {
        name: "AgentHired",
        type: "event",
        inputs: [
          { name: "jobId",      type: "uint256", indexed: true  },
          { name: "agentId",    type: "uint256", indexed: true  },
          { name: "client",     type: "address", indexed: true  },
          { name: "amount",     type: "uint256", indexed: false },
          { name: "crossChain", type: "bool",    indexed: false },
        ],
      } as const;

      // Build chunk ranges
      const ranges: { from: bigint; to: bigint }[] = [];
      for (let from = DEPLOY_BLOCK; from <= latestBlock; from += CHUNK_SIZE + BigInt(1)) {
        const to = from + CHUNK_SIZE > latestBlock ? latestBlock : from + CHUNK_SIZE;
        ranges.push({ from, to });
      }

      // Fetch all chunks in parallel instead of sequentially
      const chunkResults = await Promise.all(
        ranges.map(({ from, to }) =>
          publicClient.getLogs({
            address: XCROW_ROUTER_ADDRESS,
            event: agentHiredEvent,
            args: { client: address },
            fromBlock: from,
            toBlock: to,
          })
        )
      );

      const allIds = chunkResults
        .flat()
        .map((l) => (l.args as { jobId: bigint }).jobId)
        .sort((a, b) => (a > b ? -1 : 1)); // newest (highest ID) first

      setJobIds(allIds);
    } catch (e: any) {
      setError(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetch(true); // show spinner on first load only
    const interval = setInterval(() => fetch(false), 10000); // silent re-scan every 10s
    return () => clearInterval(interval);
  }, [address, publicClient]);

  return { jobIds, isLoading, error, refetch: fetch };
}

// ---------------------------------------------------------------------------
// Read: jobs assigned to an ERC-8004 agentId
// ---------------------------------------------------------------------------

export function useAgentJobs(wallet: `0x${string}` | undefined) {
  const { data, isLoading, error, refetch } = useReadContract({
    address: XCROW_ESCROW_ADDRESS,
    abi: XCROW_ESCROW_ABI,
    functionName: "getAgentWalletJobs",
    args: wallet ? [wallet] : undefined,
    chainId: arc.id,
    query: { enabled: !!wallet, staleTime: 0, refetchInterval: 5000 },
  });
  return { jobIds: (data as bigint[] | undefined) ?? [], isLoading, error, refetch };
}

// ---------------------------------------------------------------------------
// Read: single job details
// ---------------------------------------------------------------------------

export function useJob(jobId: bigint | null) {
  const { data, isLoading, error, refetch } = useReadContract({
    address: XCROW_ESCROW_ADDRESS,
    abi: XCROW_ESCROW_ABI,
    functionName: "getJob",
    args: jobId !== null ? [jobId] : undefined,
    chainId: arc.id,
    query: { enabled: jobId !== null, staleTime: 0, refetchInterval: 5000 },
  });
  return { job: data as Job | undefined, isLoading, error, refetch };
}

// ---------------------------------------------------------------------------
// Write: agent accepts a job
// ---------------------------------------------------------------------------

export function useRejectJob() {
  const { data: hash, writeContractAsync, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const rejectJob = async (jobId: bigint) => {
    return writeContractAsync({
      address: XCROW_ROUTER_ADDRESS,
      abi: XCROW_ROUTER_ABI,
      functionName: "rejectJobViaRouter",
      args: [jobId] as [bigint],
      chainId: arc.id,
    });
  };

  return { rejectJob, isPending, isConfirming, isSuccess, error, hash };
}

export function useAcceptJob() {
  const { data: hash, writeContractAsync, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const acceptJob = async (jobId: bigint) => {
    return writeContractAsync({
      address: XCROW_ESCROW_ADDRESS,
      abi: XCROW_ESCROW_ABI,
      functionName: "acceptJob",
      args: [jobId],
      chainId: arc.id,
    });
  };

  return { acceptJob, isPending, isConfirming, isSuccess, error, hash };
}

// ---------------------------------------------------------------------------
// Write: agent marks job complete
// ---------------------------------------------------------------------------

export function useCompleteJob() {
  const { data: hash, writeContractAsync, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const completeJob = async (jobId: bigint) => {
    return writeContractAsync({
      address: XCROW_ESCROW_ADDRESS,
      abi: XCROW_ESCROW_ABI,
      functionName: "completeJob",
      args: [jobId],
      chainId: arc.id,
    });
  };

  return { completeJob, isPending, isConfirming, isSuccess, error, hash };
}

// ---------------------------------------------------------------------------
// Write: client submits star rating after job settled
// ---------------------------------------------------------------------------

export function useSubmitFeedback() {
  const { data: hash, writeContractAsync, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const submitFeedback = async (jobId: bigint, stars: number, comment: string) => {
    // Upload comment to IPFS if provided, else use empty strings
    let feedbackURI = "";
    let feedbackHash: `0x${string}` = "0x0000000000000000000000000000000000000000000000000000000000000000";

    if (comment.trim()) {
      const pinataJwt = process.env.NEXT_PUBLIC_PINATA_JWT;
      if (pinataJwt) {
        try {
          const body = JSON.stringify({
            pinataContent: { rating: stars, comment, jobId: jobId.toString(), timestamp: Date.now() },
            pinataMetadata: { name: `xcrow-review-${jobId}` },
          });
          const res = await fetch("https://api.pinata.cloud/pinning/pinJSONToIPFS", {
            method: "POST",
            headers: { Authorization: `Bearer ${pinataJwt}`, "Content-Type": "application/json" },
            body,
          });
          if (res.ok) {
            const data = await res.json();
            feedbackURI = `ipfs://${data.IpfsHash}`;
            // keccak256 of the comment for on-chain reference
            const enc = new TextEncoder().encode(comment);
            const digest = await crypto.subtle.digest("SHA-256", enc);
            feedbackHash = `0x${Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, "0")).join("")}` as `0x${string}`;
          }
        } catch {}
      }
    }

    return writeContractAsync({
      address: XCROW_ROUTER_ADDRESS,
      abi: XCROW_ROUTER_ABI,
      functionName: "submitFeedback",
      args: [jobId, BigInt(stars), 0, "rating", feedbackURI, feedbackHash],
      chainId: arc.id,
    });
  };

  return { submitFeedback, isPending, isConfirming, isSuccess, error, hash };
}

// ---------------------------------------------------------------------------
// Total USDC earned by an agent wallet from settled Xcrow jobs
// ---------------------------------------------------------------------------

export function useAgentXcrowEarnings(wallet: `0x${string}` | undefined) {
  const publicClient = usePublicClient({ chainId: arc.id });
  const [totalUsdc, setTotalUsdc] = useState<number>(0);
  const [jobCount, setJobCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!wallet || !publicClient) return;

    const fetch = async () => {
      try {
        const jobIds = await publicClient.readContract({
          address: XCROW_ESCROW_ADDRESS,
          abi: XCROW_ESCROW_ABI,
          functionName: "getAgentWalletJobs",
          args: [wallet],
        }) as bigint[];

        if (!jobIds || jobIds.length === 0) {
          setTotalUsdc(0);
          setJobCount(0);
          setIsLoading(false);
          return;
        }

        const jobs = await Promise.all(
          jobIds.map((id) =>
            publicClient.readContract({
              address: XCROW_ESCROW_ADDRESS,
              abi: XCROW_ESCROW_ABI,
              functionName: "getJob",
              args: [id],
            })
          )
        );

        let total = BigInt(0);
        let settled = 0;
        for (const job of jobs as any[]) {
          // status 4 = Settled
          if (job.status === 4) {
            total += BigInt(job.amount) - BigInt(job.platformFee);
            settled++;
          }
        }
        setTotalUsdc(Number(total) / 1e6);
        setJobCount(settled);
      } catch {
        // silent — show 0 on error
      } finally {
        setIsLoading(false);
      }
    };

    fetch();
    const interval = setInterval(fetch, 15000);
    return () => clearInterval(interval);
  }, [wallet, publicClient]);

  return { totalUsdc, jobCount, isLoading };
}
