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
    bestFees: number[],
    userAddress: Address,
    targetTokenAddress: Address
  ) => {
    if (validInputs.length === 0) throw new Error("No inputs");

    const multicallData: `0x${string}`[] = [];
    let totalExpectedOut = 0n;

    const isTargetNative = targetTokenAddress.toLowerCase() === "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee";
    const routerTargetAddress = isTargetNative ? (WMONAD_ADDRESS as Address) : targetTokenAddress;
    const isTargetWmon = routerTargetAddress.toLowerCase() === WMONAD_ADDRESS.toLowerCase();

    // Sum all Native MON inputs to send as msg.value
    const totalNativeValue = validInputs.reduce((sum, input, idx) => 
      input.token.isNative ? sum + parsedAmountsIn[idx] : sum, 0n
    );

    validInputs.forEach((input, index) => {
      const amountIn = parsedAmountsIn[index];
      const amountOutExpected = quotesRaw[index];
      const autoFee = bestFees[index];
      totalExpectedOut += amountOutExpected;

      // Uniswap Router checks WMON Address pools for Native Mon swaps
      const tokenInAddress = input.token.isNative ? (WMONAD_ADDRESS as Address) : input.token.address;

      if (tokenInAddress.toLowerCase() === routerTargetAddress.toLowerCase()) {
        // Skip exactInputSingle since mapping is mathematically 1:1 unwrapping
        return;
      }

      // 1% slippage calculation based on precise target pool performance
      const amountOutMinimum = (amountOutExpected * 99n) / 100n;

      const encodedSwap = encodeFunctionData({
        abi: swapRouter02Abi,
        functionName: "exactInputSingle",
        args: [
          {
            tokenIn: tokenInAddress,
            tokenOut: routerTargetAddress,
            fee: autoFee, // Replaced static parameter with optimal Smart Fee logic
            recipient: isTargetWmon ? (SWAP_ROUTER_02_ADDRESS as Address) : userAddress, 
            amountIn,
            amountOutMinimum,
            sqrtPriceLimitX96: 0n,
          },
        ],
      });

      multicallData.push(encodedSwap);
    });

    if (isTargetWmon && totalExpectedOut > 0n) {
      // 1% slippage on total expected unwrap
      const totalMinimumOut = (totalExpectedOut * 99n) / 100n;

      const encodedUnwrap = encodeFunctionData({
        abi: swapRouter02Abi,
        functionName: "unwrapWETH9",
        args: [totalMinimumOut, userAddress],
      });

      multicallData.push(encodedUnwrap);
    }

    const hash = await writeContractAsync({
      address: SWAP_ROUTER_02_ADDRESS as Address,
      abi: swapRouter02Abi,
      functionName: "multicall",
      args: [multicallData],
      value: totalNativeValue, // Sends the actual Native MON to the Router!
    });

    return hash;
  };

  return { executeBatchSwap };
}
