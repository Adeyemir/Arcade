export const XCROW_ROUTER_ADDRESS =
  "0xb8b5d656660d2Cde7CDebAEbcb0bD4e5A153B887" as const;

export const USDC_ADDRESS =
  "0x3600000000000000000000000000000000000000" as const;

export const USDC_ABI = [
  {
    name: "approve",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    name: "allowance",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "nonces",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "owner", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;

export const XCROW_ESCROW_ADDRESS =
  "0x165a9040dC9C31be0bDeEd142a63Dd0210998F4D" as const;

export const XCROW_ESCROW_ABI = [
  // --- Read ---
  {
    name: "getJob",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "jobId", type: "uint256" }],
    outputs: [
      {
        name: "",
        type: "tuple",
        components: [
          { name: "jobId", type: "uint256" },
          { name: "agentId", type: "uint256" },
          { name: "agentChainId", type: "uint32" },
          { name: "client", type: "address" },
          { name: "agentWallet", type: "address" },
          { name: "amount", type: "uint256" },
          { name: "platformFee", type: "uint256" },
          { name: "taskHash", type: "bytes32" },
          { name: "deadline", type: "uint256" },
          { name: "createdAt", type: "uint256" },
          { name: "settledAt", type: "uint256" },
          { name: "proofOfWorkHash", type: "bytes32" },
          { name: "proofSubmittedAt", type: "uint256" },
          { name: "status", type: "uint8" },
          { name: "isCrossChain", type: "bool" },
          { name: "destinationDomain", type: "uint32" },
        ],
      },
    ],
  },
  {
    name: "getClientJobs",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "client", type: "address" }],
    outputs: [{ name: "", type: "uint256[]" }],
  },
  {
    name: "getAgentJobs",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "agentId", type: "uint256" }],
    outputs: [{ name: "", type: "uint256[]" }],
  },
  {
    name: "getAgentWalletJobs",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "wallet", type: "address" }],
    outputs: [{ name: "", type: "uint256[]" }],
  },
  // --- Write ---
  {
    name: "rejectJob",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "jobId", type: "uint256" },
      { name: "refundRecipient", type: "address" },
    ],
    outputs: [],
  },
  {
    name: "completeJob",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "jobId", type: "uint256" }],
    outputs: [],
  },
  {
    name: "completeAndSettle",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "jobId", type: "uint256" }],
    outputs: [],
  },
  {
    name: "submitProofOfWork",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "jobId", type: "uint256" },
      { name: "proofHash", type: "bytes32" },
    ],
    outputs: [],
  },
  {
    name: "autoSettle",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "jobId", type: "uint256" }],
    outputs: [],
  },
  {
    name: "settlementWindow",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  // --- Events ---
  {
    name: "JobCreated",
    type: "event",
    inputs: [
      { name: "jobId", type: "uint256", indexed: true },
      { name: "agentId", type: "uint256", indexed: true },
      { name: "client", type: "address", indexed: true },
      { name: "amount", type: "uint256", indexed: false },
    ],
  },
  {
    name: "JobCompleted",
    type: "event",
    inputs: [{ name: "jobId", type: "uint256", indexed: true }],
  },
  {
    name: "JobSettled",
    type: "event",
    inputs: [
      { name: "jobId", type: "uint256", indexed: true },
      { name: "agentPayout", type: "uint256", indexed: false },
      { name: "platformFee", type: "uint256", indexed: false },
    ],
  },
] as const;

export const XCROW_ROUTER_ABI = [
  // --- Write ---
  {
    name: "hireAgentByWalletWithPermit",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "agentWallet",    type: "address" },
      { name: "amount",         type: "uint256" },
      { name: "taskHash",       type: "bytes32" },
      { name: "deadline",       type: "uint256" },
      { name: "erc8004AgentId", type: "uint256" },
      { name: "permitDeadline", type: "uint256" },
      { name: "v", type: "uint8" },
      { name: "r", type: "bytes32" },
      { name: "s", type: "bytes32" },
    ],
    outputs: [{ name: "jobId", type: "uint256" }],
  },
  {
    name: "hireAgent",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "agentId", type: "uint256" },
      { name: "amount", type: "uint256" },
      { name: "taskHash", type: "bytes32" },
      { name: "deadline", type: "uint256" },
    ],
    outputs: [{ name: "jobId", type: "uint256" }],
  },
  {
    name: "hireAgentWithPermit",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "agentId", type: "uint256" },
      { name: "amount", type: "uint256" },
      { name: "taskHash", type: "bytes32" },
      { name: "deadline", type: "uint256" },
      { name: "permitDeadline", type: "uint256" },
      { name: "v", type: "uint8" },
      { name: "r", type: "bytes32" },
      { name: "s", type: "bytes32" },
    ],
    outputs: [{ name: "jobId", type: "uint256" }],
  },
  {
    name: "settleAndPay",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "jobId", type: "uint256" },
      { name: "destinationDomain", type: "uint32" },
      { name: "hookData", type: "bytes" },
    ],
    outputs: [],
  },
  {
    name: "rejectJobViaRouter",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "jobId", type: "uint256" }],
    outputs: [],
  },
  {
    name: "cancelJobViaRouter",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "jobId", type: "uint256" }],
    outputs: [],
  },
  {
    name: "disputeJobViaRouter",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "jobId", type: "uint256" },
      { name: "reason", type: "string" },
    ],
    outputs: [],
  },
  {
    name: "autoSettleViaRouter",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "jobId", type: "uint256" }],
    outputs: [],
  },
  {
    name: "submitFeedback",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "jobId", type: "uint256" },
      { name: "value", type: "int128" },
      { name: "valueDecimals", type: "uint8" },
      { name: "tag1", type: "string" },
      { name: "feedbackURI", type: "string" },
      { name: "feedbackHash", type: "bytes32" },
    ],
    outputs: [],
  },
  // --- Read ---
  {
    name: "getQuote",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "agentId", type: "uint256" }],
    outputs: [
      {
        name: "quote",
        type: "tuple",
        components: [
          { name: "agentId", type: "uint256" },
          { name: "baseRate", type: "uint256" },
          { name: "effectiveRate", type: "uint256" },
          { name: "reputationScore", type: "uint256" },
          { name: "multiplier", type: "uint256" },
          { name: "platformFee", type: "uint256" },
          { name: "totalCost", type: "uint256" },
          { name: "quotedAt", type: "uint256" },
        ],
      },
    ],
  },
  {
    name: "getAgentInfo",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "agentId", type: "uint256" }],
    outputs: [
      { name: "owner", type: "address" },
      { name: "wallet", type: "address" },
      { name: "uri", type: "string" },
    ],
  },
  // --- Events ---
  {
    name: "AgentHired",
    type: "event",
    inputs: [
      { name: "jobId", type: "uint256", indexed: true },
      { name: "agentId", type: "uint256", indexed: true },
      { name: "client", type: "address", indexed: true },
      { name: "amount", type: "uint256", indexed: false },
      { name: "crossChain", type: "bool", indexed: false },
    ],
  },
  {
    name: "FeedbackSubmitted",
    type: "event",
    inputs: [
      { name: "jobId", type: "uint256", indexed: true },
      { name: "agentId", type: "uint256", indexed: true },
      { name: "value", type: "int128", indexed: false },
    ],
  },
] as const;
