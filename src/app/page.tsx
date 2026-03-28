import React from "react";
import { Navbar } from "../components/layout/Navbar";
import { SwapInterface } from "../components/SwapInterface";

export default function Home() {
  return (
    <main className="w-full min-h-screen bg-gradient-to-b from-gray-950 to-black flex flex-col overflow-hidden">
      {/* Dedicated Global Navbar Component Integration */}
      <Navbar />

      {/* Centered App Orchestrator occupying the remaining spatial height dynamically */}
      <div className="relative z-10 flex-grow w-full px-4 py-10 flex items-center justify-center">
        <SwapInterface />
      </div>
    </main>
  );
}
