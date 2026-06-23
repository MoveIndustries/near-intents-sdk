# near-intents-sdk

A thin TypeScript SDK for moving USDT or USDC from a supported origin chain onto Movement (as USDCx or MOVE) over NEAR Intents. It wraps the official [1Click API](https://docs.near-intents.org/near-intents/integration/distribution-channels/1click-api) client and pins the destination to Movement so callers can't accidentally land elsewhere. It orchestrates the transfer — quote, deposit address, status — and never holds keys.

See [docs/near-intents-sdk-design.md](docs/near-intents-sdk-design.md) for the design spec.

## Requirements

**Every consumer needs a 1Click JWT.** The SDK performs a full transfer (binding quote → deposit address → submit → status tracking), and all of those endpoints require a Partners Portal JWT — without one the API rejects them with 401. The only thing that works unauthenticated is a dry (non-binding) quote, which the SDK does not rely on. There is no JWT-free path to an actual transfer.

Obtain a JWT by registering at the [Partners Portal](https://partners.near-intents.org). Provide it to the SDK at construction; the SDK does not mint or refresh tokens.
