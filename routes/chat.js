const express = require("express");
const axios = require("axios");
const router = express.Router();

const IG_APP_ID = process.env.IG_APP_ID;
const IG_APP_SECRET = process.env.IG_APP_SECRET;
const IG_LOGIN_REDIRECT_URI = process.env.IG_LOGIN_REDIRECT_URI;

const { authenticateToken } = require("../middleware/auth");
const {
	InstagramAccount,
	InstagramConversation,
} = require("../models/Instagram");
const Lead = require("../models/Lead");
const Campaign = require("../models/Campaign");
const Analytics = require("../models/Analytics");
const User = require("../models/User");

const {
	isSubscribed,
	requireTier,
	optionalSubscription,
} = require("../middleware/subscribed");

function toFirestoreTimestamp(dateInput) {
	const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
	return {
		_seconds: Math.floor(date.getTime() / 1000),
		_nanoseconds: (date.getTime() % 1000) * 1000000,
	};
}

// Login route
router.get(
	"/login",
	authenticateToken,
	requireTier(["Standard", "Premium"]),
	(req, res) => {
		const scopes =
			"instagram_business_basic,instagram_business_manage_messages";
		const meta = JSON.stringify({ uid: req.user.uid });

		const authURL =
			`https://api.instagram.com/oauth/authorize` +
			`?client_id=${IG_APP_ID}` +
			`&redirect_uri=${encodeURIComponent(IG_LOGIN_REDIRECT_URI)}` +
			`&scope=${scopes}` +
			`&response_type=code` +
			`&state=${encodeURIComponent(meta)}`;

		res.json({ authURL });
	}
);

// OAuth callback route
router.get("/callback", async (req, res) => {
	const { code, state } = req.query;
	if (!code) return res.status(400).json({ error: "Missing code" });

	const meta = JSON.parse(decodeURIComponent(state));

	try {
		// Get short-lived token
		const tokenRes = await axios.post(
			"https://api.instagram.com/oauth/access_token",
			new URLSearchParams({
				client_id: IG_APP_ID,
				client_secret: IG_APP_SECRET,
				grant_type: "authorization_code",
				redirect_uri: IG_LOGIN_REDIRECT_URI,
				code,
			})
		);
		const { access_token: shortTok, user_id } = tokenRes.data;

		// Verify account type
		const accountInfoRes = await axios.get("https://graph.instagram.com/me", {
			params: {
				fields: "id,username,account_type,user_id",
				access_token: shortTok,
			},
		});
		const accountInfo = accountInfoRes.data;

		const user = await User.findOne({ uid: meta.uid }).lean();
		if (
			user &&
			user.subscription?.status !== "active" &&
			(user.subscription?.tier !== "Premium" ||
				user.subscription?.tier !== "Standard")
		) {
			const redirectURL =
				process.env.NODE_ENV === "production"
					? `/dashboard/inbox?loggedIn=false&message=You-must-have-an-active-subscription-to-use-this-feature`
					: `http://localhost:3000/dashboard/inbox?loggedIn=false&message=You-must-have-an-active-subscription-to-use-this-feature`;

			return res.redirect(redirectURL);
		}

		if (accountInfo.account_type !== "BUSINESS") {
			throw new Error(
				`Account must be Business type, got: ${accountInfo.account_type}`
			);
		}

		// Exchange for long-lived token
		const longTokRes = await axios.get(
			"https://graph.instagram.com/access_token",
			{
				params: {
					grant_type: "ig_exchange_token",
					client_secret: IG_APP_SECRET,
					access_token: shortTok,
				},
			}
		);
		const longTok = longTokRes.data.access_token;

		// Verify long-lived token
		const finalCheck = await axios.get("https://graph.instagram.com/me", {
			params: { fields: "id,username,account_type", access_token: longTok },
		});

		// Subscribe to webhook events
		await axios.post(
			`https://graph.instagram.com/v23.0/me/subscribed_apps?subscribed_fields=messages&access_token=${longTok}`
		);

		await InstagramAccount.findOneAndUpdate(
			{ _id: String(accountInfo.user_id) }, // Using IG ID as _id
			{
				user: meta.uid,
				user_id: accountInfo.user_id, // meta userID
				username: accountInfo.username,
				access_token: longTok,
				token_created: new Date(),
				account_type: accountInfo.account_type,
			},
			{ upsert: true, new: true }
		);

		const redirectURL =
			process.env.NODE_ENV === "production"
				? `/dashboard/inbox?loggedIn=true&username=${accountInfo.username}`
				: `http://localhost:3000/dashboard/inbox?loggedIn=true&username=${accountInfo.username}`;

		return res.redirect(redirectURL);
	} catch (err) {
		console.error("❌ OAuth flow failed:", {
			message: err.message,
			response: err.response?.data,
			status: err.response?.status,
		});
		return res.status(500).json({
			error: "Instagram login failed",
			details: err.response?.data || err.message,
		});
	}
});

