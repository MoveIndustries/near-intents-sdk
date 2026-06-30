import { OneClickService } from "@defuse-protocol/one-click-sdk-typescript";
import { ORIGINS, MOVEMENT, type OriginKey, type StableKey, type DestKey } from "./registry.js";

export type SupportedToken = {
  assetId: string;
  symbol: string;
  decimals: number;
  chain: string; // 1Click chain id ('eth' | 'pol' | 'tron' | 'movement')
  contractAddress?: string;
  originChain?: OriginKey;
  originAsset?: StableKey; // originChain + originAsset are set for source tokens
  destinationAsset?: DestKey; // set for Movement destination tokens
};

type RouteTag = { originChain?: OriginKey; originAsset?: StableKey; destinationAsset?: DestKey };

// assetId -> route tag, built once from the registry so listTokens can label each
// live token with the keys quoteDeposit expects, instead of callers translating back.
const ROUTE_BY_ASSET_ID: Map<string, RouteTag> = (() => {
  const m = new Map<string, RouteTag>();
  const origins = ORIGINS as Record<string, Record<string, { assetId: string }>>;
  for (const origin of Object.keys(origins)) {
    for (const asset of Object.keys(origins[origin])) {
      m.set(origins[origin][asset].assetId, { originChain: origin as OriginKey, originAsset: asset as StableKey });
    }
  }
  const dests = MOVEMENT as Record<string, { assetId: string }>;
  for (const dest of Object.keys(dests)) m.set(dests[dest].assetId, { destinationAsset: dest as DestKey });
  return m;
})();

// listTokens — live /v0/tokens, filtered to the routes this SDK supports and each tagged with its
// route-key, so a caller feeds the result straight into quoteDeposit without translating back.
export async function listTokens(): Promise<SupportedToken[]> {
  const tokens = await OneClickService.getTokens();
  const out: SupportedToken[] = [];
  for (const t of tokens) {
    const tag = ROUTE_BY_ASSET_ID.get(t.assetId);
    if (!tag) continue;
    out.push({
      assetId: t.assetId,
      symbol: t.symbol,
      decimals: t.decimals,
      chain: t.blockchain,
      contractAddress: t.contractAddress,
      ...tag,
    });
  }
  return out;
}
