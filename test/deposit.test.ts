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

  it("throws on dry quotes (no depositAddress)", () => {
    expect(() => prepareDepositTx("ethereum", "usdc", q(undefined, "1"))).toThrow(/depositAddress/);
  });
});
