import { describe, it, expect } from "vitest";
import { prepareDepositTx } from "../src/deposit.js";

const q = (depositAddress: string | undefined, amountIn: string) => ({ quote: { depositAddress, amountIn } } as any);

describe("prepareDepositTx", () => {
  it("encodes an ERC-20 transfer for EVM origins", () => {
    const tx = prepareDepositTx("ethereum", "usdc", q("0x000000000000000000000000000000000a1b2c3d4e5f60718293a4b5c6d7e8f9", "1000000"));
    expect(tx).toEqual({
      family: "evm",
      to: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
      value: "0x0",
      // selector + recipient(32B) + amount(32B = 0xf4240)
      data: "0xa9059cbb" + "000000000000000000000000000000000a1b2c3d4e5f60718293a4b5c6d7e8f9" + "00000000000000000000000000000000000000000000000000000000000f4240",
    });
  });

  it("emits a TRC-20 descriptor for Tron", () => {
    const tx = prepareDepositTx("tron", "usdt", q("41abcdef0000000000000000000000000000000000", "5000000"));
    expect(tx).toEqual({
      family: "tron",
      contractAddress: "41a614f803b6fd780986a42c78ec9c7f77e6ded13c",
      function: "transfer(address,uint256)",
      parameter: ["41abcdef0000000000000000000000000000000000", "5000000"],
    });
  });

  it("encodes polygon against native USDC", () => {
    const tx = prepareDepositTx("polygon", "usdc", q("0x000000000000000000000000000000000a1b2c3d4e5f60718293a4b5c6d7e8f9", "1000000")) as { family: string; to: string };
    expect(tx.family).toBe("evm");
    expect(tx.to).toBe("0x3c499c542cef5e3811e1192ce70d8cc03d5c3359");
  });

  it("builds an ft_transfer call for a NEAR origin", () => {
    const tx = prepareDepositTx("near", "usdt", q("deposit-abc.near", "5000000"));
    expect(tx).toEqual({
      family: "near",
      receiverId: "usdt.tether-token.near",
      methodName: "ft_transfer",
      args: { receiver_id: "deposit-abc.near", amount: "5000000" },
      gas: "30000000000000",
      deposit: "1",
    });
  });

  it("encodes an ERC-20 transfer for a new EVM origin (BSC)", () => {
    const tx = prepareDepositTx("bsc", "usdt", q("0x000000000000000000000000000000000a1b2c3d4e5f60718293a4b5c6d7e8f9", "1000000000000000000")) as { family: string; to: string };
    expect(tx.family).toBe("evm");
    expect(tx.to).toBe("0x55d398326f99059ff775485246999027b3197955");
  });

  it("emits an SPL transfer descriptor for Solana", () => {
    const tx = prepareDepositTx("solana", "usdc", q("Jzn1hpcRTijgbkn3n7kjeH1sMsg9LogcfqEAqMFw2aM", "1000000"));
    expect(tx).toEqual({
      family: "solana",
      splMint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
      owner: "Jzn1hpcRTijgbkn3n7kjeH1sMsg9LogcfqEAqMFw2aM",
      amount: "1000000",
    });
  });

  it("builds a fungible-asset transfer call for Aptos", () => {
    const tx = prepareDepositTx("aptos", "usdc", q("0x2298", "1000000"));
    expect(tx).toEqual({
      family: "aptos",
      function: "0x1::primary_fungible_store::transfer",
      typeArguments: ["0x1::fungible_asset::Metadata"],
      functionArguments: ["0xbae207659db88bea0cbead6da0ed00aac12edcdda169e591cd41c94180b46f3b", "0x2298", "1000000"],
    });
  });

  it("throws on dry quotes (no depositAddress)", () => {
    expect(() => prepareDepositTx("ethereum", "usdc", q(undefined, "1"))).toThrow(/depositAddress/);
  });

  it("rejects a non-positive-integer amountIn", () => {
    const addr = "0x000000000000000000000000000000000a1b2c3d4e5f60718293a4b5c6d7e8f9";
    expect(() => prepareDepositTx("ethereum", "usdc", q(addr, "0"))).toThrow(/positive integer/);
    expect(() => prepareDepositTx("ethereum", "usdc", q(addr, ""))).toThrow(/positive integer/);
  });
});
