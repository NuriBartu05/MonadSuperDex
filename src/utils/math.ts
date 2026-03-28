import { parseUnits, formatUnits } from "viem";

/**
 * Calculates a 1% slippage bound.
 * Returns the minimum amount out allowed: `amountOut * 99 / 100`
 * 
 * @param amountOut The estimated amount out from QuoterV2
 * @returns The minimum amount out acceptable (amountOutMinimum)
 */
export function calculateSlippageOnePercent(amountOut: bigint): bigint {
  return (amountOut * 99n) / 100n;
}

/**
 * Converts a human-readable string (e.g., "1.5") to a BigInt (e.g., 1500000) using proper decimals.
 * 
 * @param value The human-readable string input
 * @param decimals The token decimals
 * @returns BigInt representation
 */
export function toBigInt(value: string, decimals: number): bigint {
  return parseUnits(value, decimals);
}

/**
 * Converts a BigInt representation (e.g., 1500000) to a human-readable string (e.g., "1.5").
 * 
 * @param value The token amount as BigInt
 * @param decimals The token decimals
 * @returns Human-readable string representation
 */
export function toHumanReadable(value: bigint, decimals: number): string {
  return formatUnits(value, decimals);
}
