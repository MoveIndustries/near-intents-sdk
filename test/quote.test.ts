import { describe, it, expect, vi, beforeEach } from "vitest";
import { OneClickService, OpenAPI, QuoteRequest } from "@defuse-protocol/one-click-sdk-typescript";
import { configure, quoteDeposit } from "../src/quote.js";
import { MOVEMENT, ORIGINS } from "../src/registry.js";

const base = { origin: "ethereum", asset: "usdc", to: "usdcx", amount: "1000000", recipient: "0x0a1b", refundTo: "0x1111111111111111111111111111111111111111" } as const;

describe("quoteDeposit", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("builds a pinned QuoteRequest and forwards it", async () => {
    const spy = vi.spyOn(OneClickService, "getQuote").mockResolvedValue({} as any);
    await quoteDeposit({ ...base });
    const req = spy.mock.calls[0][0];
    expect(req.destinationAsset).toBe(MOVEMENT.usdcx.assetId);
    expect(req.originAsset).toBe(ORIGINS.ethereum.usdc.assetId);
    expect(req.recipient).toMatch(/^0x[0-9a-f]{64}$/);
    expect(req.swapType).toBe(QuoteRequest.swapType.EXACT_INPUT);
    expect(req.depositType).toBe(QuoteRequest.depositType.ORIGIN_CHAIN);
    expect(req.recipientType).toBe(QuoteRequest.recipientType.DESTINATION_CHAIN);
    expect(req.refundType).toBe(QuoteRequest.refundType.ORIGIN_CHAIN);
    expect(req.slippageTolerance).toBe(100);
    expect(req.dry).toBe(false);
  });

  it("fails closed before any network call", async () => {
    const spy = vi.spyOn(OneClickService, "getQuote").mockResolvedValue({} as any);
    await expect(quoteDeposit({ ...base, amount: "0" })).rejects.toThrow(/amount/);
    await expect(quoteDeposit({ ...base, origin: "base" as any })).rejects.toThrow(/unsupported/);
    await expect(quoteDeposit({ ...base, deadline: "2000-01-01T00:00:00.000Z" })).rejects.toThrow(/past/);
    expect(spy).not.toHaveBeenCalled();
  });
});

describe("configure", () => {
  const defaultBase = OpenAPI.BASE;
  beforeEach(() => { OpenAPI.BASE = defaultBase; OpenAPI.TOKEN = undefined; });

  it("points the SDK at a proxy baseUrl, leaving the token to the proxy", () => {
    configure({ baseUrl: "/api/oneclick" });
    expect(OpenAPI.BASE).toBe("/api/oneclick");
    expect(OpenAPI.TOKEN).toBeUndefined();
  });

  it("keeps the default base url when none is given", () => {
    configure({ jwt: "tok" });
    expect(OpenAPI.BASE).toBe(defaultBase);
    expect(OpenAPI.TOKEN).toBe("tok");
  });
});
