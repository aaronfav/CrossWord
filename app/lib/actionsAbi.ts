export const actionsAbi = [
  {
    inputs: [{ internalType: "uint8", name: "difficulty", type: "uint8" }],
    name: "startDifficulty",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint8", name: "difficulty", type: "uint8" }],
    name: "playAgain",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint8", name: "difficulty", type: "uint8" }],
    name: "retrySameDifficulty",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "player", type: "address" },
      { indexed: false, internalType: "string", name: "actionType", type: "string" },
      { indexed: false, internalType: "uint8", name: "difficulty", type: "uint8" },
      { indexed: false, internalType: "uint256", name: "timestamp", type: "uint256" },
    ],
    name: "Action",
    type: "event",
  },
] as const;
