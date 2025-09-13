const express = require("express");
const router = express.Router();

const { authenticateToken } = require("../middleware/auth");

const {
	InstagramAccount,
	InstagramConversation,
} = require("../models/Instagram");
const CRMContact = require("../models/CRMContacts");
const CRMPipeline = require("../models/CRMPipeline");

// Get or create user's pipeline with default stages
router.get("/pipeline", authenticateToken, async (req, res) => {
	try {
		let pipeline = await CRMPipeline.findOne({ userId: req.user.uid }).lean();

		if (!pipeline) {
			// Create default pipeline
			const defaultPipeline = new CRMPipeline({
				userId: req.user.uid,
				name: "Sales Pipeline",
				description: "Default pipeline",
				stages: [
					{ id: "new_lead", name: "New Lead", color: "#6ac0ff", order: 0 },
					{ id: "interested", name: "Interested", color: "#86ff86", order: 1 },
					{
						id: "not_interested",
						name: "Not Interested",
						color: "#ff8598",
						order: 2,
					},
				],
				createdAt: new Date(),
				updatedAt: new Date(),
			});
			await defaultPipeline.save();
			pipeline = defaultPipeline.toObject();
		}

		res.json({ success: true, pipeline });
	} catch (error) {
		console.error("Error fetching pipeline:", error);
		res.status(500).json({ error: "Failed to fetch pipeline" });
	}
});

// Add new stage to pipeline
router.post("/stages", authenticateToken, async (req, res) => {
	try {
		const { name, color } = req.body;
		if (!name) return res.status(400).json({ error: "Stage name is required" });

		const pipeline = await CRMPipeline.findOne({ userId: req.user.uid });
		if (!pipeline) return res.status(404).json({ error: "Pipeline not found" });

		const newStage = {
			id: `stage_${Date.now()}`,
			name,
			color: color || "#f0f0f0",
			order: pipeline.stages.length,
		};

		pipeline.stages.push(newStage);
		pipeline.updatedAt = new Date();

		await pipeline.save();

		res.json({ success: true, stage: newStage });
	} catch (error) {
		console.error("Error creating stage:", error);
		res.status(500).json({ error: "Failed to create stage" });
	}
});

// Update stage
router.patch("/stages/:stageId", authenticateToken, async (req, res) => {
	try {
		const { stageId } = req.params;
		const { name, color } = req.body;

		const pipeline = await CRMPipeline.findOne({ userId: req.user.uid });
		if (!pipeline) return res.status(404).json({ error: "Pipeline not found" });

		const updatedStages = pipeline.stages.map((stage) =>
			stage.id === stageId
				? {
						...stage.toObject(),
						name: name || stage.name,
						color: color || stage.color,
				  }
				: stage
		);

		pipeline.stages = updatedStages;
		pipeline.updatedAt = new Date();
		await pipeline.save();

		const updatedStage = updatedStages.find((stage) => stage.id === stageId);

		res.json({ success: true, stage: updatedStage });
	} catch (error) {
		console.error("Error updating stage:", error);
		res.status(500).json({ error: "Failed to update stage" });
	}
});

// Delete stage and reassign contacts
router.delete("/stages/:stageId", authenticateToken, async (req, res) => {
	try {
		const { stageId } = req.params;

		const pipeline = await CRMPipeline.findOne({ userId: req.user.uid });
		if (!pipeline) return res.status(404).json({ error: "Pipeline not found" });

		pipeline.stages = pipeline.stages.filter((stage) => stage.id !== stageId);
		pipeline.updatedAt = new Date();
		await pipeline.save();

		const firstStageId = pipeline.stages[0]?.id || "new_lead";

		// Reassign contacts belonging to deleted stage to first stage
		await CRMContact.updateMany({ stageId }, { stageId: firstStageId });

		res.json({ success: true });
	} catch (error) {
		console.error("Error deleting stage:", error);
		res.status(500).json({ error: "Failed to delete stage" });
	}
});

// Get contacts with their CRM data
router.get("/contacts", authenticateToken, async (req, res) => {
	try {
		const accounts = await InstagramAccount.find({ user: req.user.uid }).lean();
		const accountIds = accounts.map((acc) => acc.user_id);

		if (accountIds.length === 0) {
			return res.json({ success: true, contacts: [] });
		}

		let conversations = [];
		for (const accountId of accountIds) {
			const convs = await InstagramConversation.find({
				webhook_owner_id: accountId,
			}).lean();

			const filteredConvs = convs.filter((conv) =>
				conv.messages?.some((msg) => msg.sender_id !== accountId)
			);

			conversations = conversations.concat(filteredConvs);
		}

		const contactPromises = conversations.map(async (conv) => {
			let crmData = {
				stageId: "new_lead",
				notes: "",
				tags: [],
				priority: "medium",
				createdAt: Date.now(),
				updatedAt: Date.now(),
			};

			const crmContact = await CRMContact.findById(conv._id).lean();
			if (crmContact) {
				crmData = { ...crmData, ...crmContact };
			}

			return {
				...conv,
				crm: crmData,
			};
		});

		const contacts = await Promise.all(contactPromises);
		res.json({ success: true, contacts });
	} catch (error) {
		console.error("Error fetching contacts:", error);
		res.status(500).json({ error: "Failed to fetch contacts" });
	}
});

// Update contact stage
router.patch(
	"/contacts/:contactId/stage",
	authenticateToken,
	async (req, res) => {
		try {
			const { contactId } = req.params;
			const { stageId } = req.body;

			if (!stageId)
				return res.status(400).json({ error: "Stage ID is required" });

			await CRMContact.findByIdAndUpdate(
				contactId,
				{
					stageId,
					updatedAt: new Date(),
				},
				{ new: true, upsert: true }
			);

			res.json({ success: true });
		} catch (error) {
			console.error("Error updating contact stage:", error);
			res.status(500).json({ error: "Failed to update contact stage" });
		}
	}
);

// Update contact notes
router.patch(
	"/contacts/:contactId/notes",
	authenticateToken,
	async (req, res) => {
		try {
			const { contactId } = req.params;
			const { notes } = req.body;

			await CRMContact.findByIdAndUpdate(
				contactId,
				{
					notes: notes || "",
					updatedAt: new Date(),
				},
				{ new: true, upsert: true }
			);

			res.json({ success: true });
		} catch (error) {
			console.error("Error updating contact notes:", error);
			res.status(500).json({ error: "Failed to update contact notes" });
		}
	}
);

// Reorder stages
router.patch("/stages/reorder", authenticateToken, async (req, res) => {
	try {
		const { stageIds } = req.body;

		const pipeline = await CRMPipeline.findOne({ userId: req.user.uid });
		if (!pipeline) return res.status(404).json({ error: "Pipeline not found" });

		const reorderedStages = stageIds.map((stageId, index) => {
			const stage = pipeline.stages.find((s) => s.id === stageId);
			return { ...stage.toObject(), order: index };
		});

		pipeline.stages = reorderedStages;
		pipeline.updatedAt = new Date();
		await pipeline.save();

		res.json({ success: true, stages: reorderedStages });
	} catch (error) {
		console.error("Error reordering stages:", error);
		res.status(500).json({ error: "Failed to reorder stages" });
	}
});

module.exports = router;
