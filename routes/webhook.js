const express = require("express");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const User = require("../models/User");
const Billing = require("../models/Billing");
const router = express.Router();

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

// Price ID to tier mapping
const PRICE_TIER_MAP = {
	price_1SGGUfQmvZBphmDWMk48ya35: { tier: "basic", tierValue: 55 },
	price_1SGGW0QmvZBphmDWkut1HFQV: { tier: "standard", tierValue: 97 },
	price_1SGGYjQmvZBphmDWTGE5Wxn1: { tier: "premium", tierValue: 149 },
};

// Helper function to get tier info from price ID
function getTierInfoFromPriceId(priceId) {
	const tierInfo = PRICE_TIER_MAP[priceId];
	if (!tierInfo) {
		console.warn(`Unknown price ID: ${priceId}`);
		return { tier: null, tierValue: null };
	}
	return tierInfo;
}

// Helper function to extract price ID from subscription
function getPriceIdFromSubscription(subscription) {
	if (
		!subscription.items ||
		!subscription.items.data ||
		subscription.items.data.length === 0
	) {
		console.error("No subscription items found");
		return null;
	}
	return subscription.items.data[0].price.id;
}

// Stripe webhook endpoint
router.post(
	"/stripe",
	express.raw({ type: "application/json" }),
	async (req, res) => {
		const sig = req.headers["stripe-signature"];
		let event;

		try {
			event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
		} catch (err) {
			console.log(`Webhook signature verification failed.`, err.message);
			return res.status(400).send(`Webhook Error: ${err.message}`);
		}

		try {
			switch (event.type) {
				case "customer.subscription.created":
					await handleSubscriptionCreated(event.data.object);
					break;

				case "customer.subscription.updated":
					await handleSubscriptionUpdated(event.data.object);
					break;

				case "customer.subscription.deleted":
					await handleSubscriptionDeleted(event.data.object);
					break;

				case "customer.subscription.trial_will_end":
					await handleTrialWillEnd(event.data.object);
					break;

				case "invoice.payment_succeeded":
					await handleInvoiceBilling(event.data.object, "succeeded");
					break;

				case "invoice.payment_failed":
					await handleInvoiceBilling(event.data.object, "failed");
					break;

				case "checkout.session.completed":
					await handleCheckoutCompleted(event.data.object);
					break;

				case "checkout.session.async_payment_succeeded":
					await handleCheckoutPayment(event.data.object, "succeeded");
					break;

				case "checkout.session.async_payment_failed":
					await handleCheckoutPayment(event.data.object, "failed");
					break;

				case "customer.updated":
				case "customer.created":
				case "payment_method.attached":
				case "setup_intent.succeeded":
				case "setup_intent.created":
				case "invoice.created":
				case "checkout.session.completed":
				case "invoice.finalized":
				case "invoice.paid":
					// console.log(`Event ${event.type} received and acknowledged`);
					break;

				default:
				// console.log(`Unhandled event type ${event.type}`);
			}

			res.json({ received: true });
		} catch (error) {
			console.error("Webhook handling error:", error);
			res.status(500).json({ error: "Webhook handling failed" });
		}
	}
);

// Webhook handlers
async function handleCheckoutCompleted(session) {
	console.log("Handling checkout completed...");
	const upgradeTypes = ["subscription_upgrade", "trial_upgrade"];

	if (
		!session.metadata?.type ||
		!upgradeTypes.includes(session.metadata.type)
	) {
		return;
	}

	if (session.payment_status !== "paid") {
		return;
	}

	const { subscriptionId, newPriceId } = session.metadata;

	if (!subscriptionId || !newPriceId) {
		console.error("Missing required metadata in checkout session");
		return;
	}

	try {
		const subscription = await stripe.subscriptions.retrieve(subscriptionId);

		const updateParams = {
			items: [
				{
					id: subscription.items.data[0].id,
					price: newPriceId,
				},
			],
			proration_behavior: "none",
		};

		// If upgrading from trial, end the trial and start billing immediately
		if (
			session.metadata.type === "trial_upgrade" &&
			subscription.status === "trialing"
		) {
			updateParams.trial_end = "now";
			updateParams.billing_cycle_anchor = "now"; // Start billing period NOW
		}

		// Update Stripe subscription - this fires customer.subscription.updated
		await stripe.subscriptions.update(subscriptionId, updateParams);
	} catch (error) {
		console.error(`Error updating subscription:`, error);
		throw error;
	}
}

