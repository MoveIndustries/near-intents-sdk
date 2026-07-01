import { describe, it, expect, vi, beforeEach } from "vitest";
import { OneClickService, TokenResponse } from "@defuse-protocol/one-click-sdk-typescript";
import { listTokens } from "../src/tokens.js";
import { ORIGINS, MOVEMENT } from "../src/registry.js";

const tok = (assetId: string, over: Partial<TokenResponse> = {}): TokenResponse => ({
  assetId,
  symbol: "USDC",
  decimals: 6,
  blockchain: TokenResponse.blockchain.ETH,
  price: 1,
  priceUpdatedAt: "2026-01-01T00:00:00Z",
  ...over,
});

describe("listTokens", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("keeps only registry assets and tags each with its route-key", async () => {
    vi.spyOn(OneClickService, "getTokens").mockResolvedValue([
      tok(ORIGINS.ethereum.usdc.assetId, { blockchain: TokenResponse.blockchain.ETH }),
      tok(MOVEMENT.usdcx.assetId, { symbol: "USDCx", blockchain: TokenResponse.blockchain.MOVEMENT }),
      tok("nep141:some-unsupported-asset.near", { symbol: "FOO" }),
    ] as any);

    const out = await listTokens();
    expect(out).toHaveLength(2);

    const src = out.find((t) => t.assetId === ORIGINS.ethereum.usdc.assetId)!;
    expect(src).toMatchObject({ originChain: "ethereum", originAsset: "usdc", chain: "eth" });
    expect(src.destinationAsset).toBeUndefined();
    expect(src).toMatchObject({ price: 1, priceUpdatedAt: "2026-01-01T00:00:00Z" });

    const dst = out.find((t) => t.assetId === MOVEMENT.usdcx.assetId)!;
    expect(dst).toMatchObject({ destinationAsset: "usdcx", chain: "movement" });
    expect(dst.originChain).toBeUndefined();
  });
});

describe.skipIf(!process.env.LIVE)("live listTokens (no JWT)", () => {
  it("returns every supported route from /v0/tokens", { retry: 2, timeout: 30_000 }, async () => {
    const out = await listTokens();
    expect(out.some((t) => t.originChain === "ethereum" && t.originAsset === "usdc")).toBe(true);
    expect(out.some((t) => t.destinationAsset === "usdcx")).toBe(true);
  });
});
