import { useWriteContract, useAccount } from "wagmi";
import { encodeFunctionData } from "viem";
import { SWAP_ROUTER_02_ADDRESS, WMONAD_ADDRESS } from "../config/constants";

export interface BatchSwapInput {
  tokenAddress: `0x${string}`;
  amountIn: bigint;
  amountOutQuote: bigint;
  feeTier: number;
}

// Strictly compliant SwapRouter02 JSON ABI enforcing accurate signature types bypassing abitype string parser
const swapRouter02Abi = [
  {
    inputs: [{ internalType: "bytes[]", name: "data", type: "bytes[]" }],
    name: "multicall",
    outputs: [{ internalType: "bytes[]", name: "results", type: "bytes[]" }],
    stateMutability: "payable",
    type: "function"
  },
  {
    inputs: [
      {
        components: [
          { internalType: "address", name: "tokenIn", type: "address" },
          { internalType: "address", name: "tokenOut", type: "address" },
          { internalType: "uint24", name: "fee", type: "uint24" },
          { internalType: "address", name: "recipient", type: "address" },
          { internalType: "uint256", name: "amountIn", type: "uint256" },
          { internalType: "uint256", name: "amountOutMinimum", type: "uint256" },
          { internalType: "uint160", name: "sqrtPriceLimitX96", type: "uint160" }
        ],
        internalType: "struct IV3SwapRouter.ExactInputSingleParams",
        name: "params",
        type: "tuple"
      }
    ],
    name: "exactInputSingle",
    outputs: [{ internalType: "uint256", name: "amountOut", type: "uint256" }],
    stateMutability: "payable",
    type: "function"
  },
  {
    inputs: [
      { internalType: "uint256", name: "amountMinimum", type: "uint256" },
      { internalType: "address", name: "recipient", type: "address" }
    ],
    name: "unwrapWETH9",
    outputs: [],
    stateMutability: "payable",
    type: "function"
  }
] as const;

export function useBatchSwap() {
  const { address } = useAccount();
  const { writeContractAsync, isPending } = useWriteContract();

  const executeBatchSwap = async (inputs: BatchSwapInput[]) => {
    if (!address || inputs.length === 0) return false;

    try {
      const multicallData: `0x${string}`[] = [];
      let totalAmountOutMinimum = 0n;

      for (const input of inputs) {
        // Enforce exact 1% slippage strictly using pure BigInt arithmetic avoiding 0 dropouts
        const amountOutMinimum = (input.amountOutQuote * 99n) / 100n;
        totalAmountOutMinimum += amountOutMinimum;

        const swapData = encodeFunctionData({
          abi: swapRouter02Abi,
          functionName: "exactInputSingle",
          args: [
            {
              tokenIn: input.tokenAddress,
              tokenOut: WMONAD_ADDRESS as `0x${string}`,
              fee: input.feeTier,
              // We target explicit Router literal to lock execution buffers natively!
              recipient: SWAP_ROUTER_02_ADDRESS as `0x${string}`, 
              amountIn: input.amountIn,
              amountOutMinimum: amountOutMinimum,
              sqrtPriceLimitX96: 0n,
            },
          ],
        });
        
        multicallData.push(swapData);
      }

      // Safe Native unwrapping targeting the user's exact wallet address resolving WMONAD -> MONAD cleanly
      const unwrapData = encodeFunctionData({
        abi: swapRouter02Abi,
        functionName: "unwrapWETH9",
        args: [
          totalAmountOutMinimum, // Safeguarded aggregate minimum output across all legs securely chained
          address,               // Target User EOA seamlessly
        ],
      });

      multicallData.push(unwrapData);

      const txHash = await writeContractAsync({
        address: SWAP_ROUTER_02_ADDRESS as `0x${string}`,
        abi: swapRouter02Abi,
        functionName: "multicall",
        args: [multicallData],
      });

      console.log("Batch Swap Executed cleanly. TxHash:", txHash);
      return true;

    } catch (error) {
      console.error("Batch multicall EVM revert or failure:", error);
      return false;
    }
  };

  return { executeBatchSwap, isSwapping: isPending };
}
