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
  return OneClickService.getQuote({
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
}
