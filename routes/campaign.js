const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../middleware/auth");
const { subscribed } = require("../middleware/subscribed");
const { db, admin } = require("../config/firebase");

// Import services
const LeadService = require("../services/leadService");
const RateService = require("../services/rateService");
const WorkingHoursService = require("../services/workingHoursService");

// Import utils
const { createResponse, validateRequiredFields } = require("../utils/helpers");
const { HTTP_STATUS } = require("../utils/my_constants");

router.use(authenticateToken);
router.use(subscribed);

// POST /api/v1/campaign/create - Create new campaign
router.post("/create", async (req, res) => {
	try {
		const {
			name,
			description,
			platform,
			leads,
			variants,
			workingHours,
			messageLimits,
			followUser,
			autoLikeStory,
			autoLikeNewestPost,
			tag,
		} = req.body;

		const missingFields = validateRequiredFields(req.body, [
			"name",
			"platform",
			"leads",
			"variants",
		]);

		if (missingFields.length > 0) {
			return res
				.status(HTTP_STATUS.BAD_REQUEST)
				.json(
					createResponse(
						false,
						null,
						`Missing required fields: ${missingFields.join(", ")}`
					)
				);
		}

		if (!["instagram", "twitter"].includes(platform)) {
			return res
				.status(HTTP_STATUS.BAD_REQUEST)
				.json(
					createResponse(
						false,
						null,
						'Platform must be either "instagram" or "twitter"'
					)
				);
		}

		if (!Array.isArray(leads) || leads.length === 0) {
			return res
				.status(HTTP_STATUS.BAD_REQUEST)
				.json(createResponse(false, null, "Leads must be a non-empty array"));
		}

		if (!Array.isArray(variants) || variants.length === 0) {
			return res
				.status(HTTP_STATUS.BAD_REQUEST)
				.json(
					createResponse(
						false,
						null,
						"Message variants must be a non-empty array"
					)
				);
		}

		const invalidVariants = variants.filter(
			(variant) => !variant.message || variant.message.trim() === ""
		);
		if (invalidVariants.length > 0) {
			return res
				.status(HTTP_STATUS.BAD_REQUEST)
				.json(
					createResponse(
						false,
						null,
						"All variants must have a non-empty message"
					)
				);
		}

		const processedLeads = [
			...new Set(
				leads.map((lead) =>
					typeof lead === "string" ? lead.replace("@", "").trim() : lead
				)
			),
		].filter((lead) => lead && lead.length > 0);

		if (processedLeads.length === 0) {
			return res
				.status(HTTP_STATUS.BAD_REQUEST)
				.json(createResponse(false, null, "No valid leads provided"));
		}

		const campaignRef = db.collection("campaigns").doc();
		const campaignId = campaignRef.id;
		const campaignData = {
			userId: req.user.uid,
			name: name.trim(),
			tag: tag.trim(),
			description: description?.trim() || name.trim(),
			platform: platform,
			status: "ready",
			allLeads: processedLeads.join("\n") + "\n",
			totalLeads: processedLeads.length,
			variants: variants.map((variant) => ({
				message: variant.message.trim(),
			})),
			workingHours: workingHours || { start: 0, end: 24 },
			messageLimits: messageLimits || { min: 35, max: 41 },
			followUser: followUser || false,
			autoLikeStory: autoLikeStory || false,
			autoLikeNewestPost: autoLikeNewestPost || false,
			withinWorkingHours: true,
			createdAt: Date.now(),
			updatedAt: Date.now(),
			lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
		};

		await db.runTransaction(async (transaction) => {
			transaction.set(campaignRef, campaignData);

			const batchSize = 400;
			const leadBatches = [];
			for (let i = 0; i < processedLeads.length; i += batchSize) {
				leadBatches.push(processedLeads.slice(i, i + batchSize));
			}

			if (leadBatches.length > 0) {
				const firstBatch = leadBatches[0];
				firstBatch.forEach((username) => {
					const leadRef = db.collection("leads").doc();
					transaction.set(leadRef, {
						campaignId: campaignId,
						username: username,
						type: "initial",
						status: "ready",
						sent: false,
						baseDate: Date.now(),
						assignedAccount: "",
						followUps: [],
						assignedAt: null,
						lastReassignedAt: null,
						previousAccount: null,
						reassignmentCount: 0,
					});
				});
			}
		});

		if (processedLeads.length > 400) {
			const remainingLeads = processedLeads.slice(400);
			const LeadService = require("../services/leadService");
			await LeadService.createLeadsFromCampaign(campaignId, remainingLeads);
		}

		console.log(
			`Created campaign ${campaignId} with ${processedLeads.length} leads`
		);

		res.status(HTTP_STATUS.CREATED).json(
			createResponse(
				true,
				{
					id: campaignId,
					...campaignData,
					totalLeads: processedLeads.length,
				},
				"Campaign created successfully"
			)
		);
	} catch (error) {
		console.error("Error creating campaign:", error);
		res
			.status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
			.json(createResponse(false, null, "Failed to create campaign"));
	}
});

