const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
	{
		uid: { type: String, required: true, unique: true },
		name: { type: String },
		email: { type: String, required: true, unique: true }, // Made required since webhooks rely on email
		password: { type: String, required: true },
		role: { type: String, default: "user" },

		// Enhanced subscription object aligned with Whop webhook data
		subscription: {
			status: {
				type: String,
				enum: ["pending", "active", "trial", "failed", "expired", "cancelled"],
				default: "pending",
			},
			lastEvent: { type: String }, // Tracks last webhook event received
			whopMembershipId: { type: String }, // Whop's membership identifier
			tier: { type: String }, // Plan tier name
			tierValue: { type: Number }, // Plan monetary value
			planId: { type: String }, // Whop plan identifier

			// Subscription period tracking
			renewalPeriodStart: { type: Date }, // From webhook data
			renewalPeriodEnd: { type: Date }, // From webhook data
			expiresAt: { type: Date }, // When membership expires

			// Subscription status flags
			valid: { type: Boolean, default: false }, // Whop membership validity
			licenseKey: { type: String }, // If applicable
			cancelAtPeriodEnd: { type: Boolean, default: false },

			// Metadata and tracking
			metadata: {
				type: mongoose.Schema.Types.Mixed, // Flexible object for webhook metadata
				default: {},
			},
			createdAt: { type: Date, default: Date.now },
			updatedAt: { type: Date, default: Date.now }, // Changed to Date for consistency

			// Payment tracking
			lastPaymentDate: { type: Date },
			nextBillingDate: { type: Date },
			trialEndsAt: { type: Date }, // For trial period tracking
		},

		// Billing history for audit trail
		billingHistory: [
			{
				event: { type: String }, // webhook event type
				amount: { type: Number },
				currency: { type: String, default: "USD" },
				status: { type: String },
				whopPaymentId: { type: String },
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
		timestamps: true, // Automatic createdAt/updatedAt for the document
	}
);

// Add index for webhook processing efficiency
UserSchema.index({ email: 1, "subscription.whopMembershipId": 1 });
UserSchema.index({ "subscription.status": 1, "subscription.expiresAt": 1 });

module.exports = mongoose.model("User", UserSchema);
