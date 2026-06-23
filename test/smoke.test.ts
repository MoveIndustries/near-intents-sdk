import { describe, it, expect } from "vitest";
import { quoteDeposit } from "../src/index.js";

// Live dry-quote against the real 1Click API. Gated: set RUN_SMOKE=1 to run (no JWT needed for a dry quote).
describe.skipIf(!process.env.RUN_SMOKE)("smoke (live dry quote)", () => {
  it("returns a fillable eth-USDC -> Movement USDCx dry quote", async () => {
    const res = await quoteDeposit({
      origin: "eth", asset: "usdc", to: "usdcx", amount: "1000000",
      recipient: "0x000000000000000000000000000000000a1b2c3d4e5f60718293a4b5c6d7e8f9",
      refundTo: "0x1111111111111111111111111111111111111111", dry: true,
    });
    expect(BigInt(res.quote.amountOut)).toBeGreaterThan(0n);
  }, 30_000);
});
