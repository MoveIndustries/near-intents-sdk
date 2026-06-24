// Quote Polygon USDC -> USDCx on Movement, print MetaMask deposit instructions, then track.
// Run (build first with `npm run build`), token-free:
//   RECIPIENT=0x<movement> REFUND_TO=0x<polygon> AMOUNT=20000 node examples/pol-usdc-to-mvmt-usdcx.mjs
// Then in MetaMask send the printed amount of USDC (Polygon) to the printed address; needs POL for gas.
// A 1Click JWT is optional (waives NEAR's fee): prepend ONE_CLICK_JWT=... to the command if you have one.
import { configure, quoteDeposit, trackStatus } from "../dist/index.js";

configure({ jwt: process.env.ONE_CLICK_JWT }); // undefined when unset -> runs token-free

const amount = process.env.AMOUNT; // required: smallest units (6 decimals), e.g. 20000 = 0.02 USDC
if (!amount) throw new Error("AMOUNT is required (smallest units, 6 decimals: 20000 = 0.02 USDC)");
const recipient = process.env.RECIPIENT;
if (!recipient) throw new Error("RECIPIENT is required (your Movement 0x address)");
const refundTo = process.env.REFUND_TO;
if (!refundTo) throw new Error("REFUND_TO is required (your Polygon 0x address)");
const res = await quoteDeposit({
  origin: "pol", asset: "usdc", to: "usdcx",
  amount,
  recipient,
  refundTo,
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
