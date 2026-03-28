import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { http } from "wagmi";
import { type Chain } from "viem";

export const monadMainnet = {
  id: 143,
  name: "Monad Mainnet",
  nativeCurrency: {
    decimals: 18,
    name: "Monad",
    symbol: "MON",
  },
  rpcUrls: {
    // Bulduğun çalışan RPC adreslerini ekledik
    default: { http: ["https://rpc.monad.xyz"] },
    public: { http: ["https://rpc.monad.xyz"] },
  },
} as const satisfies Chain;

export const config = getDefaultConfig({
  appName: "Monad DEX",
  projectId: "YOUR_PROJECT_ID",
  chains: [monadMainnet],
  transports: {
    // Motoru bu adrese kilitliyoruz
    [monadMainnet.id]: http("https://rpc.monad.xyz", {
      batch: { multicall: false }, // Hayati kural: Multicall kapalı!
    }),
  },
  ssr: true,
});