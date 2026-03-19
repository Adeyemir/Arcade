import { useReadContracts } from "wagmi";
import { XCROW_ESCROW_ABI, XCROW_ESCROW_ADDRESS } from "../contracts/XcrowRouter";
import { arc } from "../arc";
import { useAgentJobs } from "./useXcrowRouter";

const JOB_STATUS_SETTLED = 4;
const JOB_STATUS_ACCEPTED = 1;
const JOB_STATUS_IN_PROGRESS = 2;

export function useAgentMetrics(agentWallet: `0x${string}` | undefined) {
  const { jobIds, isLoading: jobsLoading } = useAgentJobs(agentWallet);

  const contracts = jobIds.map((jobId) => ({
    address: XCROW_ESCROW_ADDRESS,
    abi: XCROW_ESCROW_ABI,
    functionName: "getJob" as const,
    args: [jobId] as [bigint],
    chainId: arc.id,
  }));

  const { data: jobsData, isLoading: jobsDataLoading } = useReadContracts({
    contracts,
    query: { enabled: jobIds.length > 0 },
  });

  let tasksCompleted = 0;
  let activeRentals = 0;

  if (jobsData) {
    for (const result of jobsData) {
      if (result.status === "success" && result.result) {
        const job = result.result as { status: number };
        if (job.status === JOB_STATUS_SETTLED) tasksCompleted++;
        if (job.status === JOB_STATUS_ACCEPTED || job.status === JOB_STATUS_IN_PROGRESS) activeRentals++;
      }
    }
  }

  return {
    tasksCompleted,
    activeRentals,
    isLoading: jobsLoading || jobsDataLoading,
  };
}
