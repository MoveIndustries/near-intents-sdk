export type AssetEntry = { assetId: string; decimals: number; tokenAddress?: string };
export type OriginKey = keyof typeof ORIGINS;
export type StableKey = "usdc" | "usdt";
export type DestKey = keyof typeof MOVEMENT;

export const MOVEMENT = {
  usdcx: { assetId: "nep141:movement-6f9a70ef4605e7d9174f1abf8d8d3c15012f48f3.omft.near", decimals: 6 },
  move: { assetId: "nep141:movement.omft.near", decimals: 8 },
} as const;

// tokenAddress is the L1 token contract the deposit transfer targets. Provenance (the omft assetId hex
// equals the L1 contract only on EVM — never derive a non-EVM contract from it):
//   eth  USDC 0xa0b8…eb48 / USDT 0xdac1…1ec7  — canonical Ethereum contracts (also embedded in the assetId).
//   pol  USDC 0x3c49…3359 (native USDC, NOT USDC.e) / USDT 0xc213…8e8f — canonical Polygon contracts.
//   tron USDT 41a614f803… (TR7NHqje…)          — canonical TRC-20 USDT; NOT the omft assetId hex (a bridge id).
export const ORIGINS = {
  eth: {
    usdc: { assetId: "nep141:eth-0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48.omft.near", decimals: 6, tokenAddress: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48" },
    usdt: { assetId: "nep141:eth-0xdac17f958d2ee523a2206206994597c13d831ec7.omft.near", decimals: 6, tokenAddress: "0xdac17f958d2ee523a2206206994597c13d831ec7" },
  },
  pol: {
    usdc: { assetId: "nep245:v2_1.omni.hot.tg:137_qiStmoQJDQPTebaPjgx5VBxZv6L", decimals: 6, tokenAddress: "0x3c499c542cef5e3811e1192ce70d8cc03d5c3359" },
    usdt: { assetId: "nep245:v2_1.omni.hot.tg:137_3hpYoaLtt8MP1Z2GH1U473DMRKgr", decimals: 6, tokenAddress: "0xc2132d05d31c914a87c6611c10748aeb04b58e8f" },
  },
  tron: {
    usdt: { assetId: "nep141:tron-d28a265909efecdcee7c5028585214ea0b96f015.omft.near", decimals: 6, tokenAddress: "41a614f803b6fd780986a42c78ec9c7f77e6ded13c" },
  },
} as const;

export const family = (origin: OriginKey): "evm" | "tron" => (origin === "tron" ? "tron" : "evm");

export function resolveOrigin(origin: string, asset: string): AssetEntry {
  const e = (ORIGINS as Record<string, Record<string, AssetEntry>>)[origin]?.[asset];
  if (!e) throw new Error(`unsupported origin/asset: ${origin}/${asset}`);
  return e;
}

export function resolveDest(to: string): AssetEntry {
  const e = (MOVEMENT as Record<string, AssetEntry>)[to];
  if (!e) throw new Error(`unsupported destination: ${to}`);
  return e;
}

export function normalizeRecipient(addr: string): string {
  const hex = addr.startsWith("0x") ? addr.slice(2) : addr;
  if (!/^[0-9a-fA-F]+$/.test(hex) || hex.length > 64) throw new Error(`recipient is not valid: ${addr}`);
  return "0x" + hex.toLowerCase().padStart(64, "0");
}
