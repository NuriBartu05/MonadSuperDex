"use client";

import React from "react";
import { formatUnits } from "viem";
import { WhitelistToken } from "../../config/whitelist";

interface TokenRowProps {
  token: WhitelistToken;
  balance: bigint;
  quoteAmountOut: bigint;
}

export function TokenRow({ token, balance, quoteAmountOut }: TokenRowProps) {
  // Format based on dynamic token decimals from configuration
  const formattedBalance = formatUnits(balance, token.decimals);
  
  // WMONAD strictly enforces 18 decimals globally
  const formattedQuote = formatUnits(quoteAmountOut, 18);
  const hasQuote = quoteAmountOut > 0n;

  return (
    <div className="flex items-center justify-between p-4 bg-slate-800 rounded-xl border border-slate-700 hover:border-slate-600 transition-colors">
      <div className="flex flex-col">
        <span className="font-bold text-white text-lg">{token.symbol}</span>
        <span className="text-sm text-slate-400 font-medium">
          Balance: {Number(formattedBalance).toLocaleString(undefined, { maximumFractionDigits: 4 })}
        </span>
      </div>
      
      <div className="flex flex-col items-end text-right">
        {hasQuote ? (
          <>
            <span className="text-emerald-400 font-bold text-lg">
              ≈ {Number(formattedQuote).toLocaleString(undefined, { maximumFractionDigits: 4 })} WMONAD
            </span>
            <span className="text-xs text-slate-500">Estimated Output</span>
          </>
        ) : (
          <span className="text-slate-500 text-sm font-medium italic">Pending Quote...</span>
        )}
      </div>
    </div>
  );
}
