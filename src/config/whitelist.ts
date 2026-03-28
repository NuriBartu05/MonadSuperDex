import { Address } from "viem";

export interface WhitelistToken {
  name: string;
  symbol: string;
  address: Address;
  decimals: number;
  feeTier: number;
  logoUrl: string;
  isNative?: boolean;
}

export const WHITELIST_TOKENS: WhitelistToken[] = [
  {
    name: 'Monad',
    symbol: 'MON',
    address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
    decimals: 18,
    feeTier: 0,
    logoUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyl0x48Pn_DiUkGHH86-5RIRaa62LE0GzaxQ&s',
    isNative: true
  },
  {
    name: "Wrapped Monad",
    symbol: "WMON",
    address: "0x3bd359c1119da7da1d913d1c4d2b7c461115433a",
    decimals: 18,
    feeTier: 500,
    logoUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTxczNBSzyBXfHg91T4fI3BHSvXQZNmxPBV4w&s",
  },
  {
    name: "USD Coin",
    symbol: "USDC",
    address: "0x754704Bc059F8C67012fEd69BC8A327a5aafb603",
    decimals: 6,
    feeTier: 500,
    logoUrl: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/logo.png",
  },
  {
    name: "Tether USD",
    symbol: "USDT",
    address: "0xe7cd86e13AC4309349F30B3435a9d337750fC82D",
    decimals: 6,
    feeTier: 500,
    logoUrl: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xdAC17F958D2ee523a2206206994597C13D831ec7/logo.png",
  },
  {
    name: "Aqua USD",
    symbol: "aUSD",
    address: "0x00000000eFE302BEAA2b3e6e1b18d08D69a9012a",
    decimals: 6,
    feeTier: 500,
    logoUrl: "https://storage.googleapis.com/socialscan-public-asset/explorer/monad/tokens/AUSD.svg",
  },
  {
    name: "Pixie Dust",
    symbol: "PIXIE",
    address: "0xAD96C3dffCD6374294e2573A7fBBA96097CC8d7c",
    decimals: 18,
    feeTier: 500,
    logoUrl: "https://coin-images.coingecko.com/coins/images/71148/large/dust_200.png?1765996628",
  }
];
