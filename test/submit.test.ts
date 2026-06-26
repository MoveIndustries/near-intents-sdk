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
});
