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

export function useQuoterV2(inputs: QuoteInput[]) {
  const validInputs = inputs.filter(
    (i) => i.token && i.amount && !isNaN(Number(i.amount)) && Number(i.amount) > 0
  );

  // Filter out WMONAD since it's a mathematically 1:1 unwrapping and Router will revert on self-quote
  const validInputsForQuoter = validInputs.filter(
    (i) => i.token.address.toLowerCase() !== WMONAD_ADDRESS.toLowerCase()
  );

  const contracts = validInputsForQuoter.map((input) => ({
    address: QUOTER_V2_ADDRESS as `0x${string}`,
    abi: quoterV2Abi,
    functionName: "quoteExactInputSingle",
    args: [
      {
        tokenIn: input.token.address,
        tokenOut: WMONAD_ADDRESS as `0x${string}`,
        amountIn: parseUnits(input.amount, input.token.decimals),
        fee: input.token.feeTier,
        sqrtPriceLimitX96: 0n,
      },
    ],
  }));

  const { data, isLoading, refetch } = useReadContracts({
    // @ts-ignore
    contracts,
    query: {
      enabled: validInputsForQuoter.length > 0,
      refetchInterval: 12000,
    },
  });

  let totalOutRaw = 0n;
  const quotesRaw: bigint[] = [];

  let quoterIndex = 0;

  validInputs.forEach((input) => {
    if (input.token.address.toLowerCase() === WMONAD_ADDRESS.toLowerCase()) {
      // 1:1 conversion mathematically
      const amountRaw = parseUnits(input.amount, input.token.decimals);
      quotesRaw.push(amountRaw);
      totalOutRaw += amountRaw;
    } else {
      const res = data?.[quoterIndex];
      if (res && res.status === "success" && res.result) {
        // Safe extraction of index [0]
        const outArray = res.result as [bigint, bigint, number, bigint];
        const amountOut = outArray[0];
        quotesRaw.push(amountOut);
        totalOutRaw += amountOut;
      } else {
        quotesRaw.push(0n);
      }
      quoterIndex++;
    }
  });

  return { totalOutRaw, quotesRaw, isLoading, refetch, validInputs };
}
