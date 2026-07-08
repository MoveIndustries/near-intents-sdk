import { describe, it, expect } from "vitest";
import { configure, quoteDeposit } from "../src/index.js";

const RECIPIENT = "0x000000000000000000000000000000000a1b2c3d4e5f60718293a4b5c6d7e8f9";
// 10 units (all origins are 6-decimal here). Well above the per-origin bridge minimum,
// which is dynamic — Tron's floor tracks its gas/fees and has sat above 1 unit, so a fixed
// 1-unit amount raced that moving floor. Dry quotes move no funds, so a larger amount is free.
const AMOUNT = "10000000";
const EVM_REFUND = "0x1111111111111111111111111111111111111111";
// Tron's raw hex (41 + 20 bytes) form, so it needs no base58 checksum like a T... address would.
const TRON_REFUND = "410000000000000000000000000000000000000000";

// refundTo is an origin-chain address, so it has to match the origin's encoding.
// Each origin's deposit address also comes back in that chain's native encoding:
//   evm  -> 0x-prefixed hex; tron -> base58check (T...) or hex (41...).
const CASES = [
  { originChain: "ethereum", originAsset: "usdc", refundTo: EVM_REFUND, depositAddress: /^0x[0-9a-fA-F]+$/ },
  { originChain: "polygon", originAsset: "usdc", refundTo: EVM_REFUND, depositAddress: /^0x[0-9a-fA-F]+$/ },
  { originChain: "tron", originAsset: "usdt", refundTo: TRON_REFUND, depositAddress: /^(T[1-9A-HJ-NP-Za-km-z]+|41[0-9a-fA-F]+)$/ },
] as const;

// Integration tests, controlled by explicit levers (not by JWT presence):
//   npm run test:live:noauth -> LIVE=1        : the dry tier only
//   npm run test:live:auth   -> LIVE=1 AUTH=1 : dry + authenticated; the auth test FAILS if ONE_CLICK_JWT is unset
// `npm test` sets neither, so both tiers are skipped.

describe.skipIf(!process.env.LIVE)("live dry quote (no JWT)", () => {
  for (const c of CASES) {
    it(`${c.originChain}-${c.originAsset} -> Movement USDCx returns a fillable quote`, { retry: 2, timeout: 30_000 }, async () => {
      const res = await quoteDeposit({
        originChain: c.originChain, originAsset: c.originAsset, destinationAsset: "usdcx", amount: AMOUNT,
        recipient: RECIPIENT, refundTo: c.refundTo, minAmountOut: "0", dry: true,
      });
      expect(BigInt(res.quote.amountOut)).toBeGreaterThan(0n);
    });
  }
});

describe.skipIf(!process.env.AUTH)("live authenticated quote (JWT)", () => {
  for (const c of CASES) {
    it(`${c.originChain}-${c.originAsset} -> Movement USDCx returns a real deposit address`, { retry: 2, timeout: 30_000 }, async () => {
      const jwt = process.env.ONE_CLICK_JWT;
      if (!jwt) throw new Error("ONE_CLICK_JWT is required for test:auth — set it in .env");
      configure({ jwt });
      const res = await quoteDeposit({
        originChain: c.originChain, originAsset: c.originAsset, destinationAsset: "usdcx", amount: AMOUNT,
        recipient: RECIPIENT, refundTo: c.refundTo, minAmountOut: "0", dry: false,
      });
      expect(res.quote.depositAddress).toMatch(c.depositAddress);
    });
  }
});

// Confidential Intents (NEAR private-shard execution) is GA but requires a JWT — a public
// (no-JWT) request 401s with "authentication is required for confidential intent quotes".
// So it can only be exercised in the authenticated tier.
describe.skipIf(!process.env.AUTH)("live confidential quote (JWT)", () => {
  it("ethereum-usdc -> Movement USDCx returns a fillable confidential quote, still pinned to Movement", { retry: 2, timeout: 30_000 }, async () => {
    const jwt = process.env.ONE_CLICK_JWT;
    if (!jwt) throw new Error("ONE_CLICK_JWT is required for test:auth — set it in .env");
    configure({ jwt });
    const res = await quoteDeposit({
      originChain: "ethereum", originAsset: "usdc", destinationAsset: "usdcx", amount: AMOUNT,
      recipient: RECIPIENT, refundTo: EVM_REFUND, minAmountOut: "0", dry: true, confidentiality: "basic",
    });
    expect(BigInt(res.quote.amountOut)).toBeGreaterThan(0n);
  });
});
