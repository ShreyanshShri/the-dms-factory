const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../middleware/auth");

const AdsPowerAccount = require("../models/AdsPowerAccount");
const Campaign = require("../models/Campaign");
const Lead = require("../models/Lead");

// router.use(authenticateToken);

function toFirestoreTimestamp(dateInput) {
	const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
	return {
		_seconds: Math.floor(date.getTime() / 1000),
		_nanoseconds: (date.getTime() % 1000) * 1000000,
	};
}

router.post("/create", async (req, res) => {
	try {
		const { displayName, widgetId, currentCampaignId } = req.body;

		// Validate required parameters
		if (!displayName || !widgetId) {
			return res.status(400).json({
				success: false,
				message:
					"Missing required parameters: displayName and widgetId are required",
			});
		}

		// Check if account already exists for this user and widgetId
		const existingAccount = await AdsPowerAccount.findOne({
			userId: req.user.uid,
			widgetId: widgetId,
		});

		if (existingAccount) {
			return res.status(409).json({
				success: false,
				message: "AdsPower account with this widgetId already exists",
				accountId: existingAccount._id,
			});
		}

		// Create timestamp for createdAt and lastUpdated
		const now = toFirestoreTimestamp(Date.now());

		// Create new AdsPowerAccount
		const newAccount = new AdsPowerAccount({
			userId: req.user.uid,
			widgetId,
			displayName,
			platform: "twitter", // Use provided platform or default
			createdAt: now,
			currentCampaignId: currentCampaignId || null,
			status: "ready", // Default status
			lastUpdated: now,
			pendingLeadsCount: 0, // Default value
		});

		await newAccount.save();

		res.status(201).json({
			success: true,
			message: "AdsPower account created successfully",
			accountId: newAccount._id,
			account: {
				accountId: newAccount._id,
				widgetId: newAccount.widgetId,
				displayName: newAccount.displayName,
				platform: newAccount.platform,
				createdAt: newAccount.createdAt,
				currentCampaignId: newAccount.currentCampaignId,
				status: newAccount.status,
				lastUpdated: newAccount.lastUpdated,
				pendingLeadsCount: newAccount.pendingLeadsCount,
			},
		});
	} catch (error) {
		console.error("Error creating AdsPower account:", error);

		// Handle duplicate key error specifically
		if (error.code === 11000) {
			return res.status(409).json({
				success: false,
				message: "AdsPower account with this configuration already exists",
			});
		}

		res.status(500).json({
			success: false,
			message: "Failed to create AdsPower account",
		});
	}
});

// GET /api/v1/account/overview
router.get("/overview", authenticateToken, async (req, res) => {
	try {
		const userId = req.user.uid;

		const campaigns = await Campaign.find({
			userId,
			platform: "twitter",
		}).lean();
		const accounts = await AdsPowerAccount.find({ userId }).lean();

		// Group accounts by campaignId
		const accByCampaign = accounts.reduce((acc, account) => {
			const cid = account.currentCampaignId || "_unassigned";
			acc[cid] = acc[cid] || [];
			acc[cid].push(account);
			return acc;
		}, {});

		const campaignList = campaigns.map((c) => ({
			id: c._id,
			name: c.name,
			status: c.status,
			platform: c.platform || "unknown",
			lastUpdated: c.lastUpdated,
			createdAt: c.createdAt,
			accounts: accByCampaign[c._id.toString()] || [],
		}));

		// Handle unassigned accounts
		if (accByCampaign._unassigned) {
			campaignList.push({
				id: "_unassigned",
				name: "Unassigned",
				status: "n/a",
				platform: "unknown",
				lastUpdated: null,
				createdAt: toFirestoreTimestamp(new Date()),
				accounts: accByCampaign._unassigned,
			});
		}

		// Sort by lastUpdated desc (handle timestamps)
		const toMillis = (ts) => {
			if (!ts) return 0;
			if (typeof ts === "number") return ts;
			if (ts._seconds) return ts._seconds * 1000;
			if (ts.getTime) return ts.getTime();
			return 0;
		};
		campaignList.sort(
			(a, b) => toMillis(b.lastUpdated) - toMillis(a.lastUpdated)
		);

		res.json({ success: true, data: { campaigns: campaignList } });
	} catch (err) {
		console.error("AdsPowerAccount overview error:", err);
		res
			.status(500)
			.json({ success: false, message: "Failed to fetch overview" });
	}
});

