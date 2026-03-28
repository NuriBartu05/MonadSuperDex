"use client";

import { useState, useMemo, useEffect } from "react";
import { useAccount, useReadContracts, useWaitForTransactionReceipt, useBalance } from "wagmi";
import { formatUnits, parseUnits, Address, maxUint256 } from "viem";
import { TokenInputRow } from "./TokenInputRow";
import { TokenModal, TokenWithBalance } from "./TokenModal";
import { WHITELIST_TOKENS, WhitelistToken } from "../../config/whitelist";
import { SWAP_ROUTER_02_ADDRESS, WMONAD_ADDRESS } from "../../config/constants";
import { Plus, ArrowDown, ChevronDown } from "lucide-react";

import { useQuoterV2 } from "../../hooks/useQuoterV2";
import { useApprovals } from "../../hooks/useApprovals";
import { useBatchSwap } from "../../hooks/useBatchSwap";

const minErc20Abi = [
  {
    inputs: [{ name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    name: "allowance",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

interface SwapInput {
  id: string;
  amount: string;
  token: WhitelistToken | null;
}

function generateId() {
  return Math.random().toString(36).substring(2, 9);
}

export function SwapInterface() {
  const { address } = useAccount();

  const [inputs, setInputs] = useState<SwapInput[]>([{ id: generateId(), amount: "", token: null }]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeModalRowId, setActiveModalRowId] = useState<string | null>(null);
  const [modalType, setModalType] = useState<'input' | 'output' | null>(null);
  const [targetToken, setTargetToken] = useState<WhitelistToken | null>(WHITELIST_TOKENS.find(t => t.symbol === 'WMON') || null);
  
  const [isApproving, setIsApproving] = useState(false);
  const [isSwapping, setIsSwapping] = useState(false);
  const [pendingTxHash, setPendingTxHash] = useState<Address | undefined>();

  const validInputsForQuotes = useMemo(() => {
    return inputs.map(i => ({ token: i.token!, amount: i.amount })).filter(
      (i) => i.token && i.amount && !isNaN(Number(i.amount)) && Number(i.amount) > 0
    );
  }, [inputs]);

  const { totalOutRaw, quotesRaw, bestFees, isLoading: isQuoting, refetch: refetchQuotes } = useQuoterV2(validInputsForQuotes, targetToken);
  const { approve } = useApprovals();
  const { executeBatchSwap } = useBatchSwap();

  // Native MON representation if target is WMON, or formatting for whatever target token is
  const formattedOutput = totalOutRaw > 0n && targetToken ? formatUnits(totalOutRaw, targetToken.decimals) : "0";

  const contractsToRead = useMemo(() => {
    if (!address) return [];
    const calls: any[] = [];
    WHITELIST_TOKENS.forEach((token) => {
      if (!token.isNative) {
        calls.push({
          address: token.address,
          abi: minErc20Abi,
          functionName: "balanceOf",
          args: [address],
        });
      }
    });
    WHITELIST_TOKENS.forEach((token) => {
      if (!token.isNative) {
        calls.push({
          address: token.address,
          abi: minErc20Abi,
          functionName: "allowance",
          args: [address, SWAP_ROUTER_02_ADDRESS],
        });
      }
    });
    return calls;
  }, [address]);

  const { data: readData, refetch: refetchBalances } = useReadContracts({
    contracts: contractsToRead,
    query: {
      enabled: !!address,
    },
  });

  const { data: nativeBalance, refetch: refetchNative } = useBalance({ address });

  const tokensWithBalancesAndAllowances: (TokenWithBalance & { allowanceRaw: bigint })[] = useMemo(() => {
    let readIndex = 0;
    const nonNativeCount = WHITELIST_TOKENS.filter(t => !t.isNative).length;

    return WHITELIST_TOKENS.map((token) => {
      if (token.isNative) {
        const balanceRaw = nativeBalance?.value ?? 0n;
        return {
          ...token,
          balanceRaw,
          allowanceRaw: maxUint256, // Native coins don't need allowance
          balanceFormatted: formatUnits(balanceRaw, token.decimals),
        };
      } else {
        const balanceRaw = (readData?.[readIndex]?.result as bigint) ?? 0n;
        const allowanceRaw = (readData?.[readIndex + nonNativeCount]?.result as bigint) ?? 0n;
        readIndex++;
        return {
          ...token,
          balanceRaw,
          allowanceRaw,
          balanceFormatted: formatUnits(balanceRaw, token.decimals),
        };
      }
    });
  }, [readData, nativeBalance]);

  const handleOpenModal = (rowId: string) => {
    setActiveModalRowId(rowId);
    setModalType('input');
    setIsModalOpen(true);
  };

  const handleSelectToken = (token: WhitelistToken) => {
    if (modalType === 'output') {
      setTargetToken(token);
    } else if (modalType === 'input' && activeModalRowId) {
      setInputs((prev) =>
        prev.map((row) => (row.id === activeModalRowId ? { ...row, token } : row))
      );
    }
    setIsModalOpen(false);
    setModalType(null);
  };

  const handleUpdateAmount = (rowId: string, amount: string) => {
    setInputs((prev) => prev.map((row) => (row.id === rowId ? { ...row, amount } : row)));
  };

  const handleAddInput = () => {
    if (inputs.length < 5) {
      setInputs((prev) => [...prev, { id: generateId(), amount: "", token: null }]);
    }
  };

  const handleRemoveInput = (rowId: string) => {
    setInputs((prev) => prev.filter((row) => row.id !== rowId));
  };

  const handlePercentage = (rowId: string, percentage: number) => {
    const row = inputs.find((r) => r.id === rowId);
    if (!row || !row.token) return;

    const t = tokensWithBalancesAndAllowances.find((x) => x.address === row.token!.address);
    if (!t) return;

    // Strict BigInt math: (balance * percent) / 100
    const amountRaw = (t.balanceRaw * BigInt(percentage)) / 100n;
    const formatted = formatUnits(amountRaw, row.token.decimals);

    handleUpdateAmount(rowId, formatted);
  };

  const { hasInsufficientBalance, approvalQueue, parsedAmountsIn } = useMemo(() => {
    let insufficient = false;
    const queue: { token: WhitelistToken; amountNeeded: bigint }[] = [];
    const parsedAmounts: bigint[] = [];

    const tokenTotals = new Map<string, bigint>();

    inputs.forEach((row) => {
      if (!row.token || !row.amount || isNaN(Number(row.amount))) return;
      const t = tokensWithBalancesAndAllowances.find((x) => x.address === row.token!.address);
      if (!t) return;
      
      try {
        const parsedAmount = parseUnits(row.amount, row.token.decimals);
        parsedAmounts.push(parsedAmount);
        
        const currentTotal = tokenTotals.get(t.address) ?? 0n;
        tokenTotals.set(t.address, currentTotal + parsedAmount);
      } catch (e) {
        // ignore
      }
    });

    tokenTotals.forEach((totalNeeded, tokenAddress) => {
      const t = tokensWithBalancesAndAllowances.find((x) => x.address === tokenAddress);
      if (t) {
        if (totalNeeded > t.balanceRaw) {
          insufficient = true;
        }
        if (totalNeeded > t.allowanceRaw) {
          queue.push({ token: t, amountNeeded: totalNeeded });
        }
      }
    });

    return { hasInsufficientBalance: insufficient, approvalQueue: queue, parsedAmountsIn: parsedAmounts };
  }, [inputs, tokensWithBalancesAndAllowances]);

  const hasInsufficientLiquidity = validInputsForQuotes.some((input, idx) => {
    const tokenInAddress = input.token.isNative ? WMONAD_ADDRESS.toLowerCase() : input.token.address.toLowerCase();
    const targetAddress = targetToken ? (targetToken.isNative ? WMONAD_ADDRESS.toLowerCase() : targetToken.address.toLowerCase()) : "";
    
    // Identical paths are valid mathematical unwraps
    if (tokenInAddress === targetAddress) return false;
    
    // If bestFee is 0, no liquidity route was found across any of the 4 tiers
    return bestFees[idx] === 0;
  });

  const { isSuccess: txSuccess } = useWaitForTransactionReceipt({
    hash: pendingTxHash,
  });

  useEffect(() => {
    if (txSuccess && pendingTxHash) {
      refetchBalances();
      refetchNative();
      refetchQuotes();
      setPendingTxHash(undefined);
    }
  }, [txSuccess, pendingTxHash, refetchBalances, refetchNative, refetchQuotes]);

  const allAmountsEmpty = inputs.every((row) => !row.amount || Number(row.amount) === 0);
  const someTokensMissing = inputs.some((row) => !row.token);

  const needsApproval = approvalQueue.length > 0;

  const handleApprove = async () => {
    if (!needsApproval) return;
    setIsApproving(true);
    try {
      const tokenToApprove = approvalQueue[0].token;
      const hash = await approve(tokenToApprove.address, maxUint256);
      setPendingTxHash(hash);
    } catch (e) {
      console.error(e);
    } finally {
      setIsApproving(false);
    }
  };

  const handleExecute = async () => {
    if (!address || needsApproval || hasInsufficientBalance || allAmountsEmpty || !targetToken || hasInsufficientLiquidity) return;
    setIsSwapping(true);
    try {
      const hash = await executeBatchSwap(validInputsForQuotes, parsedAmountsIn, quotesRaw, bestFees, address, targetToken.address);
      setPendingTxHash(hash);
      setInputs([{ id: generateId(), amount: "", token: null }]);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSwapping(false);
    }
  };

  const targetTokenInfo = targetToken ? tokensWithBalancesAndAllowances.find((x) => x.address === targetToken.address) : null;
  const targetTokenBalanceFormatted = targetTokenInfo ? Number(targetTokenInfo.balanceFormatted).toLocaleString(undefined, { maximumFractionDigits: 6 }) : "0.0";

  let buttonText = "Swap";
  let buttonDisabled = false;
  let buttonStateClass = "bg-[#FB118E] text-white hover:bg-[#fb118ed0]";
  let onClickAction = handleExecute;

  if (!address) {
    buttonText = "Connect Wallet";
    buttonDisabled = true;
    buttonStateClass = "bg-slate-200 dark:bg-[#1B2236] text-[#FB118E]";
  } else if (someTokensMissing || allAmountsEmpty || !targetToken) {
    buttonText = "Enter an amount";
    buttonDisabled = true;
    buttonStateClass = "bg-slate-200 dark:bg-[#1B2236] text-slate-500 dark:text-gray-500";
  } else if (hasInsufficientBalance) {
    buttonText = "Insufficient Balance";
    buttonDisabled = true;
    buttonStateClass = "bg-slate-200 dark:bg-[#1B2236] text-red-500";
  } else if (isQuoting) {
    buttonText = "Fetching Quotes...";
    buttonDisabled = true;
    buttonStateClass = "bg-slate-200 dark:bg-[#1B2236] text-slate-500 dark:text-gray-500";
  } else if (hasInsufficientLiquidity) {
    buttonText = "Insufficient Liquidity";
    buttonDisabled = true;
    buttonStateClass = "bg-slate-200 dark:bg-[#1B2236] text-red-500";
  } else if (isApproving || isSwapping || pendingTxHash) {
    buttonText = "Confirm in Wallet...";
    buttonDisabled = true;
    buttonStateClass = "bg-slate-200 dark:bg-[#1B2236] text-[#FB118E]";
  } else if (needsApproval) {
    buttonText = `Approve ${approvalQueue[0].token.symbol}`;
    buttonDisabled = false;
    buttonStateClass = "bg-[#FB118E] text-white hover:bg-[#fb118ed0]";
    onClickAction = handleApprove;
  }

  return (
    <div className="relative w-full max-w-[560px] mx-auto z-10">
      {/* Background Glow */}
      <div className="absolute inset-0 bg-[#FB118E]/5 dark:bg-[#FB118E]/15 blur-[100px] w-full h-full pointer-events-none z-0 transition-opacity"></div>

      {/* Main Card */}
      <div className="relative z-10 bg-white dark:bg-[#131A2A] border border-slate-200 dark:border-[#1B2236] rounded-[32px] p-4 sm:p-6 w-full shadow-2xl transition-colors">
        <div className="flex flex-col gap-2">
          {inputs.map((row) => {
            const t = row.token ? tokensWithBalancesAndAllowances.find((x) => x.address === row.token!.address) : null;
            return (
              <TokenInputRow
                key={row.id}
                amount={row.amount}
                onAmountChange={(val) => handleUpdateAmount(row.id, val)}
                token={row.token}
                balanceFormatted={t ? Number(t.balanceFormatted).toLocaleString(undefined, { maximumFractionDigits: 6 }) : "0.0"}
                onOpenModal={() => handleOpenModal(row.id)}
                onPercentageSelect={(pct) => handlePercentage(row.id, pct)}
                onRemove={() => handleRemoveInput(row.id)}
                canRemove={inputs.length > 1}
              />
            );
          })}
        </div>

        {/* Controls Container: + Add Token & Arrow pointing down */}
        <div className="relative z-20 mt-4 mb-2 flex justify-center pointer-events-auto">
          {inputs.length < 5 && (
            <button
              onClick={handleAddInput}
              className="flex items-center gap-1 bg-slate-100 dark:bg-[#1B2236] hover:bg-slate-200 dark:hover:bg-[#252E47] border border-slate-200 dark:border-[#0D111C] rounded-full px-4 py-1.5 text-sm text-slate-700 dark:text-gray-300 transition-colors shadow-sm z-30 relative"
            >
              <Plus size={16} />
              <span>Add Token</span>
            </button>
          )}

          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-center pointer-events-none">
            <div className="bg-white dark:bg-[#131A2A] border-[4px] border-white dark:border-[#131A2A] rounded-xl z-10 transition-colors">
              <div className="bg-slate-100 dark:bg-[#1B2236] text-slate-500 dark:text-gray-400 p-1.5 rounded-lg transition-colors">
                <ArrowDown size={18} />
              </div>
            </div>
          </div>
        </div>

        <div className="pt-2">
          <div className="bg-slate-100 dark:bg-[#0D111C] border border-transparent rounded-2xl p-4 sm:p-5 transition-colors">
            <div className="flex items-center justify-between px-1 pb-3">
              <h3 className="text-slate-500 dark:text-gray-400 text-sm font-medium">You Receive</h3>
            </div>
            <div className="flex items-center justify-between gap-4">
              <input
                type="text"
                placeholder="0"
                disabled
                value={formattedOutput !== "0" ? formattedOutput : ""}
                className="bg-transparent text-4xl sm:text-5xl text-slate-900 dark:text-white outline-none w-full flex-1 appearance-none placeholder:text-slate-400 dark:placeholder:text-gray-600 truncate cursor-not-allowed"
              />
              {targetToken ? (
                <button
                  onClick={() => {
                    setModalType('output');
                    setIsModalOpen(true);
                  }}
                  className="flex items-center gap-2 bg-white dark:bg-[#131A2A] hover:bg-slate-50 dark:hover:bg-[#1B2236] border border-slate-200 dark:border-[#1B2236] rounded-full px-3 py-1.5 text-slate-800 dark:text-white font-medium transition-colors whitespace-nowrap shadow-sm"
                >
                  <div className="flex items-center gap-2">
                    {targetToken.logoUrl ? (
                      <img
                        src={targetToken.logoUrl}
                        alt={targetToken.symbol}
                        className="w-5 h-5 rounded-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://cryptologos.cc/logos/monero-xmr-logo.png';
                        }}
                      />
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-[10px] font-bold text-white">
                        {targetToken.symbol[0]}
                      </div>
                    )}
                    <span>{targetToken.symbol}</span>
                  </div>
                  <ChevronDown size={18} className="text-slate-400 dark:text-gray-400" />
                </button>
              ) : (
                <button
                  onClick={() => {
                    setModalType('output');
                    setIsModalOpen(true);
                  }}
                  className="flex items-center gap-2 bg-white dark:bg-[#131A2A] hover:bg-slate-50 dark:hover:bg-[#1B2236] border border-slate-200 dark:border-[#1B2236] rounded-full px-3 py-1.5 text-slate-800 dark:text-white font-medium transition-colors whitespace-nowrap shadow-sm"
                >
                  <span>Select token</span>
                  <ChevronDown size={18} className="text-slate-400 dark:text-gray-400" />
                </button>
              )}
            </div>
            
            {targetToken && (
              <div className="flex items-center justify-between mt-4 h-6 px-1">
                <div className="text-xs text-slate-500 dark:text-gray-400 font-medium">
                  Balance: {targetTokenBalanceFormatted}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-4">
          <button
            onClick={onClickAction}
            disabled={buttonDisabled}
            className={`w-full rounded-2xl py-4 font-semibold text-xl transition-colors ${buttonStateClass}`}
          >
            {buttonText}
          </button>
        </div>

        <TokenModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setModalType(null);
          }}
          onSelect={handleSelectToken}
          tokens={tokensWithBalancesAndAllowances}
        />
      </div>
    </div>
  );
}
