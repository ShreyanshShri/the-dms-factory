/**
 * Middleware to check if user has valid subscription
 * Automatically updates expired subscriptions
 * Assumes req.user is already populated by auth middleware
 */
const isSubscribed = async (req, res, next) => {
	try {
		// User should already be available from auth middleware
		if (!req.user) {
			return res.status(401).json({
				error: "Authentication required",
				code: "AUTH_REQUIRED",
			});
		}

		const user = req.user;

		// Check if user has subscription object
		if (!user.subscription) {
			return res.status(403).json({
				error: "No subscription found",
				code: "NO_SUBSCRIPTION",
				requiresUpgrade: true,
			});
		}

		const subscription = user.subscription;
		const now = new Date();

		// Check various expiration scenarios
		let isExpired = false;
		let needsUpdate = false;

		// Check main expiration date
		if (subscription.expiresAt && new Date(subscription.expiresAt) < now) {
			console.log("Reason for expiration: expiresAt");
			isExpired = true;
		}

		// Check renewal period end
		if (
			subscription.renewalPeriodEnd &&
			new Date(subscription.renewalPeriodEnd) < now
		) {
			console.log("Reason for expiration: renewalPeriodEnd");
			isExpired = true;
		}

		// Check trial expiration
		if (
			subscription.trialEndsAt &&
			new Date(subscription.trialEndsAt) < now &&
			subscription.status === "trial"
		) {
			console.log("Reason for expiration: trialEndsAt");
			isExpired = true;
		}

		// Check if subscription is marked as invalid by Whop
		if (subscription.valid === false) {
			console.log("Reason for expiration: valid === false");
			isExpired = true;
		}

		// Update subscription status if expired and not already marked
		// if (
		// 	isExpired &&
		// 	["active", "trial", "pending"].includes(subscription.status)
		// ) {
		// 	needsUpdate = true;
		// 	console.log("Subsciption", subscription);
		// 	// Update in database
		// 	const User = require("../models/User"); // Adjust path as needed
		// 	await User.updateOne(
		// 		{ uid: user.uid },
		// 		{
		// 			$set: {
		// 				"subscription.status": "expired",
		// 				"subscription.lastEvent": "auto_expired",
		// 				"subscription.updatedAt": now,
		// 			},
		// 		}
		// 	);

		// 	// Update the current user object for this request
		// 	subscription.status = "expired";
		// 	subscription.lastEvent = "auto_expired";
		// 	subscription.updatedAt = now;

		// 	console.log(
		// 		`🔄 Auto-expired subscription for user: ${user.email} from isSubscribed`
		// 	);
		// }

		// Determine final subscription status
		const finalStatus = isExpired ? "expired" : subscription.status;

		// Check if user has valid subscription
		const validStatuses = ["active", "trial"];

		if (!validStatuses.includes(finalStatus)) {
			return res.status(403).json({
				error: "Invalid or expired subscription",
				code: "SUBSCRIPTION_INVALID",
				status: finalStatus,
				requiresUpgrade: true,
				details: {
					currentStatus: finalStatus,
					expiresAt: subscription.expiresAt,
					renewalPeriodEnd: subscription.renewalPeriodEnd,
					trialEndsAt: subscription.trialEndsAt,
					tier: subscription.tier,
					planId: subscription.planId,
				},
			});
		}

		// Add enhanced subscription info to request
		req.subscription = {
			...subscription,
			status: finalStatus,
			isValid: true,
			timeRemaining: subscription.expiresAt
				? Math.max(
						0,
						new Date(subscription.expiresAt).getTime() - now.getTime()
				  )
				: null,
			daysRemaining: subscription.expiresAt
				? Math.max(
						0,
						Math.ceil(
							(new Date(subscription.expiresAt).getTime() - now.getTime()) /
								(1000 * 60 * 60 * 24)
						)
				  )
				: null,
		};

		// Update user object with latest subscription info
		req.user.subscription = req.subscription;

		console.log(
			`✅ Valid subscription for user: ${user.email} (${finalStatus})`
		);

		next();
	} catch (error) {
		console.error("❌ Subscription middleware error:", error);
		return res.status(500).json({
			error: "Subscription validation failed",
			code: "VALIDATION_ERROR",
		});
	}
};

/**
 * Middleware for specific tier requirements
 * @param {string|string[]} requiredTiers - Required tier(s)
 */
const requireTier = (requiredTiers) => {
	const tiers = Array.isArray(requiredTiers) ? requiredTiers : [requiredTiers];

	return (req, res, next) => {
		if (!req.subscription) {
			return res.status(403).json({
				error: "Subscription validation required first",
				code: "MISSING_SUBSCRIPTION_CHECK",
			});
		}

		const userTier = req.subscription.tier;

		if (!tiers.includes(userTier)) {
			return res.status(403).json({
				error: `Tier upgrade required`,
				code: "TIER_UPGRADE_REQUIRED",
				required: tiers,
				current: userTier,
				currentValue: req.subscription.tierValue,
				requiresUpgrade: true,
			});
		}

		next();
	};
};