// GET /api/v1/campaign/ - Get all campaigns
router.get("/", async (req, res) => {
	try {
		const campaignsRef = db.collection("campaigns");
		const snapshot = await campaignsRef
			.where("userId", "==", req.user.uid)
			.get();

		const campaigns = [];
		snapshot.forEach((doc) => {
			campaigns.push({
				id: doc.id,
				...doc.data(),
				leads: [],
				leadsCount: doc.data().totalLeads,
			});
		});

		res.json({
			name: req.user.name || "User",
			isSubscribed: req.user.isSubscribed,
			campaigns: campaigns,
		});
	} catch (error) {
		console.error("Error fetching campaigns:", error);
		res
			.status(500)
			.json({ success: false, message: "Failed to fetch campaigns" });
	}
});

// DELETE /api/v1/campaign/:campaignId - Delete a campaign
router.delete("/:campaignId", async (req, res) => {
	try {
		const { campaignId } = req.params;
		const campaignRef = db.collection("campaigns").doc(campaignId);
		const campaignSnap = await campaignRef.get();

		if (!campaignSnap.exists) {
			return res
				.status(HTTP_STATUS.NOT_FOUND)
				.json(createResponse(false, null, "Campaign not found"));
		}

		const campaignData = campaignSnap.data();

		if (campaignData.userId !== req.user.uid) {
			return res
				.status(HTTP_STATUS.FORBIDDEN)
				.json(
					createResponse(
						false,
						null,
						"You are not authorized to delete this campaign"
					)
				);
		}

		if (campaignData.status === "active") {
			return res
				.status(HTTP_STATUS.BAD_REQUEST)
				.json(createResponse(false, null, "Cannot delete an active campaign"));
		}

		const BATCH_LIMIT = 500;
		const deleteOps = [];
		let batch = db.batch();
		let count = 0;

		const leadsQuery = db
			.collection("leads")
			.where("campaignId", "==", campaignId);
		const leadsSnap = await leadsQuery.get();

		for (const doc of leadsSnap.docs) {
			batch.delete(doc.ref);
			count++;
			if (count === BATCH_LIMIT) {
				deleteOps.push(batch.commit());
				batch = db.batch();
				count = 0;
			}
		}

		const accountsQuery = db
			.collection("accounts")
			.where("currentCampaignId", "==", campaignId);
		const accountsSnap = await accountsQuery.get();

		for (const doc of accountsSnap.docs) {
			batch.update(doc.ref, { currentCampaignId: null });
			count++;
			if (count === BATCH_LIMIT) {
				deleteOps.push(batch.commit());
				batch = db.batch();
				count = 0;
			}
		}

		batch.delete(campaignRef);
		count++;

		if (count > 0) {
			deleteOps.push(batch.commit());
		}

		await Promise.all(deleteOps);

		console.log(
			`Deleted campaign ${campaignId}, ${leadsSnap.size} leads, and updated ${accountsSnap.size} accounts`
		);

		res
			.status(HTTP_STATUS.OK)
			.json(
				createResponse(
					true,
					null,
					"Campaign, leads, and account references deleted successfully"
				)
			);
	} catch (error) {
		console.error("Error deleting campaign:", error);
		res
			.status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
			.json(createResponse(false, null, "Failed to delete campaign"));
	}
});

