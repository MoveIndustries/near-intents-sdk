export type AssetEntry = { assetId: string; decimals: number; tokenAddress?: string };
export type OriginKey = keyof typeof ORIGINS;
export type StableKey = "usdc" | "usdt";
export type DestKey = keyof typeof MOVEMENT;
export type Family = "evm" | "tron" | "near" | "solana" | "aptos";

export const MOVEMENT = {
  usdcx: { assetId: "nep141:movement-6f9a70ef4605e7d9174f1abf8d8d3c15012f48f3.omft.near", decimals: 6 },
  move: { assetId: "nep141:movement.omft.near", decimals: 8 },
} as const;

// tokenAddress is the origin-chain token contract the deposit transfer targets. assetId, decimals and
// tokenAddress all come from the 1Click /v0/tokens registry. Provenance of tokenAddress per family:
//   evm    — the 0x ERC-20 contract. For omft (nep141:) ids the hex also appears in the assetId; for
//            HOT-omni (nep245:) ids it does not, so it is the registry's contractAddress verbatim.
//   tron   — TRC-20 contract in raw hex (41 + 20 bytes), NOT the omft assetId hex (a bridge id).
//   near   — NEP-141 account; here the assetId's nep141: suffix already is the token contract.
//   solana — SPL mint (base58).
//   aptos  — fungible-asset metadata object (0x…).
// BSC USDC/USDT are 18-decimal by BSC convention, unlike the 6-decimal stablecoins on every other chain.
export const ORIGINS = {
  ethereum: {
    usdc: { assetId: "nep141:eth-0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48.omft.near", decimals: 6, tokenAddress: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48" },
    usdt: { assetId: "nep141:eth-0xdac17f958d2ee523a2206206994597c13d831ec7.omft.near", decimals: 6, tokenAddress: "0xdac17f958d2ee523a2206206994597c13d831ec7" },
  },
  polygon: {
    usdc: { assetId: "nep245:v2_1.omni.hot.tg:137_qiStmoQJDQPTebaPjgx5VBxZv6L", decimals: 6, tokenAddress: "0x3c499c542cef5e3811e1192ce70d8cc03d5c3359" },
    usdt: { assetId: "nep245:v2_1.omni.hot.tg:137_3hpYoaLtt8MP1Z2GH1U473DMRKgr", decimals: 6, tokenAddress: "0xc2132d05d31c914a87c6611c10748aeb04b58e8f" },
  },
  tron: {
    usdt: { assetId: "nep141:tron-d28a265909efecdcee7c5028585214ea0b96f015.omft.near", decimals: 6, tokenAddress: "41a614f803b6fd780986a42c78ec9c7f77e6ded13c" },
  },
  near: {
    usdc: { assetId: "nep141:17208628f84f5d6ad33f0da3bbbeb27ffcb398eac501a31bd6ad2011e36133a1", decimals: 6, tokenAddress: "17208628f84f5d6ad33f0da3bbbeb27ffcb398eac501a31bd6ad2011e36133a1" },
    usdt: { assetId: "nep141:usdt.tether-token.near", decimals: 6, tokenAddress: "usdt.tether-token.near" },
  },
  bsc: {
    usdc: { assetId: "nep245:v2_1.omni.hot.tg:56_2w93GqMcEmQFDru84j3HZZWt557r", decimals: 18, tokenAddress: "0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d" },
    usdt: { assetId: "nep245:v2_1.omni.hot.tg:56_2CMMyVTGZkeyNZTSvS5sarzfir6g", decimals: 18, tokenAddress: "0x55d398326f99059ff775485246999027b3197955" },
  },
  arbitrum: {
    usdc: { assetId: "nep141:arb-0xaf88d065e77c8cc2239327c5edb3a432268e5831.omft.near", decimals: 6, tokenAddress: "0xaf88d065e77c8cc2239327c5edb3a432268e5831" },
    // Arbitrum's bridged USDT is USDT0 (symbol USDT0 in the 1Click registry).
    usdt: { assetId: "nep141:arb-0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9.omft.near", decimals: 6, tokenAddress: "0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9" },
  },
  base: {
    usdc: { assetId: "nep141:base-0x833589fcd6edb6e08f4c7c32d4f71b54bda02913.omft.near", decimals: 6, tokenAddress: "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913" },
  },
  gnosis: {
    usdc: { assetId: "nep141:gnosis-0x2a22f9c3b484c3629090feed35f17ff8f88f76f0.omft.near", decimals: 6, tokenAddress: "0x2a22f9c3b484c3629090feed35f17ff8f88f76f0" },
    usdt: { assetId: "nep141:gnosis-0x4ecaba5870353805a9f068101a40e0f32ed605c6.omft.near", decimals: 6, tokenAddress: "0x4ecaba5870353805a9f068101a40e0f32ed605c6" },
  },
  avalanche: {
    usdc: { assetId: "nep245:v2_1.omni.hot.tg:43114_3atVJH3r5c4GqiSYmg9fECvjc47o", decimals: 6, tokenAddress: "0xb97ef9ef8734c71904d8002f8b6bc66dd9c48a6e" },
    usdt: { assetId: "nep245:v2_1.omni.hot.tg:43114_372BeH7ENZieCaabwkbWkBiTTgXp", decimals: 6, tokenAddress: "0x9702230a8ea53601f5cd2dc00fdbc13d4df4a8c7" },
  },
  optimism: {
    usdc: { assetId: "nep245:v2_1.omni.hot.tg:10_A2ewyUyDp6qsue1jqZsGypkCxRJ", decimals: 6, tokenAddress: "0x0b2c639c533813f4aa9d7837caf62653d097ff85" },
    usdt: { assetId: "nep245:v2_1.omni.hot.tg:10_359RPSJVdTxwTJT9TyGssr2rFoWo", decimals: 6, tokenAddress: "0x94b008aa00579c1307b0ef2c499ad98a8ce58e58" },
  },
  solana: {
    usdc: { assetId: "nep141:sol-5ce3bf3a31af18be40ba30f721101b4341690186.omft.near", decimals: 6, tokenAddress: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v" },
    usdt: { assetId: "nep141:sol-c800a4bd850783ccb82c2b2c7e84175443606352.omft.near", decimals: 6, tokenAddress: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB" },
  },
  aptos: {
    usdc: { assetId: "nep141:aptos-34ee497f210c5a511e8d5b53bc56d75b63612bb5.omft.near", decimals: 6, tokenAddress: "0xbae207659db88bea0cbead6da0ed00aac12edcdda169e591cd41c94180b46f3b" },
    usdt: { assetId: "nep141:aptos-88cb7619440a914fe6400149a12b443c3ac21d59.omft.near", decimals: 6, tokenAddress: "0x357b0b74bc833e95a115ad22604854d6b0fca151cecd94111770e5d6ffc9dc2b" },
  },
} as const;

export const family = (origin: OriginKey): Family =>
  origin === "tron" ? "tron"
  : origin === "near" ? "near"
  : origin === "solana" ? "solana"
  : origin === "aptos" ? "aptos"
  : "evm";

export function resolveOrigin(origin: string, originAsset: string): AssetEntry {
  const e = (ORIGINS as Record<string, Record<string, AssetEntry>>)[origin]?.[originAsset];
  if (!e) throw new Error(`unsupported origin/originAsset: ${origin}/${originAsset}`);
  return e;
}

export function resolveDest(destinationAsset: string): AssetEntry {
  const e = (MOVEMENT as Record<string, AssetEntry>)[destinationAsset];
  if (!e) throw new Error(`unsupported destination: ${destinationAsset}`);
  return e;
}

export function normalizeRecipient(addr: string): string {
  const hex = addr.startsWith("0x") ? addr.slice(2) : addr;
  if (!/^[0-9a-fA-F]+$/.test(hex) || hex.length > 64) throw new Error(`recipient is not valid: ${addr}`);
  return "0x" + hex.toLowerCase().padStart(64, "0");
}
