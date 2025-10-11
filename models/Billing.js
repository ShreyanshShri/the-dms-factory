const mongoose = require("mongoose");

const BillingSchema = new mongoose.Schema({
	// User info
	userId: { type: String, required: true, index: true },
	email: { type: String, required: true, index: true },

	// Stripe transaction IDs
	stripeCustomerId: { type: String, required: true, index: true },
	stripeInvoiceId: { type: String, required: true, unique: true, index: true },
	stripeCheckoutSessionId: { type: String, default: null, index: true },
	stripePaymentIntentId: { type: String, default: null, index: true },
	stripeChargeId: { type: String, default: null },
	stripePriceId: { type: String, default: null },
	stripeProductId: { type: String, default: null },

	// Event tracking
	eventType: {
		type: String,
		required: true,
		index: true,
	},

	// Payment status - succeeded OR failed
	status: {
		type: String,
		required: true,
		enum: ["succeeded", "failed", "pending"],
		index: true,
	},

	// Transaction amounts
	amount: { type: Number, required: true },
	currency: { type: String, required: true, default: "usd" },
	tier: { type: String, default: "Unknown" },
	tierValue: { type: Number, default: 0 },

	// Payment attempt tracking
	attemptCount: { type: Number, default: 0 },

	// Payment method
	paymentMethod: {
		type: { type: String, default: null },
		cardBrand: { type: String, default: null },
		cardLast4: { type: String, default: null },
		walletType: { type: String, default: null },
	},

	billingAddress: { type: mongoose.Schema.Types.Mixed, default: null },

	// Timestamps
	createdAt: { type: Date, default: Date.now, index: true },
	paidAt: { type: Date, default: null },
	failedAt: { type: Date, default: null },

	// URLs
	invoiceUrl: { type: String, default: null },
	receiptUrl: { type: String, default: null },

	// Raw data
	rawEventData: { type: mongoose.Schema.Types.Mixed, default: {} },
});

// Indexes
BillingSchema.index({ stripeCustomerId: 1, createdAt: -1 });
BillingSchema.index({ userId: 1, status: 1 });
BillingSchema.index({ email: 1, status: 1 });

module.exports = mongoose.model("Billing", BillingSchema);