/**
 * Middleware for minimum tier value requirements
 * @param {number} minValue - Minimum tier value required
 */
const requireMinTierValue = (minValue) => {
	return (req, res, next) => {
		if (!req.subscription) {
			return res.status(403).json({
				error: "Subscription validation required first",
				code: "MISSING_SUBSCRIPTION_CHECK",
			});
		}

		const userTierValue = req.subscription.tierValue || 0;

		if (userTierValue < minValue) {
			return res.status(403).json({
				error: `Higher subscription tier required`,
				code: "HIGHER_TIER_REQUIRED",
				required: minValue,
				current: userTierValue,
				currentTier: req.subscription.tier,
				requiresUpgrade: true,
			});
		}

		next();
	};
};

/**
 * Optional subscription middleware - allows access but adds subscription info
 * Works with req.user that's already populated
 */
const optionalSubscription = async (req, res, next) => {
	try {
		if (!req.user || !req.user.subscription) {
			req.subscription = null;
			return next();
		}

		const subscription = req.user.subscription;
		const now = new Date();

		// Check if expired (same logic)
		let isExpired = false;

		// Check main expiration date
		if (subscription.expiresAt && new Date(subscription.expiresAt) < now) {
			console.log("Reason for expiration: expiresAt");
			isExpired = true;
		}

		// Check renewal period end
		if (
			subscription.renewalPeriodEnd &&
			new Date(subscription.renewalPeriodEnd) < now
		) {
			console.log("Reason for expiration: renewalPeriodEnd");
			isExpired = true;
		}

		// Check trial expiration
		if (
			subscription.trialEndsAt &&
			new Date(subscription.trialEndsAt) < now &&
			subscription.status === "trial"
		) {
			console.log("Reason for expiration: trialEndsAt");
			isExpired = true;
		}

		// Check if subscription is marked as invalid by Whop
		// console.log("Subscription: ", subscription);
		if (subscription.valid === false) {
			console.log("Reason for expiration: valid === false");
			isExpired = true;
		}

		// ADD THIS: Update database if expired (same as isSubscribed)
		if (
			isExpired &&
			["active", "trial", "pending"].includes(subscription.status)
		) {
			// console.log("Subscription: ", subscription);
			// const User = require("../models/User");
			// await User.updateOne(
			// 	{ uid: req.user.uid },
			// 	{
			// 		$set: {
			// 			"subscription.status": "expired",
			// 			"subscription.lastEvent": "auto_expired",
			// 			"subscription.updatedAt": now,
			// 		},
			// 	}
			// );
			// // Update current user object
			// subscription.status = "expired";
			// subscription.lastEvent = "auto_expired";
			// subscription.updatedAt = now;
			// console.log(
			// 	`🔄 Auto-expired subscription for user: ${req.user.email} from optionalSubscription`
			// );
		}

		// const finalStatus = isExpired ? "expired" : subscription.status;
		// const isValid = ["active", "trial"].includes(finalStatus);

		// req.subscription = isValid
		// 	? {
		// 			...subscription,
		// 			status: finalStatus,
		// 			isValid: true,
		// 			timeRemaining: subscription.expiresAt
		// 				? Math.max(
		// 						0,
		// 						new Date(subscription.expiresAt).getTime() - now.getTime()
		// 				  )
		// 				: null,
		// 			daysRemaining: subscription.expiresAt
		// 				? Math.max(
		// 						0,
		// 						Math.ceil(
		// 							(new Date(subscription.expiresAt).getTime() - now.getTime()) /
		// 								(1000 * 60 * 60 * 24)
		// 						)
		// 				  )
		// 				: null,
		// 	  }
		// 	: null;

		next();
	} catch (error) {
		console.error("❌ Optional subscription middleware error:", error);
		req.subscription = null;
		next();
	}
};

/**
 * Quick subscription check - returns boolean without blocking request
 * Useful for conditional features
 */
const hasValidSubscription = (req) => {
	if (!req.user || !req.user.subscription) return false;

	const subscription = req.user.subscription;
	const now = new Date();

	// Check expiration
	if (
		(subscription.expiresAt && new Date(subscription.expiresAt) < now) ||
		(subscription.renewalPeriodEnd &&
			new Date(subscription.renewalPeriodEnd) < now) ||
		(subscription.trialEndsAt &&
			new Date(subscription.trialEndsAt) < now &&
			subscription.status === "trial") ||
		subscription.valid === false
	) {
		return false;
	}

	return ["active", "trial"].includes(subscription.status);
};

module.exports = {
	isSubscribed,
	requireTier,
	requireMinTierValue,
	optionalSubscription,
	hasValidSubscription,
};
