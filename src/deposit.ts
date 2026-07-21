import { type QuoteResponse } from "@defuse-protocol/one-click-sdk-typescript";
import { resolveOrigin, family, type OriginKey, type StableKey } from "./registry.js";

const pad32 = (hex: string) => hex.replace(/^0x/, "").toLowerCase().padStart(64, "0");

export type EvmDepositTx = { family: "evm"; to: string; value: "0x0"; data: string };
export type TronDepositTx = { family: "tron"; contractAddress: string; function: "transfer(address,uint256)"; parameter: [string, string] };
/** Unsigned NEP-141 `ft_transfer` call. `deposit` is the mandatory 1-yoctoNEAR security deposit. */
export type NearDepositTx = { family: "near"; receiverId: string; methodName: "ft_transfer"; args: { receiver_id: string; amount: string }; gas: string; deposit: "1" };
export type DepositTx = EvmDepositTx | TronDepositTx | NearDepositTx;

/** 30 Tgas — generous for a plain `ft_transfer`, which calls no other contract. */
const NEAR_FT_TRANSFER_GAS = "30000000000000";

/** Unsigned transfer of the quote's `amountIn` to its `depositAddress`. The caller signs and broadcasts. */
export function prepareDepositTx(origin: OriginKey, originAsset: StableKey, quote: QuoteResponse): DepositTx {
  const { tokenAddress } = resolveOrigin(origin, originAsset);
  const { depositAddress, amountIn } = quote.quote;
  if (!depositAddress) throw new Error("quote has no depositAddress (dry run?)");
  if (!tokenAddress) throw new Error(`no verified L1 token address for ${origin}/${originAsset} (see tasks.md precondition)`);
  const fam = family(origin);
  if (fam === "tron") {
    return { family: "tron", contractAddress: tokenAddress, function: "transfer(address,uint256)", parameter: [depositAddress, amountIn] };
  }
  if (fam === "near") {
    return { family: "near", receiverId: tokenAddress, methodName: "ft_transfer", args: { receiver_id: depositAddress, amount: amountIn }, gas: NEAR_FT_TRANSFER_GAS, deposit: "1" };
  }
  return { family: "evm", to: tokenAddress, value: "0x0", data: "0xa9059cbb" + pad32(depositAddress) + pad32(BigInt(amountIn).toString(16)) };
}
