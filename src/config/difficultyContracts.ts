import { parseAbi } from "viem";

export const DIFFICULTY_TX_VALUE = BigInt("500000000000");

export const DIFFICULTY_CONTRACTS = {
  easy: {
    address: "0xC4ffBAd22bc39456E9Fb451BD2581151616ef7F5",
    abi: parseAbi(["function easy() payable"]),
    functionName: "easy",
  },
  medium: {
    address: "0x8E6cede224912a025C63DD694e2482Ee60a0eB1C",
    abi: parseAbi(["function medium() payable"]),
    functionName: "medium",
  },
  hard: {
    address: "0x3606D05D636aA44e92A20635Aa89bd60fA558772",
    abi: parseAbi(["function hard() payable"]),
    functionName: "hard",
  },
} as const;
