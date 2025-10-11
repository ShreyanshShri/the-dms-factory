const mongoose = require("mongoose");

const FirestoreTimestamp = {
	_seconds: Number,
	_nanoseconds: Number,
};

const AccountSchema = new mongoose.Schema({
	widgetId: String,
	userId: String,
	displayName: String,
	platform: String,
	createdAt: FirestoreTimestamp,
	currentCampaignId: String,
	status: { type: String, default: "ready" },
	lastUpdated: FirestoreTimestamp,
	pendingLeadsCount: { type: Number, default: 0 },
});

module.exports = mongoose.model("Account", AccountSchema);
