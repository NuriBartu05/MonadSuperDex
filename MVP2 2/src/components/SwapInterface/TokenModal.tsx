"use client";

import { useState } from "react";
import { X, Search } from "lucide-react";
import { WhitelistToken } from "../../config/whitelist";

export interface TokenWithBalance extends WhitelistToken {
  balanceFormatted: string;
  balanceRaw: bigint;
}

interface TokenModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (token: WhitelistToken) => void;
  tokens: TokenWithBalance[];
}

export function TokenModal({ isOpen, onClose, onSelect, tokens }: TokenModalProps) {
  const [search, setSearch] = useState("");

  if (!isOpen) return null;

  const filteredTokens = tokens.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.symbol.toLowerCase().includes(search.toLowerCase()) ||
    t.address.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-[#131A2A] border border-[#1B2236] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between p-4 border-b border-[#1B2236]">
          <h2 className="text-lg font-semibold text-white">Select a token</h2>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-4">
          <div className="relative flex items-center bg-[#0D111C] border border-[#1B2236] rounded-xl px-3 py-2 text-white outline-none focus-within:border-[#FB118E]/50 transition-colors">
            <Search size={18} className="text-gray-400 mr-2" />
            <input
              type="text"
              placeholder="Search name or paste address"
              className="bg-transparent w-full outline-none placeholder:text-gray-500 text-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto min-h-[300px]">
          {filteredTokens.length === 0 ? (
            <div className="text-center text-gray-500 py-8">No tokens found.</div>
          ) : (
            filteredTokens.map((token) => (
              <button
                key={token.address}
                onClick={() => onSelect(token)}
                className="w-full flex items-center justify-between p-4 hover:bg-[#1B2236]/50 transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={token.logoUrl}
                    alt={token.symbol}
                    className="w-8 h-8 rounded-full bg-[#0D111C]"
                  />
                  <div>
                    <div className="text-white font-medium">{token.symbol}</div>
                    <div className="text-xs text-gray-400">{token.name}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-white font-medium">
                    {Number(token.balanceFormatted).toLocaleString(undefined, { maximumFractionDigits: 6 })}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