// PATCH /api/v1/account/assign
router.patch("/assign", authenticateToken, async (req, res) => {
	const { accountId, newCampaignId } = req.body;
	if (!accountId || newCampaignId === undefined) {
		return res.status(400).json({ success: false, message: "Missing params" });
	}

	try {
		let account = await AdsPowerAccount.findOne({ widgetId: accountId });
		if (!account) {
			const { displayName } = req.body;

			// Validate required parameters
			if (!displayName) {
				return res.status(400).json({
					success: false,
					message: "Missing required parameters: displayName is required",
				});
			}

			// Create timestamp for createdAt and lastUpdated
			const now = toFirestoreTimestamp(Date.now());

			// Create new AdsPowerAccount
			const newAccount = new AdsPowerAccount({
				userId: req.user.uid,
				widgetId: accountId,
				displayName,
				platform: "twitter",
				createdAt: now,
				currentCampaignId: newCampaignId || null,
				status: "ready",
				lastUpdated: now,
				pendingLeadsCount: 0,
			});

			await newAccount.save();

			account = newAccount;
		}

		if (account.userId !== req.user.uid)
			return res.status(403).json({ success: false, message: "Access denied" });

		if (newCampaignId) {
			const campaign = await Campaign.findById(newCampaignId);
			if (!campaign || campaign.platform !== account.platform) {
				return res.status(400).json({
					success: false,
					message: "Platform mismatch: cannot assign",
				});
			}
		}

		account.currentCampaignId = newCampaignId;
		account.lastUpdated = toFirestoreTimestamp(new Date());

		await account.save();

		res.json({ success: true, message: "AdsPowerAccount reassigned" });
	} catch (err) {
		console.error("Assign error:", err);
		res
			.status(500)
			.json({ success: false, message: "Failed to assign account" });
	}
});

// PATCH /api/v1/account/assign-many
router.patch("/assign-many", authenticateToken, async (req, res) => {
	const { accountIds, newCampaignId } = req.body;
	if (!Array.isArray(accountIds) || newCampaignId === undefined) {
		return res.status(400).json({ success: false, message: "Missing params" });
	}
	try {
		const campaign = await Campaign.findById(newCampaignId);
		for (const widgetId of accountIds) {
			const account = await AdsPowerAccount.findOne({ widgetId });
			if (!account) continue;
			if (account.userId !== req.user.uid) continue;
			if (campaign && campaign.platform !== account.platform) continue;

			account.currentCampaignId = newCampaignId;
			account.lastUpdated = toFirestoreTimestamp(new Date());
			await account.save();
		}
		res.json({ success: true, message: "Accounts reassigned" });
	} catch (err) {
		console.error("Assign-many error:", err);
		res
			.status(500)
			.json({ success: false, message: "Failed to reassign accounts" });
	}
});

