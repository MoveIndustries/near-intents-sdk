import { describe, it, expect, vi, beforeEach } from "vitest";
import { OneClickService } from "@defuse-protocol/one-click-sdk-typescript";
import { submitDeposit } from "../src/submit.js";

describe("submitDeposit", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("forwards depositAddress and txHash to submitDepositTx", async () => {
    const spy = vi.spyOn(OneClickService, "submitDepositTx").mockResolvedValue({} as any);
    await submitDeposit("0xdep", "0xtx");
    expect(spy).toHaveBeenCalledWith({ depositAddress: "0xdep", txHash: "0xtx", memo: undefined });
  });

  it("passes a memo when given", async () => {
    const spy = vi.spyOn(OneClickService, "submitDepositTx").mockResolvedValue({} as any);
    await submitDeposit("0xdep", "0xtx", { memo: "m1" });
    expect(spy).toHaveBeenCalledWith({ depositAddress: "0xdep", txHash: "0xtx", memo: "m1" });
  });

  it("passes nearSenderAccount for NEAR-origin deposits", async () => {
    const spy = vi.spyOn(OneClickService, "submitDepositTx").mockResolvedValue({} as any);
    await submitDeposit("near-dep.near", "abc123", { nearSenderAccount: "alice.near" });
    expect(spy).toHaveBeenCalledWith({ depositAddress: "near-dep.near", txHash: "abc123", memo: undefined, nearSenderAccount: "alice.near" });
  });

  it("rejects an empty depositAddress or txHash before calling the API", async () => {
    const spy = vi.spyOn(OneClickService, "submitDepositTx").mockResolvedValue({} as any);
    await expect(submitDeposit("0xdep", "")).rejects.toThrow(/txHash/);
    await expect(submitDeposit("", "0xtx")).rejects.toThrow(/depositAddress/);
    expect(spy).not.toHaveBeenCalled();
  });
});