// POST /api/v1/campaign/start - Start campaign
router.post("/start", async (req, res) => {
	try {
		const { campaignID } = req.query;
		const { displayName, widgetId } = req.body;

		if (!campaignID || !displayName || !widgetId) {
			return res.status(400).json({
				success: false,
				message: "Missing required parameters",
			});
		}

		const campaignDoc = await db.collection("campaigns").doc(campaignID).get();
		if (!campaignDoc.exists || campaignDoc.data().userId !== req.user.uid) {
			return res
				.status(404)
				.json({ success: false, message: "Campaign not found" });
		}

		const existingAccountQuery = await db
			.collection("accounts")
			.where("userId", "==", req.user.uid)
			.where("widgetId", "==", widgetId)
			.limit(1)
			.get();

		let accountDoc;
		let accountData;

		if (!existingAccountQuery.empty) {
			accountDoc = existingAccountQuery.docs[0];
			accountData = {
				displayName,
				platform: campaignDoc.data().platform,
				status: "active",
				currentCampaignId: campaignID,
				lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
				pendingLeadsCount: 0,
			};

			await accountDoc.ref.update(accountData);

			const updatedDoc = await accountDoc.ref.get();
			accountData = { id: updatedDoc.id, ...updatedDoc.data() };
		} else {
			accountData = {
				userId: req.user.uid,
				widgetId: widgetId,
				displayName,
				platform: campaignDoc.data().platform,
				status: "active",
				currentCampaignId: campaignID,
				createdAt: Date.now(),
				lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
				pendingLeadsCount: 0,
			};

			const newAccountRef = await db.collection("accounts").add(accountData);
			accountData.id = newAccountRef.id;
		}

		await db.collection("campaigns").doc(campaignID).update({
			status: "active",
			lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
		});

		await LeadService.assignLeadsToAccount(campaignID, accountData.id, 24);

		res.json({
			success: true,
			message:
				"Campaign started, account created/updated. Lead assignment will proceed in the background.",
			accountId: accountData.id,
			account: {
				accountId: accountData.id,
				widgetId: accountData.widgetId,
				displayName: accountData.displayName,
				createdAt: accountData.createdAt,
				campaignId: accountData.currentCampaignId,
				lastUpdated: accountData.lastUpdated,
				status: accountData.status,
				pendingLeadsCount: accountData.pendingLeadsCount,
			},
		});
	} catch (error) {
		console.error("Error starting campaign:", error);
		res
			.status(500)
			.json({ success: false, message: "Failed to start campaign" });
	}
});

// PATCH /api/v1/campaign/start-all
router.patch("/start-all", async (req, res) => {
	const { campaignId } = req.query;
	if (campaignId === undefined) {
		return res
			.status(400)
			.json({ success: false, message: "Missing campaignId" });
	}

	try {
		const campaignDoc = await db.collection("campaigns").doc(campaignId).get();
		if (!campaignDoc.exists || campaignDoc.data().userId !== req.user.uid) {
			return res.status(404).json({
				success: false,
				message: "Campaign not found or access denied",
			});
		}

		const accountsSnap = await db
			.collection("accounts")
			.where("currentCampaignId", "==", campaignId)
			.get();

		const batch = db.batch();
		for (const doc of accountsSnap.docs) {
			batch.update(doc.ref, {
				status: "active",
				lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
			});
		}

		batch.update(db.collection("campaigns").doc(campaignId), {
			status: "active",
			lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
		});

		await batch.commit();

		await Promise.allSettled(
			accountsSnap.docs.map((doc) =>
				LeadService.assignLeadsToAccount(campaignId, doc.id, 24)
			)
		);

		res.json({
			success: true,
			message: "Campaign and all accounts started",
			accounts: accountsSnap.size,
		});
	} catch (e) {
		console.error("start-all error:", e);
		res.status(500).json({ success: false, message: "Bulk start failed" });
	}
});

// PATCH /api/v1/campaign/pause - Pause campaign
router.patch("/pause", async (req, res) => {
	try {
		const { campaignID, accountId } = req.query;

		if (!campaignID || !accountId) {
			return res.status(400).json({
				success: false,
				message: "Missing required parameters",
			});
		}

		// Find account by widgetId field, not document ID
		const accountSnapshot = await db
			.collection("accounts")
			.where("widgetId", "==", accountId)
			.limit(1)
			.get();

		if (accountSnapshot.empty) {
			return res.status(404).json({
				success: false,
				message: "Account not found",
			});
		}

		const accountDoc = accountSnapshot.docs[0];

		// Update using the actual document ID
		await accountDoc.ref.update({
			status: "paused",
			lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
		});

		await db.collection("campaigns").doc(campaignID).update({
			status: "paused",
			lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
		});

		// Pass the actual document ID to leadService
		await LeadService.unAssignLeads(campaignID, accountDoc.id, 24);

		res.json({ success: true, message: "Campaign paused successfully" });
	} catch (error) {
		console.error("Error pausing campaign:", error);
		res
			.status(500)
			.json({ success: false, message: "Failed to pause campaign" });
	}
});

