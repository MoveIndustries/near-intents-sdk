import { OneClickService, OpenAPI, QuoteRequest, type QuoteResponse } from "@defuse-protocol/one-click-sdk-typescript";
import { resolveOrigin, resolveDest, normalizeRecipient, type OriginKey, type StableKey, type DestKey } from "./registry.js";

export type QuoteDepositParams = {
  originChain: OriginKey;
  originAsset: StableKey;
  destinationAsset: DestKey;
  amount: string; // smallest unit of the origin asset
  recipient: string; // Movement address
  refundTo: string; // origin-chain address
  slippageTolerance?: number; // basis points, defaults to 100 (1%)
  minAmountOut: string; // smallest unit of the destination asset; reject the quote if its guaranteed output falls below this floor. Pass "0" to explicitly opt out.
  deadline?: string; // ISO; defaults to now + 10 min
  dry?: boolean;
};

// baseUrl points the SDK at a server-side proxy that injects the JWT, so the token
// never ships to the browser; omit it to call 1Click directly.
export function configure(opts: { jwt?: string | (() => Promise<string>); baseUrl?: string }): void {
  OpenAPI.TOKEN = opts.jwt;
  if (opts.baseUrl) OpenAPI.BASE = opts.baseUrl;
}

export async function quoteDeposit(p: QuoteDepositParams): Promise<QuoteResponse> {
  const origin = resolveOrigin(p.originChain, p.originAsset);
  const dest = resolveDest(p.destinationAsset);
  if (!/^[0-9]+$/.test(p.amount) || BigInt(p.amount) <= 0n) throw new Error(`amount must be a positive integer string: ${p.amount}`);
  const deadline = p.deadline ?? new Date(Date.now() + 600_000).toISOString();
  if (Date.parse(deadline) <= Date.now()) throw new Error(`deadline is in the past: ${deadline}`);
  if (!/^[0-9]+$/.test(p.minAmountOut)) {
    throw new Error(`minAmountOut must be a non-negative integer string ("0" opts out of the floor): ${p.minAmountOut}`);
  }
  const res = await OneClickService.getQuote({
    dry: p.dry ?? false,
    swapType: QuoteRequest.swapType.EXACT_INPUT,
    slippageTolerance: p.slippageTolerance ?? 100,
    originAsset: origin.assetId,
    destinationAsset: dest.assetId,
    amount: p.amount,
    depositType: QuoteRequest.depositType.ORIGIN_CHAIN,
    recipient: normalizeRecipient(p.recipient),
    recipientType: QuoteRequest.recipientType.DESTINATION_CHAIN,
    refundTo: p.refundTo,
    refundType: QuoteRequest.refundType.ORIGIN_CHAIN,
    deadline,
  });
  // Guard against a poorly-priced quote: compare the caller's floor against the quote's
  // guaranteed output (minAmountOut after slippage), not the expected amountOut, so the check
  // holds even in the worst-case execution the quote permits. A floor of 0 opts out.
  const floor = BigInt(p.minAmountOut);
  if (floor > 0n && BigInt(res.quote.minAmountOut) < floor) {
    throw new Error(`quote below floor: guaranteed minAmountOut ${res.quote.minAmountOut} < minAmountOut ${p.minAmountOut}`);
  }
  return res;
}
