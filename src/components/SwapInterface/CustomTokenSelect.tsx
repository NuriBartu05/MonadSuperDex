"use client";

import React, { useRef, useEffect } from "react";
import { WhitelistToken } from "../../config/whitelist";

export interface ExtendedToken extends WhitelistToken {
  balanceRaw: bigint;
  balanceFormatted: string;
}

interface CustomTokenSelectProps {
  tokens: ExtendedToken[];
  selectedTokenAddress: string;
  onSelect: (address: string) => void;
  isOpen: boolean;
  onToggle: () => void;
}

export function CustomTokenSelect({ tokens, selectedTokenAddress, onSelect, isOpen, onToggle }: CustomTokenSelectProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Close organically when intercepting outer document clicks
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        if (isOpen) onToggle();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onToggle]);

  const selectedToken = tokens.find(t => t.address.toLowerCase() === selectedTokenAddress.toLowerCase());

  return (
    <div className="relative shrink-0" ref={containerRef}>
      {/* Sleek Trigger Element */}
      <button
        onClick={onToggle}
        className="flex items-center space-x-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-gray-500 text-white font-bold py-2 sm:py-3 px-3 sm:px-4 rounded-xl shadow-md transition-all active:scale-95"
      >
        {selectedToken ? (
          <>
            <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-500 shadow-inner flex items-center justify-center border border-white/10 shrink-0">
              <span className="text-[10px] font-black leading-none">{selectedToken.symbol[0]}</span>
            </div>
            <span className="text-base tracking-wide">{selectedToken.symbol}</span>
          </>
        ) : (
          <span className="text-base text-gray-300">Select</span>
        )}
        <span className={`text-gray-400 text-xs ml-1 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}>
          ▼
        </span>
      </button>

      {/* Floating Glassmorphism Array Selector Component */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-gray-900/95 backdrop-blur-2xl border border-gray-700/80 rounded-2xl shadow-2xl z-50 overflow-hidden origin-top-right animate-in fade-in zoom-in-95 duration-100">
          <div className="max-h-64 overflow-y-auto p-1 custom-scrollbar">
            {tokens.map((token) => {
              const isSelected = selectedTokenAddress.toLowerCase() === token.address.toLowerCase();
              return (
                <div
                  key={token.address}
                  onClick={() => {
                    onSelect(token.address);
                    onToggle();
                  }}
                  className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all ${
                    isSelected ? "bg-indigo-500/20 border-indigo-500/30" : "hover:bg-gray-800 border border-transparent"
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 shadow-inner flex items-center justify-center border border-white/10 shrink-0">
                      <span className="text-xs font-black text-white leading-none">{token.symbol[0]}</span>
                    </div>
                    <span className="font-bold text-white text-sm tracking-wide">{token.symbol}</span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-sm font-semibold text-gray-300">{token.balanceFormatted}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
