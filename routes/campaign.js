const express = require("express");
const router = express.Router();

const { createResponse, validateRequiredFields } = require("../utils/helpers");
const { HTTP_STATUS } = require("../utils/my_constants");
const Campaign = require("../models/Campaign");
const Lead = require("../models/Lead");
const LeadService = require("../services/leadService");
const WorkingHoursService = require("../services/workingHoursService");
const RateService = require("../services/rateService");
const Analytics = require("../models/Analytics");
const Account = require("../models/Account");

const { subscribed } = require("../middleware/subscribed");
const { authenticateToken } = require("../middleware/auth");

router.use(authenticateToken);
router.use(subscribed);

function toFirestoreTimestamp(dateInput) {
	const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
	return {
		_seconds: Math.floor(date.getTime() / 1000),
		_nanoseconds: (date.getTime() % 1000) * 1000000,
	};
}

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
			autoLikeNewest,
			tag,
			context,
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

		if (!["instagram", "twitter"].includes(platform)) {
			return res
				.status(HTTP_STATUS.BAD_REQUEST)
				.json(
					createResponse(
						false,
						null,
						'Platform must be "instagram" or "twitter"'
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
			(v) => !v.message || v.message.trim() === ""
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

		// Process and deduplicate leads
		const processedLeads = [
			...new Set(
				leads.map((lead) =>
					typeof lead === "string" ? lead.replace("@", "").trim() : lead
				)
			),
		].filter(Boolean);

		if (processedLeads.length === 0) {
			return res
				.status(HTTP_STATUS.BAD_REQUEST)
				.json(createResponse(false, null, "No valid leads provided"));
		}

		const now = toFirestoreTimestamp(new Date());

		// Create campaign document
		const campaign = new Campaign({
			userId: req.user.uid,
			name: name.trim(),
			tag: tag ? tag.trim() : "",
			description: description ? description.trim() : name.trim(),
			platform,
			status: "ready",
			allLeads: processedLeads.join("\n") + "\n",
			totalLeads: processedLeads.length,
			variants: variants.map((v) => ({ message: v.message.trim() })),
			context: context ? context.trim() : "",
			workingHours: workingHours || { start: 0, end: 24 },
			messageLimits: messageLimits || { min: 35, max: 41 },
			followUser: followUser || false,
			autoLikeStory: autoLikeStory || false,
			autoLikeNewestPost: autoLikeNewest || false,
			withinWorkingHours: true,
			createdAt: now,
			updatedAt: now,
			lastUpdated: now,
		});

		await campaign.save();

		// Insert leads in batches
		const batchSize = 400;
		if (processedLeads.length > batchSize) {
			await LeadService.createLeadsFromCampaign(
				campaign._id.toString(),
				processedLeads.slice(0, batchSize)
			);
			const remaining = processedLeads.slice(batchSize);
			if (remaining.length > 0) {
				await LeadService.createLeadsFromCampaign(
					campaign._id.toString(),
					remaining
				);
			}
		} else {
			await LeadService.createLeadsFromCampaign(
				campaign._id.toString(),
				processedLeads
			);
		}

		res.status(HTTP_STATUS.CREATED).json(
			createResponse(
				true,
				{
					id: campaign._id,
					...campaign.toObject(),
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
		const campaigns = await Campaign.find({ userId: req.user.uid }).lean();

		const responseCampaigns = campaigns.map((campaign) => ({
			id: campaign._id,
			...campaign,
			leads: [],
			leadsCount: campaign.totalLeads,
		}));

		res.json({
			name: req.user.name || "User",
			isSubscribed: req.user.isSubscribed,
			campaigns: responseCampaigns,
		});
	} catch (error) {
		console.error("Error fetching campaigns:", error);
		res
			.status(500)
			.json({ success: false, message: "Failed to fetch campaigns" });
	}
});

// DELETE /api/v1/campaign/:campaignId - Delete campaign, leads, and unlink accounts
router.delete("/:campaignId", async (req, res) => {
	try {
		const { campaignId } = req.params;
		const campaign = await Campaign.findById(campaignId);

		if (!campaign) {
			return res
				.status(404)
				.json(createResponse(false, null, "Campaign not found"));
		}

		if (campaign.userId.toString() !== req.user.uid) {
			return res
				.status(403)
				.json(
					createResponse(
						false,
						null,
						"You are not authorized to delete this campaign"
					)
				);
		}

		if (campaign.status === "active") {
			return res
				.status(400)
				.json(createResponse(false, null, "Cannot delete an active campaign"));
		}

		// Delete all leads for this campaign in one go
		await Lead.deleteMany({ campaignId });

		// Unset currentCampaignId for all affected accounts
		await Account.updateMany(
			{ currentCampaignId: campaignId },
			{ $unset: { currentCampaignId: "" } }
		);

		// Delete the campaign itself
		await Campaign.findByIdAndDelete(campaignId);

		res
			.status(200)
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
			.status(500)
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

		const campaign = await Campaign.findById(campaignID);
		if (!campaign || campaign.userId.toString() !== req.user.uid) {
			return res
				.status(404)
				.json({ success: false, message: "Campaign not found" });
		}

		let account = await Account.findOne({
			userId: req.user.uid,
			widgetId: widgetId,
		});

		const now = toFirestoreTimestamp(Date.now());
		if (account) {
			account.displayName = displayName;
			account.platform = campaign.platform;
			account.status = "active";
			account.currentCampaignId = campaignID;
			account.lastUpdated = now;
			account.pendingLeadsCount = 0;
			await account.save();
		} else {
			account = new Account({
				userId: req.user.uid,
				widgetId,
				displayName,
				platform: campaign.platform,
				status: "active",
				currentCampaignId: campaignID,
				createdAt: now,
				lastUpdated: now,
				pendingLeadsCount: 0,
			});
			await account.save();
		}

		campaign.status = "active";
		campaign.lastUpdated = now;
		await campaign.save();

		await LeadService.assignLeadsToAccount(campaignID, widgetId, 24);

		res.json({
			success: true,
			message:
				"Campaign started, account created/updated. Lead assignment will proceed in the background.",
			accountId: account._id,
			account: {
				accountId: account._id,
				widgetId: account.widgetId,
				displayName: account.displayName,
				createdAt: account.createdAt,
				campaignId: account.currentCampaignId,
				lastUpdated: account.lastUpdated,
				status: account.status,
				pendingLeadsCount: account.pendingLeadsCount,
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
	if (!campaignId) {
		return res
			.status(400)
			.json({ success: false, message: "Missing campaignId" });
	}

	try {
		const campaign = await Campaign.findById(campaignId);
		if (!campaign || campaign.userId !== req.user.uid) {
			return res.status(404).json({
				success: false,
				message: "Campaign not found or access denied",
			});
		}

		const accounts = await Account.find({ currentCampaignId: campaignId });

		// Update all accounts to active
		await Promise.all(
			accounts.map((account) => {
				account.status = "active";
				account.lastUpdated = {
					_seconds: Math.floor(Date.now() / 1000),
					_nanoseconds: 0,
				};
				return account.save();
			})
		);

		// Update campaign status
		campaign.status = "active";
		campaign.lastUpdated = {
			_seconds: Math.floor(Date.now() / 1000),
			_nanoseconds: 0,
		};
		await campaign.save();

		// Assign leads for each account (concurrent)
		await Promise.all(
			accounts.map((account) =>
				LeadService.assignLeadsToAccount(campaignId, account.widgetId, 24)
			)
		);

		res.json({
			success: true,
			message: "Campaign and all accounts started",
			accounts: accounts.length,
		});
	} catch (error) {
		console.error("start-all error", error);
		res.status(500).json({ success: false, message: "Bulk start failed" });
	}
});

// PATCH /api/v1/campaign/pause
router.patch("/pause", async (req, res) => {
	try {
		const { campaignID, accountId } = req.query;
		if (!campaignID || !accountId) {
			return res
				.status(400)
				.json({ success: false, message: "Missing required parameters" });
		}

		const account = await Account.findOne({ widgetId: accountId });
		if (!account) {
			return res
				.status(404)
				.json({ success: false, message: "Account not found" });
		}

		account.status = "paused";
		account.lastUpdated = {
			_seconds: Math.floor(Date.now() / 1000),
			_nanoseconds: 0,
		};
		await account.save();

		const campaign = await Campaign.findById(campaignID);
		if (campaign) {
			campaign.status = "paused";
			campaign.lastUpdated = {
				_seconds: Math.floor(Date.now() / 1000),
				_nanoseconds: 0,
			};
			await campaign.save();
		}

		await LeadService.unAssignLeads(campaignID, accountId, 24);

		res.json({ success: true, message: "Campaign paused successfully" });
	} catch (error) {
		console.error("pause error", error);
		res
			.status(500)
			.json({ success: false, message: "Failed to pause campaign" });
	}
});

// PATCH /api/v1/campaign/pause-all
router.patch("/pause-all", async (req, res) => {
	const { campaignId } = req.query;
	if (!campaignId) {
		return res
			.status(400)
			.json({ success: false, message: "Missing campaignId" });
	}

	try {
		const campaign = await Campaign.findById(campaignId);
		if (!campaign || campaign.userId !== req.user.uid) {
			return res.status(404).json({
				success: false,
				message: "Campaign not found or access denied",
			});
		}

		const accounts = await Account.find({ currentCampaignId: campaignId });

		// Update all accounts to paused
		await Promise.all(
			accounts.map((account) => {
				account.status = "paused";
				account.lastUpdated = {
					_seconds: Math.floor(Date.now() / 1000),
					_nanoseconds: 0,
				};
				return account.save();
			})
		);

		// Update campaign status
		campaign.status = "paused";
		campaign.lastUpdated = {
			_seconds: Math.floor(Date.now() / 1000),
			_nanoseconds: 0,
		};
		await campaign.save();

		// Unassign leads for each account
		await Promise.all(
			accounts.map((account) =>
				LeadService.unAssignLeads(campaignId, account.widgetId, 24)
			)
		);

		res.json({
			success: true,
			message: "Campaign and all accounts paused",
			accounts: accounts.length,
		});
	} catch (error) {
		console.error("pause-all error", error);
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

		const account = await Account.findOne({ widgetId: widgetID }).lean();
		if (!account) {
			return res
				.status(404)
				.json({ success: false, message: "Account not found" });
		}

		const pendingLeadsCount = await Lead.countDocuments({
			assignedAccount: account._id.toString(),
			status: "ready",
		});

		const accountData = {
			accountId: account._id.toString(),
			widgetId: account.widgetId,
			displayName: account.displayName,
			status: account.status,
			createdAt: account.createdAt,
			campaignId: account.currentCampaignId,
			lastUpdated: account.lastUpdated,
			pendingLeadsCount,
		};

		res.json({ success: true, account: accountData });
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

		const campaign = await Campaign.findById(campaignID).lean();
		if (!campaign) {
			return res
				.status(404)
				.json({ success: false, message: "Campaign not found" });
		}

		const withinWorkingHours = WorkingHoursService.isWithinWorkingHours(
			campaign.workingHours || { start: 0, end: 24 }
		);

		res.json({
			success: true,
			campaign: {
				platform: campaign.platform,
				status: campaign.status,
				followUser: campaign.followUser,
				name: campaign.name,
				description: campaign.description,
				variants: campaign.variants,
				id: campaignID,
				withinWorkingHours,
				sendVoiceNote: campaign.sendVoiceNote,
				autoLikeStory: campaign.autoLikeStory,
				autoLikeNewestPost: campaign.autoLikeNewestPost,
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
			return res
				.status(400)
				.json({ success: false, message: "Missing required parameters" });
		}

		const campaign = await Campaign.findById(campaignID).lean();
		if (!campaign) {
			return res
				.status(404)
				.json({ success: false, message: "Campaign not found" });
		}

		const withinWorkingHours = WorkingHoursService.isWithinWorkingHours(
			campaign.workingHours || { start: 0, end: 24 }
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
			campaign.workingHours || { start: 0, end: 24 },
			campaign.messageLimits || { min: 35, max: 41 }
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
				// restart the campaign else mark as complete
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

		const lead = await Lead.findById(leadID).lean();

		if (!lead) {
			return res
				.status(404)
				.json({ success: false, message: "Lead not found" });
		}

		res.json({
			success: true,
			lead: {
				id: leadID,
				...lead,
				baseDateTimestamp: lead.baseDate,
			},
		});
	} catch (error) {
		console.error("Error fetching lead:", error);
		res.status(500).json({ success: false, message: "Failed to fetch lead" });
	}
});
// PUT /campaign/set-lead-status
router.put("/set-lead-status", async (req, res) => {
	try {
		const { campaignID, leadID } = req.query;

		if (!campaignID || !leadID) {
			return res.status(400).json({
				success: false,
				message: "Missing required parameters",
			});
		}

		await Lead.findByIdAndUpdate(leadID, {
			status: "sending",
			updatedAt: { _seconds: Math.floor(Date.now() / 1000), _nanoseconds: 0 },
		});

		return res.json({ success: true });
	} catch (error) {
		console.error("Error updating lead status:", error);
		return res.status(500).json({
			success: false,
			message: "Failed to update lead status",
		});
	}
});

// POST /campaign/check-response
router.post("/check-response", async (req, res) => {
	try {
		const { campaignID, username } = req.body;

		if (!campaignID || !username) {
			return res.status(400).json({
				success: false,
				message: "Missing required parameters",
			});
		}

		const latestAnalytics = await Analytics.findOne({
			campaignID,
			username,
		}).sort({ "timestamp._seconds": -1, "timestamp._nanoseconds": -1 });

		let status = "noResponse";
		if (latestAnalytics) {
			status = "found";
		}

		return res.json({ success: true, status });
	} catch (error) {
		console.error("Error checking response:", error);
		return res.status(500).json({
			success: false,
			message: "Failed to check response",
		});
	}
});

// POST /campaign/analytics
router.post("/analytics", async (req, res) => {
	console.log("req.body", req.body);
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

		if (!campaignID || !accountID) {
			return res.status(400).json({
				success: false,
				message: "Missing required parameters",
			});
		}

		const nowSec = Math.floor(Date.now() / 1000);

		const analyticsData = new Analytics({
			campaignID,
			accountID,
			leadID: leadID || "",
			username: username || "",
			message: message || "",
			status: status || "unknown",
			platform: platform || "instagram",
			timestamp: { _seconds: nowSec, _nanoseconds: 0 },
			createdAt: { _seconds: nowSec, _nanoseconds: 0 },
		});

		await analyticsData.save();

		// Update lead status accordingly
		if (leadID) {
			await Lead.findByIdAndUpdate(leadID, {
				status: status,
				sent: ["initialdmsent", "followup"].includes(status),
				updatedAt: { _seconds: nowSec, _nanoseconds: 0 },
			});
		}

		if (["initialdmsent", "followup"].includes(status)) {
			await RateService.recordMessageSent(accountID, campaignID);
		}

		return res.json({ success: true });
	} catch (error) {
		console.error("Error recording analytics:", error);
		return res.status(500).json({
			success: false,
			message: "Failed to record analytics",
		});
	}
});

// GET /campaign/analytics
router.get("/analytics", async (req, res) => {
	try {
		const { campaignID, accountID, timeframe = "today" } = req.query;

		const now = new Date();

		let start, end;

		switch (timeframe) {
			case "today":
				start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
				end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
				break;
			case "week":
				start = new Date(now);
				start.setDate(now.getDate() - now.getDay());
				start.setHours(0, 0, 0, 0);
				end = new Date(now);
				break;
			case "month":
				start = new Date(now.getFullYear(), now.getMonth(), 1);
				end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
				break;
			default:
				start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
				end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
				break;
		}

		const startTimestamp = {
			_seconds: Math.floor(start.getTime() / 1000),
			_nanoseconds: 0,
		};
		const endTimestamp = {
			_seconds: Math.floor(end.getTime() / 1000),
			_nanoseconds: 0,
		};

		// Build queries
		let analyticsQuery = {
			"createdAt._seconds": {
				$gte: startTimestamp._seconds,
				$lt: endTimestamp._seconds,
			},
		};

		if (campaignID) analyticsQuery.campaignID = campaignID;
		if (accountID) analyticsQuery.accountID = accountID;

		const analyticsRecords = await Analytics.find(analyticsQuery);

		let totalMessagesSent = analyticsRecords.filter((r) =>
			["initialdmsent", "followup"].includes(r.status)
		).length;

		// Build leads query for conversion calculation
		let leadsQuery = {};
		if (campaignID) leadsQuery.campaignId = campaignID;
		if (accountID) leadsQuery.assignedAccount = accountID;

		const leadsRecords = await Lead.find(leadsQuery);

		const totalLeads = leadsRecords.length;
		const convertedLeads = leadsRecords.filter(
			(l) => ["initialdmsent", "followup"].includes(l.status) || l.sent
		).length;

		const conversionRate =
			totalLeads > 0 ? ((convertedLeads / totalLeads) * 100).toFixed(2) : 0;

		const messagesByStatus = {
			initialdmsent: analyticsRecords.filter(
				(r) => r.status === "initialdmsent"
			).length,
			followup: analyticsRecords.filter((r) => r.status === "followup").length,
			unknown: analyticsRecords.filter((r) => r.status === "unknown").length,
		};

		const messagesByPlatform = {
			instagram: analyticsRecords.filter((r) => r.platform === "instagram")
				.length,
			twitter: analyticsRecords.filter((r) => r.platform === "twitter").length,
		};

		const response = {
			success: true,
			data: {
				timeframe,
				period: {
					start: start.toISOString(),
					end: end.toISOString(),
				},
				totalMessagesSent,
				leadConversionRate: parseFloat(conversionRate),
				totalLeads,
				convertedLeads,
				messagesByStatus,
				messagesByPlatform,
				campaignID: campaignID || "all",
				accountID: accountID || "all",
			},
		};

		return res.json(response);
	} catch (error) {
		console.error("Error fetching analytics:", error);
		return res.status(500).json({
			success: false,
			message: "Failed to fetch analytics data",
		});
	}
});

// GET /api/v1/campaign/analytics/trend - Get analytics trend data
router.get("/analytics/trend", async (req, res) => {
	try {
		const { campaignID, accountID, timeframe = "week" } = req.query;

		const now = new Date();
		const days = timeframe === "today" ? 1 : timeframe === "week" ? 7 : 31;
		const start = new Date(now);
		start.setDate(now.getDate() - (days - 1));
		start.setHours(0, 0, 0, 0);

		// Build query
		const query = {
			"createdAt._seconds": {
				$gte: Math.floor(start.getTime() / 1000),
				$lt: Math.floor(now.getTime() / 1000),
			},
			status: { $in: ["initialdmsent", "followup"] },
		};
		if (campaignID) query.campaignID = campaignID;
		if (accountID) query.accountID = accountID;

		const snap = await Analytics.find(query);

		// Group counts by day
		const counts = Array(days).fill(0);
		const labels = Array(days)
			.fill("")
			.map((_, i) => {
				const d = new Date(start);
				d.setDate(start.getDate() + i);
				return d.toLocaleDateString("en-US", {
					month: "short",
					day: "numeric",
				});
			});

		snap.forEach((doc) => {
			const d = new Date(doc.createdAt._seconds * 1000);
			const idx = Math.floor((d - start) / 86400000);
			if (idx >= 0 && idx < days) counts[idx]++;
		});

		res.json({ success: true, data: { labels, counts, timeframe } });
	} catch (err) {
		console.error("trend-analytics error:", err);
		res.status(500).json({ success: false, message: "Trend fetch failed" });
	}
});

// GET /api/v1/campaign/:campaignId - Get single campaign by ID
router.get("/:campaignId", async (req, res) => {
	try {
		const { campaignId } = req.params;
		if (!campaignId) {
			return res
				.status(400)
				.json(createResponse(false, null, "Campaign ID is required"));
		}

		const campaign = await Campaign.findById(campaignId).lean();
		if (!campaign) {
			return res
				.status(404)
				.json(createResponse(false, null, "Campaign not found"));
		}

		if (campaign.userId !== req.user.uid) {
			return res.status(403).json(createResponse(false, null, "Access denied"));
		}

		const leadsCount = await Lead.countDocuments({ campaignId });
		const sentLeadsCount = await Lead.countDocuments({
			campaignId,
			sent: true,
		});
		const analyticsCount = await Analytics.countDocuments({
			campaignID: campaignId,
		});

		const stats = {
			totalLeads: leadsCount,
			sentLeads: sentLeadsCount,
			pendingLeads: leadsCount - sentLeadsCount,
			totalAnalytics: analyticsCount,
		};

		res.json(
			createResponse(
				true,
				{ id: campaignId, ...campaign, stats },
				"Campaign fetched successfully"
			)
		);
	} catch (error) {
		console.error("Error fetching campaign:", error);
		res
			.status(500)
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
			context,
		} = req.body;

		if (!campaignId) {
			return res
				.status(400)
				.json(createResponse(false, null, "Campaign ID is required"));
		}

		const campaign = await Campaign.findById(campaignId);
		if (!campaign) {
			return res
				.status(404)
				.json(createResponse(false, null, "Campaign not found"));
		}

		if (campaign.userId !== req.user.uid) {
			return res.status(403).json(createResponse(false, null, "Access denied"));
		}
		const now = toFirestoreTimestamp(new Date());
		if (campaign.status === "active") {
			// Limited updates allowed when active
			const allowedUpdates = {
				name: (name && name.trim()) || campaign.name,
				description:
					(description && description.trim()) || campaign.description,
				tag: (tag && tag.trim()) || campaign.tag,
				workingHours: workingHours || campaign.workingHours,
				messageLimits: messageLimits || campaign.messageLimits,
				context: (context && context.trim()) || "",
				followUser: followUser !== undefined ? followUser : campaign.followUser,
				autoLikeStory:
					autoLikeStory !== undefined ? autoLikeStory : campaign.autoLikeStory,
				autoLikeNewestPost:
					autoLikeNewestPost !== undefined
						? autoLikeNewestPost
						: campaign.autoLikeNewestPost,
				updatedAt: now,
				lastUpdated: now,
			};

			await Campaign.findByIdAndUpdate(campaignId, allowedUpdates);

			return res.json(
				createResponse(
					true,
					{ id: campaignId, ...campaign.toObject(), ...allowedUpdates },
					"Campaign updated successfully (limited updates while active)"
				)
			);
		}

		// Full update
		const updateData = {
			updatedAt: now,
			lastUpdated: now,
		};

		if (name) updateData.name = name.trim();
		if (context) updateData.context = context.trim();
		if (description) updateData.description = description.trim();
		if (tag) updateData.tag = tag.trim();
		if (platform && ["instagram", "twitter"].includes(platform))
			updateData.platform = platform;
		if (workingHours) updateData.workingHours = workingHours;
		if (messageLimits) updateData.messageLimits = messageLimits;
		if (followUser !== undefined) updateData.followUser = followUser;
		if (autoLikeStory !== undefined) updateData.autoLikeStory = autoLikeStory;
		if (autoLikeNewestPost !== undefined)
			updateData.autoLikeNewestPost = autoLikeNewestPost;

		if (variants && Array.isArray(variants)) {
			const invalidVariants = variants.filter(
				(v) => !v.message || v.message.trim() === ""
			);
			if (invalidVariants.length > 0) {
				return res
					.status(400)
					.json(
						createResponse(
							false,
							null,
							"All variants must have a non-empty message"
						)
					);
			}
			updateData.variants = variants.map((v) => ({
				message: v.message.trim(),
			}));
		}

		if (newLeads && Array.isArray(newLeads) && newLeads.length > 0) {
			const processedNewLeads = [
				...new Set(
					newLeads.map((l) =>
						typeof l === "string" ? l.replace("@", "").trim() : l
					)
				),
			].filter(Boolean);
			if (processedNewLeads.length > 0) {
				const existingLeads = await Lead.find({ campaignId }).select(
					"username"
				);
				const existingUsernames = new Set(existingLeads.map((l) => l.username));
				const trulyNewLeads = processedNewLeads.filter(
					(u) => !existingUsernames.has(u)
				);
				if (trulyNewLeads.length > 0) {
					await LeadService.createLeadsFromCampaign(campaignId, trulyNewLeads);
					updateData.totalLeads =
						(campaign.totalLeads || 0) + trulyNewLeads.length;
					updateData.allLeads =
						(campaign.allLeads || "") + trulyNewLeads.join("\n") + "\n";
				}
			}
		}

		await Campaign.findByIdAndUpdate(campaignId, updateData);

		const updatedCampaign = await Campaign.findById(campaignId);

		return res.json(
			createResponse(true, updatedCampaign, "Campaign updated successfully")
		);
	} catch (error) {
		console.error("Error updating campaign:", error);
		return res
			.status(500)
			.json(createResponse(false, null, "Failed to update campaign"));
	}
});

module.exports = router;
