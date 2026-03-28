"use client";

import React from "react";
import { formatUnits } from "viem";
import { WhitelistToken } from "../../config/whitelist";

interface TokenSlotProps {
  token?: WhitelistToken;
  balance?: bigint;
  quoteAmountOut?: bigint;
  empty?: boolean;
}

export function TokenSlot({ token, balance, quoteAmountOut, empty }: TokenSlotProps) {
  // Empty State Rendering ensuring layout shifts do not destroy visual boundaries
  if (empty || !token || balance === undefined) {
    return (
      <div className="grid grid-cols-2 gap-4 items-center bg-gray-800 p-5 rounded-xl border border-gray-700 shadow-inner">
        <div className="flex flex-col">
          <span className="font-bold text-gray-400 text-lg tracking-wide">Empty Token Slot</span>
          <span className="text-sm text-gray-500 font-medium mt-1">Balance: 0.0000</span>
        </div>
        <div className="flex flex-col items-end text-right justify-center">
          <div className="text-gray-500 text-sm font-semibold italic">Pending...</div>
        </div>
      </div>
    );
  }

  const formattedBalance = formatUnits(balance, token.decimals);
  const formattedQuote = quoteAmountOut ? formatUnits(quoteAmountOut, 18) : "0";
  const hasQuote = quoteAmountOut && quoteAmountOut > 0n;

  return (
    <div className="grid grid-cols-2 gap-4 items-center bg-gray-800 p-5 rounded-xl border border-gray-600 shadow-md hover:border-gray-500 transition-colors duration-200">
      <div className="flex flex-col">
        <span className="font-bold text-white text-xl tracking-wide">
          {token.symbol}
        </span>
        <span className="text-sm text-gray-400 font-medium mt-1">
          Balance: {Number(formattedBalance).toLocaleString(undefined, { maximumFractionDigits: 4 })}
        </span>
      </div>
      
      <div className="flex flex-col items-end text-right justify-center">
        {hasQuote ? (
          <>
            <span className="text-purple-400 font-black text-lg">
              ≈ {Number(formattedQuote).toLocaleString(undefined, { maximumFractionDigits: 4 })} WMONAD
            </span>
            <span className="text-[10px] text-gray-500 font-bold mt-1 uppercase tracking-widest">
              Estimation
            </span>
          </>
        ) : (
          <div className="flex items-center space-x-1 animate-pulse mb-1">
            <span className="text-gray-400 text-sm font-semibold italic">Pending...</span>
          </div>
        )}
      </div>
    </div>
  );
}
