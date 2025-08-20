// webhook.js
const express = require("express");
const bodyParser = require("body-parser");
const crypto = require("crypto");
const { db } = require("../config/firebase");

const router = express.Router();

// ✅ Put your Whop signing secret in env
const WHOP_WEBHOOK_SECRET = process.env.WHOP_WEBHOOK_SECRET || "";

/**
 * We MUST parse the webhook request as RAW to verify the signature.
 * Do NOT run express.json() before this route.
 */
router.post(
	"/payment-webhook",
	bodyParser.raw({ type: () => true }), // accept all types
	async (req, res) => {
		try {
			// const rawBody =
			// req.body instanceof Buffer ? req.body.toString("utf8") : "";
			const signature = req.headers["whop-signature"]; // adjust header name if Whop documents differently
			const rawBody = req.body.toString("utf8");

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
					await updateData(event.data.user_email, "pending");
					break;

				case "payment_succeed":
				case "payment_succeeded":
					console.log("✅ Payment succeeded:", event.data);
					await updateData(event.data.user_email, "approved");
					// 👉 grant access / mark user as paid here
					break;

				case "payment_failed":
				case "payment_failure":
					console.log("❌ Payment failed:", event.data);
					await updateData(event.data.user_email, "failed");
					break;

				default:
					console.log("Unhandled event type:", type, "full event:", event);
			}

			// Ack quickly so Whop doesn't retry
			return res.status(200).send("ok");
		} catch (err) {
			console.error("Webhook handler error:", err);
			return res.status(500).send("webhook handler error");
		}
	}
);

const updateData = async (email, status) => {
	try {
		const snapshot = await db
			.collection("users")
			.where("email", "==", email)
			.limit(1)
			.get();

		if (snapshot.empty) {
			throw new Error(`No user found with email: ${email}`);
		} else {
			const userDoc = snapshot.docs[0]; // get the first (and only) doc
			const userRef = userDoc.ref;

			const updateData = {
				isSubscribed: status === "approved",
				subscriptionStatus: status,
				updatedAt: Date.now(),
			};

			await userRef.update(updateData);
			console.log(`✅ Updated user ${email}:`, updateData);
		}
	} catch (err) {
		console.error(err);
	}
};

module.exports = router;
