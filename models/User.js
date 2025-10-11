const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
	{
		uid: { type: String, required: true, unique: true },
		name: { type: String },
		email: { type: String, required: true, unique: true },
		password: { type: String, required: true },
		role: { type: String, default: "user" },

		// Stripe-specific subscription tracking
		subscription: {
			// Stripe identifiers
			stripeCustomerId: { type: String }, // Stripe customer ID
			stripeSubscriptionId: { type: String }, // Stripe subscription ID
			stripePriceId: { type: String }, // Current price ID

			status: {
				type: String,
				enum: [
					"pending",
					"active",
					"trialing",
					"past_due",
					"canceled",
					"unpaid",
					"incomplete",
					"incomplete_expired",
				],
				default: "pending",
			},

			// Plan details
			tier: {
				type: String,
				enum: ["basic", "standard", "premium"],
			},
			tierValue: { type: Number }, // 55, 97, or 149

			// Subscription timing
			currentPeriodStart: { type: Date },
			currentPeriodEnd: { type: Date },
			trialStart: { type: Date },
			trialEnd: { type: Date },

			// Subscription management
			cancelAtPeriodEnd: { type: Boolean, default: false },
			canceledAt: { type: Date },

			// Pending changes (for plan upgrades)
			pendingUpdate: {
				newTier: { type: String },
				newPriceId: { type: String },
				newTierValue: { type: Number },
				scheduledFor: { type: Date }, // When the change takes effect
			},

			// Trial tracking
			hasUsedTrial: { type: Boolean, default: false },

			// Webhook tracking
			lastWebhookEvent: { type: String },
			lastWebhookTimestamp: { type: Date },

			createdAt: { type: Date, default: Date.now },
			updatedAt: { type: Date, default: Date.now },
		},

		// Payment history
		billingHistory: [
			{
				stripeInvoiceId: { type: String },
				stripePaymentIntentId: { type: String },
				event: { type: String },
				amount: { type: Number },
				currency: { type: String, default: "usd" },
				status: { type: String },
				tier: { type: String },
				processedAt: { type: Date, default: Date.now },
				metadata: { type: mongoose.Schema.Types.Mixed },
			},
		],

		timeZone: { type: String, default: "UTC-5 (Eastern Time)" },
		notifications: {
			email: { type: Boolean, default: true },
			push: { type: Boolean, default: true },
			sms: { type: Boolean, default: false },
			errors: { type: Boolean, default: true },
			limits: { type: Boolean, default: true },
			completion: { type: Boolean, default: true },
		},
		privacy: {
			dataSharing: { type: Boolean, default: false },
			analytics: { type: Boolean, default: true },
			marketing: { type: Boolean, default: false },
		},
	},
	{
		timestamps: true,
	}
);

// Indexes for efficient queries
UserSchema.index({ email: 1, "subscription.stripeCustomerId": 1 });
UserSchema.index({
	"subscription.status": 1,
	"subscription.currentPeriodEnd": 1,
});
UserSchema.index({ "subscription.stripeSubscriptionId": 1 });

module.exports = mongoose.model("User", UserSchema);
