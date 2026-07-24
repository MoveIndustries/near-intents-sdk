import { type QuoteResponse } from "@defuse-protocol/one-click-sdk-typescript";
import { resolveOrigin, family, type OriginKey, type StableKey } from "./registry.js";

const pad32 = (hex: string) => hex.replace(/^0x/, "").toLowerCase().padStart(64, "0");

export type EvmDepositTx = { family: "evm"; to: string; value: "0x0"; data: string };
export type TronDepositTx = { family: "tron"; contractAddress: string; function: "transfer(address,uint256)"; parameter: [string, string] };
/** Unsigned NEP-141 `ft_transfer` call. `deposit` is the mandatory 1-yoctoNEAR security deposit. */
export type NearDepositTx = { family: "near"; receiverId: string; methodName: "ft_transfer"; args: { receiver_id: string; amount: string }; gas: string; deposit: "1" };
/**
 * Declarative SPL transfer. `owner` is the deposit account 1Click returned; the caller derives its
 * associated token account for `splMint` and moves `amount` from its own ATA (e.g. @solana/spl-token).
 */
export type SolanaDepositTx = { family: "solana"; splMint: string; owner: string; amount: string };
/** Unsigned Aptos fungible-asset transfer entry-function call. `functionArguments` is [metadataObject, recipient, amount]. */
export type AptosDepositTx = { family: "aptos"; function: "0x1::primary_fungible_store::transfer"; typeArguments: string[]; functionArguments: [string, string, string] };
export type DepositTx = EvmDepositTx | TronDepositTx | NearDepositTx | SolanaDepositTx | AptosDepositTx;

/** 30 Tgas — generous for a plain `ft_transfer`, which calls no other contract. */
const NEAR_FT_TRANSFER_GAS = "30000000000000";

/** Unsigned transfer of the quote's `amountIn` to its `depositAddress`. The caller signs and broadcasts. */
export function prepareDepositTx(origin: OriginKey, originAsset: StableKey, quote: QuoteResponse): DepositTx {
  const { tokenAddress } = resolveOrigin(origin, originAsset);
  const { depositAddress, amountIn } = quote.quote;
  if (!depositAddress) throw new Error("quote has no depositAddress (dry run?)");
  if (!tokenAddress) throw new Error(`no verified L1 token address for ${origin}/${originAsset} (see tasks.md precondition)`);
  if (!/^[1-9][0-9]*$/.test(amountIn)) throw new Error(`quote amountIn is not a positive integer: ${amountIn}`);
  const fam = family(origin);
  if (fam === "tron") {
    return { family: "tron", contractAddress: tokenAddress, function: "transfer(address,uint256)", parameter: [depositAddress, amountIn] };
  }
  if (fam === "near") {
    return { family: "near", receiverId: tokenAddress, methodName: "ft_transfer", args: { receiver_id: depositAddress, amount: amountIn }, gas: NEAR_FT_TRANSFER_GAS, deposit: "1" };
  }
  if (fam === "solana") {
    return { family: "solana", splMint: tokenAddress, owner: depositAddress, amount: amountIn };
  }
  if (fam === "aptos") {
    return { family: "aptos", function: "0x1::primary_fungible_store::transfer", typeArguments: ["0x1::fungible_asset::Metadata"], functionArguments: [tokenAddress, depositAddress, amountIn] };
  }
  if (!/^0x[0-9a-fA-F]{40}$/.test(depositAddress)) throw new Error(`evm depositAddress is not a 20-byte hex address: ${depositAddress}`);
  return { family: "evm", to: tokenAddress, value: "0x0", data: "0xa9059cbb" + pad32(depositAddress) + pad32(BigInt(amountIn).toString(16)) };
}
