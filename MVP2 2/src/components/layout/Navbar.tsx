"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";

export function Navbar() {
  return (
    <nav className="w-full flex items-center justify-between p-4 bg-transparent border-b border-[#1B2236]/30">
      <div className="text-xl font-bold text-white tracking-wide">
        Monad Batch Swap
      </div>
      <ConnectButton />
    </nav>
  );
}
