"use client";

import { useState, useMemo, useEffect } from "react";
import { useAccount, useReadContracts, useWaitForTransactionReceipt, useBalance } from "wagmi";
import { formatUnits, parseUnits, Address, maxUint256 } from "viem";
import { TokenInputRow } from "./TokenInputRow";
import { TokenModal, TokenWithBalance } from "./TokenModal";
import { WHITELIST_TOKENS, WhitelistToken } from "../../config/whitelist";
import { SWAP_ROUTER_02_ADDRESS } from "../../config/constants";
import { Plus, ArrowDown } from "lucide-react";

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
  
  const [isApproving, setIsApproving] = useState(false);
  const [isSwapping, setIsSwapping] = useState(false);
  const [pendingTxHash, setPendingTxHash] = useState<Address | undefined>();

  const validInputsForQuotes = useMemo(() => {
    return inputs.map(i => ({ token: i.token!, amount: i.amount })).filter(
      (i) => i.token && i.amount && !isNaN(Number(i.amount)) && Number(i.amount) > 0
    );
  }, [inputs]);

  const { totalOutRaw, quotesRaw, isLoading: isQuoting, refetch: refetchQuotes } = useQuoterV2(validInputsForQuotes);
  const { approve } = useApprovals();
  const { executeBatchSwap } = useBatchSwap();

  // Native MON representation
  const formattedOutput = totalOutRaw > 0n ? formatUnits(totalOutRaw, 18) : "0";

  const contractsToRead = useMemo(() => {
    if (!address) return [];
    const calls: any[] = [];
    WHITELIST_TOKENS.forEach((token) => {
      calls.push({
        address: token.address,
        abi: minErc20Abi,
        functionName: "balanceOf",
        args: [address],
      });
    });
    WHITELIST_TOKENS.forEach((token) => {
      calls.push({
        address: token.address,
        abi: minErc20Abi,
        functionName: "allowance",
        args: [address, SWAP_ROUTER_02_ADDRESS],
      });
    });
    return calls;
  }, [address]);

  const { data: readData, refetch: refetchBalances } = useReadContracts({
    contracts: contractsToRead,
    query: {
      enabled: !!address,
    },
  });

  // ======= DEBUGGING: Console logs =======
  useEffect(() => {
    console.log("WAGMI READ DATA:", readData);
  }, [readData]);

  const { data: nativeBalance } = useBalance({ address });

  useEffect(() => {
    console.log("NATIVE BALANCE:", nativeBalance);
  }, [nativeBalance]);
  // =======================================

  const tokensWithBalancesAndAllowances: (TokenWithBalance & { allowanceRaw: bigint })[] = useMemo(() => {
    return WHITELIST_TOKENS.map((token, index) => {
      const balanceRaw = (readData?.[index]?.result as bigint) ?? 0n;
      const allowanceRaw = (readData?.[index + WHITELIST_TOKENS.length]?.result as bigint) ?? 0n;
      return {
        ...token,
        balanceRaw,
        allowanceRaw,
        balanceFormatted: formatUnits(balanceRaw, token.decimals),
      };
    });
  }, [readData]);

  const handleOpenModal = (rowId: string) => {
    setActiveModalRowId(rowId);
    setIsModalOpen(true);
  };

  const handleSelectToken = (token: WhitelistToken) => {
    if (activeModalRowId) {
      setInputs((prev) =>
        prev.map((row) => (row.id === activeModalRowId ? { ...row, token } : row))
      );
    }
    setIsModalOpen(false);
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

  const { isSuccess: txSuccess } = useWaitForTransactionReceipt({
    hash: pendingTxHash,
  });

  if (txSuccess && pendingTxHash) {
    refetchBalances();
    refetchQuotes();
    setPendingTxHash(undefined);
  }

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
    if (!address || needsApproval || hasInsufficientBalance || allAmountsEmpty) return;
    setIsSwapping(true);
    try {
      const hash = await executeBatchSwap(validInputsForQuotes, parsedAmountsIn, quotesRaw, address);
      setPendingTxHash(hash);
      setInputs([{ id: generateId(), amount: "", token: null }]);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSwapping(false);
    }
  };

  let buttonText = "Swap";
  let buttonDisabled = false;
  let buttonStateClass = "bg-[#FB118E] text-white hover:bg-[#fb118ed0]";
  let onClickAction = handleExecute;

  if (!address) {
    buttonText = "Connect Wallet";
    buttonDisabled = true;
    buttonStateClass = "bg-[#1B2236] text-[#FB118E]";
  } else if (someTokensMissing || allAmountsEmpty) {
    buttonText = "Enter an amount";
    buttonDisabled = true;
    buttonStateClass = "bg-[#1B2236] text-gray-500";
  } else if (hasInsufficientBalance) {
    buttonText = "Insufficient Balance";
    buttonDisabled = true;
    buttonStateClass = "bg-[#1B2236] text-red-500";
  } else if (isQuoting) {
    buttonText = "Fetching Quotes...";
    buttonDisabled = true;
    buttonStateClass = "bg-[#1B2236] text-gray-500";
  } else if (isApproving || isSwapping || pendingTxHash) {
    buttonText = "Confirm in Wallet...";
    buttonDisabled = true;
    buttonStateClass = "bg-[#1B2236] text-[#FB118E]";
  } else if (needsApproval) {
    buttonText = `Approve ${approvalQueue[0].token.symbol}`;
    buttonDisabled = false;
    buttonStateClass = "bg-[#FB118E] text-white hover:bg-[#fb118ed0]";
    onClickAction = handleApprove;
  }

  return (
    <div className="relative w-full max-w-[480px] mx-auto">
      {/* Background Glow */}
      <div className="absolute inset-0 bg-[#FB118E]/10 blur-[100px] w-full h-full pointer-events-none z-0"></div>

      {/* Main Card */}
      <div className="relative z-10 bg-[#131A2A] border border-[#1B2236] rounded-[24px] p-2 sm:p-4 w-full shadow-2xl">
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
        <div className="flex flex-col items-center justify-center -my-2 py-4 relative z-10 gap-3">
          {inputs.length < 5 && (
            <button
              onClick={handleAddInput}
              className="flex items-center gap-1 bg-[#1B2236] hover:bg-[#252E47] border border-[#0D111C] rounded-full px-4 py-1.5 text-sm text-gray-300 transition-colors shadow-sm"
            >
              <Plus size={16} />
              <span>Add Token</span>
            </button>
          )}

          <div className="bg-[#131A2A] border-[4px] border-[#131A2A] rounded-xl z-10">
            <div className="bg-[#1B2236] text-gray-400 p-1 rounded-lg">
              <ArrowDown size={18} />
            </div>
          </div>
        </div>

        <div className="pt-2">
          <div className="bg-[#0D111C] border border-transparent rounded-2xl p-4 transition-colors">
            <div className="flex items-center justify-between px-1 pb-2">
              <h3 className="text-gray-400 text-sm font-medium">You Receive</h3>
            </div>
            <div className="flex items-center justify-between gap-4">
              <input
                type="text"
                placeholder="0"
                disabled
                value={formattedOutput !== "0" ? formattedOutput : ""}
                className="bg-transparent text-3xl text-gray-500 outline-none w-full flex-1 appearance-none placeholder:text-gray-600 truncate cursor-not-allowed"
              />
              <button
                disabled
                className="flex items-center gap-2 bg-[#131A2A] border border-[#1B2236] rounded-full px-3 py-1.5 text-white font-medium cursor-not-allowed whitespace-nowrap opacity-80"
              >
                <img src="https://cryptologos.cc/logos/monero-xmr-logo.png" alt="MON" className="w-5 h-5 rounded-full" />
                <span>MON</span>
              </button>
            </div>
          </div>
        </div>

        <div className="mt-4">
          <button
            onClick={onClickAction}
            disabled={buttonDisabled}
            className={`w-full rounded-2xl py-4 font-semibold text-lg transition-colors ${buttonStateClass}`}
          >
            {buttonText}
          </button>
        </div>

        <TokenModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSelect={handleSelectToken}
          tokens={tokensWithBalancesAndAllowances}
        />
      </div>
    </div>
  );
}
