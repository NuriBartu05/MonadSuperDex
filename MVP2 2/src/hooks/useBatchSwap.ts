import { useWriteContract } from "wagmi";
import { SWAP_ROUTER_02_ADDRESS, WMONAD_ADDRESS } from "../config/constants";
import { Address, encodeFunctionData } from "viem";
import { QuoteInput } from "./useQuoterV2";

export const swapRouter02Abi = [
  {
    inputs: [
      {
        components: [
          { name: "tokenIn", type: "address" },
          { name: "tokenOut", type: "address" },
          { name: "fee", type: "uint24" },
          { name: "recipient", type: "address" },
          { name: "amountIn", type: "uint256" },
          { name: "amountOutMinimum", type: "uint256" },
          { name: "sqrtPriceLimitX96", type: "uint160" },
        ],
        name: "params",
        type: "tuple",
      },
    ],
    name: "exactInputSingle",
    outputs: [{ name: "amountOut", type: "uint256" }],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      { name: "amountMinimum", type: "uint256" },
      { name: "recipient", type: "address" },
    ],
    name: "unwrapWETH9",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [{ name: "data", type: "bytes[]" }],
    name: "multicall",
    outputs: [{ name: "results", type: "bytes[]" }],
    stateMutability: "payable",
    type: "function",
  },
] as const;

export function useBatchSwap() {
  const { writeContractAsync } = useWriteContract();

  const executeBatchSwap = async (
    validInputs: QuoteInput[],
    parsedAmountsIn: bigint[],
    quotesRaw: bigint[],
    userAddress: Address
  ) => {
    if (validInputs.length === 0) throw new Error("No inputs");

    const multicallData: `0x${string}`[] = [];
    let totalExpectedOut = 0n;

    validInputs.forEach((input, index) => {
      const amountIn = parsedAmountsIn[index];
      const amountOutExpected = quotesRaw[index];
      totalExpectedOut += amountOutExpected;

      if (input.token.address.toLowerCase() === WMONAD_ADDRESS.toLowerCase()) {
        // Skip exactInputSingle for WMON as Router cannot swap WMON for WMON.
        // The router will directly unwrap it mapping 1:1.
        return;
      }

      // 1% slippage calculation
      const amountOutMinimum = (amountOutExpected * 99n) / 100n;

      const encodedSwap = encodeFunctionData({
        abi: swapRouter02Abi,
        functionName: "exactInputSingle",
        args: [
          {
            tokenIn: input.token.address,
            tokenOut: WMONAD_ADDRESS as Address,
            fee: input.token.feeTier,
            recipient: SWAP_ROUTER_02_ADDRESS as Address, // Router holds WMON temporarily
            amountIn,
            amountOutMinimum,
            sqrtPriceLimitX96: 0n,
          },
        ],
      });

      multicallData.push(encodedSwap);
    });

    // 1% slippage on total expected unwrap
    const totalMinimumOut = (totalExpectedOut * 99n) / 100n;

    const encodedUnwrap = encodeFunctionData({
      abi: swapRouter02Abi,
      functionName: "unwrapWETH9",
      args: [totalMinimumOut, userAddress],
    });

    multicallData.push(encodedUnwrap);

    const hash = await writeContractAsync({
      address: SWAP_ROUTER_02_ADDRESS as Address,
      abi: swapRouter02Abi,
      functionName: "multicall",
      args: [multicallData],
    });

    return hash;
  };

  return { executeBatchSwap };
}
