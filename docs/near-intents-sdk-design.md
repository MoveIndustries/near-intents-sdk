# Design: near-intents-sdk — USDT/USDC → Movement (USDCx or MOVE)

## Goal

A thin TypeScript SDK that moves USDT or USDC from a supported origin chain (Polygon, Ethereum, Tron) onto **Movement** over NEAR Intents, delivering either **USDCx** or **MOVE**, with the destination *chain* pinned by the SDK so the caller can only land on Movement. The SDK wraps the official 1Click API client and restricts `destinationAsset` to the Movement asset set — USDCx (`nep141:movement-6f9a70ef4605e7d9174f1abf8d8d3c15012f48f3.omft.near`) or MOVE (`nep141:movement.omft.near`) — removing the failure mode where the NEAR Intents UI defaults USDCx to the Aleo variant (`nep141:aleo-usdcx.omft.near`) and offers no network selection. Every supported transfer is a solver-filled swap (e.g. USDT→USDCx, USDC→MOVE). The SDK orchestrates the transfer — quote, deposit address, status — and can prepare the unsigned origin-chain deposit transaction, but it never holds keys or signs.

## Non-Goals

- No solver logic — no relay subscription, no quoting, no `token_diff` signing, no inventory.
- No reimplementation of the 1Click HTTP/OpenAPI client — reuse `@defuse-protocol/one-click-sdk-typescript`.
- No key custody and no broadcasting — the SDK prepares transactions; the caller's wallet signs and sends.
- No outbound direction in v1 — sending a Movement asset (USDCx/MOVE) out to another chain is out.
- No arbitrary asset pairs — origin is USDT or USDC, destination is always a Movement asset (USDCx or MOVE).
- No non-Movement destinations — the destination chain is fixed; there is no parameter to send elsewhere.
- No origins beyond Movement's own solver routes — v1 ships only the Polygon/Ethereum/Tron assets the solver fills; third-party-solver-only routes are not exposed even if `/v0/tokens` lists them.
- No price discovery or slippage strategy — 1Click returns the quote; the caller sets a tolerance.
- No UI.

## References

