import { describe, it, expect, vi, beforeEach } from "vitest";
import { OneClickService, GetExecutionStatusResponse } from "@defuse-protocol/one-click-sdk-typescript";
import { trackStatus, isTerminal } from "../src/status.js";

const S = GetExecutionStatusResponse.status;

describe("status", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("classifies terminal vs non-terminal", () => {
    expect([S.SUCCESS, S.REFUNDED, S.FAILED].every(isTerminal)).toBe(true);
    expect([S.PENDING_DEPOSIT, S.PROCESSING, S.INCOMPLETE_DEPOSIT].some(isTerminal)).toBe(false);
  });

  it("polls until a terminal state", async () => {
    const spy = vi.spyOn(OneClickService, "getExecutionStatus")
      .mockResolvedValueOnce({ status: S.PENDING_DEPOSIT } as any)
      .mockResolvedValueOnce({ status: S.PROCESSING } as any)
      .mockResolvedValueOnce({ status: S.SUCCESS } as any);
    const res = await trackStatus("0xdep", { intervalMs: 0 });
    expect(res.status).toBe(S.SUCCESS);
    expect(spy).toHaveBeenCalledTimes(3);
  });
});
