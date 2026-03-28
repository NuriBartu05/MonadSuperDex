"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useAccount, useReadContracts } from "wagmi";
import { parseUnits, formatUnits } from "viem";
import { WHITELIST_TOKENS } from "../../config/whitelist";
import { TokenInputRow, RowData } from "./TokenInputRow";
import { SmartActionButton } from "./SmartActionButton";
import { useQuoterV2, TokenQuoteInput } from "../../hooks/useQuoterV2";
import { useApprovals, TokenReq } from "../../hooks/useApprovals";
import { useBatchSwap, BatchSwapInput } from "../../hooks/useBatchSwap";
import { SWAP_ROUTER_02_ADDRESS } from "../../config/constants";
import { ExtendedToken } from "./CustomTokenSelect";

// 1. STRICT MINIMAL ABI (Resolving viem generic erc20Abi decode crashes for specific RPCs)
const minimalErc20Abi = [
  {
    "constant": true,
    "inputs": [{ "name": "_owner", "type": "address" }],
    "name": "balanceOf",
    "outputs": [{ "name": "balance", "type": "uint256" }],
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [{ "name": "owner", "type": "address" }, { "name": "spender", "type": "address" }],
    "name": "allowance",
    "outputs": [{ "name": "remaining", "type": "uint256" }],
    "type": "function"
  }
] as const;

