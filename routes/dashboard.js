const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../middleware/auth");
const { subscribed } = require("../middleware/subscribed");
const { db, admin } = require("../config/firebase");
const { createResponse } = require("../utils/helpers");
const { HTTP_STATUS } = require("../utils/my_constants");

router.use(authenticateToken);
router.use(subscribed);

// Get overall dashboard stats
router.get("/stats", async (req, res) => {
	try {
		const userId = req.user.uid;

		// Get user's campaigns
		const campaignsSnapshot = await db
			.collection("campaigns")
			.where("userId", "==", userId)
			.get();

		const campaigns = campaignsSnapshot.docs.map((doc) => ({
			id: doc.id,
			...doc.data(),
		}));

		// Get user's accounts
		const accountsSnapshot = await db
			.collection("accounts")
			.where("userId", "==", userId)
			.get();

		const accounts = accountsSnapshot.docs.map((doc) => ({
			id: doc.id,
			...doc.data(),
		}));

		// Calculate stats
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

		// Get today's messages (last 24 hours)
		const yesterday = Date.now() - 24 * 60 * 60 * 1000;
		const todayAnalyticsSnapshot = await db
			.collection("analytics")
			.where("createdAt", ">=", yesterday)
			.get();

		const todayMessages = todayAnalyticsSnapshot.docs.filter((doc) => {
			const data = doc.data();
			return (
				campaigns.some((c) => c.id === data.campaignID) &&
				["initialdmsent", "followup"].includes(data.status)
			);
		});

		const todayReplies = todayAnalyticsSnapshot.docs.filter((doc) => {
			const data = doc.data();
			return (
				campaigns.some((c) => c.id === data.campaignID) &&
				data.status === "replyreceived"
			);
		});

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

// Get performance data for charts (last 7 days)
router.get("/performance", async (req, res) => {
	try {
		const userId = req.user.uid;
		const { timeRange = 7 } = req.query; // Default 7 days

		// Get user's campaigns
		const campaignsSnapshot = await db
			.collection("campaigns")
			.where("userId", "==", userId)
			.get();

		const campaignIds = campaignsSnapshot.docs.map((doc) => doc.id);

		if (campaignIds.length === 0) {
			return res.json(
				createResponse(true, {
					daily: {
						labels: [],
						datasets: [],
					},
				})
			);
		}

		// Get analytics data for the specified time range
		const daysAgo = parseInt(timeRange);
		const startDate = Date.now() - daysAgo * 24 * 60 * 60 * 1000;

		const analyticsSnapshot = await db
			.collection("analytics")
			.where("createdAt", ">=", startDate)
			.orderBy("createdAt", "asc")
			.get();

		// Process data by day
		const dailyData = {};
		const today = new Date();

		// Initialize days
		for (let i = daysAgo - 1; i >= 0; i--) {
			const date = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
			const dayKey = date.toLocaleDateString("en-US", { weekday: "short" });
			dailyData[dayKey] = { messages: 0, replies: 0 };
		}

		// Aggregate analytics data
		analyticsSnapshot.docs.forEach((doc) => {
			const data = doc.data();
			if (campaignIds.includes(data.campaignID)) {
				const date = new Date(data.createdAt);
				const dayKey = date.toLocaleDateString("en-US", { weekday: "short" });

				if (dailyData[dayKey]) {
					if (["initialdmsent", "followup"].includes(data.status)) {
						dailyData[dayKey].messages++;
					} else if (data.status === "replyreceived") {
						dailyData[dayKey].replies++;
					}
				}
			}
		});

		const labels = Object.keys(dailyData);
		const messagesData = Object.values(dailyData).map((d) => d.messages);
		const repliesData = Object.values(dailyData).map((d) => d.replies);

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

// Get campaign rankings
router.get("/campaign-rankings", async (req, res) => {
	try {
		const userId = req.user.uid;

		// Get user's campaigns
		const campaignsSnapshot = await db
			.collection("campaigns")
			.where("userId", "==", userId)
			.get();

		const campaigns = campaignsSnapshot.docs.map((doc) => ({
			id: doc.id,
			...doc.data(),
		}));

		// Get analytics for each campaign (last 7 days)
		const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
		const analyticsSnapshot = await db
			.collection("analytics")
			.where("createdAt", ">=", weekAgo)
			.get();

		// Aggregate by campaign
		const campaignStats = {};
		campaigns.forEach((campaign) => {
			campaignStats[campaign.id] = {
				name: campaign.name,
				platform: campaign.platform,
				dms: 0,
				replies: 0,
			};
		});

		analyticsSnapshot.docs.forEach((doc) => {
			const data = doc.data();
			if (campaignStats[data.campaignID]) {
				if (["initialdmsent", "followup"].includes(data.status)) {
					campaignStats[data.campaignID].dms++;
				} else if (data.status === "replyreceived") {
					campaignStats[data.campaignID].replies++;
				}
			}
		});

		// Convert to array and sort by DMs sent
		const rankings = Object.values(campaignStats)
			.sort((a, b) => b.dms - a.dms)
			.slice(0, 5); // Top 5

		res.json(createResponse(true, rankings));
	} catch (error) {
		console.error("Error fetching campaign rankings:", error);
		res
			.status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
			.json(createResponse(false, null, "Failed to fetch campaign rankings"));
	}
});

// Get recent activity
router.get("/recent-activity", async (req, res) => {
	try {
		const userId = req.user.uid;
		const { limit = 10 } = req.query;

		// Get user's campaigns
		const campaignsSnapshot = await db
			.collection("campaigns")
			.where("userId", "==", userId)
			.get();

		const campaignIds = campaignsSnapshot.docs.map((doc) => doc.id);
		const campaignNames = {};
		campaignsSnapshot.docs.forEach((doc) => {
			campaignNames[doc.id] = doc.data().name;
		});

		if (campaignIds.length === 0) {
			return res.json(createResponse(true, []));
		}

		// Get recent analytics
		const analyticsSnapshot = await db
			.collection("analytics")
			.orderBy("createdAt", "desc")
			.limit(parseInt(limit) * 2) // Get more to filter user's data
			.get();

		const activities = [];
		analyticsSnapshot.docs.forEach((doc) => {
			const data = doc.data();
			if (
				campaignIds.includes(data.campaignID) &&
				activities.length < parseInt(limit)
			) {
				let action = "";
				if (data.status === "initialdmsent") {
					action = `Sent initial DM in ${campaignNames[data.campaignID]}`;
				} else if (data.status === "followup") {
					action = `Sent follow-up in ${campaignNames[data.campaignID]}`;
				} else if (data.status === "replyreceived") {
					action = `Received reply in ${campaignNames[data.campaignID]}`;
				}

				if (action) {
					const time = new Date(data.createdAt);
					const now = new Date();
					const diffMinutes = Math.floor((now - time) / (1000 * 60));

					let timeStr = "";
					if (diffMinutes < 60) {
						timeStr = `${diffMinutes}m ago`;
					} else if (diffMinutes < 1440) {
						timeStr = `${Math.floor(diffMinutes / 60)}h ago`;
					} else {
						timeStr = `${Math.floor(diffMinutes / 1440)}d ago`;
					}

					activities.push({
						action,
						time: timeStr,
						platform: data.platform || "instagram",
					});
				}
			}
		});

		res.json(createResponse(true, activities));
	} catch (error) {
		console.error("Error fetching recent activity:", error);
		res
			.status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
			.json(createResponse(false, null, "Failed to fetch recent activity"));
	}
});

// Add to your existing dashboard routes

// Get campaign metrics
router.get("/campaign-metrics", async (req, res) => {
	try {
		const userId = req.user.uid;

		const campaignsSnapshot = await db
			.collection("campaigns")
			.where("userId", "==", userId)
			.get();

		const campaigns = campaignsSnapshot.docs.map((doc) => doc.data());

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

// Get campaigns with analytics
router.get("/campaigns-analytics", async (req, res) => {
	try {
		const userId = req.user.uid;

		// This would combine campaign data with their analytics
		// You can implement this based on your specific needs
	} catch (error) {
		console.error("Error fetching campaigns analytics:", error);
		res
			.status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
			.json(createResponse(false, null, "Failed to fetch campaigns analytics"));
	}
});

// Add this route to your dashboard.js file
router.get("/recent-messages", authenticateToken, async (req, res) => {
	try {
		const { limit = 50 } = req.query;

		// Get user's Instagram accounts
		const accountsSnap = await db
			.collection("instagram_accounts")
			.where("user", "==", req.user.uid)
			.get();

		if (accountsSnap.empty) {
			return res.json({ success: true, messages: [] });
		}

		const accountIds = accountsSnap.docs.map((doc) => doc.data().user_id);

		// Get recent conversations for user's accounts
		const conversationsSnap = await db
			.collection("instagram_conversations")
			.where("webhook_owner_id", "in", accountIds.map(String))
			.orderBy("last_time", "desc")
			.limit(parseInt(limit))
			.get();

		const recentMessages = [];

		for (const doc of conversationsSnap.docs) {
			const data = doc.data();

			// Get campaign name if available
			let campaignName = "N/A";
			if (data.campaignId) {
				try {
					const campaignDoc = await db
						.collection("campaigns")
						.doc(data.campaignId)
						.get();
					if (campaignDoc.exists) {
						campaignName =
							campaignDoc.data().name ||
							campaignDoc.data().title ||
							"Unnamed Campaign";
					}
				} catch (err) {
					console.log("Campaign fetch error:", err);
				}
			}

			// Format timestamp
			const timestamp = data.last_time?.toDate();
			const timeAgo = timestamp ? formatTimeAgo(timestamp) : "Unknown";

			recentMessages.push({
				id: doc.id,
				account: data.businessAccount?.username || "Unknown",
				recipient: data.clientAccount?.username || "Unknown",
				type: data.responded ? "sent" : "reply",
				content: data.last_message || "No message content",
				timestamp: timeAgo,
				campaign: campaignName,
				interested: data.interested || false,
				unread_count: data.unread_count || 0,
				tags: data.tags || [],
			});
		}

		res.json({ success: true, messages: recentMessages });
	} catch (error) {
		console.error("Error fetching recent messages:", error);
		res.status(500).json({ error: error.message });
	}
});

// Helper function to format time ago
function formatTimeAgo(date) {
	const now = new Date();
	const diffInSeconds = Math.floor((now - date) / 1000);

	if (diffInSeconds < 60) return "Just now";
	if (diffInSeconds < 3600)
		return `${Math.floor(diffInSeconds / 60)} minutes ago`;
	if (diffInSeconds < 86400)
		return `${Math.floor(diffInSeconds / 3600)} hours ago`;
	if (diffInSeconds < 604800)
		return `${Math.floor(diffInSeconds / 86400)} days ago`;
	return date.toLocaleDateString();
}

module.exports = router;
