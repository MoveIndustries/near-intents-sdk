# Changelog

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and versioning follows [SemVer](https://semver.org/spec/v2.0.0.html). Nothing is published to npm yet, and npm distribution is a follow-up.

## [Unreleased]

### Added
- This is the initial version of the SDK, which wraps the official 1Click client and pins the destination to Movement so callers cannot accidentally land elsewhere.
- It quotes and moves USDT or USDC from Ethereum, Polygon, or Tron into Movement as `usdcx` or `move`, through `quoteDeposit`, `prepareDepositTx`, `submitDeposit`, `getStatus`, `isTerminal`, and `listTokens`.
- It never signs, broadcasts, or holds keys, since `prepareDepositTx` returns an unsigned transaction for the caller's own wallet.
