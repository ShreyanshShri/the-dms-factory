const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../middleware/auth");
const { createResponse } = require("../utils/helpers");
const { HTTP_STATUS } = require("../utils/my_constants");

const Campaign = require("../models/Campaign");
const {
	InstagramAccount,
	InstagramConversation,
} = require("../models/Instagram");
const Analytics = require("../models/Analytics");
const Account = require("../models/Account");

router.use(authenticateToken);

// Get overall dashboard stats
// CHANGED: Now queries Analytics with date field instead of Firestore timestamps
router.get("/stats", async (req, res) => {
	try {
		const userId = req.user.uid;

		const campaigns = await Campaign.find({ userId }).lean();
		const accounts = await Account.find({ userId: userId }).lean();

		const totalCampaigns = campaigns.length;
		const activeCampaigns = campaigns.filter(
			(c) => c.status === "active"
		).length;
		const pausedCampaigns = campaigns.filter(
			(c) => c.status === "paused"
		).length;

		const totalAccounts = accounts.length;
		const activeAccounts = accounts.filter((a) => a.status === "active").length;
		const pausedAccounts = accounts.filter((a) => a.status === "paused").length;

		// CHANGED: Query today's date in YYYY-MM-DD format
		const today = new Date().toISOString().split("T")[0];
		const campaignIds = campaigns.map((c) => String(c._id));

		const todayAnalytics = await Analytics.find({
			campaignID: { $in: campaignIds },
			date: today,
		}).lean();

		// CHANGED: Sum counters from Analytics documents
		const dmsSentToday = todayAnalytics.reduce(
			(sum, a) => sum + (a.initialDMsSent || 0) + (a.followUpsSent || 0),
			0
		);
		const repliesToday = todayAnalytics.reduce(
			(sum, a) => sum + (a.messagesReceived || 0),
			0
		);

		const replyRate =
			dmsSentToday > 0 ? ((repliesToday / dmsSentToday) * 100).toFixed(1) : 0;

		res.json(
			createResponse(true, {
				totalCampaigns,
				activeCampaigns,
				pausedCampaigns,
				totalAccounts,
				activeAccounts,
				pausedAccounts,
				dmsSentToday,
				repliesToday,
				replyRate: `${replyRate}%`,
			})
		);
	} catch (error) {
		console.error("Error fetching dashboard stats:", error);
		res
			.status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
			.json(createResponse(false, null, "Failed to fetch dashboard stats"));
	}
});

// Get performance data for charts (last X days)
// CHANGED: Now queries Analytics with date strings instead of Firestore timestamps
router.get("/performance", async (req, res) => {
	try {
		const userId = req.user.uid;
		const { timeRange = 7 } = req.query;
		const daysAgo = parseInt(timeRange);

		const campaigns = await Campaign.find({ userId }).lean();
		if (campaigns.length === 0) {
			return res.json(
				createResponse(true, {
					daily: { labels: [], datasets: [] },
				})
			);
		}

		const campaignIds = campaigns.map((c) => String(c._id));

		// CHANGED: Generate date range in YYYY-MM-DD format
		const dateStrings = [];
		const labels = [];

		for (let i = daysAgo - 1; i >= 0; i--) {
			const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
			dateStrings.push(date.toISOString().split("T")[0]);
			labels.push(date.toLocaleDateString("en-US", { weekday: "short" }));
		}

		// CHANGED: Query Analytics with date range
		const analyticsRecords = await Analytics.find({
			campaignID: { $in: campaignIds },
			date: { $in: dateStrings },
		}).lean();

		// CHANGED: Map date -> counters
		const dailyData = {};
		dateStrings.forEach((dateStr, idx) => {
			dailyData[dateStr] = {
				messages: 0,
				replies: 0,
				label: labels[idx],
			};
		});

		analyticsRecords.forEach((record) => {
			if (dailyData[record.date]) {
				dailyData[record.date].messages +=
					(record.initialDMsSent || 0) + (record.followUpsSent || 0);
				dailyData[record.date].replies += record.messagesReceived || 0;
			}
		});

		// Generate final arrays
		const messagesData = dateStrings.map((d) => dailyData[d].messages);
		const repliesData = dateStrings.map((d) => dailyData[d].replies);

		res.json(
			createResponse(true, {
				daily: {
					labels,
					datasets: [
						{
							label: "DMs Sent",
							data: messagesData,
							borderColor: "#3B82F6",
							backgroundColor: "rgba(59, 130, 246, 0.1)",
							fill: true,
						},
						{
							label: "Replies",
							data: repliesData,
							borderColor: "#10B981",
							backgroundColor: "rgba(16, 185, 129, 0.1)",
							fill: true,
						},
					],
				},
			})
		);
	} catch (error) {
		console.error("Error fetching performance data:", error);
		res
			.status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
			.json(createResponse(false, null, "Failed to fetch performance data"));
	}
});