export function SwapInterface() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const { address, isConnected } = useAccount();

  const [inputs, setInputs] = useState<RowData[]>([
    { id: "row-1", tokenAddress: "", amount: "" }
  ]);
  const [isRefreshingQuotes, setIsRefreshingQuotes] = useState(false);

  // Wagmi Cache Protection Setup
  const whitelistBalanceContracts = useMemo(() => {
    if (!address) return [];
    
    return WHITELIST_TOKENS.map(t => ({
      address: t.address as `0x${string}`,
      abi: minimalErc20Abi, // Utilizing strict fallback JSON ABI
      functionName: "balanceOf",
      args: [address as `0x${string}`]
    }));
  }, [address]);

  const { data: whitelistBalanceData, refetch: refetchBalances } = useReadContracts({
    contracts: whitelistBalanceContracts,
    query: { 
      enabled: whitelistBalanceContracts.length > 0 && !!address,
      refetchInterval: 10000 
    }
  });

  // 2. AGGRESSIVE WAGMI CACHE POISONING FIX: 
  // Force a hard manual refetch once the Ethereum provider is genuinely bolted via hydration, nuking the cached '0's!
  useEffect(() => {
    if (mounted && isConnected && address) {
      refetchBalances();
    }
  }, [mounted, isConnected, address, refetchBalances]);

  const sortedTokensWithBalances: ExtendedToken[] = useMemo(() => {
    const populated = WHITELIST_TOKENS.map((token, index) => {
      const dataObj = whitelistBalanceData?.[index];
      
      const rawBal: bigint = (dataObj?.status === "success" && dataObj?.result !== undefined) 
        ? (dataObj.result as bigint) 
        : 0n;

      let fmtBal = "0.00";
      try {
        if (rawBal > 0n) {
          fmtBal = Number(formatUnits(rawBal, token.decimals)).toLocaleString(undefined, { maximumFractionDigits: 6 });
        }
      } catch (err) {
        fmtBal = "0.00";
      }

      return {
        ...token,
        balanceRaw: rawBal,
        balanceFormatted: fmtBal
      };
    });

    return populated.sort((a, b) => {
      if (a.balanceRaw > b.balanceRaw) return -1;
      if (a.balanceRaw < b.balanceRaw) return 1;
      return 0;
    });
  }, [whitelistBalanceData]);

  const validRows = useMemo(() => {
    return inputs.map((row, index) => {
      const extendedToken = sortedTokensWithBalances.find(t => t.address.toLowerCase() === row.tokenAddress.toLowerCase());
      
      let amountInRaw = 0n;
      try {
        if (extendedToken && row.amount) {
          amountInRaw = parseUnits(row.amount, extendedToken.decimals);
        }
      } catch {
        amountInRaw = 0n;
      }

      const isInsufficient = Boolean(extendedToken && amountInRaw > extendedToken.balanceRaw);
      
      return {
        ...row,
        tokenObj: extendedToken,
        amountInRaw,
        isInsufficient,
        index
      };
    }).filter(v => v.tokenObj && v.amountInRaw > 0n);
  }, [inputs, sortedTokensWithBalances]);

  const hasValidInputs = validRows.length > 0;
  const hasInsufficientBalance = validRows.some(row => row.isInsufficient);

  const quoteInputs: TokenQuoteInput[] = useMemo(() => {
    if (hasInsufficientBalance) return [];
    return validRows.map(v => ({
      tokenAddress: v.tokenAddress as `0x${string}`,
      feeTier: v.tokenObj!.feeTier,
      amountIn: v.amountInRaw
    }));
  }, [validRows, hasInsufficientBalance]);

  const { quotes, isLoading: isQuoting, refetchQuotes } = useQuoterV2(quoteInputs);

  const totalQuoteAmount = useMemo(() => {
    return quotes.reduce((acc, curr) => acc + (curr || 0n), 0n);
  }, [quotes]);

  const approvalRequirements: TokenReq[] = useMemo(() => {
    if (hasInsufficientBalance) return [];
    return validRows.map(v => ({
      address: v.tokenAddress as `0x${string}`,
      amount: v.amountInRaw,
      symbol: v.tokenObj!.symbol
    }));
  }, [validRows, hasInsufficientBalance]);

  const { executeApprovals, isApproving, refetchAllowances } = useApprovals(approvalRequirements);

  const allowanceContracts = useMemo(() => {
    if (!address) return [];
    return validRows.map(v => ({
      address: v.tokenAddress as `0x${string}`,
      abi: minimalErc20Abi, // Using the new static JSON Array ABI
      functionName: "allowance",
      args: [address as `0x${string}`, SWAP_ROUTER_02_ADDRESS as `0x${string}`]
    }));
  }, [validRows, address]);

  const { data: rawAllowances } = useReadContracts({
    contracts: allowanceContracts,
    query: { enabled: allowanceContracts.length > 0 && !!address && !hasInsufficientBalance }
  });

  const approvalQueue: TokenReq[] = useMemo(() => {
    if (!rawAllowances || hasInsufficientBalance) return [];
    return approvalRequirements.filter((req, idx) => {
      const dataObj = rawAllowances[idx];
      const currentAllowance = dataObj?.status === "success" ? (dataObj.result as bigint) : undefined;
      return currentAllowance === undefined || currentAllowance < req.amount;
    });
  }, [rawAllowances, approvalRequirements, hasInsufficientBalance]);

  const { executeBatchSwap, isSwapping } = useBatchSwap();

  const handleApprove = async () => {
    if (!hasValidInputs || hasInsufficientBalance) return;
    const success = await executeApprovals();
    if (success) {
      refetchAllowances();
      refetchBalances();
    }
  };

  const handleExecute = async () => {
    if (!hasValidInputs || hasInsufficientBalance) return;

    setIsRefreshingQuotes(true);
    const freshQuotesUpdate = await refetchQuotes();
    setIsRefreshingQuotes(false);

    const freshQuotesData: bigint[] = [];
    if (freshQuotesUpdate.data) {
      freshQuotesUpdate.data.forEach((res: any) => {
        if (res.status === "success" && res.result) {
          freshQuotesData.push(res.result[0] as bigint);
        } else {
          freshQuotesData.push(0n);
        }
      });
    } else {
      quotes.forEach(q => freshQuotesData.push(q));
    }

    const batchSwapInputs: BatchSwapInput[] = validRows.map((v, idx) => ({
      tokenAddress: v.tokenAddress as `0x${string}`,
      amountIn: v.amountInRaw,
      amountOutQuote: freshQuotesData[idx] ?? 0n,
      feeTier: v.tokenObj!.feeTier
    }));

    await executeBatchSwap(batchSwapInputs);
    refetchBalances(); 
  };

  const handleAddRow = () => {
    if (inputs.length >= 5) return;
    setInputs([...inputs, { id: `row-${Date.now()}`, tokenAddress: "", amount: "" }]);
  };

  const handleRemoveRow = (id: string) => {
    if (inputs.length <= 1) return;
    setInputs(inputs.filter(row => row.id !== id));
  };

  const handleUpdateRow = (id: string, field: keyof RowData, value: string) => {
    setInputs(inputs.map(row => row.id === id ? { ...row, [field]: value } : row));
  };

  if (!mounted) {
    return (
      <section className="w-full max-w-lg mx-auto bg-gray-900 border border-gray-800 rounded-[2rem] shadow-xl min-h-[500px] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </section>
    );
  }

  return (
    <section className="w-full max-w-lg mx-auto bg-gray-900/80 backdrop-blur-3xl border border-white/5 rounded-[2rem] shadow-[0_0_50px_-15px_rgba(79,70,229,0.3)] p-3 sm:p-5 relative overflow-visible z-10">
      <div className="absolute inset-x-0 top-0 h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none" />

      <div className="p-2 sm:p-4 mb-1 flex justify-between items-center z-0">
        <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">Swap</h2>
        <div className="text-[10px] sm:text-xs font-bold text-indigo-300 bg-indigo-500/10 px-3 py-1.5 rounded-full border border-indigo-500/20 shadow-inner">
          Max 5 Tokens
        </div>
      </div>

      <div className="flex flex-col space-y-2 relative z-20">
        {inputs.map((row) => (
          <TokenInputRow 
            key={row.id}
            row={row}
            sortedTokens={sortedTokensWithBalances}
            onUpdate={handleUpdateRow}
            onRemove={handleRemoveRow}
            canRemove={inputs.length > 1}
          />
        ))}
      </div>

      {inputs.length < 5 && (
        <div className="mt-2 flex justify-center relative z-0">
          <button 
            onClick={handleAddRow}
            className="flex items-center justify-center space-x-2 text-sm font-semibold text-indigo-400 hover:text-indigo-300 bg-indigo-500/5 hover:bg-indigo-500/10 px-4 py-3 rounded-2xl transition-all w-full border border-indigo-500/20 border-dashed hover:border-indigo-500/40 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
          >
            <span className="text-xl leading-none mb-[2px]">+</span>
            <span className="tracking-wide">Add Token</span>
          </button>
        </div>
      )}

      <div className="mt-4 p-5 bg-gray-800/80 border border-gray-700/80 rounded-2xl flex flex-col relative overflow-hidden z-0 shadow-inner">
        <div className="absolute -right-4 -bottom-4 w-32 h-32 bg-purple-500/20 rounded-full blur-2xl pointer-events-none" />
        
        <span className="text-xs sm:text-sm text-gray-400 font-bold mb-2 uppercase tracking-widest">You Receive</span>
        <div className="flex items-center justify-between">
          {isQuoting ? (
            <div className="h-10 flex items-center space-x-2">
              <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" />
              <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-100" />
              <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-200" />
            </div>
          ) : (
            <span className="text-4xl sm:text-5xl font-black text-white tracking-tight truncate pr-4">
              {Number(formatUnits(totalQuoteAmount, 18)).toLocaleString(undefined, { maximumFractionDigits: 6 })}
            </span>
          )}
          
          <div className="flex items-center space-x-2 bg-gray-900 border border-gray-700 px-3 sm:px-4 py-2 rounded-xl shadow-md shrink-0">
            <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-gradient-to-br from-purple-500 to-fuchsia-500 shadow-inner border border-white/10 shrink-0" />
            <span className="text-base sm:text-lg font-bold tracking-wide text-white">WMONAD</span>
          </div>
        </div>
      </div>

      <div className="mt-4 relative z-0">
        {/* @ts-ignore */}
        <SmartActionButton 
          isConnected={Boolean(isConnected)}
          hasValidInputs={hasValidInputs}
          hasInsufficientBalance={hasInsufficientBalance}
          isApproving={isApproving}
          approvalQueue={approvalQueue}
          isRefreshingQuotes={isRefreshingQuotes}
          isExecuting={isSwapping}
          onApprove={handleApprove}
          onExecute={handleExecute}
        />
      </div>

    </section>
  );
}
