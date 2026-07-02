# Changelog

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and versioning follows [SemVer](https://semver.org/spec/v2.0.0.html). Published to npm as [@moveindustries/near-intents-sdk](https://www.npmjs.com/package/@moveindustries/near-intents-sdk).

## [Unreleased]

## [0.0.1] - 2026-07-02

### Added
- This is the initial version of the SDK, which wraps the official 1Click client and pins the destination to Movement so callers cannot accidentally land elsewhere.
- It quotes and moves USDT or USDC from Ethereum, Polygon, or Tron into Movement as `usdcx` or `move`, through `quoteDeposit`, `prepareDepositTx`, `submitDeposit`, `getStatus`, `isTerminal`, and `listTokens`.
- It never signs, broadcasts, or holds keys, since `prepareDepositTx` returns an unsigned transaction for the caller's own wallet.
