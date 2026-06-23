# near-intents-sdk

A thin TypeScript SDK for moving USDT or USDC from a supported origin chain onto Movement (as USDCx or MOVE) over NEAR Intents. It wraps the official [1Click API](https://docs.near-intents.org/near-intents/integration/distribution-channels/1click-api) client and pins the destination to Movement so callers can't accidentally land elsewhere. It orchestrates the transfer — quote, deposit address, status — and never holds keys.

See [docs/near-intents-sdk-design.md](docs/near-intents-sdk-design.md) for the design spec.

## Requirements

**Every consumer needs a 1Click JWT.** The SDK performs a full transfer (binding quote → deposit address → submit → status tracking), and all of those endpoints require a Partners Portal JWT — without one the API rejects them with 401. The only thing that works unauthenticated is a dry (non-binding) quote, which the SDK does not rely on. There is no JWT-free path to an actual transfer.

Obtain a JWT by registering at the [Partners Portal](https://partners.near-intents.org). Pass it to `configure()`; the SDK does not mint or refresh tokens.

## Usage

```ts
import { configure, quoteDeposit, prepareDepositTx, trackStatus } from "near-intents-sdk";

configure({ jwt: process.env.ONE_CLICK_JWT! });

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