// Get campaign rankings (top 5 campaigns last 7 days)
// CHANGED: Now queries Analytics with date strings instead of Firestore timestamps
router.get("/campaign-rankings", async (req, res) => {
	try {
		const userId = req.user.uid;

		const campaigns = await Campaign.find({ userId }).lean();

		// CHANGED: Generate last 7 days date range
		const dateStrings = [];
		for (let i = 6; i >= 0; i--) {
			const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
			dateStrings.push(date.toISOString().split("T")[0]);
		}

		// CHANGED: Query Analytics with date range
		const analyticsRecords = await Analytics.find({
			date: { $in: dateStrings },
		}).lean();

		// Initialize campaign stats
		const campaignStats = {};
		campaigns.forEach((c) => {
			campaignStats[String(c._id)] = {
				name: c.name,
				platform: c.platform,
				dms: 0,
				replies: 0,
				replyRate: 0,
			};
		});

		// CHANGED: Sum counters from Analytics records
		analyticsRecords.forEach((record) => {
			const cStat = campaignStats[record.campaignID];
			if (!cStat) return;

			cStat.dms += (record.initialDMsSent || 0) + (record.followUpsSent || 0);
			cStat.replies += record.messagesReceived || 0;
		});

		// Calculate reply rates and prepare rankings
		const rankings = Object.values(campaignStats)
			.map((campaign) => ({
				...campaign,
				replyRate:
					campaign.dms > 0
						? ((campaign.replies / campaign.dms) * 100).toFixed(1) + "%"
						: "0%",
			}))
			.sort((a, b) => b.dms - a.dms)
			.slice(0, 5);

		res.json(createResponse(true, rankings));
	} catch (error) {
		console.error("Error fetching campaign rankings:", error);
		res
			.status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
			.json(createResponse(false, null, "Failed to fetch campaign rankings"));
	}
});

// Get recent activity (limit by query param)
// ⚠️ WARNING: This endpoint CANNOT work with the new Analytics schema
// The new schema only stores daily aggregated counters, not individual events with timestamps/usernames
// You have 3 options:
// 1. Remove this endpoint completely
// 2. Keep it but return empty array
// 3. Store detailed events in a separate collection if you need this feature
router.get("/recent-activity", async (req, res) => {
	try {
		// Option 2: Return empty array since we don't have individual event data
		res.json(createResponse(true, []));

		// NOTE: If you need this feature, you'll need to store individual events
		// in a separate collection alongside the aggregated Analytics data
	} catch (error) {
		console.error("Error fetching recent activity:", error);
		res
			.status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
			.json(createResponse(false, null, "Failed to fetch recent activity"));
	}
});

// Campaign metrics for dashboard
router.get("/campaign-metrics", async (req, res) => {
	try {
		const userId = req.user.uid;
		const campaigns = await Campaign.find({ userId }).lean();

		const metrics = {
			totalCampaigns: campaigns.length,
			activeCampaigns: campaigns.filter((c) => c.status === "active").length,
			pausedCampaigns: campaigns.filter((c) => c.status === "paused").length,
			completedCampaigns: campaigns.filter((c) => c.status === "completed")
				.length,
		};

		res.json(createResponse(true, metrics));
	} catch (error) {
		console.error("Error fetching campaign metrics:", error);
		res
			.status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
			.json(createResponse(false, null, "Failed to fetch campaign metrics"));
	}
});

// Recent messages endpoint
router.get("/recent-messages", authenticateToken, async (req, res) => {
	try {
		const { limit = 50 } = req.query;
		const accounts = await InstagramAccount.find({ user: req.user.uid }).lean();

		if (accounts.length === 0) return res.json({ success: true, messages: [] });

		const accountIds = accounts.map((acc) => String(acc.user_id));
		const conversations = await InstagramConversation.find({
			webhook_owner_id: { $in: accountIds },
		})
			.sort({ last_time: -1 })
			.limit(parseInt(limit))
			.lean();

		const recentMessages = [];

		for (const conv of conversations) {
			let campaignName = "N/A";
			if (conv.campaignId) {
				try {
					const campaign = await Campaign.findById(conv.campaignId).lean();
					if (campaign) campaignName = campaign.name || "Unnamed Campaign";
				} catch (err) {
					console.error("Campaign fetch error:", err);
				}
			}

			const timeAgo = formatTimeAgo(conv.last_time);

			recentMessages.push({
				id: conv._id,
				account: conv.businessAccount?.username || "Unknown",
				recipient: conv.clientAccount?.username || "Unknown",
				type: conv.responded ? "sent" : "reply",
				content: conv.last_message || "No message content",
				timestamp: timeAgo,
				campaign: campaignName,
				interested: conv.interested || false,
				unread_count: conv.unread_count || 0,
				tags: conv.tags || [],
			});
		}

		res.json({ success: true, messages: recentMessages });
	} catch (error) {
		console.error("Error fetching recent messages:", error);
		res.status(500).json({ error: error.message });
	}
});

// Helper function for relative time formatting
function formatTimeAgo(date) {
	if (!date) return "Unknown";
	const now = new Date();
	const diffSeconds = Math.floor((now - new Date(date)) / 1000);

	if (diffSeconds < 60) return "Just now";
	if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)} minutes ago`;
	if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)} hours ago`;
	if (diffSeconds < 604800)
		return `${Math.floor(diffSeconds / 86400)} days ago`;
	return new Date(date).toLocaleDateString();
}

module.exports = router;
