# near-intents-sdk

A thin TypeScript SDK for moving USDT or USDC from a supported origin chain onto Movement (as USDCx or MOVE) over NEAR Intents. It wraps the official [1Click API](https://docs.near-intents.org/near-intents/integration/distribution-channels/1click-api) client and pins the destination to Movement so callers can't accidentally land elsewhere. It orchestrates the transfer — quote, deposit address, status — and never holds keys.

## Authentication

**A 1Click JWT is optional — the full transfer works without one.** Binding quote → deposit address → status tracking all succeed unauthenticated. Verified on mainnet: a Polygon USDC → Movement USDCx transfer completed end-to-end with no token set.

Pass a JWT only to waive NEAR's protocol fee — without one, NEAR auto-injects its `appFees` and takes a small cut of the swap — and for attributed rate limits instead of anonymous IP-based ones. Obtain one at the [Partners Portal](https://partners.near-intents.org) and pass it to `configure({ jwt })`; the SDK does not mint or refresh tokens.

A JWT is a secret, so in a browser don't ship it to the client. Front 1Click with a server-side proxy that injects the token and point the SDK at it with `configure({ baseUrl: "/api/oneclick" })` (omit `jwt` — the proxy holds it). Without `baseUrl` the SDK calls 1Click directly.

## Usage

```ts
import { configure, quoteDeposit, prepareDepositTx, submitDeposit, getStatus, isTerminal } from "@moveindustries/near-intents-sdk";

configure({ jwt: process.env.ONE_CLICK_JWT }); // jwt optional; omit configure() entirely to run token-free

// 1. Quote: USDC on Ethereum -> USDCx on Movement. Destination is pinned to Movement.
const res = await quoteDeposit({
  originChain: "ethereum",  // "ethereum" | "polygon" | "tron" | "near"
  originAsset: "usdc",      // "usdc" | "usdt"  (tron is usdt-only)
  destinationAsset: "usdcx", // "usdcx" | "move"
  amount: "1000000",        // 1.0 USDC, in the origin asset's smallest units
  recipient: "0xYourMovementAddress",
  refundTo: "0xYourEthereumAddress",
  minAmountOut: "995000",   // required floor in the destination asset's smallest units; throws if the quote's guaranteed output is lower. Pass "0" to opt out.
  // slippageTolerance: 100, // basis points, defaults to 100 (1%); raise it for `destinationAsset: "move"`
  // confidentiality: "basic", // opt into NEAR Confidential Intents; requires a JWT (see below). Omit for a normal public quote.
});
const { depositAddress, amountOut, deadline } = res.quote;

// 2. (Optional) Build the unsigned deposit transfer; your wallet signs + broadcasts it.
const depositTx = prepareDepositTx("ethereum", "usdc", res);
// EVM: { family: "evm", to, value, data }   Tron: { family: "tron", contractAddress, function, parameter }
// NEAR: { family: "near", receiverId, methodName: "ft_transfer", args, gas, deposit }

// 3. (Optional) After broadcasting, hand 1Click the tx hash to speed up deposit detection.
await submitDeposit(depositAddress!, "0xYourDepositTxHash");
// For a NEAR origin, also pass the signing account: submitDeposit(depositAddress!, txHash, { nearSenderAccount: "you.near" })

// 4. Read execution status. Poll on your own cadence until isTerminal(status).
const { status } = await getStatus(depositAddress!);
// isTerminal(status) is true for "SUCCESS" | "REFUNDED" | "FAILED"
```

The SDK never signs, broadcasts, or holds keys — step 2 returns an *unsigned* transaction for your wallet.

## Confidential Intents

Pass `confidentiality: "basic"` (or `"advanced"`) to `quoteDeposit` to route the swap through [NEAR Confidential Intents](https://www.near.org/blog/announcing-general-availability-of-confidential-intents) — confidential execution on a NEAR private shard, with order size, timing, and counterparties kept off the public chain. The deposit → Movement flow is otherwise identical; the destination stays pinned to your Movement address.

Unlike the rest of the SDK, **confidential quotes require a JWT** — a public request returns `401 "authentication is required for confidential intent quotes"`. Set one with `configure({ jwt })`, or route through an authenticated proxy with `configure({ baseUrl })`. Without either, `quoteDeposit` throws before making the request.

Confidential Movement routes are still being enabled; until then a confidential quote to Movement returns `400 "No liquidity available"`.

## Supported routes

Backed by Movement's own solver: origins **Polygon, Ethereum, Tron, NEAR** (USDC + USDT; Tron is USDT-only) → **USDCx** or **MOVE** on Movement.

## Install

```sh
npm i @moveindustries/near-intents-sdk
```

Published manually by a maintainer: bump the version, update [CHANGELOG.md](CHANGELOG.md), then `npm publish` (which builds via `prepublishOnly`). See [CHANGELOG.md](CHANGELOG.md) for changes.

## Tests

- `npm test` — unit only, offline, no secrets.
- `npm run test:live:noauth` — adds a live dry quote against the real API (no JWT).
- `npm run test:live:auth` — adds an authenticated quote; requires `ONE_CLICK_JWT` in `.env` (fails if unset).
