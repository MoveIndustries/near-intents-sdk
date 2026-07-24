import { describe, it, expect } from "vitest";
import { configure, quoteDeposit } from "../src/index.js";

const RECIPIENT = "0x000000000000000000000000000000000a1b2c3d4e5f60718293a4b5c6d7e8f9";
// 10 units for the 6-decimal origins (BSC is 18-decimal — see BSC_AMOUNT). Well above the per-origin
// bridge minimum, which is dynamic — Tron's floor tracks its gas/fees and has sat above 1 unit, so a
// fixed 1-unit amount raced that moving floor. Dry quotes move no funds, so a larger amount is free.
const AMOUNT = "10000000";
// BSC USDC/USDT are 18-decimal, so 10 units is 1e19 raw; the 6-decimal AMOUNT would be dust below the floor.
const BSC_AMOUNT = "10000000000000000000";
const EVM_REFUND = "0x1111111111111111111111111111111111111111";
// Tron's raw hex (41 + 20 bytes) form, so it needs no base58 checksum like a T... address would.
const TRON_REFUND = "410000000000000000000000000000000000000000";
// A NEAR account ID. Unlike EVM/Tron, where any well-formed string passes, 1Click validates
// that a NEAR ORIGIN_CHAIN refund account actually exists on-chain, so this must be a real
// account — the canonical intents.near contract account serves as a stable, always-present one.
const NEAR_REFUND = "intents.near";
// A valid base58 pubkey; like NEAR, a stable always-present account (the USDC mint) so refund
// validation never masks the liquidity check. Dry quotes move no funds.
const SOLANA_REFUND = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
// An Aptos 0x account address.
const APTOS_REFUND = "0x0000000000000000000000000000000000000000000000000000000000000001";

// refundTo is an origin-chain address, so it has to match the origin's encoding.
// Each origin's deposit address also comes back in that chain's native encoding:
//   evm  -> 0x-prefixed hex; tron -> base58check (T...) or hex (41...); near -> account ID
//   (named a.b.near or a 64-char implicit hex account), lowercase [a-z0-9._-], 2-64 chars.
//   solana -> base58 pubkey; aptos -> 0x-prefixed hex.
// Every origin in the registry MUST have a case here. A route only quotes into USDCx once the solver
// enables that pair, which is configured in a separate repo — so a newly registered origin's case
// fails the live tier until that change lands. That CI failure is expected and correct, not a
// regression to silence or a reason to omit the case.
const CASES = [
  { originChain: "ethereum", originAsset: "usdc", refundTo: EVM_REFUND, depositAddress: /^0x[0-9a-fA-F]+$/ },
  { originChain: "polygon", originAsset: "usdc", refundTo: EVM_REFUND, depositAddress: /^0x[0-9a-fA-F]+$/ },
  { originChain: "tron", originAsset: "usdt", refundTo: TRON_REFUND, depositAddress: /^(T[1-9A-HJ-NP-Za-km-z]+|41[0-9a-fA-F]+)$/ },
  { originChain: "near", originAsset: "usdc", refundTo: NEAR_REFUND, depositAddress: /^[a-z0-9._-]{2,64}$/ },
  { originChain: "bsc", originAsset: "usdc", refundTo: EVM_REFUND, amount: BSC_AMOUNT, depositAddress: /^0x[0-9a-fA-F]+$/ },
  { originChain: "arbitrum", originAsset: "usdc", refundTo: EVM_REFUND, depositAddress: /^0x[0-9a-fA-F]+$/ },
  { originChain: "base", originAsset: "usdc", refundTo: EVM_REFUND, depositAddress: /^0x[0-9a-fA-F]+$/ },
  { originChain: "gnosis", originAsset: "usdc", refundTo: EVM_REFUND, depositAddress: /^0x[0-9a-fA-F]+$/ },
  { originChain: "avalanche", originAsset: "usdc", refundTo: EVM_REFUND, depositAddress: /^0x[0-9a-fA-F]+$/ },
  { originChain: "optimism", originAsset: "usdc", refundTo: EVM_REFUND, depositAddress: /^0x[0-9a-fA-F]+$/ },
  { originChain: "solana", originAsset: "usdc", refundTo: SOLANA_REFUND, depositAddress: /^[1-9A-HJ-NP-Za-km-z]{32,44}$/ },
  { originChain: "aptos", originAsset: "usdc", refundTo: APTOS_REFUND, depositAddress: /^0x[0-9a-fA-F]+$/ },
] as const;

// Integration tests, controlled by explicit levers (not by JWT presence):
//   npm run test:live:noauth -> LIVE=1        : the dry tier only
//   npm run test:live:auth   -> LIVE=1 AUTH=1 : dry + authenticated; the auth test FAILS if ONE_CLICK_JWT is unset
// `npm test` sets neither, so both tiers are skipped.

describe.skipIf(!process.env.LIVE)("live dry quote (no JWT)", () => {
  for (const c of CASES) {
    it(`${c.originChain}-${c.originAsset} -> Movement USDCx returns a fillable quote`, { retry: 2, timeout: 30_000 }, async () => {
      const res = await quoteDeposit({
        originChain: c.originChain, originAsset: c.originAsset, destinationAsset: "usdcx", amount: "amount" in c ? c.amount : AMOUNT,
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
        originChain: c.originChain, originAsset: c.originAsset, destinationAsset: "usdcx", amount: "amount" in c ? c.amount : AMOUNT,
        recipient: RECIPIENT, refundTo: c.refundTo, minAmountOut: "0", dry: false,
      });
      expect(res.quote.depositAddress).toMatch(c.depositAddress);
    });
  }
});
