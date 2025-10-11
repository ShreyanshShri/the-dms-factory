const mongoose = require("mongoose");

const FirestoreTimestamp = {
	_seconds: { type: Number, required: true },
	_nanoseconds: { type: Number, required: true },
};

const LeadSchema = new mongoose.Schema({
	campaignId: { type: String, required: true },
	username: { type: String, required: true },
	type: { type: String, default: "initial" },
	baseDate: FirestoreTimestamp,
	assignedAt: FirestoreTimestamp,
	followUps: [{ type: mongoose.Schema.Types.Mixed }],
	assignedAccount: { type: String, default: "" },
	lastReassignedAt: FirestoreTimestamp,
	sent: { type: Boolean, default: false },
	status: { type: String, default: "ready" },
	previousAccount: { type: String },
	reassignmentCount: { type: Number, default: 0 },
	initialDM: { type: String },
});

module.exports = mongoose.model("Lead", LeadSchema);
