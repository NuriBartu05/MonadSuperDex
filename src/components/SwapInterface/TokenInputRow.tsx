"use client";

import React, { useState } from "react";
import { formatUnits } from "viem";
import { CustomTokenSelect, ExtendedToken } from "./CustomTokenSelect";

export interface RowData {
  id: string;
  tokenAddress: string;
  amount: string;
}

interface TokenInputRowProps {
  row: RowData;
  sortedTokens: ExtendedToken[]; // Inherently presorted global bounds derived from EVM states
  onUpdate: (id: string, field: keyof RowData, value: string) => void;
  onRemove: (id: string) => void;
  canRemove: boolean;
}

export function TokenInputRow({ row, sortedTokens, onUpdate, onRemove, canRemove }: TokenInputRowProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const selectedToken = sortedTokens.find(
    (t) => t.address.toLowerCase() === row.tokenAddress.toLowerCase()
  );
  
  const displayBalance = selectedToken ? selectedToken.balanceFormatted : "0.00";

  const handlePercentage = (percentage: number) => {
    if (!selectedToken || selectedToken.balanceRaw === 0n) return;
    const fraction = (selectedToken.balanceRaw * BigInt(Math.floor(percentage * 100))) / 10000n;
    const exactString = formatUnits(fraction, selectedToken.decimals);
    onUpdate(row.id, "amount", exactString);
  };

  const handleToggle = () => setIsDropdownOpen(!isDropdownOpen);

  return (
    <div className="relative flex flex-col bg-gray-900/60 p-3 sm:p-4 rounded-2xl border border-gray-700/60 shadow-inner group hover:border-gray-600 focus-within:border-indigo-500/50 transition-all duration-200">
      
      {canRemove && (
        <button 
          onClick={() => onRemove(row.id)}
          className="absolute -right-2 -top-2 w-6 h-6 flex items-center justify-center bg-gray-800 border border-gray-700 text-gray-400 hover:text-white hover:bg-rose-500/80 hover:border-rose-500 hover:shadow-[0_0_15px_rgba(244,63,94,0.4)] transition-all rounded-full z-10 opacity-0 group-hover:opacity-100"
          title="Remove token"
        >
          <span className="mb-[2px] font-bold">&times;</span>
        </button>
      )}

      <div className="flex items-center justify-between w-full gap-2 sm:gap-4">
        <input 
          type="number"
          placeholder="0.0"
          value={row.amount}
          onChange={(e) => onUpdate(row.id, "amount", e.target.value)}
          className="w-full bg-transparent text-2xl sm:text-3xl font-semibold text-white placeholder-gray-700 outline-none appearance-none font-sans"
        />
        
        <CustomTokenSelect 
          tokens={sortedTokens}
          selectedTokenAddress={row.tokenAddress}
          onSelect={(addr) => onUpdate(row.id, "tokenAddress", addr)}
          isOpen={isDropdownOpen}
          onToggle={handleToggle}
        />
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className="text-xs sm:text-sm font-medium text-gray-500 flex gap-1">
          Balance: <span className="text-gray-300 font-semibold">{displayBalance}</span>
        </div>

        <div className="flex items-center space-x-1 sm:space-x-2">
          {[25, 50, 75, 100].map(pct => (
            <button 
              key={pct}
              onClick={() => handlePercentage(pct)}
              className="text-[10px] font-bold px-2 py-1 bg-gray-800 text-gray-400 rounded-md hover:bg-gray-700 hover:text-white border border-transparent hover:border-gray-600 transition-all shadow-sm active:scale-95"
            >
              {pct === 100 ? "MAX" : `${pct}%`}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
