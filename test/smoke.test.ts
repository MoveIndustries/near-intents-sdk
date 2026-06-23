import { describe, it, expect } from "vitest";
import { configure, quoteDeposit } from "../src/index.js";

const RECIPIENT = "0x000000000000000000000000000000000a1b2c3d4e5f60718293a4b5c6d7e8f9";
const REFUND = "0x1111111111111111111111111111111111111111";

// Integration tests, controlled by explicit levers (not by JWT presence):
//   npm run test:live:noauth -> LIVE=1        : the dry tier only
//   npm run test:live:auth   -> LIVE=1 AUTH=1 : dry + authenticated; the auth test FAILS if ONE_CLICK_JWT is unset
// `npm test` sets neither, so both tiers are skipped.

describe.skipIf(!process.env.LIVE)("live dry quote (no JWT)", () => {
  it("eth-USDC -> Movement USDCx returns a fillable quote", { retry: 2, timeout: 30_000 }, async () => {
    const res = await quoteDeposit({
      origin: "eth", asset: "usdc", to: "usdcx", amount: "1000000",
      recipient: RECIPIENT, refundTo: REFUND, dry: true,
    });
    expect(BigInt(res.quote.amountOut)).toBeGreaterThan(0n);
  });
});

describe.skipIf(!process.env.AUTH)("live authenticated quote (JWT)", () => {
  it("eth-USDC -> Movement USDCx returns a real deposit address", { retry: 2, timeout: 30_000 }, async () => {
    const jwt = process.env.ONE_CLICK_JWT;
    if (!jwt) throw new Error("ONE_CLICK_JWT is required for test:auth — set it in .env");
    configure({ jwt });
    const res = await quoteDeposit({
      origin: "eth", asset: "usdc", to: "usdcx", amount: "1000000",
      recipient: RECIPIENT, refundTo: REFUND, dry: false,
    });
    expect(res.quote.depositAddress).toMatch(/^0x[0-9a-fA-F]+$/);
  });
});
