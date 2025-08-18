// webhook.js
const express = require("express");
const bodyParser = require("body-parser");
const crypto = require("crypto");

const router = express.Router();

// Middleware to capture raw body for signature verification
router.use(
	bodyParser.json({
		verify: (req, res, buf) => {
			req.rawBody = buf.toString();
		},
	})
);

// Replace this with your Whop webhook signing secret
const WHOP_WEBHOOK_SECRET = process.env.WHOP_WEBHOOK_SECRET;

router.post("/payment-webhook", (req, res) => {
	try {
		// ✅ Verify signature if Whop provides one
		const signature = req.headers["whop-signature"];
		if (WHOP_WEBHOOK_SECRET && signature) {
			const expected = crypto
				.createHmac("sha256", WHOP_WEBHOOK_SECRET)
				.update(req.rawBody)
				.digest("hex");

			if (expected !== signature) {
				console.error("❌ Invalid webhook signature");
				return res.status(400).send("Invalid signature");
			}
		}

		const event = req.body;
		console.log("📩 Webhook received:", event.type);

		switch (event.type) {
			case "payment_pending":
				console.log("⚠️ Payment is pending:", event.data);
				break;
			case "payment_succeed":
				console.log("✅ Payment succeeded:", event.data);
				// 👉 Update user subscription / grant access here
				break;
			case "payment_failed":
				console.log("❌ Payment failed:", event.data);
				// 👉 Notify user or retry logic here
				break;
			default:
				console.log("ℹ️ Unhandled event:", event.type);
		}

		res.status(200).send("ok");
	} catch (err) {
		console.error("Webhook error:", err);
		res.status(500).send("Webhook handler error");
	}
});

module.exports = router;
