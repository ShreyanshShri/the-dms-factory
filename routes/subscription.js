const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const express = require("express");
const router = express.Router();
const subscriptionService = require("../services/subscriptionService");
// const auth = require("../middleware/auth"); // Your auth middleware
const { authenticateToken } = require("../middleware/auth");
const User = require("../models/User");
const Billing = require("../models/Billing");

// Create subscription with trial (creates session with subscription mode)
router.post("/create", authenticateToken, async (req, res) => {
	try {
		const { tier, cancelled = false } = req.body;

		if (!["basic", "standard", "premium"].includes(tier)) {
			return res.status(400).json({ error: "Invalid tier" });
		}

		const result = await subscriptionService.createSubscriptionCheckout(
			// Changed method name
			req.user._id,
			tier
		);
		res.json(result);
	} catch (error) {
		console.error("Subscription creation error:", error);
		res.status(400).json({ error: error.message });
	}
});

// Upgrade subscription (creates session with payment mode and then upgrades manually)
router.post("/upgrade", authenticateToken, async (req, res) => {
	try {
		const { newTier } = req.body;

		if (!["basic", "standard", "premium"].includes(newTier)) {
			return res.status(400).json({ error: "Invalid tier" });
		}
		const result = await subscriptionService.upgradeSubscription(
			req.user._id,
			newTier
		);
		res.json(result);
	} catch (error) {
		console.error("Subscription upgrade error:", error);
		res.status(400).json({ error: error.message });
	}
});

// Upgrade from trial to paid immediately (creates session with payment mode and then upgrades manually)
router.post("/upgrade-trial", authenticateToken, async (req, res) => {
	try {
		const { newTier } = req.body;

		if (!["basic", "standard", "premium"].includes(newTier)) {
			return res.status(400).json({ error: "Invalid tier" });
		}

		const result = await subscriptionService.upgradeFromTrial(
			req.user._id,
			newTier
		);
		res.json(result);
	} catch (error) {
		console.error("Trial upgrade error:", error);
		res.status(400).json({ error: error.message });
	}
});

// Reactivate subscription (doesnt do shit for now...)
router.post("/reactivate", authenticateToken, async (req, res) => {
	try {
		if (req.user.subscription.cancelAtPeriodEnd) {
			const result = await subscriptionService.reactivateSubscription(
				req.user._id
			);
			return res.json({ ...result, method: "reactivate" });
		} else {
			const result = await subscriptionService.createSubscriptionCheckout(
				req.user._id,
				req.user.subscription.tier
			);
			return res.json({ ...result, method: "checkout" });
		}
	} catch (error) {
		console.error("Subscription reactivation error:", error);
		res.status(400).json({ error: error.message });
	}
});

// Cancel subscription
router.post("/cancel", authenticateToken, async (req, res) => {
	try {
		const { immediate } = req.body;
		const result = await subscriptionService.cancelSubscription(
			req.user._id,
			immediate
		);
		res.json(result);
	} catch (error) {
		console.error("Subscription cancellation error:", error);
		res.status(400).json({ error: error.message });
	}
});

// Get subscription status
router.get("/status", authenticateToken, async (req, res) => {
	try {
		const user = await User.findById(req.user._id);
		res.json({
			subscription: user.subscription,
			billingHistory: user.billingHistory.slice(-10), // Last 10 transactions
		});
	} catch (error) {
		console.error("Error fetching subscription status:", error);
		res.status(500).json({ error: "Internal server error" });
	}
});

// Get detailed subscription info for manage page
router.get("/manage", authenticateToken, async (req, res) => {
	try {
		// const user = await User.findById(req.user._id);
		// if (!user) {
		// 	return res.status(400).json({ error: "User not found" });
		// }
		const user = req.user;

		const subscription = user.subscription;
		let stripeSubscription = null;

		// Get latest info from Stripe if subscription exists
		if (subscription.stripeSubscriptionId) {
			try {
				stripeSubscription = await stripe.subscriptions.retrieve(
					subscription.stripeSubscriptionId
				);
			} catch (error) {
				console.error("Error fetching Stripe subscription:", error);
			}
		}

		// Calculate days remaining
		const now = new Date();
		const currentPeriodEnd = subscription.currentPeriodEnd
			? new Date(subscription.currentPeriodEnd)
			: null;
		const trialEnd = subscription.trialEnd
			? new Date(subscription.trialEnd)
			: null;

		let daysRemaining = 0;
		if (subscription.status === "trialing" && trialEnd) {
			daysRemaining = Math.max(
				0,
				Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
			);
		} else if (currentPeriodEnd) {
			daysRemaining = Math.max(
				0,
				Math.ceil(
					(currentPeriodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
				)
			);
		}

		const billingRecords = await Billing.find({
			userId: req.user._id.toString(),
		})
			.sort({ createdAt: -1 })
			.limit(50)
			.select("-rawEventData") // Exclude heavy raw data
			.lean();

		res.json({
			subscription: {
				...subscription,
				daysRemaining,
				stripeStatus: stripeSubscription?.status,
			},
			billingHistory: billingRecords,
		});
	} catch (error) {
		console.error("Error fetching subscription details:", error);
		res.status(500).json({ error: "Internal server error" });
	}
});

router.get(
	"/checkout/success/:sessionId",
	authenticateToken,
	async (req, res) => {
		try {
			const { sessionId } = req.params;

			// Retrieve the checkout session from Stripe
			const session = await stripe.checkout.sessions.retrieve(sessionId);

			if (!session) {
				return res.status(404).json({ error: "Session not found" });
			}

			// Build response based on what exists in the session
			const response = {
				success: session.payment_status === "paid",
				payment_status: session.payment_status,
				mode: session.mode,
				amount_total: session.amount_total,
				currency: session.currency,
				customer: session.customer_details,
				metadata: session.metadata,
			};

			// Add subscription data if it exists (subscription mode)
			if (session.subscription) {
				const subscription = await stripe.subscriptions.retrieve(
					session.subscription
				);
				response.subscription = {
					id: subscription.id,
					status: subscription.status,
					currentPeriodEnd: subscription.current_period_end,
					trialEnd: subscription.trial_end,
				};
			}

			// Add payment intent if it exists (payment mode)
			if (session.payment_intent) {
				response.payment_intent = session.payment_intent;
			}
			res.json(response);
		} catch (error) {
			console.error("Error fetching checkout success:", error);
			res.status(500).json({ error: "Failed to verify session" });
		}
	}
);

module.exports = router;