router.get("/webhook", (req, res) => {
	const mode = req.query["hub.mode"];
	const token = req.query["hub.verify_token"];
	const challenge = req.query["hub.challenge"];

	// Verify webhook (use your own verify token)
	if (mode === "subscribe" && token === process.env.WEBHOOK_VERIFY_TOKEN) {
		console.log("✅ Webhook verified successfully");
		res.status(200).send(challenge);
	} else {
		console.error("❌ Webhook verification failed");
		console.error("mode:", mode);
		console.error("token:", token);
		console.error("challenge:", challenge);
		console.error(
			"process.env.WEBHOOK_VERIFY_TOKEN:",
			process.env.WEBHOOK_VERIFY_TOKEN
		);
		res.sendStatus(403);
	}
});

const conversationTimers = new Map();

async function sendConversationWebhook(convoKey, business_account_id) {
	try {
		const conv = await InstagramConversation.findById(convoKey).exec();
		if (!conv) {
			console.error("Conversation document not found:", convoKey);
			return;
		}

		if (!conv.messages || conv.messages.length === 0) {
			console.error("No messages found for conversation:", convoKey);
			return;
		}

		let formattedConversation = "";
		conv.messages
			.sort((a, b) => a.timestamp - b.timestamp)
			.forEach((msg) => {
				const isBusiness = msg.sender_id === conv.businessAccount.id;
				const label = isBusiness ? "My msg" : "Prospect";
				formattedConversation += `${label}: ${msg.text}\n`;
			});

		await axios.post(
			// "https://n8n.aigrowtech.ru/webhook/6baef27-40e8-4f77-9b77-26039c0a8d68",
			// "https://n8n.aigrowtech.ru/webhook-test/6baef27b-40e8-4ad9-b22a-10b41a1fff87",
			"https://n8n.aigrowtech.ru/webhook/6baef27b-40e8-4ad9-b22a-10b41a1fff87",
			{
				conversation_key: convoKey,
				business_account_id: conv.businessAccount.id,
				client_account_id: conv.clientAccount.id,
				client_username: conv.clientAccount.username,
				formatted_conversation: formattedConversation.trim(),
				timestamp: new Date().toISOString(),
			}
		);

		console.log("Conversation sent to webhook", { convoKey });
	} catch (error) {
		console.error("Failed to send webhook:", error.message);
	} finally {
		conversationTimers.delete(convoKey);
	}
}

function scheduleConversationWebhook(convoKey, business_account_id, sender_id) {
	if (sender_id === business_account_id) {
		return; // don't schedule for business messages
	}
	if (conversationTimers.has(convoKey)) {
		clearTimeout(conversationTimers.get(convoKey));
		console.log("Cleared existing timer for:", convoKey);
	}
	const timer = setTimeout(() => {
		sendConversationWebhook(convoKey, business_account_id);
	}, 60 * 1000); // 1 minute delay for demo (adjust as needed)
	conversationTimers.set(convoKey, timer);
	console.log("Scheduled webhook for conversation:", convoKey);
}

