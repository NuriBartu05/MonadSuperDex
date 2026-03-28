# Monad Super Dex

### Production-ready multi-token swap orchestrator natively optimized for Monad Testnet execution.

## Core Features
1. **Dynamic Token Bounding**: Algorithmically evaluates non-zero Whitelist token boundaries strictly enforcing `N >= 2` and a `Math.min(N, 5)` routing queue limit.
2. **V3 SwapRouter02 Integration**: Utilizes standard Uniswap V3 core periphery architecture entirely bypassing Permit2 external requirements through explicit `ADDRESS_THIS` state routing constraints.
3. **Sequential EOA Approval Queue**: Intelligently verifies allowance states natively, handling multi-prompt sequencer transactions securely under the hood.
4. **Anti-Stale Quote Refresh Mechanism**: (Phase 3 Orchestration) Re-fetches V3 Quoter estimates precisely *between* the `Approve` chain resolutions and the `Execute` finality, guaranteeing a strict 1% mathematical slippage calculation against the absolute latest EVM block.

## Tech Stack
- **Framework**: Next.js (App Router)
- **Styling**: Tailwind CSS
- **Web3 Integrations**: wagmi v2 + viem
- **Smart Contract Interfacing**: Extrapolated `@uniswap/v3-sdk` SwapRouter02 / QuoterV2 Native ABIs.

## Setup & Installation Instructions

**1. Clone the repository and install dependencies:**
```bash
git clone <repository-url>
cd <project-directory>
npm install
```

**2. Run the Development Server:**
```bash
npm run dev
```

**3. Test Interface:**
Open [http://localhost:3000](http://localhost:3000) inside your Web3-enabled Browser (e.g., MetaMask, Rabby). Ensure you are connected to the **Monad Testnet (Chain ID: 10143)**.

## Architecture Highlights: Smart Routing & EOA Flow
The Uniswap Universal Router relies fundamentally on `Permit2` signatures which inherently demand multi-layered contract authorizations that overcomplicate secure EOA prototyping and deployment limits. 

To surgically mitigate this without sacrificing UX and batch aggregation:
* We wrap routing payloads iteratively through `SwapRouter02`'s native `multicall(bytes[])` aggregator.
* The explicit `exactInputSingle` parameters map their `recipient` dynamically to `address(2)` (acting as `ADDRESS_THIS` to the Router). This elegantly caches mathematically calculated `WMONAD` yields safely under the protocol's unified execution custody mid-transaction without dropping bounds to the user yet.
* Appended sequentially as the grand-finale multicall parameter is an `unwrapWETH9(0, address(user))` command. This securely evaluates, unwraps, and sweeps all aggregated `WMONAD` yields directly back to the executing EOA user, comprehensively achieving highly secured, single-tx batch execution cleanly absent of Permit2 architecture overhead.
