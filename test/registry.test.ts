import { describe, it, expect } from "vitest";
import { resolveOrigin, resolveDest, normalizeRecipient, MOVEMENT, ORIGINS } from "../src/registry.js";

describe("registry", () => {
  it("resolves known origin/asset pairs", () => {
    expect(resolveOrigin("ethereum", "usdc").assetId).toContain("eth-0xa0b8");
    expect(resolveOrigin("polygon", "usdc").tokenAddress).toBe("0x3c499c542cef5e3811e1192ce70d8cc03d5c3359");
    expect(resolveOrigin("tron", "usdt").tokenAddress).toBe("41a614f803b6fd780986a42c78ec9c7f77e6ded13c");
    expect(resolveOrigin("near", "usdc").tokenAddress).toBe("17208628f84f5d6ad33f0da3bbbeb27ffcb398eac501a31bd6ad2011e36133a1");
    expect(resolveOrigin("near", "usdt").tokenAddress).toBe("usdt.tether-token.near");
  });

  it("resolves the source-chain origins", () => {
    // BSC stablecoins are 18-decimal, unlike the 6-decimal coins on every other chain.
    expect(resolveOrigin("bsc", "usdc").decimals).toBe(18);
    expect(resolveOrigin("bsc", "usdt").decimals).toBe(18);
    expect(resolveOrigin("bsc", "usdt").tokenAddress).toBe("0x55d398326f99059ff775485246999027b3197955");
    expect(resolveOrigin("arbitrum", "usdc").tokenAddress).toBe("0xaf88d065e77c8cc2239327c5edb3a432268e5831");
    expect(resolveOrigin("base", "usdc").tokenAddress).toBe("0x833589fcd6edb6e08f4c7c32d4f71b54bda02913");
    expect(resolveOrigin("solana", "usdc").tokenAddress).toBe("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v");
    expect(resolveOrigin("aptos", "usdt").decimals).toBe(6);
  });

  it("every EVM omft assetId embeds its own tokenAddress", () => {
    const entries = Object.values(ORIGINS).flatMap((assets) => Object.values(assets)) as Array<{ assetId: string; tokenAddress?: string }>;
    for (const entry of entries) {
      const m = entry.assetId.match(/^nep141:[a-z]+-0x([0-9a-f]{40})\.omft\.near$/i);
      if (!m) continue;
      expect(entry.tokenAddress?.toLowerCase()).toBe("0x" + m[1].toLowerCase());
    }
  });

  it("throws on unsupported pairs", () => {
    expect(() => resolveOrigin("tron", "usdc")).toThrow(/unsupported/);
    // base is a single-asset (usdc-only) origin.
    expect(() => resolveOrigin("base", "usdt")).toThrow(/unsupported/);
  });

  it("resolves destinations and rejects others", () => {
    expect(resolveDest("usdcx").assetId).toBe(MOVEMENT.usdcx.assetId);
    expect(() => resolveDest("aleo")).toThrow(/unsupported destination/);
  });

  it("left-pads a short recipient to a full 32-byte word", () => {
    const out = normalizeRecipient("0x0a1b2c3d4e5f60718293a4b5c6d7e8f9");
    expect(out).toMatch(/^0x[0-9a-f]{64}$/);
    expect(out.endsWith("0a1b2c3d4e5f60718293a4b5c6d7e8f9")).toBe(true);
  });

  it("rejects non-hex or oversized recipients", () => {
    expect(() => normalizeRecipient("0xZZ")).toThrow(/not valid/);
    expect(() => normalizeRecipient("0x" + "a".repeat(65))).toThrow(/not valid/);
  });
});