async function handleSubscriptionCreated(subscription) {
	const userId = subscription.metadata?.userId;
	if (!userId) {
		console.error("No userId in subscription metadata");
		return;
	}

	// Extract price ID and tier information
	const priceId = getPriceIdFromSubscription(subscription);
	if (!priceId) {
		console.error("Could not extract price ID from subscription");
		return;
	}

	const { tier, tierValue } = getTierInfoFromPriceId(priceId);

	const updateData = {
		"subscription.stripeCustomerId": subscription.customer,
		"subscription.stripeSubscriptionId": subscription.id,
		"subscription.stripePriceId": priceId,
		"subscription.status": subscription.status,
		"subscription.tier": tier,
		"subscription.tierValue": tierValue,
		"subscription.lastWebhookEvent": "subscription.created",
		"subscription.lastWebhookTimestamp": new Date(),
		"subscription.updatedAt": new Date(),
	};

	// Set trial flag if user is on trial
	if (subscription.trial_start) {
		updateData["subscription.hasUsedTrial"] = true;
		updateData["subscription.trialStart"] = new Date(
			subscription.trial_start * 1000
		);
	}

	if (subscription.trial_end) {
		updateData["subscription.trialEnd"] = new Date(
			subscription.trial_end * 1000
		);
	}

	// Only set period dates if they exist (not always present during trial)
	if (subscription.current_period_start) {
		updateData["subscription.currentPeriodStart"] = new Date(
			subscription.current_period_start * 1000
		);
	}

	if (subscription.current_period_end) {
		updateData["subscription.currentPeriodEnd"] = new Date(
			subscription.current_period_end * 1000
		);
	}

	await User.findByIdAndUpdate(userId, updateData);
}

async function handleSubscriptionUpdated(subscription) {
	console.log("Handling subscription updated...");
	const userId = subscription.metadata?.userId;
	if (!userId) {
		console.error("No userId in subscription metadata");
		return;
	}

	const freshSubscription = await stripe.subscriptions.retrieve(
		subscription.id
	);

	// NEW: Get period from subscription items, not subscription
	const subscriptionItem = freshSubscription.items.data[0];

	const priceId = subscriptionItem.price.id; // Also get price from item now

	const { tier, tierValue } = getTierInfoFromPriceId(priceId);

	const updateData = {
		"subscription.stripePriceId": priceId,
		"subscription.tier": tier,
		"subscription.tierValue": tierValue,
		"subscription.status": freshSubscription.status,
		"subscription.cancelAtPeriodEnd": freshSubscription.cancel_at_period_end,
		"subscription.lastWebhookEvent": "subscription.updated",
		"subscription.lastWebhookTimestamp": new Date(),
		"subscription.updatedAt": new Date(),
	};

	// Get periods from subscription ITEM, not subscription
	if (subscriptionItem.current_period_start) {
		updateData["subscription.currentPeriodStart"] = new Date(
			subscriptionItem.current_period_start * 1000
		);
	}

	if (subscriptionItem.current_period_end) {
		updateData["subscription.currentPeriodEnd"] = new Date(
			subscriptionItem.current_period_end * 1000
		);
	}

	// Clear trial dates if subscription is now active
	if (freshSubscription.status === "active" && !freshSubscription.trial_end) {
		updateData["subscription.trialEnd"] = null;
		updateData["subscription.trialStart"] = null;
	}

	if (freshSubscription.cancel_at_period_end === false) {
		updateData["subscription.pendingUpdate"] = null;
	}

	await User.findByIdAndUpdate(userId, updateData);
}

async function handleSubscriptionDeleted(subscription) {
	const userId = subscription.metadata?.userId;
	if (!userId) {
		console.error("No userId in subscription metadata");
		return;
	}

	await User.findByIdAndUpdate(userId, {
		"subscription.status": "canceled",
		"subscription.canceledAt": new Date(),
		"subscription.lastWebhookEvent": "subscription.deleted",
		"subscription.lastWebhookTimestamp": new Date(),
		"subscription.updatedAt": new Date(),
	});

	console.log(`Subscription deleted for user ${userId}`);
}

async function handleTrialWillEnd(subscription) {
	const userId = subscription.metadata?.userId;
	if (!userId) {
		console.error("No userId in subscription metadata");
		return;
	}

	// Send email notification about trial ending
	console.log(
		`Trial will end for user ${userId} on ${new Date(
			subscription.trial_end * 1000
		)}`
	);

	await User.findByIdAndUpdate(userId, {
		"subscription.lastWebhookEvent": "trial.will_end",
		"subscription.lastWebhookTimestamp": new Date(),
	});
}