router.post("/webhook", async (req, res) => {
	if (req.body.object !== "instagram") {
		return res.sendStatus(404);
	}

	try {
		for (const entry of req.body.entry) {
			if (!entry.messaging) continue;

			const business_account_id = entry.id;

			for (const event of entry.messaging) {
				if (!event.message) continue;

				const recipient_id = event.recipient.id;
				const sender_id = event.sender.id;
				const msgText = event.message.text;
				const msgTime = new Date(Number(event.timestamp));

				const convoKey = [sender_id, recipient_id].sort().join("_");

				let conv = await InstagramConversation.findById(convoKey).exec();

				const accountDoc = await InstagramAccount.findById(
					business_account_id
				).exec();

				if (conv) {
					await InstagramConversation.findByIdAndUpdate(convoKey, {
						last_message: msgText,
						last_time: msgTime,
						$inc: { unread_count: business_account_id === sender_id ? 0 : 1 },
						responded: business_account_id === sender_id,
					}).exec();
				} else {
					const isColdDm = business_account_id === sender_id;
					if (isColdDm) {
						// no saved convo + DM from business account, ignore
						return res.sendStatus(200);
					}

					// no saved convo but is a client initiated convo, continue

					// get sender ig info
					let business_username = "";
					let client_username = "";
					let campaignId = null;
					let lead = null;
					if (accountDoc) {
						try {
							const token = accountDoc.access_token;

							const [busRes, cliRes] = await Promise.all([
								axios.get(
									`https://graph.instagram.com/${business_account_id}`,
									{
										params: { fields: "username", access_token: token },
									}
								),
								axios.get(
									`https://graph.instagram.com/${
										recipient_id === business_account_id
											? sender_id
											: recipient_id
									}`,
									{
										params: { fields: "username", access_token: token },
									}
								),
							]);
							business_username = busRes.data.username;
							client_username = cliRes.data.username;
						} catch (err) {
							console.warn("Failed to fetch usernames:", err.message);
						}
					}

					// find campaignId
					let context = "";
					let initial_message = {
						sender_id: recipient_id,
						recipient_id: sender_id,
						text: "",
						timestamp: msgTime,
					};
					if (client_username) {
						lead = await Lead.findOne({
							username: client_username,
						}).exec();
						if (lead) {
							console.log("lead", lead);
							campaignId = lead.campaignId;
							if (campaignId && lead._id) {
								const campaignDoc = await Campaign.findById(campaignId).exec();
								context = campaignDoc?.context || "";
								const analytics = await Analytics.findOne({
									campaignID: campaignId,
									leadID: lead._id,
									status: "initialdmsent",
								});

								if (analytics) {
									initial_message = {
										sender_id: recipient_id,
										recipient_id: sender_id,
										text: analytics.message,
										timestamp: analytics.createdAt._seconds,
									};
								}
							}
						}
					}

					// save the convo
					conv = new InstagramConversation({
						_id: convoKey,
						businessAccount: {
							id: business_account_id,
							username: business_username,
						},
						clientAccount: {
							id:
								recipient_id === business_account_id ? sender_id : recipient_id,
							username: client_username,
						},
						webhook_owner_id: business_account_id,
						last_message: msgText,
						last_time: msgTime,
						unread_count: 1,
						responded: business_account_id === sender_id,
						interested: false,
						tags: [],
						campaignId,
						context,
						createdAt: new Date(),
						// fetch single message (initial COLD DM)
						messages: [initial_message],
					});
					await conv.save();

					// post analytics
					if (
						campaignId &&
						lead._id &&
						client_username &&
						client_username !== ""
					) {
						const now = toFirestoreTimestamp(new Date());
						const analytics = new Analytics({
							campaignID: campaignId,
							leadID: lead._id,
							username: client_username,
							message: msgText,
							status: "replyreceived",
							platform: "instagram",
							timestamp: now,
							createdAt: now,
						});
						await analytics.save();
					}
				}
				// Append message (problematic)
				await InstagramConversation.findByIdAndUpdate(convoKey, {
					$push: {
						messages: {
							sender_id,
							recipient_id,
							text: msgText,
							timestamp: msgTime,
						},
					},
				}).exec();

				// Schedule webhook if sender is other that business (ie user sent msg)
				if (sender_id !== business_account_id) {
					const user = await User.findOne({
						uid: accountDoc.user,
					});
					if (
						user &&
						user.subscription?.status === "active" &&
						user.subscription?.tier === "Premium"
					) {
						scheduleConversationWebhook(
							convoKey,
							business_account_id,
							sender_id
						);
					}
				}
			}
		}

		res.sendStatus(200);
	} catch (err) {
		console.error("Webhook error:", err);
		res.status(500).json({ error: "Webhook failed" });
	}
});

