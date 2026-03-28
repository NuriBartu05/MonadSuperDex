import { Address } from "viem";

export interface WhitelistToken {
  name: string;
  symbol: string;
  address: Address;
  decimals: number;
  feeTier: number; // 3000 = 0.3% standard Uniswap V3 fee
}

/**
 * Strict array of supported ERC-20 tokens for batch swapping.
 * CRITICAL: Native MONAD is intentionally omitted. EOA wallets cannot approve native coins to the router.
 */
export const WHITELIST_TOKENS: WhitelistToken[] = [
  {
    name: "Wrapped MONAD",
    symbol: "WMON",
    address: "0x3bd359c1119da7da1d913d1c4d2b7c461115433a",
    decimals: 18,
    feeTier: 3000,
  },
  {
    name: "USD Coin",
    symbol: "USDC",
    address: "0x754704Bc059F8C67012fEd69BC8A327a5aafb603",
    decimals: 6,
    feeTier: 3000,
  },
  {
    name: "Tether USD",
    symbol: "USDT",
    address: "0xe7cd86e13AC4309349F30B3435a9d337750fC82D",
    decimals: 6,
    feeTier: 3000,
  },
  {
    name: "Wrapped Bitcoin",
    symbol: "WBTC",
    address: "0x0555E30da8f98308EdB960aa94C0Db47230d2B9c",
    decimals: 8,
    feeTier: 3000,
  },
  {
    name: "Wormhole Bridged WETH",
    symbol: "WETH",
    address: "0xEE8c0E9f1BFFb4Eb878d8f15f368A02a35481242",
    decimals: 18,
    feeTier: 3000,
  },
  {
    name: "Wrapped eETH",
    symbol: "weETH",
    address: "0xA3D68b74bF0528fdD07263c60d6488749044914b",
    decimals: 18,
    feeTier: 3000,
  }
];