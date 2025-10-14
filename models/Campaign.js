const mongoose = require("mongoose");

const FirestoreTimestamp = {
	_seconds: { type: Number, required: true },
	_nanoseconds: { type: Number, required: true },
};

const CampaignSchema = new mongoose.Schema({
	userId: { type: String, required: true },
	name: { type: String },
	description: { type: String },
	context: { type: String, default: "" },
	platform: { type: String, enum: ["instagram", "twitter"] },
	totalLeads: { type: Number, default: 0 },
	variants: [
		{
			message: { type: String, required: true },
		},
	],
	workingHours: {
		start: { type: Number, default: 0 },
		end: { type: Number, default: 24 },
	},
	messageLimits: {
		min: { type: Number, default: 35 },
		max: { type: Number, default: 41 },
	},
	followUser: { type: Boolean, default: false },
	autoLikeStory: { type: Boolean, default: false },
	autoLikeNewestPost: { type: Boolean, default: false },
	withinWorkingHours: { type: Boolean, default: true },
	createdAt: FirestoreTimestamp,
	updatedAt: FirestoreTimestamp,
	status: { type: String, default: "ready" },
	lastUpdated: FirestoreTimestamp,
});

module.exports =
	mongoose.models.Campaign || mongoose.model("Campaign", CampaignSchema);
