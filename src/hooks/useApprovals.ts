import { useWriteContract } from "wagmi";
import { SWAP_ROUTER_02_ADDRESS } from "../config/constants";
import { Address } from "viem";

export const erc20ApproveAbi = [
  {
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    name: "approve",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

export function useApprovals() {
  const { writeContractAsync } = useWriteContract();

  const approve = async (tokenAddress: Address, amount: bigint) => {
    const hash = await writeContractAsync({
      address: tokenAddress,
      abi: erc20ApproveAbi,
      functionName: "approve",
      args: [SWAP_ROUTER_02_ADDRESS as Address, amount],
    });
    return hash;
  };

  return { approve };
}
