import { describe, it, expect } from "vitest";
import { resolveOrigin, resolveDest, normalizeRecipient, MOVEMENT } from "../src/registry.js";

describe("registry", () => {
  it("resolves known origin/asset pairs", () => {
    expect(resolveOrigin("ethereum", "usdc").assetId).toContain("eth-0xa0b8");
    expect(resolveOrigin("polygon", "usdc").tokenAddress).toBe("0x3c499c542cef5e3811e1192ce70d8cc03d5c3359");
    expect(resolveOrigin("tron", "usdt").tokenAddress).toBe("41a614f803b6fd780986a42c78ec9c7f77e6ded13c");
  });

  it("throws on unsupported pairs", () => {
    expect(() => resolveOrigin("tron", "usdc")).toThrow(/unsupported/);
    expect(() => resolveOrigin("base", "usdc")).toThrow(/unsupported/);
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
