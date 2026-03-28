"use client";

import { ChevronDown, X } from "lucide-react";
import { WhitelistToken } from "../../config/whitelist";

interface TokenInputRowProps {
  amount: string;
  onAmountChange: (val: string) => void;
  token: WhitelistToken | null;
  onOpenModal: () => void;
  balanceFormatted: string;
  onPercentageSelect: (percent: number) => void;
  onRemove?: () => void;
  canRemove: boolean;
}

export function TokenInputRow({
  amount,
  onAmountChange,
  token,
  onOpenModal,
  balanceFormatted,
  onPercentageSelect,
  onRemove,
  canRemove,
}: TokenInputRowProps) {
  return (
    <div className="bg-slate-100 dark:bg-[#0D111C] hover:border-slate-300 dark:hover:border-[#1B2236] border border-transparent rounded-2xl p-4 sm:p-5 transition-colors relative group">
      {canRemove && onRemove && (
        <button
          onClick={onRemove}
          className="absolute -right-2 -top-2 bg-slate-200 dark:bg-[#1B2236] text-slate-500 dark:text-gray-400 hover:text-slate-800 dark:hover:text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity z-10 shadow-sm"
        >
          <X size={14} />
        </button>
      )}

      <div className="flex items-center justify-between gap-4">
        <input
          type="number"
          placeholder="0"
          value={amount}
          onChange={(e) => onAmountChange(e.target.value)}
          className="bg-transparent text-4xl sm:text-5xl text-slate-900 dark:text-white outline-none w-full flex-1 appearance-none placeholder:text-slate-400 dark:placeholder:text-gray-600 truncate"
        />

        <button
          onClick={onOpenModal}
          className="flex items-center gap-2 bg-white dark:bg-[#131A2A] hover:bg-slate-50 dark:hover:bg-[#1B2236] border border-slate-200 dark:border-[#1B2236] rounded-full px-3 py-1.5 text-slate-800 dark:text-white font-medium transition-colors whitespace-nowrap shadow-sm"
        >
          {token ? (
            <>
              {token.logoUrl ? (
                <img src={token.logoUrl} alt={token.symbol} className="w-5 h-5 rounded-full object-cover" 
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://cryptologos.cc/logos/monero-xmr-logo.png';
                  }}
                />
              ) : (
                <div className="w-5 h-5 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-[10px] font-bold text-white">
                  {token.symbol[0]}
                </div>
              )}
              <span>{token.symbol}</span>
            </>
          ) : (
            <span>Select token</span>
          )}
          <ChevronDown size={18} className="text-slate-400 dark:text-gray-400" />
        </button>
      </div>

      <div className="flex items-center justify-between mt-4 h-6">
        {token && (
          <div className="text-sm text-slate-500 dark:text-gray-400 font-medium">
            Balance: {balanceFormatted}
          </div>
        )}

        {token && (
          <div className="flex items-center gap-2">
            {[25, 50, 75, 100].map((percent) => (
              <button
                key={percent}
                onClick={() => onPercentageSelect(percent)}
                className="bg-slate-200 dark:bg-[#1B2236] hover:bg-slate-300 dark:hover:bg-[#252E47] text-slate-600 dark:text-gray-400 text-xs font-semibold rounded-lg px-3 py-1.5 transition-colors"
                type="button"
              >
                {percent}%
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
