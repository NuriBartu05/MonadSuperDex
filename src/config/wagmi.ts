import { http, createConfig } from "wagmi";
import { defineChain } from "viem";

// Definitively configuring Monad Mainnet strictly targeting standard routing RPC
export const monadMainnet = defineChain({
  id: 143, // The strictly declared user network Chain ID
  name: "Monad Mainnet",
  nativeCurrency: {
    decimals: 18,
    name: "Monad",
    symbol: "MON",
  },
  rpcUrls: {
    default: {
      http: ["https://rpc-mainnet.monad.xyz"],
    },
    public: {
      http: ["https://rpc-mainnet.monad.xyz"],
    },
  },
  blockExplorers: {
    default: { name: "Monad Explorer", url: "https://explorer.monad.xyz" },
  },
  // Multicall3 purposely removed to prevent silent batch RPC failures
});

export const config = createConfig({
  chains: [monadMainnet],
  // Globally force Wagmi to use individual eth_call executions natively
  batch: { multicall: false },
  transports: {
    // Explicitly reject HTTP-level request batching at the RPC transport layer safely
    [monadMainnet.id]: http('https://rpc.monad.xyz', { batch: false }),
  },
});
