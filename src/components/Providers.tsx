"use client";

import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import { RainbowKitProvider, darkTheme } from "@rainbow-me/rainbowkit";
import { config, monadMainnet } from "../config/wagmi";
import "@rainbow-me/rainbowkit/styles.css";

// Global QueryClient instance for React Query caching backing Wagmi
const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        {/* Force explicit routing to Mainnet avoiding red 'Wrong Network' button issues */}
        <RainbowKitProvider theme={darkTheme()} initialChain={monadMainnet}>
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}