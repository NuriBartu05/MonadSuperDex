import { encodeFunctionData, Address, Hex } from "viem";

/**
 * Router recipient constant. 
 * SwapRouter02 uses `address(2)` internally to represent `ADDRESS_THIS` 
 * (to keep swapped funds in the router before unwrapping).
 */
export const ROUTER_AS_RECIPIENT = "0x0000000000000000000000000000000000000002" as Address;

// Minimal ABI for SwapRouter02 strictly needed for exactInputSingle, unwrapWETH9, and multicall
const swapRouter02ABI = [
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
  },
  {
    inputs: [{ internalType: "bytes[]", name: "data", type: "bytes[]" }],
    name: "multicall",
    outputs: [{ internalType: "bytes[]", name: "results", type: "bytes[]" }],
    stateMutability: "payable",
    type: "function"
  }
] as const;

/**
 * Encodes the calldata for a V3 exactInputSingle swap.
 * CRITICAL: The recipient MUST be set to the router itself to hold the WMONAD before unwrap.
 * 
 * @param tokenIn The address of the input token
 * @param tokenOut The address of the output token (e.g., WMONAD)
 * @param feeTier The pool fee tier
 * @param amountIn Exact input amount
 * @param amountOutMinimum Minimum output amount to prevent slippage
 * @returns Encoded hex calldata
 */
export function encodeExactInputSingle(
  tokenIn: Address,
  tokenOut: Address,
  feeTier: number,
  amountIn: bigint,
  amountOutMinimum: bigint
): Hex {
  return encodeFunctionData({
    abi: swapRouter02ABI,
    functionName: "exactInputSingle",
    args: [
      {
        tokenIn,
        tokenOut,
        fee: feeTier,
        recipient: ROUTER_AS_RECIPIENT, // Router temporarily holds WMONAD
        amountIn,
        amountOutMinimum,
        sqrtPriceLimitX96: 0n // 0 means no price limit
      }
    ]
  });
}

/**
 * Encodes the calldata to unwrap WMONAD into Native MONAD.
 * 
 * @param userAddress The final destination for the Native MONAD
 * @returns Encoded hex calldata
 */
export function encodeUnwrapWETH9(userAddress: Address): Hex {
  return encodeFunctionData({
    abi: swapRouter02ABI,
    functionName: "unwrapWETH9",
    args: [
      0n, // amountMinimum MUST be 0
      userAddress // The final recipient is the EOA
    ]
  });
}

/**
 * Encodes a multicall bundling multiple operations (e.g., exactInputSingle + unwrapWETH9).
 * 
 * @param calldatas Array of hex-encoded calldata strings
 * @returns Single encoded multicall hex calldata
 */
export function encodeMulticall(calldatas: Hex[]): Hex {
  return encodeFunctionData({
    abi: swapRouter02ABI,
    functionName: "multicall",
    args: [calldatas]
  });
}
