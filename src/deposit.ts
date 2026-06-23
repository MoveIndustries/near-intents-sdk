import { type QuoteResponse } from "@defuse-protocol/one-click-sdk-typescript";
import { resolveOrigin, family, type OriginKey, type StableKey } from "./registry.js";

const pad32 = (hex: string) => hex.replace(/^0x/, "").toLowerCase().padStart(64, "0");

export type EvmDepositTx = { family: "evm"; to: string; value: "0x0"; data: string };
export type TronDepositTx = { family: "tron"; contractAddress: string; function: "transfer(address,uint256)"; parameter: [string, string] };
export type DepositTx = EvmDepositTx | TronDepositTx;

/** Unsigned transfer of the quote's `amountIn` to its `depositAddress`. The caller signs and broadcasts. */
export function prepareDepositTx(origin: OriginKey, asset: StableKey, quote: QuoteResponse): DepositTx {
  const { tokenAddress } = resolveOrigin(origin, asset);
  const { depositAddress, amountIn } = quote.quote;
  if (!depositAddress) throw new Error("quote has no depositAddress (dry run?)");
  if (!tokenAddress) throw new Error(`no verified L1 token address for ${origin}/${asset} (see tasks.md precondition)`);
  if (family(origin) === "tron") {
    return { family: "tron", contractAddress: tokenAddress, function: "transfer(address,uint256)", parameter: [depositAddress, amountIn] };
  }
  return { family: "evm", to: tokenAddress, value: "0x0", data: "0xa9059cbb" + pad32(depositAddress) + pad32(BigInt(amountIn).toString(16)) };
}
