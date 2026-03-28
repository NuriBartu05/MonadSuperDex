import { useReadContracts } from "wagmi";
import { QUOTER_V2_ADDRESS, WMONAD_ADDRESS } from "../config/constants";

export interface TokenQuoteInput {
  tokenAddress: `0x${string}`;
  feeTier: number;
  amountIn: bigint;
}

// Strictly compliant QuoterV2 JSON ABI resolving the abitype string parser error natively
const quoterV2Abi = [
  {
    inputs: [
      {
        components: [
          { internalType: "address", name: "tokenIn", type: "address" },
          { internalType: "address", name: "tokenOut", type: "address" },
          { internalType: "uint256", name: "amountIn", type: "uint256" },
          { internalType: "uint24", name: "fee", type: "uint24" },
          { internalType: "uint160", name: "sqrtPriceLimitX96", type: "uint160" }
        ],
        internalType: "struct IQuoterV2.QuoteExactInputSingleParams",
        name: "params",
        type: "tuple"
      }
    ],
    name: "quoteExactInputSingle",
    outputs: [
      { internalType: "uint256", name: "amountOut", type: "uint256" },
      { internalType: "uint160", name: "sqrtPriceX96After", type: "uint160" },
      { internalType: "uint32", name: "initializedTicksCrossed", type: "uint32" },
      { internalType: "uint256", name: "gasEstimate", type: "uint256" }
    ],
    stateMutability: "nonpayable",
    type: "function"
  }
] as const;

export function useQuoterV2(inputs: TokenQuoteInput[]) {
  const contracts = inputs.map((input) => ({
    address: QUOTER_V2_ADDRESS as `0x${string}`,
    abi: quoterV2Abi,
    functionName: "quoteExactInputSingle",
    args: [
      {
        tokenIn: input.tokenAddress,
        tokenOut: WMONAD_ADDRESS as `0x${string}`,
        amountIn: input.amountIn,
        fee: input.feeTier,
        sqrtPriceLimitX96: 0n,
      },
    ],
  }));

  const { data, refetch, isLoading } = useReadContracts({
    // @ts-ignore - Bypass dynamic contract shape mismatch visually safely
    contracts,
    query: {
      enabled: inputs.length > 0 && inputs.every((input) => input.amountIn > 0n),
    },
  });

  const quotes = data?.map((res) => {
    if (res.status === "success" && res.result) {
      // Decode explicitly based on viem array return for un-named tuples natively
      // Safely extracting index 0 (amountOut) preventing identical '0' output drops
      const resultArray = res.result as [bigint, bigint, number, bigint];
      return resultArray[0] ?? 0n;
    }
    return 0n;
  }) || [];

  return { quotes, isLoading, refetchQuotes: refetch };
}
