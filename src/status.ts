import { OneClickService, GetExecutionStatusResponse } from "@defuse-protocol/one-click-sdk-typescript";

const TERMINAL = new Set<GetExecutionStatusResponse.status>([
  GetExecutionStatusResponse.status.SUCCESS,
  GetExecutionStatusResponse.status.REFUNDED,
  GetExecutionStatusResponse.status.FAILED,
]);

export const isTerminal = (status: GetExecutionStatusResponse.status): boolean => TERMINAL.has(status);

/** Fetch the swap's current execution status once. Poll it yourself, checking `isTerminal`. */
export async function getStatus(
  depositAddress: string,
  opts: { depositMemo?: string } = {},
): Promise<GetExecutionStatusResponse> {
  return OneClickService.getExecutionStatus(depositAddress, opts.depositMemo);
}