// PATCH /api/v1/campaign/pause-all
router.patch("/pause-all", async (req, res) => {
	const { campaignId } = req.query;
	if (campaignId === undefined) {
		return res
			.status(400)
			.json({ success: false, message: "Missing campaignId" });
	}

	try {
		const campaignDoc = await db.collection("campaigns").doc(campaignId).get();
		if (!campaignDoc.exists || campaignDoc.data().userId !== req.user.uid) {
			return res.status(404).json({
				success: false,
				message: "Campaign not found or access denied",
			});
		}

		const accountsSnap = await db
			.collection("accounts")
			.where("currentCampaignId", "==", campaignId)
			.get();

		const batch = db.batch();
		for (const doc of accountsSnap.docs) {
			batch.update(doc.ref, {
				status: "paused",
				lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
			});
		}

		batch.update(db.collection("campaigns").doc(campaignId), {
			status: "paused",
			lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
		});

		await batch.commit();

		await Promise.allSettled(
			accountsSnap.docs.map((doc) =>
				LeadService.unAssignLeads(campaignId, doc.id, 24)
			)
		);

		res.json({
			success: true,
			message: "Campaign and all accounts paused",
			accounts: accountsSnap.size,
		});
	} catch (e) {
		console.error("pause-all error:", e);
		res.status(500).json({ success: false, message: "Bulk pause failed" });
	}
});

// GET /api/v1/campaign/account-status - Check account status
router.get("/account-status", async (req, res) => {
	try {
		const { widgetID } = req.query;

		if (!widgetID) {
			return res
				.status(400)
				.json({ success: false, message: "Missing widgetID" });
		}

		// FIXED: Query by widgetId field, not document ID
		const accountSnapshot = await db
			.collection("accounts")
			.where("widgetId", "==", widgetID)
			.limit(1)
			.get();

		if (accountSnapshot.empty) {
			return res
				.status(404)
				.json({ success: false, message: "Account not found" });
		}

		const accountDoc = accountSnapshot.docs[0];
		const accountData = accountDoc.data();
		const accountId = accountDoc.id; // This is the actual document ID

		const leadsSnapshot = await db
			.collection("leads")
			.where("assignedAccount", "==", accountId) // Use document ID here
			.where("status", "==", "ready")
			.get();

		accountData.pendingLeadsCount = leadsSnapshot.size;

		res.json({
			success: true,
			account: {
				accountId: accountId, // Return document ID
				widgetId: accountData.widgetId, // Return widgetId as field
				displayName: accountData.displayName,
				status: accountData.status,
				createdAt: accountData.createdAt,
				campaignId: accountData.currentCampaignId,
				lastUpdated: accountData.lastUpdated,
				pendingLeadsCount: accountData.pendingLeadsCount,
			},
		});
	} catch (error) {
		console.error("Error checking account status:", error);
		res
			.status(500)
			.json({ success: false, message: "Failed to check account status" });
	}
});

// GET /api/v1/campaign/campaign-status - Check campaign status
router.get("/campaign-status", async (req, res) => {
	try {
		const { campaignID } = req.query;

		if (!campaignID) {
			return res
				.status(400)
				.json({ success: false, message: "Missing campaignID" });
		}

		const campaignDoc = await db.collection("campaigns").doc(campaignID).get();

		if (!campaignDoc.exists) {
			return res
				.status(404)
				.json({ success: false, message: "Campaign not found" });
		}

		const campaignData = campaignDoc.data();

		const withinWorkingHours = WorkingHoursService.isWithinWorkingHours(
			campaignData.workingHours || { start: 0, end: 24 }
		);

		res.json({
			success: true,
			campaign: {
				platform: campaignData.platform,
				status: campaignData.status,
				followUser: campaignData.followUser,
				name: campaignData.name,
				description: campaignData.description,
				variants: campaignData.variants,
				id: campaignID,
				withinWorkingHours,
				sendVoiceNote: campaignData.sendVoiceNote,
				autoLikeStory: campaignData.autoLikeStory,
				autoLikeNewestPost: campaignData.autoLikeNewestPost,
			},
		});
	} catch (error) {
		console.error("Error checking campaign status:", error);
		res
			.status(500)
			.json({ success: false, message: "Failed to check campaign status" });
	}
});

