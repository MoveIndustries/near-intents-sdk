import { describe, it, expect, vi, beforeEach } from "vitest";
import { OneClickService, GetExecutionStatusResponse } from "@defuse-protocol/one-click-sdk-typescript";
import { getStatus, isTerminal } from "../src/status.js";

const S = GetExecutionStatusResponse.status;

describe("status", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("classifies terminal vs non-terminal", () => {
    expect([S.SUCCESS, S.REFUNDED, S.FAILED].every(isTerminal)).toBe(true);
    expect([S.PENDING_DEPOSIT, S.PROCESSING, S.INCOMPLETE_DEPOSIT].some(isTerminal)).toBe(false);
  });

  it("fetches the current status once", async () => {
    const spy = vi.spyOn(OneClickService, "getExecutionStatus").mockResolvedValue({ status: S.PROCESSING } as any);
    const res = await getStatus("0xdep", { depositMemo: "m1" });
    expect(res.status).toBe(S.PROCESSING);
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith("0xdep", "m1");
  });
});
