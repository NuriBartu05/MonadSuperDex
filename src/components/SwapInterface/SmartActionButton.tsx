"use client";

import React from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { TokenReq } from "../../hooks/useApprovals";

interface SmartActionButtonProps {
  isConnected: boolean;
  hasValidInputs: boolean;
  hasInsufficientBalance?: boolean; // 1. Prop Eklendi
  isApproving: boolean;
  approvalQueue: TokenReq[];
  isRefreshingQuotes: boolean;
  isExecuting: boolean;
  onApprove: () => void;
  onExecute: () => void;
}

export function SmartActionButton({
  isConnected,
  hasValidInputs,
  hasInsufficientBalance, // 2. Parametrelere Eklendi
  isApproving,
  approvalQueue,
  isRefreshingQuotes,
  isExecuting,
  onApprove,
  onExecute,
}: SmartActionButtonProps) {

  if (!isConnected) {
    return (
      <div className="w-full flex justify-center mt-2">
        <ConnectButton showBalance={false} chainStatus="icon" />
      </div>
    );
  }

  const baseClasses = "w-full py-4 rounded-xl font-bold text-lg tracking-wide transition-all duration-200 flex justify-center items-center shadow-lg";
  const activeClasses = "bg-purple-600 hover:bg-purple-500 text-white shadow-[0_0_20px_-5px_rgba(147,51,234,0.5)] transform active:scale-95 border border-purple-500/50";
  const executeClasses = "bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_20px_-5px_rgba(37,99,235,0.5)] transform active:scale-95 border border-blue-500/50";
  const disabledClasses = "bg-gray-800 text-gray-500 cursor-not-allowed shadow-none border border-gray-700 flex justify-center";
  const errorClasses = "bg-rose-900/30 text-rose-500 cursor-not-allowed shadow-none border border-rose-800/50 flex justify-center"; // Kırmızı hata tasarımı eklendi

  // Dynamically evaluating zero-values blocking execution organically
  if (!hasValidInputs) {
    return (
      <div className="w-full">
        <button
          disabled
          className={`${baseClasses} ${disabledClasses}`}
        >
          Enter an amount
        </button>
      </div>
    );
  }

  // 3. Yetersiz Bakiye Kontrolü (YENİ EKLENEN BLOK)
  if (hasInsufficientBalance) {
    return (
      <div className="w-full">
        <button
          disabled
          className={`${baseClasses} ${errorClasses}`}
        >
          Insufficient Balance
        </button>
      </div>
    );
  }

  // Queue Evaluator dynamically bypassing if active Web3 state satisfies
  const needsApproval = approvalQueue.length > 0;
  if (needsApproval) {
    const currentToken = approvalQueue[0];

    return (
      <div className="w-full">
        <button
          onClick={onApprove}
          disabled={isApproving}
          className={`${baseClasses} ${isApproving ? disabledClasses : activeClasses}`}
        >
          {isApproving
            ? `Approving ${currentToken.symbol}...`
            : `Approve ${currentToken.symbol} (1/${approvalQueue.length})`}
        </button>
      </div>
    );
  }

  // Critical Anti-stale Refresh Syncing
  if (isRefreshingQuotes) {
    return (
      <div className="w-full">
        <button
          disabled
          className={`${baseClasses} ${disabledClasses} animate-pulse`}
        >
          Fetching Fresh Quotes...
        </button>
      </div>
    );
  }

  // Safe to Send EVM Batch Transaction Target State
  return (
    <div className="w-full">
      <button
        onClick={onExecute}
        disabled={isExecuting}
        className={`${baseClasses} ${isExecuting ? disabledClasses : executeClasses}`}
      >
        {isExecuting ? "Executing Batch Swap..." : "Execute Batch Swap"}
      </button>
    </div>
  );
}