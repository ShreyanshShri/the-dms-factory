// webhook.js

const express = require("express");
const bodyParser = require("body-parser");
const crypto = require("crypto");
const { db } = require("../config/firebase");

const router = express.Router();

const WHOP_WEBHOOK_SECRET = process.env.WHOP_WEBHOOK_SECRET || "";

// Tier mapping based on your checkoutLinks.ts
const TIER_MAPPING = {
	plan_KUuUHqMFyFG1U: { name: "Premium", value: 149 },
	plan_qy4Xr0dxEdnEi: { name: "Standard", value: 97 },
	plan_ydYbLPyKoeURo: { name: "Basic", value: 55 },
};

// 🆕 NEW HELPER FUNCTION: Check if user has previous successful purchases
const hasExistingSuccessfulBilling = async (email) => {
	if (!email) return false;

	try {
		const billingSnapshot = await db
			.collection("billing")
			.where("email", "==", email)
			.where("eventType", "in", ["payment_succeeded", "membership_went_valid"])
			.limit(1)
			.get();

		return !billingSnapshot.empty;
	} catch (err) {
		console.error("❌ Error checking existing billing:", err);
		return false;
	}
};

/**
 * 🔥 Handle Whop webhooks
 */
router.post(
	"/payment-webhook",
	bodyParser.raw({ type: () => true }), // MUST be raw for signature check
	async (req, res) => {
		try {
			const signature = req.headers["whop-signature"];
			const rawBody = req.body.toString("utf8");

			// 🔒 Verify HMAC signature
			if (WHOP_WEBHOOK_SECRET && signature) {
				const expectedHex = crypto
					.createHmac("sha256", WHOP_WEBHOOK_SECRET)
					.update(rawBody)
					.digest("hex");

				if (expectedHex !== String(signature).trim()) {
					console.error("❌ Invalid webhook signature");
					return res.status(400).send("invalid signature");
				}
			}

			// ✅ Parse JSON
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

			// Extract action and data from webhook payload
			const action = event.action || "";
			const data = event.data || {};

			// Convert action to consistent format
			const type = String(action).toLowerCase().replace(/\./g, "_");
			console.log(
				"📩 Webhook received:",
				type,
				"payload keys:",
				Object.keys(event)
			);

			const email = data.user_email || data.email;
			const membershipId = data.membership_id || data.id;

			// Get tier information
			const tierInfo = TIER_MAPPING[data.plan_id] || {
				name: "Unknown",
				value: data.subtotal || data.final_amount || 0,
			};

			switch (type) {
				// =============== PAYMENTS ===============
				case "payment_pending":
					await updateSubscription(email, {
						status: "pending",
						lastEvent: type,
						whopMembershipId: membershipId,
						tier: tierInfo.name,
						tierValue: tierInfo.value,
						planId: data.plan_id,
					});
					await createBillingRecord(email, data, type, tierInfo);
					break;

				case "payment_succeeded":
					// 🆕 MODIFIED: Check if user has existing successful billing
					const hasExistingPayment = await hasExistingSuccessfulBilling(email);
					const paymentStatus = hasExistingPayment ? "trial" : "active";

					console.log(
						`💡 User ${email} has existing billing: ${hasExistingPayment}, setting status to: ${paymentStatus}`
					);

					await updateSubscription(email, {
						status: paymentStatus, // 🆕 CHANGED: Set to "trial" if existing customer, "active" if new
						lastEvent: type,
						whopMembershipId: membershipId,
						tier: tierInfo.name,
						tierValue: tierInfo.value,
						planId: data.plan_id,
					});
					await createBillingRecord(email, data, type, tierInfo);
					break;

				case "payment_failed":
					await updateSubscription(email, {
						status: "failed",
						lastEvent: type,
						whopMembershipId: membershipId,
						tier: tierInfo.name,
						tierValue: tierInfo.value,
						planId: data.plan_id,
					});
					await createBillingRecord(email, data, type, tierInfo);
					break;

				// =============== MEMBERSHIPS ===============
				case "membership_went_valid":
					// 🆕 MODIFIED: Check if user has existing successful billing for membership renewals
					const hasExistingMembership = await hasExistingSuccessfulBilling(
						email
					);
					const membershipStatus = hasExistingMembership ? "trial" : "active";

					console.log(
						`💡 User ${email} has existing membership: ${hasExistingMembership}, setting status to: ${membershipStatus}`
					);

					await updateSubscription(email, {
						status: membershipStatus, // 🆕 CHANGED: Set to "trial" if existing customer, "active" if new
						lastEvent: type,
						whopMembershipId: membershipId,
						// Use renewal_period_end from membership webhooks
						...(data.renewal_period_end && {
							currentPeriodEnd: new Date(
								data.renewal_period_end * 1000
							).toISOString(),
						}),
						...(data.expires_at && {
							expiresAt: new Date(data.expires_at * 1000).toISOString(),
						}),
						tier: tierInfo.name,
						tierValue: tierInfo.value,
						planId: data.plan_id,
						valid: data.valid,
						licenseKey: data.license_key,
					});
					await createBillingRecord(email, data, type, tierInfo);
					break;

				case "membership_cancel_at_period_end_changed":
					await updateSubscription(email, {
						status: data.cancel_at_period_end ? "cancelling" : "active",
						lastEvent: type,
						whopMembershipId: membershipId,
						...(data.renewal_period_end && {
							currentPeriodEnd: new Date(
								data.renewal_period_end * 1000
							).toISOString(),
						}),
						tier: tierInfo.name,
						tierValue: tierInfo.value,
						planId: data.plan_id,
						cancelAtPeriodEnd: data.cancel_at_period_end,
						valid: data.valid,
					});
					await createBillingRecord(email, data, type, tierInfo);
					break;

				case "membership_went_invalid":
					await updateSubscription(email, {
						status: "expired",
						lastEvent: type,
						whopMembershipId: membershipId,
						tier: tierInfo.name,
						tierValue: tierInfo.value,
						planId: data.plan_id,
						valid: data.valid,
					});
					await createBillingRecord(email, data, type, tierInfo);
					break;

				case "membership_metadata_updated":
					await updateSubscription(email, {
						lastEvent: type,
						metadata: data.metadata || {},
						tier: tierInfo.name,
						tierValue: tierInfo.value,
						planId: data.plan_id,
						valid: data.valid,
					});
					await createBillingRecord(email, data, type, tierInfo);
					break;

				case "membership_experience_claimed":
					console.log("🎟️ Experience claimed by user:", data);
					await createBillingRecord(email, data, type, tierInfo);
					break;

				// =============== REFUNDS / DISPUTES / OTHERS ===============
				case "refund_created":
				case "refund_updated":
					console.log("💸 Refund event:", data);
					await createBillingRecord(email, data, type, tierInfo);
					break;

				case "dispute_created":
				case "dispute_updated":
				case "dispute_alert_created":
					console.log("⚖️ Dispute event:", data);
					await createBillingRecord(email, data, type, tierInfo);
					break;

				case "resolution_created":
				case "resolution_updated":
				case "resolution_decided":
					console.log("📜 Resolution event:", data);
					await createBillingRecord(email, data, type, tierInfo);
					break;

				case "payment_affiliate_reward_created":
					console.log("👥 Affiliate reward:", data);
					await createBillingRecord(email, data, type, tierInfo);
					break;

				default:
					console.log("Unhandled event type:", type, "full event:", event);
			}

			return res.status(200).send("ok");
		} catch (err) {
			console.error("Webhook handler error:", err);
			return res.status(500).send("webhook handler error");
		}
	}
);

