# Changelog

## 0.0.2

### Patch Changes

- 25ed3f7: Add a required `minAmountOut` floor to `quoteDeposit`: reject a quote when its guaranteed output falls below the caller's minimum. Pass `"0"` to opt out.

## [0.0.1] - 2026-07-02

### Added

- This is the initial version of the SDK, which wraps the official 1Click client and pins the destination to Movement so callers cannot accidentally land elsewhere.
- It quotes and moves USDT or USDC from Ethereum, Polygon, or Tron into Movement as `usdcx` or `move`, through `quoteDeposit`, `prepareDepositTx`, `submitDeposit`, `getStatus`, `isTerminal`, and `listTokens`.
- It never signs, broadcasts, or holds keys, since `prepareDepositTx` returns an unsigned transaction for the caller's own wallet.
