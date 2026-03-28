import { useAccount, useReadContracts } from "wagmi";
import { erc20Abi } from "viem";
import { WHITELIST_TOKENS, WhitelistToken } from "../config/whitelist";

export interface TokenWithBalance extends WhitelistToken {
  balance: bigint;
}

/**
 * Custom hook to batch fetch ERC-20 balances for the EOA wallet dynamically
 * across the predefined strict Whitelist via a single wagmi multicall payload.
 */
export function useBalances() {
  const { address } = useAccount();

  // Construct contract read requests for each whitelisted token
  const contracts = WHITELIST_TOKENS.map((token) => ({
    address: token.address,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: [address as `0x${string}`],
  }));

  const { data, isError, isLoading, refetch } = useReadContracts({
    contracts,
    query: {
      // Execute only if the wallet is successfully connected
      enabled: !!address,
    }
  });

  // Filter for tokens with strictly positive balances > 0 (The mathematical target N)
  const balances: TokenWithBalance[] = [];
  if (data) {
    data.forEach((result, index) => {
      if (result.status === "success" && result.result !== undefined) {
        const balance = result.result as bigint;
        if (balance > 0n) {
          balances.push({
            ...WHITELIST_TOKENS[index],
            balance,
          });
        }
      }
    });
  }

  // Calculate boundary mathematics required by product constraints
  const availableTokenCount = balances.length;
  const hasMinimumTokens = availableTokenCount >= 2;

  return {
    balances,
    isError,
    isLoading,
    refetch,
    hasMinimumTokens,  // Bounding metric `N >= 2`
    availableTokenCount // `N`
  };
}
