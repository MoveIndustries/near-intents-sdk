# near-intents-sdk

A thin TypeScript SDK for moving USDT or USDC from a supported origin chain onto Movement (as USDCx or MOVE) over NEAR Intents. It wraps the official [1Click API](https://docs.near-intents.org/near-intents/integration/distribution-channels/1click-api) client and pins the destination to Movement so callers can't accidentally land elsewhere. It orchestrates the transfer — quote, deposit address, status — and never holds keys.

## Authentication

**A 1Click JWT is optional — the full transfer works without one.** Binding quote → deposit address → status tracking all succeed unauthenticated. Verified on mainnet: a Polygon USDC → Movement USDCx transfer completed end-to-end with no token set.

Pass a JWT only to waive NEAR's protocol fee — without one, NEAR auto-injects its `appFees` and takes a small cut of the swap — and for attributed rate limits instead of anonymous IP-based ones. Obtain one at the [Partners Portal](https://partners.near-intents.org) and pass it to `configure({ jwt })`; the SDK does not mint or refresh tokens.

## Usage

```ts
import { configure, quoteDeposit, prepareDepositTx, trackStatus } from "near-intents-sdk";

configure({ jwt: process.env.ONE_CLICK_JWT }); // jwt optional; omit configure() entirely to run token-free

// 1. Quote: USDC on Ethereum -> USDCx on Movement. Destination is pinned to Movement.
const res = await quoteDeposit({
  origin: "eth",            // "eth" | "pol" | "tron"
  asset: "usdc",            // "usdc" | "usdt"  (tron is usdt-only)
  to: "usdcx",              // "usdcx" | "move"
  amount: "1000000",        // 1.0 USDC, in the origin asset's smallest units
  recipient: "0xYourMovementAddress",
  refundTo: "0xYourEthereumAddress",
  // slippageTolerance: 100, // basis points, defaults to 100 (1%); raise it for `to: "move"`
});
const { depositAddress, amountOut, deadline } = res.quote;

// 2. (Optional) Build the unsigned deposit transfer; your wallet signs + broadcasts it.
const depositTx = prepareDepositTx("eth", "usdc", res);
// EVM: { family: "evm", to, value, data }   Tron: { family: "tron", contractAddress, function, parameter }

// 3. Track to a terminal state.
const result = await trackStatus(depositAddress!);
// result.status === "SUCCESS" | "REFUNDED" | "FAILED"
```

The SDK never signs, broadcasts, or holds keys — step 2 returns an *unsigned* transaction for your wallet.

## Supported routes

Backed by Movement's own solver: origins **Polygon, Ethereum, Tron** (USDC + USDT; Tron is USDT-only) → **USDCx** or **MOVE** on Movement.

## Status

Not yet published to npm. Install from source: `npm i && npm run build`.

Tests:
- `npm test` — unit only, offline, no secrets.
- `npm run test:live:noauth` — adds a live dry quote against the real API (no JWT).
- `npm run test:live:auth` — adds an authenticated quote; requires `ONE_CLICK_JWT` in `.env` (fails if unset).
