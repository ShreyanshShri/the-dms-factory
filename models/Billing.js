// models/Billing.js

const mongoose = require("mongoose");

const BillingSchema = new mongoose.Schema({
	userId: { type: String, index: true }, // user id reference if available
	email: { type: String, required: true, index: true },
	transactionId: { type: String, default: null },
	membershipId: { type: String, default: null },
	planId: { type: String, default: null },
	eventType: { type: String, default: "unknown" },
	status: { type: String, default: "unknown" },
	amount: { type: Number, default: 0 },
	currency: { type: String, default: "usd" },
	tier: { type: String, default: "Unknown" },
	tierValue: { type: Number, default: 0 },

	paymentMethod: {
		type: {
			type: String,
			default: null,
		},
		cardBrand: { type: String, default: null },
		cardLast4: { type: String, default: null },
		walletType: { type: String, default: null },
	},

	billingAddress: { type: mongoose.Schema.Types.Mixed, default: null },
	refundedAmount: { type: Number, default: 0 },

	createdAt: { type: Date, default: Date.now }, // Recorded time (from webhook or now)
	paidAt: { type: Date, default: null },
	refundedAt: { type: Date, default: null },
	timestamp: { type: Date, default: Date.now }, // Internal insert timestamp

	billingReason: { type: String, default: null },

	// Membership specific fields
	licenseKey: { type: String, default: null },
	valid: { type: Boolean, default: null },
	cancelAtPeriodEnd: { type: Boolean, default: null },
	renewalPeriodStart: { type: Date, default: null },
	renewalPeriodEnd: { type: Date, default: null },
	expiresAt: { type: Date, default: null },

	affiliate: { type: mongoose.Schema.Types.Mixed, default: null },

	rawEventData: { type: mongoose.Schema.Types.Mixed, default: {} }, // Store full raw webhook event
});

module.exports = mongoose.model("Billing", BillingSchema);