// GET /api/v1/campaign/fetch-leads - Get leads for processing
router.get("/fetch-leads", async (req, res) => {
	try {
		const { campaignID, accountId } = req.query;

		if (!campaignID || !accountId) {
			return res.status(400).json({
				success: false,
				message: "Missing required parameters",
			});
		}

		const campaignDoc = await db.collection("campaigns").doc(campaignID).get();

		if (!campaignDoc.exists) {
			return res
				.status(404)
				.json({ success: false, message: "Campaign not found" });
		}

		const campaignData = campaignDoc.data();

		const withinWorkingHours = WorkingHoursService.isWithinWorkingHours(
			campaignData.workingHours || { start: 0, end: 24 }
		);

		if (!withinWorkingHours) {
			return res.status(200).json({
				success: true,
				leads: [],
				batchSize: 0,
				message: "Campaign is not within working hours",
			});
		}

		const rateInfo = await RateService.getRateLimitInfo(
			accountId,
			campaignData.workingHours || { start: 0, end: 24 },
			campaignData.messageLimits || { min: 35, max: 41 }
		);

		if (rateInfo.remainingMessages <= 0) {
			return res.json({
				success: true,
				leads: [],
				batchSize: 0,
				message: `Daily message limit reached (${rateInfo.messageLimitsMax}/${rateInfo.messageLimitsMax} sent)`,
			});
		}

		let leads = await LeadService.fetchLeadsForProcessing(
			campaignID,
			accountId,
			8
		);

		if (leads.length === 0) {
			const leadsCount = await LeadService.assignLeadsToAccount(
				campaignID,
				accountId,
				24
			);

			if (leadsCount === 0) {
				return res.status(400).json({
					success: true,
					leads: [],
					batchSize: 0,
					message: "No leads available",
				});
			} else {
				leads = await LeadService.fetchLeadsForProcessing(
					campaignID,
					accountId,
					8
				);
			}
		}

		const workingHoursInfo = WorkingHoursService.getWorkingHoursProgress();

		res.json({
			success: true,
			leads,
			batchSize: 8,
			...rateInfo,
			...workingHoursInfo,
		});
	} catch (error) {
		console.error("Error fetching leads:", error);
		res.status(500).json({ success: false, message: "Failed to fetch leads" });
	}
});

// GET /api/v1/campaign/fetch-lead - Get specific lead details
router.get("/fetch-lead", async (req, res) => {
	try {
		const { campaignID, leadID } = req.query;

		if (!campaignID || !leadID) {
			return res.status(400).json({
				success: false,
				message: "Missing required parameters",
			});
		}

		const leadDoc = await db.collection("leads").doc(leadID).get();

		if (!leadDoc.exists) {
			return res
				.status(404)
				.json({ success: false, message: "Lead not found" });
		}

		const leadData = leadDoc.data();

		res.json({
			success: true,
			lead: {
				id: leadID,
				...leadData,
				baseDateTimestamp: leadData.baseDate,
			},
		});
	} catch (error) {
		console.error("Error fetching lead:", error);
		res.status(500).json({ success: false, message: "Failed to fetch lead" });
	}
});

// PUT /api/v1/campaign/set-lead-status - Update lead status
router.put("/set-lead-status", async (req, res) => {
	try {
		const { campaignID, leadID } = req.query;

		if (!campaignID || !leadID) {
			return res.status(400).json({
				success: false,
				message: "Missing required parameters",
			});
		}

		await db.collection("leads").doc(leadID).update({
			status: "sending",
			lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
		});

		res.json({ success: true });
	} catch (error) {
		console.error("Error updating lead status:", error);
		res
			.status(500)
			.json({ success: false, message: "Failed to update lead status" });
	}
});

