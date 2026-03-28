import { useReadContracts } from "wagmi";
import { parseUnits } from "viem";
import { QUOTER_V2_ADDRESS, WMONAD_ADDRESS } from "../config/constants";
import { WhitelistToken } from "../config/whitelist";

export const quoterV2Abi = [
  {
    inputs: [
      {
        components: [
          { name: "tokenIn", type: "address" },
          { name: "tokenOut", type: "address" },
          { name: "amountIn", type: "uint256" },
          { name: "fee", type: "uint24" },
          { name: "sqrtPriceLimitX96", type: "uint160" },
        ],
        name: "params",
        type: "tuple",
      },
    ],
    name: "quoteExactInputSingle",
    outputs: [
      { name: "amountOut", type: "uint256" },
      { name: "sqrtPriceX96After", type: "uint160" },
      { name: "initializedTicksCrossed", type: "uint32" },
      { name: "gasEstimate", type: "uint256" },
    ],
    stateMutability: "view",
    type: "function",
  },
] as const;

export interface QuoteInput {
  token: WhitelistToken;
  amount: string;
}

const ALL_FEE_TIERS = [100, 500, 3000, 10000];

export function useQuoterV2(inputs: QuoteInput[], targetToken: WhitelistToken | null) {
  const validInputs = inputs.filter(
    (i) => i.token && i.amount && !isNaN(Number(i.amount)) && Number(i.amount) > 0
  );

  // Filter out identical pairings since Router will revert on self-quote
  const validInputsForQuoter = validInputs.filter(
    (i) => {
      if (!targetToken) return false;
      const tokenInAddress = i.token.isNative ? WMONAD_ADDRESS.toLowerCase() : i.token.address.toLowerCase();
      const targetAddress = targetToken.isNative ? WMONAD_ADDRESS.toLowerCase() : targetToken.address.toLowerCase();
      return tokenInAddress !== targetAddress;
    }
  );

  const contracts = targetToken && validInputsForQuoter.length > 0 ? validInputsForQuoter.flatMap((input) => {
    // Treat Native MON as WMON for Uniswap QuoterV2
    const tokenIn = input.token.isNative ? (WMONAD_ADDRESS as `0x${string}`) : input.token.address;
    const tokenOut = targetToken.isNative ? (WMONAD_ADDRESS as `0x${string}`) : (targetToken.address as `0x${string}`);
    const amountIn = parseUnits(input.amount, input.token.decimals);

    return ALL_FEE_TIERS.map((fee) => ({
      address: QUOTER_V2_ADDRESS as `0x${string}`,
      abi: quoterV2Abi,
      functionName: "quoteExactInputSingle",
      args: [
        {
          tokenIn,
          tokenOut,
          amountIn,
          fee,
          sqrtPriceLimitX96: 0n,
        },
      ],
    }));
  }) : [];

  const { data, isLoading, refetch } = useReadContracts({
    // @ts-ignore
    contracts,
    query: {
      enabled: targetToken !== null && validInputsForQuoter.length > 0,
      refetchInterval: 12000,
    },
  });

  let totalOutRaw = 0n;
  const quotesRaw: bigint[] = [];
  const bestFees: number[] = [];

  let quoterBaseIndex = 0;

  validInputs.forEach((input) => {
    if (targetToken) {
      const tokenInAddress = input.token.isNative ? WMONAD_ADDRESS.toLowerCase() : input.token.address.toLowerCase();
      const targetAddress = targetToken.isNative ? WMONAD_ADDRESS.toLowerCase() : targetToken.address.toLowerCase();
      
      if (tokenInAddress === targetAddress) {
        // 1:1 conversion mathematically
        const amountRaw = parseUnits(input.amount, input.token.decimals);
        quotesRaw.push(amountRaw);
        bestFees.push(0); // Dummy fee since identical paths don't route payload
        totalOutRaw += amountRaw;
      } else {
        let bestAmountOut = 0n;
        let bestFee = 0;

        for (let i = 0; i < ALL_FEE_TIERS.length; i++) {
          const res = data?.[quoterBaseIndex + i];
          if (res && res.status === "success" && res.result) {
            // Safe extraction of index [0]
            const outArray = res.result as [bigint, bigint, number, bigint];
            const amountOut = outArray[0];
            if (amountOut > bestAmountOut) {
              bestAmountOut = amountOut;
              bestFee = ALL_FEE_TIERS[i];
            }
          }
        }
        
        quotesRaw.push(bestAmountOut);
        bestFees.push(bestFee);
        totalOutRaw += bestAmountOut;

        quoterBaseIndex += ALL_FEE_TIERS.length;
      }
    } else {
      quotesRaw.push(0n);
      bestFees.push(0);
    }
  });

  return { totalOutRaw, quotesRaw, bestFees, isLoading, refetch, validInputs };
}
