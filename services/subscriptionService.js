const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const User = require("../models/User");

const PRICE_CONFIG = {
	basic: {
		priceId: process.env.STRIPE_BASIC_PRICE_ID,
		amount: 5500, // 55.00 in cents
		name: "basic",
	},
	standard: {
		priceId: process.env.STRIPE_STANDARD_PRICE_ID,
		amount: 9700, // 97.00 in cents
		name: "standard",
	},
	premium: {
		priceId: process.env.STRIPE_PREMIUM_PRICE_ID,
		amount: 14900, // 149.00 in cents
		name: "premium",
	},
};

class SubscriptionService {
	// Create checkout session for new subscription (with 14-day trial)
	async createSubscriptionCheckout(userId, tier) {
		try {
			const user = await User.findById(userId);
			if (!user) throw new Error("User not found");

			// Check if user has already used trial
			let trialPeriod = true;
			if (user.subscription.hasUsedTrial) {
				// throw new Error("Trial period already used");
				trialPeriod = false;
			}

			const priceConfig = PRICE_CONFIG[tier];
			if (!priceConfig) throw new Error("Invalid tier");

			// Get or create Stripe customer
			let customerId = user.subscription.stripeCustomerId;
			if (!customerId) {
				const customer = await stripe.customers.create({
					email: user.email,
					name: user.name,
					metadata: { userId: user._id.toString() },
				});
				customerId = customer.id;

				await User.findByIdAndUpdate(userId, {
					"subscription.stripeCustomerId": customerId,
				});
			}

			let subscription_data = {
				metadata: {
					userId: user._id.toString(),
					tier: tier,
				},
			};

			if (trialPeriod) {
				subscription_data = {
					...subscription_data,
					trial_period_days: 14,
				};
			}

			// Create checkout session with 14-day trial
			const session = await stripe.checkout.sessions.create({
				customer: customerId,
				payment_method_types: ["card"],
				mode: "subscription",
				line_items: [
					{
						price: priceConfig.priceId,
						quantity: 1,
					},
				],
				subscription_data,
				success_url: `${process.env.CLIENT_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
				cancel_url: `${process.env.CLIENT_URL}/cancel`,
				metadata: {
					userId: user._id.toString(),
					type: "new_subscription",
					tier: tier,
				},
			});

			return {
				checkoutUrl: session.url,
				sessionId: session.id,
			};
		} catch (error) {
			console.error("Error creating subscription checkout:", error);
			throw error;
		}
	}

	// Create checkout session for subscription upgrade
	async createUpgradeCheckout(userId, newTier) {
		try {
			const user = await User.findById(userId);
			if (
				!user ||
				!user.subscription.stripeSubscriptionId ||
				user.subscription.status === "canceled"
			) {
				return await this.createSubscriptionCheckout(userId, newTier);
				// throw new Error("No active subscription found");
			}

			const currentTier = user.subscription.tier;
			const newPriceConfig = PRICE_CONFIG[newTier];
			const currentPriceConfig = PRICE_CONFIG[currentTier];
			if (!newPriceConfig || !currentPriceConfig)
				throw new Error("Invalid tier");

			// Check if it's actually an upgrade
			if (newPriceConfig.amount <= currentPriceConfig.amount) {
				throw new Error("New plan must be higher tier than current plan");
			}

			// Calculate prorated amount for immediate upgrade
			const subscription = await stripe.subscriptions.retrieve(
				user.subscription.stripeSubscriptionId
			);
			const subscriptionItem = subscription.items.data[0];

			const currentPeriodStart = subscriptionItem.current_period_start;
			const currentPeriodEnd = subscriptionItem.current_period_end;
			const now = Math.floor(Date.now() / 1000);

			// Calculate prorated amount
			const timeUsed = now - currentPeriodStart;
			const totalPeriod = currentPeriodEnd - currentPeriodStart;
			const unusedTime = totalPeriod - timeUsed;
			const proratedCredit = Math.floor(
				(unusedTime / totalPeriod) * currentPriceConfig.amount
			);
			const upgradeAmount = newPriceConfig.amount - proratedCredit;
			// Create checkout session for upgrade payment
			const session = await stripe.checkout.sessions.create({
				customer: user.subscription.stripeCustomerId,
				payment_method_types: ["card"],
				mode: "payment",
				line_items: [
					{
						price_data: {
							currency: "usd",
							product_data: {
								name: `Upgrade to ${
									newTier.charAt(0).toUpperCase() + newTier.slice(1)
								} Plan`,
								description: `Prorated upgrade from ${currentTier} to ${newTier}`,
							},
							unit_amount: Math.max(upgradeAmount, 0), // Ensure non-negative
						},
						quantity: 1,
					},
				],
				success_url: `${process.env.CLIENT_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
				cancel_url: `${process.env.CLIENT_URL}/cancel`,
				metadata: {
					userId: user._id.toString(),
					type: "subscription_upgrade",
					newTier: newTier,
					subscriptionId: user.subscription.stripeSubscriptionId,
					newPriceId: newPriceConfig.priceId,
				},
			});

			return {
				checkoutUrl: session.url,
				sessionId: session.id,
				upgradeAmount: upgradeAmount / 100, // Convert to dollars for display
				proratedCredit: proratedCredit / 100,
			};
		} catch (error) {
			console.error("Error creating upgrade checkout:", error);
			throw error;
		}
	}

	// Create checkout for immediate trial to paid upgrade
	async createTrialUpgradeCheckout(userId, newTier) {
		try {
			const user = await User.findById(userId);
			if (!user || !user.subscription.stripeSubscriptionId) {
				throw new Error("No active subscription found");
			}

			const subscription = await stripe.subscriptions.retrieve(
				user.subscription.stripeSubscriptionId
			);

			if (subscription.status !== "trialing") {
				throw new Error("Subscription is not in trial period");
			}

			const newPriceConfig = PRICE_CONFIG[newTier];
			if (!newPriceConfig) throw new Error("Invalid tier");

			// Create payment checkout to collect the upgrade fee
			const session = await stripe.checkout.sessions.create({
				mode: "payment", // ✅ Payment mode, not subscription mode
				customer: user.subscription.stripeCustomerId,
				line_items: [
					{
						price_data: {
							currency: "usd",
							product_data: {
								name: `Upgrade to ${
									newTier.charAt(0).toUpperCase() + newTier.slice(1)
								} Plan`,
								description: `Upgrade from trial to ${newTier}`,
							},
							unit_amount: newPriceConfig.amount,
						},
						quantity: 1,
					},
				],
				success_url: `${process.env.CLIENT_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
				cancel_url: `${process.env.CLIENT_URL}/cancel`,
				metadata: {
					userId: user._id.toString(),
					type: "trial_upgrade",
					subscriptionId: user.subscription.stripeSubscriptionId,
					newPriceId: newPriceConfig.priceId,
					newTier: newTier,
				},
			});

			return { success: true, checkoutUrl: session.url };
		} catch (error) {
			console.error("Error creating trial upgrade checkout:", error);
			throw error;
		}
	}

	// Cancel subscription
	async cancelSubscription(userId, cancelImmediately = false) {
		try {
			const user = await User.findById(userId);
			if (!user || !user.subscription.stripeSubscriptionId) {
				throw new Error("No active subscription found");
			}

			if (cancelImmediately) {
				await stripe.subscriptions.cancel(
					user.subscription.stripeSubscriptionId
				);

				await User.findByIdAndUpdate(userId, {
					"subscription.status": "canceled",
					"subscription.canceledAt": new Date(),
					"subscription.updatedAt": new Date(),
				});
			} else {
				await stripe.subscriptions.update(
					user.subscription.stripeSubscriptionId,
					{
						cancel_at_period_end: true,
					}
				);

				await User.findByIdAndUpdate(userId, {
					"subscription.cancelAtPeriodEnd": true,
					"subscription.updatedAt": new Date(),
				});
			}

			return { success: true, canceledImmediately: cancelImmediately };
		} catch (error) {
			console.error("Error canceling subscription:", error);
			throw error;
		}
	}

	// Add these methods to your SubscriptionService class

	async createSubscription(userId, tier) {
		return this.createSubscriptionCheckout(userId, tier);
	}

	async upgradeSubscription(userId, newTier) {
		return this.createUpgradeCheckout(userId, newTier);
	}

	async upgradeFromTrial(userId, newTier) {
		return this.createTrialUpgradeCheckout(userId, newTier);
	}

	async reactivateSubscription(userId) {
		try {
			const user = await User.findById(userId);
			if (!user || !user.subscription.stripeSubscriptionId) {
				throw new Error("No subscription found to reactivate");
			}

			await stripe.subscriptions.update(
				user.subscription.stripeSubscriptionId,
				{
					cancel_at_period_end: false,
				}
			);

			return { success: true, message: "Subscription reactivated" };
		} catch (error) {
			console.error("Error reactivating subscription:", error);
			throw error;
		}
	}
}

module.exports = new SubscriptionService();