// POST /api/v1/campaign/check-response - Check if user responded
router.post("/check-response", async (req, res) => {
	try {
		const { campaignID, username } = req.body;

		if (!campaignID || !username) {
			return res.status(400).json({
				success: false,
				message: "Missing required parameters",
			});
		}

		const analyticsSnapshot = await db
			.collection("analytics")
			.where("campaignID", "==", campaignID)
			.where("username", "==", username)
			.orderBy("timestamp", "desc")
			.limit(1)
			.get();

		let status = "noResponse";
		if (!analyticsSnapshot.empty) {
			const latestEvent = analyticsSnapshot.docs[0].data();
			status = "found";
		}

		res.json({ success: true, status });
	} catch (error) {
		console.error("Error checking response:", error);
		res
			.status(500)
			.json({ success: false, message: "Failed to check response" });
	}
});

// POST /api/v1/campaign/analytics - Record analytics
router.post("/analytics", async (req, res) => {
	try {
		const {
			campaignID,
			accountID,
			leadID,
			username,
			message,
			status,
			platform,
		} = req.body;

		console.log("Received analytics data:", req.body);

		if (!campaignID || !accountID) {
			return res.status(400).json({
				success: false,
				message: "Missing required parameters",
			});
		}

		const analyticsData = {
			campaignID,
			accountID,
			leadID: leadID || "",
			username: username || "",
			message: message || "",
			status: status || "unknown",
			platform: platform || "instagram",
			timestamp: admin.firestore.FieldValue.serverTimestamp(),
			createdAt: Date.now(),
		};

		console.log("Adding analytics");
		await db.collection("analytics").add(analyticsData);

		await db
			.collection("leads")
			.doc(leadID)
			.update({
				status: status,
				sent: status === "initialdmsent" || status === "followup",
				lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
			});

		if (status === "initialdmsent" || status === "followup") {
			await RateService.recordMessageSent(accountID, campaignID);
		}

		res.json({ success: true });
	} catch (error) {
		console.error("Error recording analytics:", error);
		res
			.status(500)
			.json({ success: false, message: "Failed to record analytics" });
	}
});

// GET /api/v1/campaign/:campaignId - Get single campaign by ID
router.get("/:campaignId", async (req, res) => {
	try {
		const { campaignId } = req.params;

		if (!campaignId) {
			return res
				.status(HTTP_STATUS.BAD_REQUEST)
				.json(createResponse(false, null, "Campaign ID is required"));
		}

		const campaignDoc = await db.collection("campaigns").doc(campaignId).get();

		if (!campaignDoc.exists) {
			return res
				.status(HTTP_STATUS.NOT_FOUND)
				.json(createResponse(false, null, "Campaign not found"));
		}

		const campaignData = campaignDoc.data();

		if (campaignData.userId !== req.user.uid) {
			return res
				.status(HTTP_STATUS.FORBIDDEN)
				.json(createResponse(false, null, "Access denied"));
		}

		const leadsSnapshot = await db
			.collection("leads")
			.where("campaignId", "==", campaignId)
			.get();

		const sentLeadsSnapshot = await db
			.collection("leads")
			.where("campaignId", "==", campaignId)
			.where("sent", "==", true)
			.get();

		const analyticsSnapshot = await db
			.collection("analytics")
			.where("campaignID", "==", campaignId)
			.get();

		const stats = {
			totalLeads: leadsSnapshot.size,
			sentLeads: sentLeadsSnapshot.size,
			pendingLeads: leadsSnapshot.size - sentLeadsSnapshot.size,
			totalAnalytics: analyticsSnapshot.size,
		};

		res.json(
			createResponse(
				true,
				{
					id: campaignId,
					...campaignData,
					stats,
				},
				"Campaign fetched successfully"
			)
		);
	} catch (error) {
		console.error("Error fetching campaign:", error);
		res
			.status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
			.json(createResponse(false, null, "Failed to fetch campaign"));
	}
});

