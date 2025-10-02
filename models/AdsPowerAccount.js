const mongoose = require("mongoose");

const FirestoreTimestamp = {
	_seconds: Number,
	_nanoseconds: Number,
};

const AdsPowerAccountSchema = new mongoose.Schema({
	widgetId: String,
	userId: String,
	displayName: String,
	platform: { type: String, default: "twitter" },
	createdAt: FirestoreTimestamp,
	currentCampaignId: String,
	status: { type: String, default: "ready" },
	lastUpdated: FirestoreTimestamp,
	pendingLeadsCount: { type: Number, default: 0 },
});

module.exports = mongoose.model("AdsPowerAccount", AdsPowerAccountSchema);
