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
  originChain: "ethereum",  // any OriginKey — see ORIGINS in src/registry.ts
  originAsset: "usdc",      // "usdc" | "usdt"  (some origins carry only one)
  destinationAsset: "usdcx", // "usdcx" | "move"
  amount: "1000000",        // 1.0 USDC, in the origin asset's smallest units
  recipient: "0xYourMovementAddress",
  refundTo: "0xYourEthereumAddress",
  minAmountOut: "995000",   // required floor in the destination asset's smallest units; throws if the quote's guaranteed output is lower. Pass "0" to opt out.
  // slippageTolerance: 100, // basis points, defaults to 100 (1%); raise it for `destinationAsset: "move"`
});
const { depositAddress, amountOut, deadline } = res.quote;

// 2. (Optional) Build the unsigned deposit transfer; your wallet signs + broadcasts it.
const depositTx = prepareDepositTx("ethereum", "usdc", res);
// EVM:    { family: "evm", to, value, data }
// Tron:   { family: "tron", contractAddress, function, parameter }
// NEAR:   { family: "near", receiverId, methodName: "ft_transfer", args, gas, deposit }
// Solana: { family: "solana", splMint, owner, amount }         — derive the owner's ATA and transfer
// Aptos:  { family: "aptos", function, typeArguments, functionArguments }

// 3. (Optional) After broadcasting, hand 1Click the tx hash to speed up deposit detection.
await submitDeposit(depositAddress!, "0xYourDepositTxHash");
// For a NEAR origin, also pass the signing account: submitDeposit(depositAddress!, txHash, { nearSenderAccount: "you.near" })

// 4. Read execution status. Poll on your own cadence until isTerminal(status).
const { status } = await getStatus(depositAddress!);
// isTerminal(status) is true for "SUCCESS" | "REFUNDED" | "FAILED"
```

The SDK never signs, broadcasts, or holds keys — step 2 returns an *unsigned* transaction for your wallet.

## Supported routes

Origins and their USDC/USDT assets are defined in [`ORIGINS`](src/registry.ts); destinations (USDCx, MOVE) in [`MOVEMENT`](src/registry.ts). Those are the canonical lists — consult them rather than a table here. `prepareDepositTx` emits a family-specific descriptor for each origin family (EVM, Tron, NEAR, Solana, Aptos).

Which pairs actually quote is decided by Movement's solver at runtime, not by this SDK — a registered origin may return "no liquidity" for a given destination until the solver enables that route.

## Install

```sh
npm i @moveindustries/near-intents-sdk
```

Published manually by a maintainer: bump the version, update [CHANGELOG.md](CHANGELOG.md), then `npm publish` (which builds via `prepublishOnly`). See [CHANGELOG.md](CHANGELOG.md) for changes.

## Tests

- `npm test` — unit only, offline, no secrets.
- `npm run test:live:noauth` — adds a live dry quote against the real API (no JWT).
- `npm run test:live:auth` — adds an authenticated quote; requires `ONE_CLICK_JWT` in `.env` (fails if unset).
