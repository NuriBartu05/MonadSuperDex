"use client";

import React from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";

export function Navbar() {
  return (
    <nav className="w-full flex items-center justify-between p-4 px-6 md:px-10 bg-gray-950/80 backdrop-blur-xl border-b border-white/5 sticky top-0 z-50">
      <div className="flex items-center space-x-3 cursor-default">
        {/* Sleek Gradient Monad Logomark Placeholder */}
        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-500 shadow-[0_0_20px_-2px_rgba(168,85,247,0.4)] flex items-center justify-center border border-white/10">
          <span className="text-white font-black text-xl leading-none tracking-tighter">M</span>
        </div>
        <span className="text-xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-gray-100 to-gray-400 tracking-tight">
          Monad Batch Swap
        </span>
      </div>
      
      <div>
        <ConnectButton 
          chainStatus={{ smallScreen: "none", largeScreen: "icon" }} 
          showBalance={false} 
        />
      </div>
    </nav>
  );
}
