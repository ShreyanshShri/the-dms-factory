// routes/crm.js
const express = require("express");
const { db, admin } = require("../config/firebase");
const { authenticateToken } = require("../middleware/auth");
const router = express.Router();

// Get user's pipeline with custom stages
router.get("/pipeline", authenticateToken, async (req, res) => {
	try {
		const pipelineSnap = await db
			.collection("crm_pipelines")
			.where("userId", "==", req.user.uid)
			.limit(1)
			.get();

		let pipeline;
		if (pipelineSnap.empty) {
			// Create default pipeline with default stages
			const defaultPipeline = {
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
				createdAt: admin.firestore.FieldValue.serverTimestamp(),
				updatedAt: admin.firestore.FieldValue.serverTimestamp(),
			};

			const docRef = await db.collection("crm_pipelines").add(defaultPipeline);
			pipeline = { id: docRef.id, ...defaultPipeline };
		} else {
			const doc = pipelineSnap.docs[0];
			pipeline = { id: doc.id, ...doc.data() };
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

		if (!name) {
			return res.status(400).json({ error: "Stage name is required" });
		}

		// Get current pipeline
		const pipelineSnap = await db
			.collection("crm_pipelines")
			.where("userId", "==", req.user.uid)
			.limit(1)
			.get();

		if (pipelineSnap.empty) {
			return res.status(404).json({ error: "Pipeline not found" });
		}

		const pipelineDoc = pipelineSnap.docs[0];
		const pipeline = pipelineDoc.data();

		// Create new stage
		const newStage = {
			id: `stage_${Date.now()}`,
			name,
			color: color || "#f0f0f0",
			order: pipeline.stages.length,
		};

		// Add stage to pipeline
		const updatedStages = [...pipeline.stages, newStage];

		await pipelineDoc.ref.update({
			stages: updatedStages,
			updatedAt: admin.firestore.FieldValue.serverTimestamp(),
		});

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

		const pipelineSnap = await db
			.collection("crm_pipelines")
			.where("userId", "==", req.user.uid)
			.limit(1)
			.get();

		if (pipelineSnap.empty) {
			return res.status(404).json({ error: "Pipeline not found" });
		}

		const pipelineDoc = pipelineSnap.docs[0];
		const pipeline = pipelineDoc.data();

		// Update the specific stage
		const updatedStages = pipeline.stages.map((stage) =>
			stage.id === stageId
				? { ...stage, name: name || stage.name, color: color || stage.color }
				: stage
		);

		await pipelineDoc.ref.update({
			stages: updatedStages,
			updatedAt: admin.firestore.FieldValue.serverTimestamp(),
		});

		const updatedStage = updatedStages.find((s) => s.id === stageId);
		res.json({ success: true, stage: updatedStage });
	} catch (error) {
		console.error("Error updating stage:", error);
		res.status(500).json({ error: "Failed to update stage" });
	}
});

// Delete stage
router.delete("/stages/:stageId", authenticateToken, async (req, res) => {
	try {
		const { stageId } = req.params;

		const pipelineSnap = await db
			.collection("crm_pipelines")
			.where("userId", "==", req.user.uid)
			.limit(1)
			.get();

		if (pipelineSnap.empty) {
			return res.status(404).json({ error: "Pipeline not found" });
		}

		const pipelineDoc = pipelineSnap.docs[0];
		const pipeline = pipelineDoc.data();

		// Remove the stage
		const updatedStages = pipeline.stages.filter(
			(stage) => stage.id !== stageId
		);

		await pipelineDoc.ref.update({
			stages: updatedStages,
			updatedAt: admin.firestore.FieldValue.serverTimestamp(),
		});

		// Move all contacts in deleted stage to first stage
		const batch = db.batch();
		const contactsSnap = await db
			.collection("crm_contacts")
			.where("stageId", "==", stageId)
			.get();

		const firstStageId = updatedStages[0]?.id || "new_lead";
		contactsSnap.docs.forEach((doc) => {
			batch.update(doc.ref, { stageId: firstStageId });
		});

		await batch.commit();

		res.json({ success: true });
	} catch (error) {
		console.error("Error deleting stage:", error);
		res.status(500).json({ error: "Failed to delete stage" });
	}
});

// Get contacts with their CRM data
router.get("/contacts", authenticateToken, async (req, res) => {
	try {
		// Get user's conversations
		const accountsSnap = await db
			.collection("instagram_accounts")
			.where("user", "==", req.user.uid)
			.get();

		const accountIds = accountsSnap.docs.map((doc) => doc.data().user_id);

		if (accountIds.length === 0) {
			return res.json({ success: true, contacts: [] });
		}

		let conversations = [];

		// Get conversations for all user accounts
		for (const accountId of accountIds) {
			const conversationsSnap = await db
				.collection("instagram_conversations")
				.where("webhook_owner_id", "==", String(accountId))
				.get();

			conversationsSnap.forEach((doc) => {
				conversations.push({ id: doc.id, ...doc.data() });
			});
		}

		// Get CRM data for these conversations
		const contactPromises = conversations.map(async (conv) => {
			const crmSnap = await db.collection("crm_contacts").doc(conv.id).get();

			let crmData = {
				stageId: "new_lead",
				notes: "",
				tags: [],
				priority: "medium",
				createdAt: Date.now(),
				updatedAt: Date.now(),
			};

			if (crmSnap.exists) {
				crmData = { ...crmData, ...crmSnap.data() };
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

// Update contact stage (for drag and drop)
router.patch(
	"/contacts/:contactId/stage",
	authenticateToken,
	async (req, res) => {
		try {
			const { contactId } = req.params;
			const { stageId } = req.body;

			if (!stageId) {
				return res.status(400).json({ error: "Stage ID is required" });
			}

			await db.collection("crm_contacts").doc(contactId).set(
				{
					stageId,
					updatedAt: admin.firestore.FieldValue.serverTimestamp(),
				},
				{ merge: true }
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

			await db
				.collection("crm_contacts")
				.doc(contactId)
				.set(
					{
						notes: notes || "",
						updatedAt: admin.firestore.FieldValue.serverTimestamp(),
					},
					{ merge: true }
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
		const { stageIds } = req.body; // Array of stage IDs in new order

		const pipelineSnap = await db
			.collection("crm_pipelines")
			.where("userId", "==", req.user.uid)
			.limit(1)
			.get();

		if (pipelineSnap.empty) {
			return res.status(404).json({ error: "Pipeline not found" });
		}

		const pipelineDoc = pipelineSnap.docs[0];
		const pipeline = pipelineDoc.data();

		// Reorder stages based on provided order
		const reorderedStages = stageIds.map((stageId, index) => {
			const stage = pipeline.stages.find((s) => s.id === stageId);
			return { ...stage, order: index };
		});

		await pipelineDoc.ref.update({
			stages: reorderedStages,
			updatedAt: admin.firestore.FieldValue.serverTimestamp(),
		});

		res.json({ success: true, stages: reorderedStages });
	} catch (error) {
		console.error("Error reordering stages:", error);
		res.status(500).json({ error: "Failed to reorder stages" });
	}
});

module.exports = router;
