// models/Analytics.js
const mongoose = require("mongoose");

const FirestoreTimestamp = {
	_seconds: { type: Number, required: true },
	_nanoseconds: { type: Number, required: true },
};

const AnalyticsSchema = new mongoose.Schema({
	campaignID: String,
	accountID: String,
	leadID: String,
	username: String,
	message: String,
	status: { type: String, default: "unknown" },
	platform: { type: String, default: "instagram" },
	timestamp: FirestoreTimestamp,
	createdAt: FirestoreTimestamp,
});

module.exports =
	mongoose.models.Analytics || mongoose.model("Analytics", AnalyticsSchema);