const updateSubscription = async (email, updates) => {
	if (!email) {
		console.error("❌ No email in webhook event");
		return;
	}

	try {
		const snapshot = await db
			.collection("users")
			.where("email", "==", email)
			.limit(1)
			.get();

		if (snapshot.empty) {
			console.log(
				`⚠️ No user found with email: ${email}, creating user record`
			);
			// Create user if doesn't exist
			const newUserRef = db.collection("users").doc();
			await newUserRef.set({
				email: email,
				createdAt: Date.now(),
				subscription: {
					...updates,
					updatedAt: Date.now(),
				},
			});
			console.log(`✅ Created new user ${email} with subscription:`, updates);
			return newUserRef.id;
		}

		const userDoc = snapshot.docs[0];
		const userRef = userDoc.ref;

		// Filter out undefined values to prevent Firestore errors
		const cleanUpdates = Object.keys(updates).reduce((clean, key) => {
			if (updates[key] !== undefined) {
				clean[key] = updates[key];
			}
			return clean;
		}, {});

		const updateData = {
			subscription: {
				...(userDoc.data().subscription || {}),
				...cleanUpdates,
				updatedAt: Date.now(),
			},
		};

		await userRef.update(updateData);
		console.log(`✅ Updated user ${email}:`, updateData);
		return userRef.id;
	} catch (err) {
		console.error("❌ Firestore update failed:", err);
		throw err;
	}
};

