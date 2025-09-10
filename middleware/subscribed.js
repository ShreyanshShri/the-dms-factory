// subscribed.js (updated)

const subscribed = async (req, res, next) => {
	const user = req.user;
	const subscription = user.subscription || {};

	// Check if user has an active subscription based on webhook logic
	const isActive = subscription.status === "active";
	const isValid = subscription.valid !== false; // Handle undefined as valid
	const notExpired =
		!subscription.expiresAt || new Date(subscription.expiresAt) > new Date();
	const notEndedYet =
		!subscription.currentPeriodEnd ||
		new Date(subscription.currentPeriodEnd) > new Date();

	const isSubscribed = isActive && isValid && notExpired && notEndedYet;

	if (isSubscribed) {
		// Add comprehensive subscription info to request for use in routes
		req.subscriptionInfo = {
			tier: subscription.tier || "Unknown",
			tierValue: subscription.tierValue || 0,
			planId: subscription.planId || null,
			status: subscription.status || "unknown",
			valid: subscription.valid,
			currentPeriodEnd: subscription.currentPeriodEnd || null,
			expiresAt: subscription.expiresAt || null,
			cancelAtPeriodEnd: subscription.cancelAtPeriodEnd || false,
			licenseKey: subscription.licenseKey || null,
			whopMembershipId: subscription.whopMembershipId || null,
			lastEvent: subscription.lastEvent || null,
			updatedAt: subscription.updatedAt || null,
		};

		next();
	} else {
		return res.status(403).json({
			success: false,
			message: "Not subscribed or subscription expired",
			subscriptionInfo: {
				tier: subscription.tier || null,
				status: subscription.status || "inactive",
				expiresAt: subscription.expiresAt || null,
				currentPeriodEnd: subscription.currentPeriodEnd || null,
				reason: !isActive
					? "inactive"
					: !isValid
					? "invalid"
					: !notExpired
					? "expired"
					: "period_ended",
			},
		});
	}
};

module.exports = { subscribed };
