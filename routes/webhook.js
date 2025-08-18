// webhook.js
const express = require("express");
const bodyParser = require("body-parser");
const crypto = require("crypto");

const router = express.Router();

// ✅ Put your Whop signing secret in env
const WHOP_WEBHOOK_SECRET = process.env.WHOP_WEBHOOK_SECRET || "";

/**
 * We MUST parse the webhook request as RAW to verify the signature.
 * Do NOT run express.json() before this route.
 */
router.post(
	"/payment-webhook",
	bodyParser.raw({ type: "application/json" }), // keep raw body (Buffer)
	(req, res) => {
		try {
			const rawBody =
				req.body instanceof Buffer ? req.body.toString("utf8") : "";
			const signature = req.headers["whop-signature"]; // adjust header name if Whop documents differently

			// 🔒 Verify HMAC signature (if configured)
			if (WHOP_WEBHOOK_SECRET && signature) {
				const expectedHex = crypto
					.createHmac("sha256", WHOP_WEBHOOK_SECRET)
					.update(rawBody)
					.digest("hex");

				// simple compare; switch to timingSafeEqual if Whop returns a hex digest
				if (expectedHex !== String(signature).trim()) {
					console.error("❌ Invalid webhook signature");
					return res.status(400).send("invalid signature");
				}
			}

			// ✅ Parse AFTER verification
			let event;
			try {
				event = JSON.parse(rawBody || "{}");
			} catch (e) {
				console.error(
					"❌ JSON parse error:",
					e.message,
					"rawBody:",
					rawBody?.slice(0, 500)
				);
				return res.status(400).send("invalid json");
			}

			// Be defensive about where the type lives
			const type =
				event.type ||
				event.event?.type ||
				event.event_type ||
				event.action ||
				"";

			console.log(
				"📩 Webhook received:",
				type || "(no type)",
				"payload keys:",
				Object.keys(event)
			);

			// Normalize for switch (lowercase, dots → underscores)
			const normalized = String(type).toLowerCase().replace(/\./g, "_");

			switch (normalized) {
				case "payment_pending":
					console.log("⚠️ Payment pending:", event.data);
					break;

				case "payment_succeed":
				case "payment_succeeded":
					console.log("✅ Payment succeeded:", event.data);
					// 👉 grant access / mark user as paid here
					break;

				case "payment_failed":
				case "payment_failure":
					console.log("❌ Payment failed:", event.data);
					// 👉 handle failure / notify user here
					break;

				default:
					console.log("ℹ️ Unhandled event type:", type, "full event:", event);
			}

			// Ack quickly so Whop doesn't retry
			return res.status(200).send("ok");
		} catch (err) {
			console.error("Webhook handler error:", err);
			return res.status(500).send("webhook handler error");
		}
	}
);

module.exports = router;