// Get all conversations and accounts for authenticated user (no messages)
router.get(
	"/all-conversations",
	authenticateToken,
	requireTier(["Standard", "Premium"]),
	async (req, res) => {
		try {
			// Extract pagination parameters from query string
			const { page = 1, limit = 10 } = req.query;
			const pageNum = parseInt(page);
			const limitNum = parseInt(limit);
			const skip = (pageNum - 1) * limitNum;

			// Get user's Instagram accounts
			const accounts = await InstagramAccount.find({
				user: req.user.uid,
			}).lean();
			const accountIds = accounts.map((acc) => acc.user_id);

			// Get total count for pagination metadata
			const totalConversations = await InstagramConversation.countDocuments({
				webhook_owner_id: { $in: accountIds },
			});

			// Get paginated conversations using $in operator (more efficient than loop)
			const conversations = await InstagramConversation.find(
				{
					webhook_owner_id: { $in: accountIds },
				},
				{
					messages: 0, // Exclude messages field
				}
			)
				.sort({ last_time: -1 })
				.skip(skip)
				.limit(limitNum)
				.lean();

			res.json({
				success: true,
				accounts,
				conversations,
				pagination: {
					totalItems: totalConversations,
					currentPage: pageNum,
					totalPages: Math.ceil(totalConversations / limitNum),
					pageSize: limitNum,
					hasNextPage: pageNum < Math.ceil(totalConversations / limitNum),
					hasPrevPage: pageNum > 1,
				},
			});
		} catch (error) {
			res.status(500).json({ error: error.message });
		}
	}
);

// Get paginated messages for a conversation
router.get(
	"/messages",
	authenticateToken,
	requireTier(["Standard", "Premium"]),
	async (req, res) => {
		const { recipient_id, sender_id, limit = 25, page = 1 } = req.query;
		if (!recipient_id)
			return res.status(400).json({ error: "Missing recipient_id param" });
		if (!sender_id)
			return res.status(400).json({ error: "Missing sender_id param" });

		try {
			const convoKey = [sender_id, recipient_id].sort().join("_");
			const conversation = await InstagramConversation.findById(convoKey);

			if (!conversation) {
				return res.status(404).json({ error: "Conversation not found" });
			}

			// Reset unread count
			conversation.unread_count = 0;
			await conversation.save();

			// Pagination logic
			const startIndex = (page - 1) * limit;
			const paginatedMessages = conversation.messages
				.sort((a, b) => a.timestamp - b.timestamp)
				.slice(startIndex, startIndex + Number(limit));

			res.json({
				success: true,
				messages: paginatedMessages,
				pagination: {
					limit: Number(limit),
					page: Number(page),
					total: conversation.messages.length,
				},
			});
		} catch (error) {
			res.status(500).json({ error: error.message });
		}
	}
);

// Send a message
router.post("/send", async (req, res) => {
	const { sender_id, recipient_id, message } = req.body;
	if (!sender_id || !recipient_id || !message)
		return res.status(400).json({ error: "Bad payload" });

	try {
		const account = await InstagramAccount.findById(sender_id);
		if (!account)
			return res.status(400).json({ error: "Sender account not found" });

		const token = account.access_token;

		const resp = await axios.post(
			"https://graph.instagram.com/v23.0/me/messages",
			{
				recipient: { id: recipient_id },
				message: { text: message },
			},
			{ params: { access_token: token } }
		);

		res.json({ success: true, message_id: resp.data.message_id });
	} catch (error) {
		console.error("Error sending message:", error);
		res
			.status(500)
			.json({ error: error.response?.data?.error?.message || error.message });
	}
});

