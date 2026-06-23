import { OneClickService, GetExecutionStatusResponse } from "@defuse-protocol/one-click-sdk-typescript";

const TERMINAL = new Set<GetExecutionStatusResponse.status>([
  GetExecutionStatusResponse.status.SUCCESS,
  GetExecutionStatusResponse.status.REFUNDED,
  GetExecutionStatusResponse.status.FAILED,
]);

export const isTerminal = (status: GetExecutionStatusResponse.status): boolean => TERMINAL.has(status);

/** Poll until the swap reaches a terminal state (SUCCESS | REFUNDED | FAILED). */
export async function trackStatus(
  depositAddress: string,
  opts: { intervalMs?: number; depositMemo?: string } = {},
): Promise<GetExecutionStatusResponse> {
  for (;;) {
    const res = await OneClickService.getExecutionStatus(depositAddress, opts.depositMemo);
    if (isTerminal(res.status)) return res;
    await new Promise((r) => setTimeout(r, opts.intervalMs ?? 3000));
  }
}
