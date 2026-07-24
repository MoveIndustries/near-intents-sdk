---
"@moveindustries/near-intents-sdk": minor
---

Add eight source-chain origins — BSC, Arbitrum, Base, Gnosis, Avalanche, Optimism, Solana and Aptos — each pairing USDC and/or USDT to USDCx on Movement (Base is USDC-only). `prepareDepositTx` now emits family-specific descriptors for Solana (SPL transfer) and Aptos (fungible-asset transfer) alongside the existing EVM, Tron and NEAR descriptors.
