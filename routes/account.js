const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../middleware/auth");

const Account = require("../models/Account");
const Campaign = require("../models/Campaign");

router.use(authenticateToken);

function toFirestoreTimestamp(dateInput) {
	const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
	return {
		_seconds: Math.floor(date.getTime() / 1000),
		_nanoseconds: (date.getTime() % 1000) * 1000000,
	};
}

// GET /api/v1/account/overview
router.get("/overview", async (req, res) => {
	try {
		const userId = req.user.uid;

		const campaigns = await Campaign.find({ userId }).lean();
		const accounts = await Account.find({ userId }).lean();

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
		console.error("Account overview error:", err);
		res
			.status(500)
			.json({ success: false, message: "Failed to fetch overview" });
	}
});

// PATCH /api/v1/account/assign
router.patch("/assign", async (req, res) => {
	const { accountId, newCampaignId } = req.body;
	if (!accountId || newCampaignId === undefined) {
		return res.status(400).json({ success: false, message: "Missing params" });
	}
	try {
		const account = await Account.findOne({ widgetId: accountId });
		if (!account)
			return res
				.status(403)
				.json({ success: false, message: "Account not found" });
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

		res.json({ success: true, message: "Account reassigned" });
	} catch (err) {
		console.error("Assign error:", err);
		res
			.status(500)
			.json({ success: false, message: "Failed to assign account" });
	}
});

// PATCH /api/v1/account/assign-many
router.patch("/assign-many", async (req, res) => {
	const { accountIds, newCampaignId } = req.body;
	if (!Array.isArray(accountIds) || newCampaignId === undefined) {
		return res.status(400).json({ success: false, message: "Missing params" });
	}
	try {
		const campaign = await Campaign.findById(newCampaignId);
		for (const widgetId of accountIds) {
			const account = await Account.findOne({ widgetId });
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

module.exports = router;