// Set interested state on a conversation
router.post(
	"/set-interested",
	authenticateToken,
	requireTier(["Standard", "Premium"]),
	async (req, res) => {
		try {
			const { sender_id, recipient_id, state } = req.body;
			const convoKey = [sender_id, recipient_id].sort().join("_");
			await InstagramConversation.findByIdAndUpdate(convoKey, {
				interested: state,
			});
			res.json({ success: true });
		} catch (error) {
			res.status(500).json({ error: error.message });
		}
	}
);

// Switch campaign on a conversation
router.post(
	"/switch-campaign",
	authenticateToken,
	requireTier(["Standard", "Premium"]),
	async (req, res) => {
		try {
			const { sender_id, recipient_id, campaign_id } = req.body;
			const convoKey = [sender_id, recipient_id].sort().join("_");

			const campaign = await Campaign.findById(campaign_id);
			if (!campaign) {
				return res
					.status(404)
					.json({ success: false, message: "Campaign not found" });
			}

			await InstagramConversation.findByIdAndUpdate(convoKey, {
				campaignId: campaign_id,
				context: campaign.context || "",
			});

			res.json({ success: true });
		} catch (error) {
			res.status(500).json({ error: error.message });
		}
	}
);

// Get all available tags for authenticated user's accounts
router.get(
	"/tags",
	authenticateToken,
	requireTier(["Standard", "Premium"]),
	async (req, res) => {
		try {
			const accounts = await InstagramAccount.find({
				user: req.user.uid,
			}).lean();
			const accountIds = accounts.map((acc) => acc.user_id);
			if (accountIds.length === 0) return res.json({ success: true, tags: [] });

			const conversations = await InstagramConversation.find({
				webhook_owner_id: { $in: accountIds },
			}).lean();

			const allTags = new Set();
			conversations.forEach((conv) => {
				(conv.tags || []).forEach((tag) => allTags.add(tag));
			});

			res.json({ success: true, tags: Array.from(allTags) });
		} catch (error) {
			res.status(500).json({ error: error.message });
		}
	}
);

// Add or remove tags on a conversation
router.post(
	"/tags",
	authenticateToken,
	requireTier(["Standard", "Premium"]),
	async (req, res) => {
		try {
			const { sender_id, recipient_id, tags } = req.body;
			if (!Array.isArray(tags))
				return res.status(400).json({ error: "Tags must be an array" });

			const convoKey = [sender_id, recipient_id].sort().join("_");
			await InstagramConversation.findByIdAndUpdate(convoKey, { tags });
			res.json({ success: true });
		} catch (error) {
			res.status(500).json({ error: error.message });
		}
	}
);

// Get available recipients (users who have messaged us)
router.get("/recipients/:businessAccountId", async (req, res) => {
	try {
		const { businessAccountId } = req.params;
		const recipients = await db
			.collection("instagram_users")
			.where("business_account_id", "==", businessAccountId)
			.where("can_receive_messages", "==", true)
			.get()
			.then((snapshot) =>
				snapshot.docs.map((doc) => ({ user_id: doc.id, ...doc.data() }))
			);

		res.json({ success: true, recipients });
	} catch (error) {
		res.status(500).json({ error: "Failed to fetch recipients" });
	}
});

// Optional: Clean up old timers on server shutdown
process.on("SIGTERM", () => {
	conversationTimers.forEach((timer) => clearTimeout(timer));
	conversationTimers.clear();
});

// Deprecated - Get Instagram accounts for authenticated user
router.get("/accounts", authenticateToken, async (req, res) => {
	try {
		const accounts = await InstagramAccount.find({ user: req.user.uid }).lean();
		res.json({ success: true, accounts });
	} catch (error) {
		res.status(500).json({ success: false, message: error.message });
	}
});

// Deprecated - Get Instagram conversations by recipient ID (IG user ID)
router.get("/conversations", authenticateToken, async (req, res) => {
	const { account } = req.query;
	if (!account) return res.status(400).json({ error: "Missing account param" });
	try {
		const conversations = await InstagramConversation.find({
			"clientAccount.id": account,
		}).lean(); // Adjust filter if needed
		res.json({ success: true, conversations });
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
});

module.exports = router;
