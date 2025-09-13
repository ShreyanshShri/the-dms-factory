const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../middleware/auth");
const { subscribed } = require("../middleware/subscribed");
const { createResponse } = require("../utils/helpers");
const { HTTP_STATUS } = require("../utils/my_constants");

const Campaign = require("../models/Campaign");
const {
	InstagramAccount,
	InstagramConversation,
} = require("../models/Instagram");
const Analytics = require("../models/Analytics");

router.use(authenticateToken);
router.use(subscribed);

// Get overall dashboard stats
router.get("/stats", async (req, res) => {
	try {
		const userId = req.user.uid;

		const campaigns = await Campaign.find({ userId }).lean();
		const accounts = await InstagramAccount.find({ user: userId }).lean();

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

		const yesterday = Date.now() - 24 * 60 * 60 * 1000;
		const analyticsDocs = await Analytics.find({
			createdAt: { $gte: new Date(yesterday) },
		});

		const todayMessages = analyticsDocs.filter(
			(d) =>
				campaigns.some((c) => String(c._id) === d.campaignID) &&
				["initialdmsent", "followup"].includes(d.status)
		);

		const todayReplies = analyticsDocs.filter(
			(d) =>
				campaigns.some((c) => String(c._id) === d.campaignID) &&
				d.status === "replyreceived"
		);

		const dmsSentToday = todayMessages.length;
		const repliesToday = todayReplies.length;
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
router.get("/performance", async (req, res) => {
	try {
		const userId = req.user.uid;
		const { timeRange = 7 } = req.query; // days
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
		const startDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
		const analyticsDocs = await Analytics.find({
			createdAt: { $gte: startDate },
		}).sort("createdAt");

		const dailyData = {};
		const today = new Date();
		for (let i = daysAgo - 1; i >= 0; i--) {
			const date = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
			const dayKey = date.toLocaleDateString("en-US", { weekday: "short" });
			dailyData[dayKey] = { messages: 0, replies: 0 };
		}

		analyticsDocs.forEach((doc) => {
			if (!campaignIds.includes(doc.campaignID)) return;
			const dayKey = new Date(doc.createdAt).toLocaleDateString("en-US", {
				weekday: "short",
			});
			if (!dailyData[dayKey]) return;
			if (["initialdmsent", "followup"].includes(doc.status)) {
				dailyData[dayKey].messages++;
			} else if (doc.status === "replyreceived") {
				dailyData[dayKey].replies++;
			}
		});

		const labels = Object.keys(dailyData);
		const messagesData = labels.map((label) => dailyData[label].messages);
		const repliesData = labels.map((label) => dailyData[label].replies);

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
router.get("/campaign-rankings", async (req, res) => {
	try {
		const userId = req.user.uid;
		const campaigns = await Campaign.find({ userId }).lean();
		const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
		const analyticsDocs = await Analytics.find({
			createdAt: { $gte: weekAgo },
		});

		const campaignStats = {};
		campaigns.forEach((c) => {
			campaignStats[String(c._id)] = {
				name: c.name,
				platform: c.platform,
				dms: 0,
				replies: 0,
			};
		});

		analyticsDocs.forEach((doc) => {
			const cStat = campaignStats[doc.campaignID];
			if (!cStat) return;
			if (["initialdmsent", "followup"].includes(doc.status)) cStat.dms++;
			else if (doc.status === "replyreceived") cStat.replies++;
		});

		const rankings = Object.values(campaignStats)
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
router.get("/recent-activity", async (req, res) => {
	try {
		const userId = req.user.uid;
		const limit = parseInt(req.query.limit) || 10;

		const campaigns = await Campaign.find({ userId }).lean();
		const campaignIds = campaigns.map((c) => String(c._id));
		const campaignNames = {};
		campaigns.forEach((c) => {
			campaignNames[String(c._id)] = c.name;
		});

		if (campaignIds.length === 0) return res.json(createResponse(true, []));

		const analyticsDocs = await Analytics.find({})
			.sort({ createdAt: -1 })
			.limit(limit * 2);

		const activities = [];
		analyticsDocs.some((doc) => {
			if (campaignIds.includes(doc.campaignID) && activities.length < limit) {
				let action = "";
				if (doc.status === "initialdmsent") {
					action = `Sent initial DM in ${campaignNames[doc.campaignID]}`;
				} else if (doc.status === "followup") {
					action = `Sent follow-up in ${campaignNames[doc.campaignID]}`;
				} else if (doc.status === "replyreceived") {
					action = `Received reply in ${campaignNames[doc.campaignID]}`;
				}
				if (action) {
					const time = new Date(doc.createdAt);
					const now = new Date();
					const diffMinutes = Math.floor((now - time) / (1000 * 60));
					let timeStr = "";
					if (diffMinutes < 60) timeStr = `${diffMinutes}m ago`;
					else if (diffMinutes < 1440)
						timeStr = `${Math.floor(diffMinutes / 60)}h ago`;
					else timeStr = `${Math.floor(diffMinutes / 1440)}d ago`;

					activities.push({
						action,
						time: timeStr,
						platform: doc.platform || "instagram",
					});
				}
				return false;
			}
			return false;
		});

		res.json(createResponse(true, activities));
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
					console.log("Campaign fetch error:", err);
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