- [1Click API](https://docs.near-intents.org/near-intents/integration/distribution-channels/1click-api) — REST API for cross-chain swaps over NEAR Intents. Host: `https://1click.chaindefuser.com`.
- [one-click-sdk-typescript](https://github.com/defuse-protocol/one-click-sdk-typescript) — official client this SDK wraps (`OneClickService`, `OpenAPI`, `QuoteRequest`).
- [Supported tokens](https://1click.chaindefuser.com/v0/tokens) — live 1Click asset registry; source of the verified asset ids and decimals.

## High-Level Design

```
caller ── quoteDeposit({origin, asset, to, amount, recipient, refundTo})
            │
            ▼
   [SDK] build QuoteRequest  destinationAsset = MOVEMENT[to]  (USDCx | MOVE, pinned to Movement)
            │                 originAsset      = ORIGINS[origin][asset]  (USDC | USDT)
            ▼                 swapType=EXACT_INPUT, recipientType=DESTINATION_CHAIN
   OneClickService.getQuote ──► { depositAddress, amountOut, deadline, ... }
            │
            ├── (optional) prepareDepositTx(quote) ──► unsigned origin-chain transfer
            │                                            caller signs + broadcasts
            ▼
   trackStatus(depositAddress) ──► poll getExecutionStatus until terminal
                                     SUCCESS | REFUNDED | FAILED
```

The SDK holds no funds and no balances. 1Click takes custody at the `depositAddress` and the solver network delivers the chosen Movement asset to `recipient` on Movement, or refunds to `refundTo` on the origin chain. The invariant the SDK leans on: a 1Click swap resolves to exactly one terminal state — `SUCCESS` (delivered) or `REFUNDED`/`FAILED` (returned) — so the SDK never reconciles partial state; it only surfaces the state 1Click reports. The only value the SDK is responsible for is correctness of the `QuoteRequest` it builds — above all, that `destinationAsset` is one of the two Movement asset ids and `recipient` is a Movement address.

## Integration Assumptions

- Runs in two contexts: a browser (archetype 1 — user signs in their connected wallet) and a server (archetype 2 — partner has its own custody). The SDK is identical in both; only who signs the prepared tx differs.
- The caller supplies a 1Click JWT. The SDK does not mint or refresh it.
- The caller owns the origin-chain signing path. The SDK never sees a private key.
- Network calls are outbound HTTPS to `https://1click.chaindefuser.com` only.
- Single transfer per call — no batching, no queue, no persistence. State lives with the caller (the `depositAddress` is the handle).

## Components

### OneClick client

- **Responsibilities:** configure the official SDK (base URL, JWT) and expose its three methods to the rest of the SDK.
- Reuse `OneClickService.getQuote`, `getExecutionStatus`, `submitDepositTx` and the `OpenAPI` config object. Do NOT wrap or re-export the generated request/response model classes beyond what the high-level API needs.
- JWT is set via `OpenAPI.TOKEN`, which accepts a string or an `async () => string` for callers that refresh tokens.

### Asset registry

- **Responsibilities:** hold the Movement destination set and the supported origin assets, and reject anything not in either set.
- Destinations are the two Movement assets — USDCx (6 decimals) and MOVE (8 decimals). Both are on the `movement` chain; the SDK exposes no other destination.
- Origins are keyed by chain, with a `usdc` and/or `usdt` entry; each carries its `assetId` and `decimals`. `amount` is always in the origin asset's smallest unit, so decimals are load-bearing.
- The registry below is the set Movement's own solver actually quotes and fills against — Polygon, Ethereum, and Tron, into both USDCx and MOVE. These are the routes with guaranteed liquidity. Tron is USDT-only (no `tron_usdc`). Other `/v0/tokens` origins (base, arbitrum, solana, aptos, sui, gnosis, bsc, …) are intentionally excluded: a quote into Movement from them would only fill if some third-party solver carries inventory — unverified, so not in v1 (see Open Questions).

```ts
const MOVEMENT = {
  usdcx: { assetId: 'nep141:movement-6f9a70ef4605e7d9174f1abf8d8d3c15012f48f3.omft.near', decimals: 6 },
  move:  { assetId: 'nep141:movement.omft.near', decimals: 8 },
} as const;

// Backed by Movement's own solver inventory.
const ORIGINS = {
  eth:  { usdc: { assetId: 'nep141:eth-0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48.omft.near', decimals: 6 },
          usdt: { assetId: 'nep141:eth-0xdac17f958d2ee523a2206206994597c13d831ec7.omft.near', decimals: 6 } },
  pol:  { usdc: { assetId: 'nep245:v2_1.omni.hot.tg:137_qiStmoQJDQPTebaPjgx5VBxZv6L', decimals: 6 },
          usdt: { assetId: 'nep245:v2_1.omni.hot.tg:137_3hpYoaLtt8MP1Z2GH1U473DMRKgr', decimals: 6 } },
  tron: { usdt: { assetId: 'nep141:tron-d28a265909efecdcee7c5028585214ea0b96f015.omft.near', decimals: 6 } },
} as const;
```

### Quote builder

- **Responsibilities:** turn a high-level request into a 1Click `QuoteRequest` with the destination pinned, and return the quote.
- `quoteDeposit({ origin, asset, to, amount, recipient, refundTo, slippageTolerance?, dry? })` — `origin` is the chain key, `asset` is `'usdc'` or `'usdt'`, `to` is `'usdcx'` or `'move'` — resolves `originAsset` from `ORIGINS` and `destinationAsset` from `MOVEMENT`, and sets `swapType = EXACT_INPUT`, `depositType = ORIGIN_CHAIN`, `recipientType = DESTINATION_CHAIN`, `refundType = ORIGIN_CHAIN`, and a `deadline` (the quote-expiry ISO timestamp; the SDK does not auto-refresh — past the deadline the caller re-quotes).
- `recipient` is a Movement (Aptos-style) address: `0x` + a full 32-byte word (64 hex). The SDK **left-pads to the full 32 bytes, preserving leading zero bytes** — this is required, not defensive: 1Click rejects a shorter recipient with `400 "recipient is not valid"`, and a padded one is accepted (verified against `/v0/quote`).
- The Partners JWT on the client avoids the 0.2% protocol fee; the SDK does not set `appFees` (that array is a separate integrator-surcharge mechanism, out of v1).
- `slippageTolerance` is in basis points (100 = 1%), forwarded to 1Click as-is, defaulting to `100` when omitted — matching the official SDK example. The SDK applies no per-asset default; because MOVE is volatile, callers using `to: 'move'` should pass a higher tolerance, but the SDK does not special-case it (staying consistent with the upstream client it wraps).
- Returns the 1Click quote unchanged plus the resolved origin/destination metadata. The `depositAddress` in the response is the transfer handle.

### Deposit-tx preparation

- **Responsibilities:** for archetype 1, build the unsigned origin-chain transfer of `amount` to the quote's `depositAddress`, for every supported origin.
- Returns an unsigned tx object for the caller's wallet to sign and broadcast. The SDK does not sign or broadcast. `submitDepositTx({ txHash, depositAddress })` is optional — 1Click detects the deposit on its own; it only speeds processing — so the SDK exposes it but does not require it.
- Symmetric across origins: an ERC-20 `transfer` for the EVM origins (eth, pol) and a TRC-20 `transfer` for Tron. Tron needs a TRC-20 builder dependency; keep it isolated so the EVM path carries no Tron code.

### Status tracker

- **Responsibilities:** poll `getExecutionStatus(depositAddress)` and surface the lifecycle to a terminal state.
- `trackStatus(depositAddress)` exposes the raw 1Click status and resolves when it reaches `SUCCESS`, `REFUNDED`, or `FAILED`. `PENDING_DEPOSIT`, `PROCESSING`, and `INCOMPLETE_DEPOSIT` are non-terminal.

## Transfer Flow

1. Caller calls `quoteDeposit({ origin, asset, to, amount, recipient, refundTo })`.
2. Reject if the `origin`/`asset` pair is not in `ORIGINS`, or `to` is not in `MOVEMENT`.
3. Reject if `recipient` is not a valid Movement address (`0x` + ≤64 hex), or `refundTo` is not valid for the origin chain; normalize `recipient` to the full left-padded 32-byte form.
4. Build the `QuoteRequest` with `destinationAsset` set to the selected Movement asset and submit `getQuote`.
5. Return the quote: `depositAddress`, `amountOut` (in the chosen Movement asset), `deadline`, fee, time estimate.
6. (Optional) Caller calls `prepareDepositTx(quote)` to get the unsigned origin-chain transfer (ERC-20 for eth/pol, TRC-20 for tron); the caller's wallet signs and broadcasts it.
7. Caller calls `trackStatus(depositAddress)`.
8. While status is `PENDING_DEPOSIT`/`PROCESSING`, keep polling.
9. On `INCOMPLETE_DEPOSIT`, surface it as non-terminal — the deposit was below the required amount; resolution is 1Click's (top-up or refund), not the SDK's.
10. Resolve on `SUCCESS` (Movement asset delivered to `recipient`), `REFUNDED` (returned to `refundTo`), or `FAILED`.

## Safety Rules

- **Never sign, never broadcast, never hold keys.** The SDK only prepares transactions.
- **Pin the destination chain.** `destinationAsset` is always a Movement asset (USDCx or MOVE); there is no caller-facing parameter to send off Movement. This is the one rule the SDK exists to enforce.
- **Fail closed on bad input:** unknown `origin`/`asset` pair, `to` not in the Movement set, missing JWT, invalid `recipient`/`refundTo`, non-positive `amount`, or a `deadline` already in the past → throw before any network call.
- **A `dry` quote is non-binding** — never treat a dry-run quote's `depositAddress` as fundable.
- **Surface, don't reconcile.** On any non-`SUCCESS` terminal state the SDK reports it and stops; it does not retry the swap.

## First Milestone

- JWT-configured 1Click client over the official SDK.
- `quoteDeposit` pinned to the Movement destination set (USDCx, MOVE) for the supported origin set.
- Origin/recipient/refund validation with fail-closed errors.
- `prepareDepositTx` for all origins — ERC-20 (eth, pol) and TRC-20 (tron) unsigned transfer to `depositAddress`.
- `trackStatus` polling to a terminal state.

## Remaining Open Questions

- **Per-route fill confirmation.** Only `eth` USDC → USDCx was probed live (it filled: 1.0 → 0.997066). The other solver-configured pairs — the `→ MOVE` destinations and the Tron and Polygon origins — are taken from the solver config, not each confirmed against a live quote.
- **`depositMemo`.** 1Click's status lookup requires the quote's `depositMemo` alongside `depositAddress` when the quote returns one. Confirm whether Movement-destination quotes return a `depositMemo`; if so, the SDK's transfer handle must be `{ depositAddress, depositMemo }`, not `depositAddress` alone.

