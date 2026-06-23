// Quote Polygon USDC -> USDCx on Movement, print MetaMask deposit instructions, then track.
// Run (build first): npm run build
//   RECIPIENT=0x<movement> REFUND_TO=0x<polygon> AMOUNT=100000 node --env-file=.env examples/quote-pol-usdcx.mjs
// Then in MetaMask send the printed amount of USDC (Polygon) to the printed address; needs POL for gas.
import { configure, quoteDeposit, trackStatus } from "../dist/index.js";

configure({ jwt: process.env.ONE_CLICK_JWT });

const amount = process.env.AMOUNT ?? "1000000"; // default 1.0 USDC (6 decimals); 100000 = 0.10
const res = await quoteDeposit({
  origin: "pol", asset: "usdc", to: "usdcx",
  amount,
  recipient: process.env.RECIPIENT,
  refundTo: process.env.REFUND_TO,
  deadline: new Date(Date.now() + 3600_000).toISOString(), // 1 hour to do the MetaMask send
  dry: false,
});
const q = res.quote;
console.log("\n=== In MetaMask (Polygon), send a normal USDC transfer: ===");
console.log("  token:   USDC (Polygon)");
console.log("  to:     ", q.depositAddress);
console.log("  amount: ", (Number(q.amountIn) / 1e6).toFixed(6), "USDC");
console.log("  you receive ~", q.amountOutFormatted ?? q.amountOut, "USDCx on Movement");
console.log("  deposit before:", q.deadline, "\n");
console.log("Tracking status (send the USDC now)...");
const final = await trackStatus(q.depositAddress);
console.log("FINAL:", final.status);
