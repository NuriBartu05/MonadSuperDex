"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";

export function Navbar() {
  return (
    <nav className="w-full flex items-center justify-between p-4 bg-transparent border-b border-slate-200 dark:border-[#1B2236]/30 transition-colors duration-300">
      <div className="text-xl font-bold text-slate-900 dark:text-white tracking-wide">
        Monad Super Dex
      </div>
      <div className="flex items-center gap-4">
        <ConnectButton />
      </div>
    </nav>
  );
}
