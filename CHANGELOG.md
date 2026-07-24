# Changelog

## 0.0.4

### Patch Changes

- Harden fail-closed input validation and fix the deposit-type exports:

  - prepareDepositTx rejects a non-positive-integer quote amountIn before building any descriptor.
  - prepareDepositTx rejects a depositAddress that is not a 20-byte hex address on the EVM path, before ABI-encoding.
  - quoteDeposit rejects a slippageTolerance that is not between 0 and 10000 basis points.
  - quoteDeposit rejects a non-parseable deadline instead of silently passing the past-deadline guard.
  - submitDeposit rejects an empty depositAddress or txHash before calling the API.
  - SolanaDepositTx and AptosDepositTx are exported from the package root.
  - Add a package exports map so modern-ESM (nodenext/bundler) resolution finds the entrypoint and types.

- Add eight source-chain origins — BSC, Arbitrum, Base, Gnosis, Avalanche, Optimism, Solana and Aptos — each pairing USDC and/or USDT to USDCx on Movement (Base is USDC-only). `prepareDepositTx` now emits family-specific descriptors for Solana (SPL transfer) and Aptos (fungible-asset transfer) alongside the existing EVM, Tron and NEAR descriptors.

## 0.0.3

### Patch Changes

- Add `near` as a supported origin chain (USDC + USDT), alongside Ethereum, Polygon, and Tron. `prepareDepositTx` returns a new `NearDepositTx` (an unsigned NEP-141 `ft_transfer` call); `submitDeposit` takes an optional `nearSenderAccount`, required by the 1Click API for NEAR-origin deposits.

## 0.0.2

### Patch Changes

- 25ed3f7: Add a required `minAmountOut` floor to `quoteDeposit`: reject a quote when its guaranteed output falls below the caller's minimum. Pass `"0"` to opt out.

## [0.0.1] - 2026-07-02

### Patch Changes

- This is the initial version of the SDK, which wraps the official 1Click client and pins the destination to Movement so callers cannot accidentally land elsewhere.
- It quotes and moves USDT or USDC from Ethereum, Polygon, or Tron into Movement as `usdcx` or `move`, through `quoteDeposit`, `prepareDepositTx`, `submitDeposit`, `getStatus`, `isTerminal`, and `listTokens`.
- It never signs, broadcasts, or holds keys, since `prepareDepositTx` returns an unsigned transaction for the caller's own wallet.
