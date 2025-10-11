// models/DailyAnalytics.js
const mongoose = require("mongoose");

const AnalyticsSchema = new mongoose.Schema({
	campaignID: { type: String, required: true },
	date: { type: String, required: true }, // YYYY-MM-DD format
	platform: { type: String, default: "instagram" },

	// Counters
	initialDMsSent: { type: Number, default: 0 },
	followUpsSent: { type: Number, default: 0 },
	messagesFailed: { type: Number, default: 0 },
	messagesReceived: { type: Number, default: 0 },
	messagesPending: { type: Number, default: 0 },

	lastUpdated: { type: Date, default: Date.now },
});

// Compound index for fast lookups by campaign and date
AnalyticsSchema.index({ campaignID: 1, date: 1 }, { unique: true });

module.exports =
	mongoose.models.Analytics || mongoose.model("Analytics", AnalyticsSchema);