const createBillingRecord = async (email, eventData, eventType, tierInfo) => {
	if (!email) {
		console.log("⚠️ No email provided for billing record");
		return;
	}

	try {
		// Get user ID for billing record
		const snapshot = await db
			.collection("users")
			.where("email", "==", email)
			.limit(1)
			.get();

		let userId = null;
		if (!snapshot.empty) {
			userId = snapshot.docs[0].id;
		}

		const billingRecord = {
			userId: userId,
			email: email,
			transactionId: eventData.id || null,
			membershipId: eventData.membership_id || eventData.id || null,
			planId: eventData.plan_id || null,
			eventType: eventType,
			status: eventData.status || "unknown",
			amount: eventData.subtotal || eventData.final_amount || 0,
			currency: eventData.currency || "usd",
			tier: tierInfo.name,
			tierValue: tierInfo.value,
			paymentMethod: {
				type: eventData.payment_method_type || null,
				cardBrand: eventData.card_brand || null,
				cardLast4: eventData.card_last_4 || null,
				walletType: eventData.wallet_type || null,
			},
			billingAddress: eventData.billing_address || null,
			refundedAmount: eventData.refunded_amount || 0,
			// Handle different timestamp fields
			createdAt: eventData.created_at
				? new Date(eventData.created_at * 1000)
				: new Date(),
			paidAt: eventData.paid_at ? new Date(eventData.paid_at * 1000) : null,
			refundedAt: eventData.refunded_at
				? new Date(eventData.refunded_at * 1000)
				: null,
			timestamp: Date.now(),
			billingReason: eventData.billing_reason || null,
			// Membership specific fields
			licenseKey: eventData.license_key || null,
			valid: eventData.valid || null,
			cancelAtPeriodEnd: eventData.cancel_at_period_end || null,
			renewalPeriodStart: eventData.renewal_period_start
				? new Date(eventData.renewal_period_start * 1000)
				: null,
			renewalPeriodEnd: eventData.renewal_period_end
				? new Date(eventData.renewal_period_end * 1000)
				: null,
			expiresAt: eventData.expires_at
				? new Date(eventData.expires_at * 1000)
				: null,
			affiliate: eventData.affiliate || null,
			rawEventData: eventData, // Store full event for debugging
		};

		// Remove undefined values
		const cleanRecord = Object.keys(billingRecord).reduce((clean, key) => {
			if (billingRecord[key] !== undefined) {
				clean[key] = billingRecord[key];
			}
			return clean;
		}, {});

		const docRef = await db.collection("billing").add(cleanRecord);
		console.log(`✅ Created billing record ${docRef.id} for ${email}`);
	} catch (err) {
		console.error("❌ Failed to create billing record:", err);
	}
};

module.exports = router;
