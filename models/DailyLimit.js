const mongoose = require("mongoose");

const FirestoreTimestamp = {
	_seconds: Number,
	_nanoseconds: Number,
};

const DailyLimitSchema = new mongoose.Schema({
	accountId: { type: String, required: true },
	campaignId: { type: String }, // optional, for reference
	date: { type: String, required: true }, // e.g., "YYYY-MM-DD"
	messagesSentToday: { type: Number, default: 0 },
	messageLimitsMax: { type: Number, default: 41 },
	minMsgLimit: { type: Number, default: 35 },
	workingHours: {
		start: { type: Number, default: 0 },
		end: { type: Number, default: 24 },
	},
	createdAt: FirestoreTimestamp,
	lastMessageAt: FirestoreTimestamp,
});

module.exports = mongoose.model("DailyLimit", DailyLimitSchema);