// PUT /api/v1/campaign/:campaignId - Update campaign
router.put("/:campaignId", async (req, res) => {
	try {
		const { campaignId } = req.params;
		const {
			name,
			description,
			platform,
			newLeads,
			variants,
			workingHours,
			messageLimits,
			followUser,
			autoLikeStory,
			autoLikeNewestPost,
			tag,
		} = req.body;

		if (!campaignId) {
			return res
				.status(HTTP_STATUS.BAD_REQUEST)
				.json(createResponse(false, null, "Campaign ID is required"));
		}

		const campaignDoc = await db.collection("campaigns").doc(campaignId).get();

		if (!campaignDoc.exists) {
			return res
				.status(HTTP_STATUS.NOT_FOUND)
				.json(createResponse(false, null, "Campaign not found"));
		}

		const existingCampaign = campaignDoc.data();

		if (existingCampaign.userId !== req.user.uid) {
			return res
				.status(HTTP_STATUS.FORBIDDEN)
				.json(createResponse(false, null, "Access denied"));
		}

		if (existingCampaign.status === "active") {
			const allowedUpdates = {
				name: name?.trim() || existingCampaign.name,
				description: description?.trim() || existingCampaign.description,
				tag: tag?.trim() || existingCampaign.tag,
				workingHours: workingHours || existingCampaign.workingHours,
				messageLimits: messageLimits || existingCampaign.messageLimits,
				followUser:
					followUser !== undefined ? followUser : existingCampaign.followUser,
				autoLikeStory:
					autoLikeStory !== undefined
						? autoLikeStory
						: existingCampaign.autoLikeStory,
				autoLikeNewestPost:
					autoLikeNewestPost !== undefined
						? autoLikeNewestPost
						: existingCampaign.autoLikeNewestPost,
				updatedAt: Date.now(),
				lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
			};

			await db.collection("campaigns").doc(campaignId).update(allowedUpdates);

			return res.json(
				createResponse(
					true,
					{
						id: campaignId,
						...existingCampaign,
						...allowedUpdates,
					},
					"Campaign updated successfully (limited updates while active)"
				)
			);
		}

		const updateData = {
			updatedAt: Date.now(),
			lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
		};

		if (name) updateData.name = name.trim();
		if (description) updateData.description = description.trim();
		if (tag) updateData.tag = tag.trim();
		if (platform && ["instagram", "twitter"].includes(platform)) {
			updateData.platform = platform;
		}
		if (workingHours) updateData.workingHours = workingHours;
		if (messageLimits) updateData.messageLimits = messageLimits;
		if (followUser !== undefined) updateData.followUser = followUser;
		if (autoLikeStory !== undefined) updateData.autoLikeStory = autoLikeStory;
		if (autoLikeNewestPost !== undefined)
			updateData.autoLikeNewestPost = autoLikeNewestPost;

		if (variants && Array.isArray(variants)) {
			const invalidVariants = variants.filter(
				(variant) => !variant.message || variant.message.trim() === ""
			);
			if (invalidVariants.length > 0) {
				return res
					.status(HTTP_STATUS.BAD_REQUEST)
					.json(
						createResponse(
							false,
							null,
							"All variants must have a non-empty message"
						)
					);
			}

			updateData.variants = variants.map((variant) => ({
				message: variant.message.trim(),
			}));
		}

		if (newLeads && Array.isArray(newLeads) && newLeads.length > 0) {
			const processedNewLeads = [
				...new Set(
					newLeads.map((lead) =>
						typeof lead === "string" ? lead.replace("@", "").trim() : lead
					)
				),
			].filter((lead) => lead && lead.length > 0);

			if (processedNewLeads.length > 0) {
				const existingLeadsSnapshot = await db
					.collection("leads")
					.where("campaignId", "==", campaignId)
					.get();

				const existingUsernames = new Set(
					existingLeadsSnapshot.docs.map((doc) => doc.data().username)
				);

				const trulyNewLeads = processedNewLeads.filter(
					(username) => !existingUsernames.has(username)
				);

				if (trulyNewLeads.length > 0) {
					await LeadService.createLeadsFromCampaign(campaignId, trulyNewLeads);

					const newTotalLeads =
						existingCampaign.totalLeads + trulyNewLeads.length;
					updateData.totalLeads = newTotalLeads;

					const newLeadsString = trulyNewLeads.join("\n") + "\n";
					updateData.allLeads = existingCampaign.allLeads + newLeadsString;
				}
			}
		}

		await db.collection("campaigns").doc(campaignId).update(updateData);

		const updatedCampaignDoc = await db
			.collection("campaigns")
			.doc(campaignId)
			.get();
		const updatedCampaignData = updatedCampaignDoc.data();

		res.json(
			createResponse(
				true,
				{
					id: campaignId,
					...updatedCampaignData,
				},
				"Campaign updated successfully"
			)
		);
	} catch (error) {
		console.error("Error updating campaign:", error);
		res
			.status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
			.json(createResponse(false, null, "Failed to update campaign"));
	}
});

module.exports = router;
