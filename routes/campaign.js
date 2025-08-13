const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../middleware/auth");
const { db, admin } = require("../config/firebase");

// Import services
const LeadService = require("../services/leadService");
const RateService = require("../services/rateService");
const WorkingHoursService = require("../services/workingHoursService");

// Import utils
const { createResponse, validateRequiredFields } = require("../utils/helpers");
const { HTTP_STATUS } = require("../utils/my_constants");

// Apply authentication to all routes // done
router.use(authenticateToken);

// POST /api/v1/campaign/create - Create new campaign // done
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

		// Validate required fields
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

		// Validate platform
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

		// Validate leads array
		if (!Array.isArray(leads) || leads.length === 0) {
			return res
				.status(HTTP_STATUS.BAD_REQUEST)
				.json(createResponse(false, null, "Leads must be a non-empty array"));
		}

		// Validate variants array
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

		// Validate each variant has a message
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

		// Process leads - remove duplicates and clean usernames
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

		// Create campaign document
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

		// Use transaction to create campaign and leads atomically
		await db.runTransaction(async (transaction) => {
			// Create campaign
			transaction.set(campaignRef, campaignData);

			// Create leads in batches (Firestore has 500 operation limit per transaction)
			const batchSize = 400; // Leave room for campaign creation
			const leadBatches = [];

			for (let i = 0; i < processedLeads.length; i += batchSize) {
				leadBatches.push(processedLeads.slice(i, i + batchSize));
			}

			// Process first batch in transaction
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

		// Process remaining lead batches outside transaction if any
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

// GET /api/v1/campaign/ - Get all campaigns // done
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

// DELETE /api/v1/campaign/:campaignId - Delete a campaign // done
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

		// Authorization check
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

		// Prevent deleting active campaign
		if (campaignData.status === "active") {
			return res
				.status(HTTP_STATUS.BAD_REQUEST)
				.json(createResponse(false, null, "Cannot delete an active campaign"));
		}

		const BATCH_LIMIT = 500;
		const deleteOps = [];
		let batch = db.batch();
		let count = 0;

		// 🔹 1. Delete leads related to this campaign
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

		// 🔹 2. Update all accounts with currentCampaignId == campaignId
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

		// 🔹 3. Delete the campaign document
		batch.delete(campaignRef);
		count++;

		// Final commit if anything left
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

// POST /api/v1/campaign/start - Start campaign // done
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

		// Verify campaign exists and belongs to user
		const campaignDoc = await db.collection("campaigns").doc(campaignID).get();
		if (!campaignDoc.exists || campaignDoc.data().userId !== req.user.uid) {
			return res
				.status(404)
				.json({ success: false, message: "Campaign not found" });
		}

		// Create or update account
		const accountId = widgetId;
		const accountData = {
			userId: req.user.uid,
			displayName,
			platform: campaignDoc.data().platform,
			status: "active",
			currentCampaignId: campaignID,
			createdAt: Date.now(),
			lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
			pendingLeadsCount: 0,
		};

		await db
			.collection("accounts")
			.doc(accountId)
			.set(accountData, { merge: true });

		// Update campaign status
		await db.collection("campaigns").doc(campaignID).update({
			status: "active",
			lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
		});

		// Assign leads to this account
		await LeadService.assignLeadsToAccount(campaignID, accountId, 24);

		const updatedUser = await db.collection("accounts").doc(accountId).get();
		const updatedUserData = updatedUser.data();

		res.json({
			success: true,
			message:
				"Campaign started, account created/reused. Lead assignment will proceed in the background.",
			accountId: accountId,
			account: {
				accountId: accountId,
				displayName: accountData.displayName,
				createdAt: accountData.createdAt,
				campaignId: accountData.currentCampaignId,
				lastUpdated: updatedUserData.lastUpdated,
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
		// Check campaign exists & user owns it
		const campaignDoc = await db.collection("campaigns").doc(campaignId).get();
		if (!campaignDoc.exists || campaignDoc.data().userId !== req.user.uid) {
			return res.status(404).json({
				success: false,
				message: "Campaign not found or access denied",
			});
		}

		// Find all accounts linked to this campaign
		const accountsSnap = await db
			.collection("accounts")
			.where("currentCampaignId", "==", campaignId)
			.get();

		// Batch update all accounts: status "active" and update lastUpdated, assign leads
		const batch = db.batch();
		for (const doc of accountsSnap.docs) {
			batch.update(doc.ref, {
				status: "active",
				lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
			});
			// Optionally (sync), assign leads if you want per-account, e.g.:
			// await LeadService.assignLeadsToAccount(campaignId, doc.id, 24);
		}
		// Update campaign status as well
		batch.update(db.collection("campaigns").doc(campaignId), {
			status: "active",
			lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
		});
		await batch.commit();

		// Optionally, assign leads in parallel for all accounts (async, not in Firestore batch)
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

		// Update account status
		await db.collection("accounts").doc(accountId).update({
			status: "paused",
			lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
		});

		// Update campaign status
		await db.collection("campaigns").doc(campaignID).update({
			status: "paused",
			lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
		});

		await LeadService.unAssignLeads(campaignID, accountId, 24);

		res.json({ success: true, message: "Campaign paused successfully" });
	} catch (error) {
		console.error("Error pausing campaign:", error);
		res
			.status(500)
			.json({ success: false, message: "Failed to pause campaign" });
	}
});

// PATCH /api/v1/campaign/:campaignId/pause-all
router.patch("/pause-all", async (req, res) => {
	const { campaignId } = req.query;
	if (campaignId === undefined) {
		return res
			.status(400)
			.json({ success: false, message: "Missing campaignId" });
	}
	try {
		// Check campaign exists & user owns it
		const campaignDoc = await db.collection("campaigns").doc(campaignId).get();
		if (!campaignDoc.exists || campaignDoc.data().userId !== req.user.uid) {
			return res.status(404).json({
				success: false,
				message: "Campaign not found or access denied",
			});
		}

		// Find all accounts linked to this campaign
		const accountsSnap = await db
			.collection("accounts")
			.where("currentCampaignId", "==", campaignId)
			.get();

		// Batch update all accounts: status "paused" and update lastUpdated
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

		// Unassign leads for all accounts (async, not in Firestore batch)
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

// GET /api/v1/campaign/account-status - Check account status // done
router.get("/account-status", async (req, res) => {
	try {
		const { widgetID } = req.query;

		if (!widgetID) {
			return res
				.status(400)
				.json({ success: false, message: "Missing widgetID" });
		}

		const accountDoc = await db.collection("accounts").doc(widgetID).get();

		if (!accountDoc.exists) {
			return res
				.status(404)
				.json({ success: false, message: "Account not found" });
		}

		const accountData = accountDoc.data();

		// Get pending leads count
		const leadsSnapshot = await db
			.collection("leads")
			.where("assignedAccount", "==", widgetID)
			.where("status", "==", "ready")
			.get();

		accountData.pendingLeadsCount = leadsSnapshot.size;

		res.json({
			success: true,
			account: {
				accountId: widgetID,
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

// GET /api/v1/campaign/campaign-status - Check campaign status // done
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

		// Check working hours
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

// GET /api/v1/campaign/fetch-leads - Get leads for processing // done
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

		// Check working hours
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
		// Check if daily limit reached
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

		// if no assigned leads
		if (leads.length === 0) {
			// try assigning
			const leadsCount = await LeadService.assignLeadsToAccount(
				campaignID,
				accountId,
				24
			);
			if (leadsCount === 0) {
				// if cant assign then no leads left
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

// GET /api/v1/campaign/fetch-lead - Get specific lead details // done
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

// PUT /api/v1/campaign/set-lead-status - Update lead status // done
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

		// Check latest analytics for this user
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
			// You can implement logic to check if user responded based on your criteria
			status = "found"; // or 'noResponse' based on your logic
		}

		res.json({ success: true, status });
	} catch (error) {
		console.error("Error checking response:", error);
		res
			.status(500)
			.json({ success: false, message: "Failed to check response" });
	}
});

// POST /api/v1/campaign/analytics - Record analytics // done
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

		// set lead status from sending to sent
		await db
			.collection("leads")
			.doc(leadID)
			.update({
				status: status,
				sent: status === "initialdmsent" || status === "followup",
				lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
			});

		// Update rate limiting info
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

// for frontends
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

		// Verify campaign belongs to user
		if (campaignData.userId !== req.user.uid) {
			return res
				.status(HTTP_STATUS.FORBIDDEN)
				.json(createResponse(false, null, "Access denied"));
		}

		// Get campaign stats
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
			newLeads, // Only new leads to be added
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

		// Get existing campaign
		const campaignDoc = await db.collection("campaigns").doc(campaignId).get();

		if (!campaignDoc.exists) {
			return res
				.status(HTTP_STATUS.NOT_FOUND)
				.json(createResponse(false, null, "Campaign not found"));
		}

		const existingCampaign = campaignDoc.data();

		// Verify campaign belongs to user
		if (existingCampaign.userId !== req.user.uid) {
			return res
				.status(HTTP_STATUS.FORBIDDEN)
				.json(createResponse(false, null, "Access denied"));
		}

		// Check if campaign is running - only allow certain updates
		if (existingCampaign.status === "active") {
			// Only allow updating certain fields when campaign is active
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

		// Full update for non-active campaigns
		const updateData = {
			updatedAt: Date.now(),
			lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
		};

		// Update fields if provided
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

		// Handle variants update
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

		// Handle NEW leads only - don't remove existing ones
		if (newLeads && Array.isArray(newLeads) && newLeads.length > 0) {
			const processedNewLeads = [
				...new Set(
					newLeads.map((lead) =>
						typeof lead === "string" ? lead.replace("@", "").trim() : lead
					)
				),
			].filter((lead) => lead && lead.length > 0);

			if (processedNewLeads.length > 0) {
				// Get existing leads to avoid duplicates
				const existingLeadsSnapshot = await db
					.collection("leads")
					.where("campaignId", "==", campaignId)
					.get();

				const existingUsernames = new Set(
					existingLeadsSnapshot.docs.map((doc) => doc.data().username)
				);

				// Filter out leads that already exist
				const trulyNewLeads = processedNewLeads.filter(
					(username) => !existingUsernames.has(username)
				);

				if (trulyNewLeads.length > 0) {
					// Create new leads
					await LeadService.createLeadsFromCampaign(campaignId, trulyNewLeads);

					// Update campaign with new total count
					const newTotalLeads =
						existingCampaign.totalLeads + trulyNewLeads.length;
					updateData.totalLeads = newTotalLeads;

					// Update allLeads string by appending new leads
					const newLeadsString = trulyNewLeads.join("\n") + "\n";
					updateData.allLeads = existingCampaign.allLeads + newLeadsString;
				}
			}
		}

		// Update campaign
		await db.collection("campaigns").doc(campaignId).update(updateData);

		// Get updated campaign data
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
