"use client";

import "@rainbow-me/rainbowkit/styles.css";
import * as React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import { RainbowKitProvider, darkTheme, lightTheme } from "@rainbow-me/rainbowkit";
import { ThemeProvider, useTheme } from "next-themes";
import { config } from "../config/wagmi";

const queryClient = new QueryClient();

function RainbowThemeWrapper({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const isLight = mounted && theme === 'light';

  const activeTheme = isLight 
    ? lightTheme({
        accentColor: "#FB118E", // Uniswap active pink state
        accentColorForeground: "white",
        borderRadius: "medium",
        fontStack: "system",
        overlayBlur: "small",
      })
    : darkTheme({
        accentColor: "#FB118E", // Uniswap active pink state
        accentColorForeground: "white",
        borderRadius: "medium",
        fontStack: "system",
        overlayBlur: "small",
      });

  return (
    <RainbowKitProvider theme={activeTheme}>
      {children}
    </RainbowKitProvider>
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark">
      <WagmiProvider config={config}>
        <QueryClientProvider client={queryClient}>
          <RainbowThemeWrapper>
            {children}
          </RainbowThemeWrapper>
        </QueryClientProvider>
      </WagmiProvider>
    </ThemeProvider>
  );
}
