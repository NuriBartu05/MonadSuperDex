import { useState } from "react";
import { useAccount, useReadContracts, useWriteContract, usePublicClient } from "wagmi";
import { Address, erc20Abi } from "viem";
import { SWAP_ROUTER_02_ADDRESS } from "../config/constants";

export interface TokenReq {
  address: Address;
  amount: bigint;
  symbol: string;
}

/**
 * Phase 2 Component: The Approval Queue
 * Sequentially checks EVM allowances against SwapRouter02 and executes standard
 * ERC-20 `approve` transactions sequentially strictly for missing bounds.
 */
export function useApprovals(requirements: TokenReq[]) {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { writeContractAsync } = useWriteContract();
  
  const [isApproving, setIsApproving] = useState(false);
  const [approvalProgress, setApprovalProgress] = useState<string | null>(null);

  // Dynamically map tokens to allowance verify requests targeting the exact router
  const contracts = requirements.map((req) => ({
    address: req.address,
    abi: erc20Abi,
    functionName: "allowance",
    args: [address as Address, SWAP_ROUTER_02_ADDRESS as Address],
  }));

  const { data: allowances, refetch } = useReadContracts({
    contracts,
    query: {
      enabled: requirements.length > 0 && !!address,
    }
  });

  const executeApprovals = async (): Promise<boolean> => {
    if (!allowances || !address || !publicClient) return false;

    // Filter down to ONLY the tokens that strictly lack necessary state bounds
    const tokensNeedingApproval = requirements.filter((req, index) => {
      // Data format guaranteed by ABI signature uint256
      const currentAllowance = allowances[index]?.result as bigint | undefined;
      return currentAllowance === undefined || currentAllowance < req.amount;
    });

    if (tokensNeedingApproval.length === 0) {
      return true; // Bypass EVM loop entirely if UX is already prepped
    }

    setIsApproving(true);

    try {
      const total = tokensNeedingApproval.length;
      for (let i = 0; i < total; i++) {
        const token = tokensNeedingApproval[i];
        
        // Progress mask UI handling
        setApprovalProgress(`${i + 1}/${total}`);

        const hash = await writeContractAsync({
          address: token.address,
          abi: erc20Abi,
          functionName: "approve",
          args: [SWAP_ROUTER_02_ADDRESS as Address, token.amount],
        });

        // Sequence pause: Crucially wait for block confirmation to prevent nonce race conditions
        await publicClient.waitForTransactionReceipt({ hash });
      }
      
      await refetch(); // Sync Wagmi state explicitly post execution
      setApprovalProgress(null);
      setIsApproving(false);
      return true;

    } catch (error) {
      console.error("Approval sequence aborted:", error);
      setApprovalProgress(null);
      setIsApproving(false);
      return false;
    }
  };

  return {
    executeApprovals,
    isApproving,
    approvalProgress,
    refetchAllowances: refetch
  };
}
