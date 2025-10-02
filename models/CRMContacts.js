const mongoose = require("mongoose");

const CRMContactSchema = new mongoose.Schema(
	{
		_id: { type: String, required: true }, // Use conversationId or any unique ID for contact
		stageId: { type: String, default: "new_lead" },
		notes: { type: String, default: "" },
		tags: { type: [String], default: [] },
		priority: { type: String, default: "medium" },
	},
	{ timestamps: true }
);

module.exports = mongoose.model("CRMContact", CRMContactSchema, "crm_contacts");
