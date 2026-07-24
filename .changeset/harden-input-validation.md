---
"@moveindustries/near-intents-sdk": patch
---

Harden fail-closed input validation and fix the deposit-type exports:

- prepareDepositTx rejects a non-positive-integer quote amountIn before building any descriptor.
- prepareDepositTx rejects a depositAddress that is not a 20-byte hex address on the EVM path, before ABI-encoding.
- quoteDeposit rejects a slippageTolerance that is not between 0 and 10000 basis points.
- quoteDeposit rejects a non-parseable deadline instead of silently passing the past-deadline guard.
- submitDeposit rejects an empty depositAddress or txHash before calling the API.
- SolanaDepositTx and AptosDepositTx are exported from the package root.
