const mongoose = require("mongoose");

// Stage subdocument schema
const StageSchema = new mongoose.Schema(
	{
		id: { type: String, required: true, unique: true },
		name: { type: String, required: true },
		color: { type: String, default: "#f0f0f0" },
		order: { type: Number, required: true },
	},
	{ _id: false }
);

const CRMPipelineSchema = new mongoose.Schema({
	userId: { type: String, required: true, index: true, unique: true },
	name: { type: String, required: true },
	description: { type: String },
	stages: { type: [StageSchema], default: [] },
	createdAt: { type: Date, default: Date.now },
	updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model(
	"CRMPipeline",
	CRMPipelineSchema,
	"crm_pipelines"
);
