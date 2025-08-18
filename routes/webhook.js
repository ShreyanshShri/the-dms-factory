// webhook.js
const express = require("express");
const bodyParser = require("body-parser");
const crypto = require("crypto");

const router = express.Router();

const WHOP_WEBHOOK_SECRET = process.env.WHOP_WEBHOOK_SECRET;

// Use raw parser only for this route
router.post(
	"/payment-webhook",
	bodyParser.raw({ type: "application/json" }),
	(req, res) => {
		try {
			// req.body is now a Buffer
			const rawBody = req.body.toString("utf8");

			// ✅ Verify signature if Whop provides one
			const signature = req.headers["whop-signature"];
			if (WHOP_WEBHOOK_SECRET && signature) {
				const expected = crypto
					.createHmac("sha256", WHOP_WEBHOOK_SECRET)
					.update(rawBody)
					.digest("hex");

				if (expected !== signature) {
					console.error("❌ Invalid webhook signature");
					return res.status(400).send("Invalid signature");
				}
			}

			// Parse JSON manually after verification
			console.log("rawBody", rawBody);
			console.log("rawbody type", rawBody.type);
			const event = JSON.parse(rawBody);
			console.log("📩 Webhook received:", event.type);

			switch (event.type) {
				case "payment_pending":
					console.log("⚠️ Payment is pending:", event.data);
					break;
				case "payment_succeed":
					console.log("✅ Payment succeeded:", event.data);
					// 👉 Grant access here
					break;
				case "payment_failed":
					console.log("❌ Payment failed:", event.data);
					// 👉 Handle failure
					break;
				default:
					console.log("ℹ️ Unhandled event:", event.type);
			}

			res.status(200).send("ok");
		} catch (err) {
			console.error("Webhook error:", err);
			res.status(500).send("Webhook handler error");
		}
	}
);

module.exports = router;
