<div align="center">
  <h1>Monad Batch Swap 🦇</h1>
  <p><strong>The next-generation multi-token DEX aggregator on the Monad Network.</strong></p>

  <!-- Badges -->
  <p>
    <img src="https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white" alt="Next.js" />
    <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
    <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" />
    <img src="https://img.shields.io/badge/Wagmi-000000?style=for-the-badge&logo=wechat&logoColor=white" alt="Wagmi" />
    <img src="https://img.shields.io/badge/Monad-8A2BE2?style=for-the-badge&logo=monero&logoColor=white" alt="Monad" />
  </p>
</div>

<br/>

## 🎯 The Problem & Our Solution

**The Problem:** Fragmented wallets. Swapping multiple token balances into one target token manually requires multiple approvals, multiple separate transactions, and incurs compounded, wasted gas fees. This tedious UX is a massive bottleneck for heavy DeFi users and airdrop farmers.

**The Solution:** A highly optimized batching interface. Users can seamlessly select up to 5 individual tokens mapped to precise percentage allocations, and our engine will execute a **single multicall transaction** to swap them all into their desired target asset. Save time, minimize manual friction, and reduce gas footprint instantly!

## 🧠 Under the Hood

> **"We do NOT use bloated off-chain SDKs. Monad Batch Swap interacts directly with Uniswap V3's core smart contracts (QuoterV2 and SwapRouter02) entirely on-chain using raw JSON ABIs, Viem, and Wagmi."**

- ⚡ **Smart Auto-Fee Discovery**: We built a dynamic, intelligent quote engine! Rather than hardcoding static fallback fees and risking reverted transactions on low-liquidity pairs, our dApp concurrently queries multiple Uniswap V3 fee tiers (`100`, `500`, `3000`, `10000`) under the hood to locate the absolute deepest liquidity and the highest mathematically optimal return rate before the swap is ever submitted.
- 🪙 **Native Coin Multi-Routing**: The protocol seamlessly handles underlying `Native MON` vs `ERC-20` logic entirely automatically. No confusing WMON conversions for the user—our interface directly injects pure algorithmic `msg.value` offsets while dynamically mimicking wrapped Web3 interfaces safely inside the router loop!

## 🛠️ Tech Stack

* **Frontend:** Next.js (App Router), React, Tailwind CSS v4 (with native Light/Dark mode).
* **Web3 Integration:** Wagmi, Viem, RainbowKit.
* **Smart Contracts Interacted:** Uniswap V3 (Router & Quoter).
* **Target Network:** Monad Mainnet & Monad Testnet.

## 🚀 Getting Started

To spin up the aggregator locally on your own machine:

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/monad-batch-swap.git
   cd monad-batch-swap
   ```

2. **Install dependencies:**  
   *(Using the legacy flag ensures identical resolution of deep Web3 peer dependencies to prevent package clashes)*
   ```bash
   npm install --legacy-peer-deps
   ```

3. **Configure Environment:**  
   Ensure you have configured your environment correctly by creating a `.env` or `.env.local` file with your specific `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`.

4. **Run the Development Server:**
   ```bash
   npm run dev
   ```

Launch your browser to `http://localhost:3000` to interact with the protocol natively!

## ✨ UI/UX Highlights

- 🌑 **Premium Aesthetics**: Features a highly polished, responsive dark-mode glassmorphism UI with subtle mesh gradient glows crafted meticulously with Tailwind CSS v4.
- 🧮 **100% BigInt Math Precision**: Floating-point loss is completely non-existent. We utilize pure EVM-grade `bigint` memory tracking across multi-route batching states guaranteeing absolute mathematical integrity.
- 🏎️ **Reactive State Handling**: Real-time approvals, allowance polling loops, and multi-token balance injections using fully synchronized Wagmi read handlers!
