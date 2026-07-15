import { OneClickService, type SubmitDepositTxResponse } from "@defuse-protocol/one-click-sdk-typescript";

/**
 * Hand 1Click the deposit tx hash so it can start processing without waiting to
 * detect the deposit on the origin chain. Optional speed-up — status tracking works
 * without it. Goes between broadcasting the deposit and reading status.
 *
 * `nearSenderAccount` is required by the 1Click API for NEAR-origin deposits (the
 * account that signed the `ft_transfer`); ignored for other origins.
 */
export async function submitDeposit(
  depositAddress: string,
  txHash: string,
  opts: { memo?: string; nearSenderAccount?: string } = {},
): Promise<SubmitDepositTxResponse> {
  return OneClickService.submitDepositTx({ depositAddress, txHash, memo: opts.memo, nearSenderAccount: opts.nearSenderAccount });
}