// campaigns
// POST /api/v1/campaign/start - Start campaign
router.post("/start", async (req, res) => {
	return res.status(200).json({ success: true, message: "Campaign started" });
	try {
		const { widgetId } = req.body;

		if (!widgetId) {
			return res.status(400).json({
				success: false,
				message: "Missing Widget ID",
			});
		}

		const account = await AdsPowerAccount.findOneAndUpdate(
			{ widgetId },
			{
				status: "active",
				lastUpdated: new Date(),
				pendingLeadsCount: 0,
			},
			{ new: true }
		);

		if (!account) {
			return res.status(404).json({
				success: false,
				message: "Account not found",
			});
		}

		const campaign = await Campaign.findOneAndUpdate(
			{ _id: account.currentCampaignId, userId: req.user.uid },
			{
				status: "active",
				lastUpdated: new Date(),
			},
			{ new: true }
		);

		if (!campaign) {
			return res.status(404).json({
				success: false,
				message: "Campaign not found",
			});
		}

		await LeadService.assignLeadsToAccount(
			account.currentCampaignId,
			widgetId,
			24
		);

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

		const accounts = await AdsPowerAccount.find({
			currentCampaignId: campaignId,
		});

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

		const account = await AdsPowerAccount.findOne({ widgetId: accountId });
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

		const accounts = await AdsPowerAccount.find({
			currentCampaignId: campaignId,
		});

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

router.get("/fetch-leads", async (req, res) => {
	try {
		const { campaignId, accountId } = req.query;
		if (!campaignId || !accountId) {
			return res
				.status(400)
				.json({ success: false, message: "Missing required parameters" });
		}

		const campaign = await Campaign.findById(campaignId).lean();
		if (!campaign) {
			return res
				.status(404)
				.json({ success: false, message: "Campaign not found" });
		}

		// const withinWorkingHours = WorkingHoursService.isWithinWorkingHours(
		// 	campaign.workingHours || { start: 0, end: 24 }
		// );

		// if (!withinWorkingHours) {
		// 	return res.status(200).json({
		// 		success: true,
		// 		leads: [],
		// 		batchSize: 0,
		// 		message: "Campaign is not within working hours",
		// 	});
		// }

		// if (req.user.subscription.status === "trial") {
		// 	// get analytics count
		// 	const campaignIds = await Campaign.distinct("_id", {
		// 		userId: req.user.uid,
		// 	});

		// 	// Simplified date range
		// 	const now = new Date();
		// 	const startOfDay = new Date(
		// 		now.getFullYear(),
		// 		now.getMonth(),
		// 		now.getDate()
		// 	);
		// 	const endOfDay = new Date(
		// 		now.getFullYear(),
		// 		now.getMonth(),
		// 		now.getDate() + 1
		// 	);

		// 	const analyticsCount = await Analytics.countDocuments({
		// 		status: "initialdmsent",
		// 		campaignID: { $in: campaignIds },
		// 		"createdAt._seconds": {
		// 			$gte: Math.floor(startOfDay.getTime() / 1000),
		// 			$lt: Math.floor(endOfDay.getTime() / 1000),
		// 		},
		// 	});

		// 	if (analyticsCount >= 50) {
		// 		return res.status(200).json({
		// 			success: true,
		// 			leads: [],
		// 			batchSize: 0,
		// 			message:
		// 				"Daily free quota exceeded. Upgrade to paid tier to continue.",
		// 		});
		// 	}
		// }

		// const rateInfo = await RateService.getRateLimitInfo(
		// 	accountId,
		// 	campaign.workingHours || { start: 0, end: 24 },
		// 	campaign.messageLimits || { min: 35, max: 41 }
		// );

		// if (rateInfo.remainingMessages <= 0) {
		// 	return res.json({
		// 		success: true,
		// 		leads: [],
		// 		batchSize: 0,
		// 		message: `Daily message limit reached (${rateInfo.messageLimitsMax}/${rateInfo.messageLimitsMax} sent)`,
		// 	});
		// }

		// let leads = await LeadService.fetchLeadsForProcessing(
		// 	campaignID,
		// 	accountId,
		// 	8
		// );

		// if (leads.length === 0) {
		// 	const leadsCount = await LeadService.assignLeadsToAccount(
		// 		campaignID,
		// 		accountId,
		// 		24
		// 	);
		// 	if (leadsCount === 0) {
		// 		return res.status(400).json({
		// 			success: true,
		// 			leads: [],
		// 			batchSize: 0,
		// 			message: "No leads available",
		// 		});
		// 		// restart the campaign else mark as complete
		// 	} else {
		// 		leads = await LeadService.fetchLeadsForProcessing(
		// 			campaignID,
		// 			accountId,
		// 			8
		// 		);
		// 	}
		// }

		// const workingHoursInfo = WorkingHoursService.getWorkingHoursProgress();

		const leads = await Lead.find({
			campaignId,
			status: "ready",
		}).limit(8);
		console.log("leads", leads);
		res.json({
			success: true,
			leads,
			batchSize: 8,
			// ...rateInfo,
			// ...workingHoursInfo,
		});
	} catch (error) {
		console.error("Error fetching leads:", error);
		res.status(500).json({ success: false, message: "Failed to fetch leads" });
	}
});

module.exports = router;