async function handleInvoiceBilling(invoice, paymentStatus) {
	console.log("Handling invoice billing...");

	if (!invoice.customer_email) {
		console.error("Invoice Billing: No email found");
		return;
	}

	const user = await User.findOne({ email: invoice.customer_email });
	if (!user) {
		console.error("Invoice Billing: User not found");
		return;
	}

	// Get payment method details for BOTH succeeded and failed
	let paymentMethodDetails = {};
	let receiptUrl = null;

	if (invoice.charge) {
		try {
			const charge = await stripe.charges.retrieve(invoice.charge);
			paymentMethodDetails = {
				type: charge.payment_method_details?.type || null,
				cardBrand: charge.payment_method_details?.card?.brand || null,
				cardLast4: charge.payment_method_details?.card?.last4 || null,
				walletType: charge.payment_method_details?.card?.wallet?.type || null,
			};
			receiptUrl = charge.receipt_url || null;
		} catch (error) {
			console.error("Error fetching charge:", error);
		}
	}

	// Extract price info from line items (if exists)
	const lineItem = invoice.lines?.data?.[0];
	const priceId = lineItem?.price?.id || null;
	const productId = lineItem?.price?.product || null;
	const { tier, tierValue } = priceId
		? getTierInfoFromPriceId(priceId)
		: { tier: "Unknown", tierValue: 0 };

	// Create billing record - BOTH SUCCESS AND FAILURE
	await Billing.create({
		userId: user._id.toString(),
		email: user.email,
		stripeCustomerId: invoice.customer,
		stripeInvoiceId: invoice.id,
		stripePaymentIntentId: invoice.payment_intent,
		stripeChargeId: invoice.charge || null,
		stripePriceId: priceId,
		stripeProductId: productId,
		eventType: `invoice.payment_${paymentStatus}`,
		status: paymentStatus,
		amount:
			paymentStatus === "succeeded" ? invoice.amount_paid : invoice.amount_due,
		currency: invoice.currency,
		tier: tier,
		tierValue: tierValue,
		attemptCount: invoice.attempt_count || 0,
		paymentMethod: paymentMethodDetails,
		billingAddress: invoice.customer_address || null,
		invoiceUrl: invoice.hosted_invoice_url,
		receiptUrl: receiptUrl,
		paidAt: invoice.status_transitions?.paid_at
			? new Date(invoice.status_transitions.paid_at * 1000)
			: null,
		failedAt: paymentStatus === "failed" ? new Date() : null,
		rawEventData: invoice,
	});
}

async function handleCheckoutPayment(session, paymentStatus) {
	console.log("Handling checkout payment...");

	const email = session.customer_email || session.customer_details?.email;
	if (!email) {
		console.error("Checkout Payment: No email found");
		return;
	}

	const user = await User.findOne({ email: email });
	if (!user) {
		console.error("Checkout Payment: User not found");
		return;
	}

	// Get payment intent for transaction details
	let paymentMethodDetails = {};
	let receiptUrl = null;

	if (session.payment_intent) {
		try {
			const paymentIntent = await stripe.paymentIntents.retrieve(
				session.payment_intent,
				{ expand: ["charges.data.payment_method_details"] }
			);

			const charge = paymentIntent.charges.data[0];
			if (charge) {
				paymentMethodDetails = {
					type: charge.payment_method_details?.type || null,
					cardBrand: charge.payment_method_details?.card?.brand || null,
					cardLast4: charge.payment_method_details?.card?.last4 || null,
					walletType: charge.payment_method_details?.card?.wallet?.type || null,
				};
				receiptUrl = charge.receipt_url || null;
			}
		} catch (error) {
			console.error("Error fetching payment intent:", error);
		}
	}

	// Extract metadata from session
	const metadata = session.metadata || {};
	// const lineItem = session.line_items?.data?.[0] || null;

	// Create billing record
	await Billing.create({
		userId: user._id.toString(),
		email: email,
		stripeCustomerId: session.customer,
		stripePaymentIntentId: session.payment_intent,
		stripeCheckoutSessionId: session.id,
		eventType: `checkout.session.${paymentStatus}`,
		status: paymentStatus,
		amount: session.amount_total,
		currency: session.currency,
		tier: metadata.newTier || "Unknown",
		tierValue: session.amount_total,
		paymentMethod: paymentMethodDetails,
		billingAddress: session.customer_details?.address || null,
		receiptUrl: receiptUrl,
		paidAt: paymentStatus === "succeeded" ? new Date() : null,
		failedAt: paymentStatus === "failed" ? new Date() : null,
		metadata: metadata,
		rawEventData: session,
	});

	// Update user
	await User.findByIdAndUpdate(user._id, {
		$push: {
			billingHistory: {
				stripePaymentIntentId: session.payment_intent,
				event: `checkout.${paymentStatus}`,
				amount: session.amount_total,
				currency: session.currency,
				status: paymentStatus,
				tier: metadata.newTier,
				processedAt: new Date(),
			},
		},
	});
}

module.exports = router;
