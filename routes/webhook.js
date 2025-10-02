const crypto = require("crypto");
const bodyParser = require("body-parser");
const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../middleware/auth");

const Billing = require("../models/Billing");
const User = require("../models/User");

const WHOP_WEBHOOK_SECRET = process.env.WHOP_WEBHOOK_SECRET;

const TIER_MAPPING = {
	plan_KUuUHqMFyFG1U: { name: "Premium", value: 149 },
	plan_qy4Xr0dxEdnEi: { name: "Standard", value: 97 },
	plan_ydYbLPyKoeURo: { name: "Basic", value: 55 },
};

// Helper to check if user has any previous successful billing
const hasExistingBilling = async (email) => {
	if (!email) return false;

	try {
		const existing = await Billing.findOne({
			email,
			eventType: { $in: ["payment_succeeded", "membership_went_valid"] },
		}).lean();

		return !!existing;
	} catch (err) {
		console.error("❌ Error checking existing billing:", err);
		return false;
	}
};

// Whop payment webhook handler
router.post(
	"/payment-webhook",
	bodyParser.raw({ type: () => true }), // Raw body to verify signature
	async (req, res) => {
		try {
			const signature = req.headers["whop-signature"];
			const rawBody = req.body.toString("utf8");

			// Verify HMAC signature
			if (WHOP_WEBHOOK_SECRET && signature) {
				const expectedSig = crypto
					.createHmac("sha256", WHOP_WEBHOOK_SECRET)
					.update(rawBody)
					.digest("hex");

				if (expectedSig !== signature.trim()) {
					console.error("❌ Invalid webhook signature");
					return res.status(400).send("invalid signature");
				}
			}

			let event;
			try {
				event = JSON.parse(rawBody);
			} catch (e) {
				console.error("❌ Failed to parse webhook JSON:", e.message);
				return res.status(400).send("invalid json");
			}

			const action = event.action || "";
			const data = event.data || {};

			const type = action.toLowerCase().replace(/\./g, "_");
			console.log("Received webhook event:", type);
			console.log("Received webhook data:", data);

			let email = data.user_email || data.email;
			console.log("Membership Id", data.id);
			if (email === undefined || email === null) {
				const user = await User.findOne({
					"subscription.whopMembershipId": data.id,
				});
				email = user?.email;
			}
			const membershipId = data.membership_id || data.id;
			const tierInfo = TIER_MAPPING[data.plan_id] || {
				name: "Unknown",
				value: data.subtotal || data.final_amount || 0,
			};

			switch (type) {
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
					const hasPrevPayment = await hasExistingBilling(email);
					const newStatus = hasPrevPayment ? "trial" : "active";
					console.log(
						`User ${email} previous payment: ${hasPrevPayment}, status: ${newStatus}`
					);

					await updateSubscription(email, {
						status: newStatus,
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

				case "membership_went_valid":
					const hasPrevMember = await hasExistingBilling(email);
					const memberStatus = hasPrevMember ? "trial" : "active";

					console.log(
						`User ${email} previous membership: ${hasPrevMember}, status: ${memberStatus}`
					);

					await updateSubscription(email, {
						status: memberStatus,
						lastEvent: type,
						whopMembershipId: membershipId,
						...(data.renewal_period_start && {
							renewalPeriodStart: new Date(data.renewal_period_start * 1000),
						}),
						...(data.renewal_period_end && {
							renewalPeriodEnd: new Date(data.renewal_period_end * 1000),
						}),
						...(data.expires_at && {
							expiresAt: new Date(data.expires_at * 1000),
						}),
						tier: tierInfo.name,
						tierValue: tierInfo.value,
						planId: data.plan_id,
						valid: data.valid,
						licenseKey: data.license_key,
					});
					// await createBillingRecord(email, data, type, tierInfo);
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
					// await createBillingRecord(email, data, type, tierInfo);
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
					// await createBillingRecord(email, data, type, tierInfo);
					break;

				// Add other cases similarly...

				default:
					console.log("Unhandled webhook event type:", type);
			}

			return res.status(200).send("ok");
		} catch (err) {
			console.error("Webhook processing error:", err);
			return res.status(500).send("internal error");
		}
	}
);

const updateSubscription = async (email, updates) => {
	if (!email) {
		console.error("❌ No email in webhook event");
		return;
	}

	try {
		let user = await User.findOne({ email });
		if (!user) {
			console.log("❌ No user found for email:", email);
			// Create new user
			user = new User({
				email,
				subscription: {
					...updates,
					updatedAt: new Date(),
				},
			});
			await user.save();
			console.log(`✅ Created new user ${email} with subscription:`, updates);
			return user._id;
		}

		// Clean updates to remove undefined keys
		const cleanUpdates = {};
		Object.keys(updates).forEach((key) => {
			if (updates[key] !== undefined) cleanUpdates[key] = updates[key];
		});

		user.subscription = {
			...user.subscription,
			...cleanUpdates,
			updatedAt: new Date(),
		};
		console.log("User: ", user);
		await user.save();
		console.log(`✅ Updated user ${email}:`, user.subscription);
		return user._id;
	} catch (err) {
		console.error("❌ MongoDB update failed:", err);
		throw err;
	}
};

const createBillingRecord = async (email, eventData, eventType, tierInfo) => {
	if (!email) {
		console.log("⚠️ No email provided for billing record");
		return;
	}

	try {
		const user = await User.findOne({ email });
		const userId = user ? user._id : null;

		const createdAt = eventData.created_at
			? new Date(eventData.created_at * 1000)
			: new Date();

		const billingRecord = {
			userId,
			email,
			transactionId: eventData.id || null,
			membershipId: eventData.membership_id || eventData.id || null,
			planId: eventData.plan_id || null,
			eventType,
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
			createdAt,
			paidAt: eventData.paid_at ? new Date(eventData.paid_at * 1000) : null,
			refundedAt: eventData.refunded_at
				? new Date(eventData.refunded_at * 1000)
				: null,
			timestamp: new Date(),
			billingReason: eventData.billing_reason || null,
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
			rawEventData: eventData,
		};

		// Remove undefined fields from billingRecord
		Object.keys(billingRecord).forEach(
			(key) => billingRecord[key] === undefined && delete billingRecord[key]
		);

		const billing = new Billing(billingRecord);
		await billing.save();

		console.log(`✅ Created billing record for ${email}`);
	} catch (err) {
		console.error("❌ Failed to create billing record:", err);
	}
};

module.exports = router;
