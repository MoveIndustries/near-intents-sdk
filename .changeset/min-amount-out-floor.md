---
"@moveindustries/near-intents-sdk": patch
---

Add a required `minAmountOut` floor to `quoteDeposit`: reject a quote when its guaranteed output falls below the caller's minimum. Pass `"0"` to opt out.
