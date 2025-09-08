// routes/chat.js
const express = require("express");
const axios = require("axios");
const { db, admin } = require("../config/firebase");
const router = express.Router();
const { authenticateToken } = require("../middleware/auth");

const IG_APP_ID = process.env.IG_APP_ID;
const IG_APP_SECRET = process.env.IG_APP_SECRET;
const IG_LOGIN_REDIRECT_URI = process.env.IG_LOGIN_REDIRECT_URI;

// login logic
router.get("/login", authenticateToken, (req, res) => {
	const scopes = "instagram_business_basic,instagram_business_manage_messages";
	const meta = JSON.stringify({ uid: req.user.uid });

	const authURL =
		`https://api.instagram.com/oauth/authorize` +
		`?client_id=${IG_APP_ID}` +
		`&redirect_uri=${encodeURIComponent(IG_LOGIN_REDIRECT_URI)}` +
		`&scope=${scopes}` +
		`&response_type=code` +
		`&state=${encodeURIComponent(meta)}`;
	// "https://www.instagram.com/oauth/authorize?force_reauth=true&client_id=1654432455251534&redirect_uri=https://4995d4e5a11d.ngrok-free.app/api/v1/chats/callback&response_type=code&scope=instagram_business_basic%2Cinstagram_business_manage_messages%2Cinstagram_business_manage_comments%2Cinstagram_business_content_publish%2Cinstagram_business_manage_insights";

	res.json({ authURL });
});

// login logic
router.get("/callback", async (req, res) => {
	const { code, state } = req.query;
	if (!code) return res.status(400).json({ error: "Missing code" });
	const meta = JSON.parse(decodeURIComponent(state));

	try {
		/* 1️⃣ short-lived token */
		const tokenRes = await axios.post(
			"https://api.instagram.com/oauth/access_token",
			new URLSearchParams({
				client_id: IG_APP_ID,
				client_secret: IG_APP_SECRET,
				grant_type: "authorization_code",
				redirect_uri: IG_LOGIN_REDIRECT_URI, // must equal the one used in /login
				code,
			})
		);

		const { access_token: shortTok, user_id } = tokenRes.data;

		/* 2️⃣ exchange for 60-day token */
		const longTokRes = await axios.get(
			"https://graph.instagram.com/v23.0/access_token",
			{
				params: {
					grant_type: "ig_exchange_token",
					client_secret: IG_APP_SECRET,
					access_token: shortTok,
				},
			}
		);

		const longTok = longTokRes.data.access_token;

		await axios.post(
			`https://graph.instagram.com/v23.0/me/subscribed_apps?subscribed_fields=messages&access_token=${longTok}`
		);

		const { data } = await axios.get(`https://graph.instagram.com/me`, {
			params: {
				fields: "id,username,account_type,user_id",
				access_token: longTok,
			},
		});

		/* 4️⃣ store everything you need */
		await db.collection("instagram_accounts").doc(String(data.user_id)).set(
			{
				user: meta.uid,
				user_id: data.user_id,
				username: data.username,
				access_token: longTok,
				token_created: new Date(),
			},
			{ merge: true }
		);

		const URL =
			process.env.NODE_ENV === "production"
				? "/inbox"
				: "http://localhost:3000/inbox";
		res.redirect(URL);
	} catch (err) {
		console.error("OAuth flow failed:", err.response?.data || err.message);
		res.status(500).json({ error: "Instagram login failed", err });
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

// Store active timers for each conversation
const conversationTimers = new Map();

// Function to send webhook after delay
async function sendConversationWebhook(convoKey, business_account_id) {
	try {
		// Query messages from Firestore
		const convRef = db.collection("instagram_conversations").doc(convoKey);
		const messagesSnapshot = await convRef
			.collection("messages")
			.orderBy("timestamp", "asc")
			.get();

		if (messagesSnapshot.empty) {
			console.log("No messages found for conversation:", convoKey);
			return;
		}

		// Get conversation details
		const convSnap = await convRef.get();
		if (!convSnap.exists) {
			console.log("Conversation document not found:", convoKey);
			return;
		}

		const convData = convSnap.data();
		const businessAccountId = convData.businessAccount.id;
		const clientAccountId = convData.clientAccount.id;

		// Format messages as "My msg: ... Prospect: ..." format
		let formattedConversation = "";

		messagesSnapshot.docs.forEach((doc) => {
			const messageData = doc.data();
			const isBusinessMessage = messageData.sender_id === businessAccountId;

			const label = isBusinessMessage ? "My msg" : "Prospect";
			formattedConversation += `${label}: ${messageData.text}\n`;
		});

		// Send to n8n webhook
		await axios.post(
			"https://n8n.aigrowtech.ru/webhook/6baef27b-40e8-4ad9-b22a-10b41a1fff77",
			{
				conversation_key: convoKey,
				business_account_id: businessAccountId,
				client_account_id: clientAccountId,
				formatted_conversation: formattedConversation.trim(),
				timestamp: new Date().toISOString(),
			}
		);

		console.log("Conversation sent to n8n webhook:", {
			conversation_key: convoKey,
			business_account_id: businessAccountId,
			client_account_id: clientAccountId,
			formatted_conversation: formattedConversation.trim(),
			timestamp: new Date().toISOString(),
		});
	} catch (error) {
		console.error("Failed to send conversation webhook:", error.message);
	} finally {
		// Clean up the timer reference
		conversationTimers.delete(convoKey);
	}
}

// Function to schedule or reschedule webhook
function scheduleConversationWebhook(convoKey, business_account_id, sender_id) {
	// Only schedule for messages FROM prospects (not business account)
	if (sender_id === business_account_id) {
		return; // Don't schedule webhook for business account messages
	}

	// Clear existing timer if it exists
	if (conversationTimers.has(convoKey)) {
		clearTimeout(conversationTimers.get(convoKey));
		console.log("Cleared existing timer for:", convoKey);
	}

	// Set new 5-minute timer
	const timer = setTimeout(() => {
		sendConversationWebhook(convoKey, business_account_id);
	}, 60 * 1000); // 1 minute in milliseconds

	conversationTimers.set(convoKey, timer);
	console.log("Scheduled webhook for conversation:", convoKey);
}

// Updated webhook handler
router.post("/webhook", async (req, res) => {
	if (req.body.object !== "instagram") return res.sendStatus(404);

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
				const convRef = db.collection("instagram_conversations").doc(convoKey);
				const convSnap = await convRef.get();

				if (convSnap.exists) {
					convRef.update({
						last_message: msgText,
						last_time: msgTime,
						unread_count: admin.firestore.FieldValue.increment(1),
						responded: business_account_id == sender_id,
					});
				} else {
					let business_account_username = "";
					let client_account_username = "";
					const client_id =
						sender_id == business_account_id ? recipient_id : sender_id;
					console.log(business_account_id);
					console.log(entry);
					db.collection("instagram_accounts")
						.doc(String(business_account_id))
						.get()
						.then(async (accountSnap) => {
							const data = await accountSnap.data();
							console.log("accountSnap", data);
							const token = data.access_token;

							try {
								const [business_account_data, client_account_data] =
									await Promise.all([
										axios.get(
											`https://graph.instagram.com/${business_account_id}?fields=username&access_token=${token}`
										),
										axios.get(
											`https://graph.instagram.com/${client_id}?fields=username&access_token=${token}`
										),
									]);

								business_account_username = business_account_data.data.username;
								client_account_username = client_account_data.data.username;
							} catch (err) {
								console.warn("Failed to fetch IG username:", err.message);
							}

							const lead_snap = await db
								.collection("leads")
								.where("username", "==", client_account_username)
								.limit(1)
								.get();

							let campaignId = null;
							let context = "";
							if (lead_snap.docs.length > 0) {
								campaignId = lead_snap.docs[0].data().campaignId;
								const campaign_snap = await db
									.collection("campaigns")
									.doc(campaignId)
									.get();
								if (campaign_snap.exists) {
									const campaign = campaign_snap.data();
									context = campaign.context || "";
								}
							}

							convRef.set({
								businessAccount: {
									id: business_account_id,
									username: business_account_username,
								},
								clientAccount: {
									id: client_id,
									username: client_account_username,
								},
								webhook_owner_id: business_account_id,
								last_message: msgText,
								last_time: msgTime,
								unread_count: 1,
								responded: business_account_id == sender_id,
								interested: false,
								tags: [],
								campaignId,
								context,
							});
						});
				}

				// Add message (fire-and-forget, no await)
				convRef.collection("messages").add({
					sender_id,
					recipient_id,
					text: msgText,
					timestamp: msgTime,
				});

				// **NEW: Schedule or reschedule the webhook**
				if (business_account_id !== sender_id) {
					scheduleConversationWebhook(convoKey, business_account_id, sender_id);
				}
			}
		}

		res.sendStatus(200);
	} catch (err) {
		console.error("Webhook failed:", err);
		res.status(500).json({ error: "Webhook failed" });
	}
});

// Optional: Clean up old timers on server restart
process.on("SIGTERM", () => {
	conversationTimers.forEach((timer) => clearTimeout(timer));
	conversationTimers.clear();
});

// depricated
router.get("/accounts", authenticateToken, async (req, res) => {
	const snap = await db
		.collection("instagram_accounts")
		.where("user", "==", req.user.uid)
		.get();
	const accounts = [];
	snap.forEach((doc) =>
		accounts.push({ ig_account_id: doc.id, ...doc.data() })
	);
	res.json({ success: true, accounts });
});

// depricated
router.get("/conversations", authenticateToken, async (req, res) => {
	const { account } = req.query; // IG_USER_ID
	if (!account) return res.status(400).json({ error: "Missing account param" });
	try {
		// const snap = await db
		// 	.collection("instagram_conversations")
		// 	.where("recipient_id", "==", String(account))
		// 	// .orderBy("last_time", "desc")
		// 	.limit(25)
		// 	.get();

		// const convos = [];
		// snap.forEach((d) => convos.push({ thread_id: d.id, ...d.data() }));
		// // 		GET https://graph.instagram.com/v23.0/{ig_user_id}/conversations
		// //   ?fields=id,updated_time,
		// //           participants.limit(2){id,username},
		// //           messages.limit(1){id,text,from,to,timestamp}
		// //   &access_token={token}
		const snapshot = await db
			.collection("instagram_conversations")
			.where("recipient_id", "==", account)
			//   .orderBy("last_time", "desc")
			.get();
		const conversations = snapshot.docs.map((doc) => ({
			id: doc.id,
			...doc.data(),
		}));
		// const accountSnap = await db
		// 	.collection("instagram_accounts")
		// 	.doc(String(account))
		// 	.get();
		// const access_token = accountSnap.data().access_token;
		// const { data } = await axios.get(
		// 	`https://graph.instagram.com/v23.0/me/conversations?fields=id,updated_time,participants.limit(2){id,username},messages.limit(1){id,text,from,to,timestamp}&access_token=${access_token}`
		// );
		res.json({ success: true, conversations: conversations });
	} catch (err) {
		console.error(err);
		res.status(500).json({ error: err.message });
	}
});

// combining /accounts and /conversations
// Get all conversations for a user (no messages)
router.get("/all-conversations", authenticateToken, async (req, res) => {
	try {
		const snap = await db
			.collection("instagram_accounts")
			.where("user", "==", req.user.uid)
			.get();

		const accounts = snap.docs.map((doc) => ({
			user_id: doc.data().user_id,
			username: doc.data().username,
		}));

		let conversations = [];

		for (const account of accounts) {
			const snapshot = await db
				.collection("instagram_conversations")
				.where("webhook_owner_id", "==", String(account.user_id)) // query per account
				.get();

			snapshot.forEach((doc) => {
				conversations.push({
					id: doc.id,
					...doc.data(),
				});
			});
		}

		res.json({
			success: true,
			accounts,
			conversations,
		});
	} catch (err) {
		console.error(err);
		res.status(500).json({ error: err.message });
	}
});

// Get paginated messages for a conversation
router.get("/messages", authenticateToken, async (req, res) => {
	const { recipient_id, sender_id, limit = 25, page = 1 } = req.query;
	if (!recipient_id)
		return res.status(400).json({ error: "Missing recipient_id param" });
	if (!sender_id)
		return res.status(400).json({ error: "Missing sender_id param" });

	try {
		const convoKey = [sender_id, recipient_id].sort().join("_");
		const convRef = db.collection("instagram_conversations").doc(convoKey);
		await convRef.update({ unread_count: 0 });

		const messagesRef = convRef
			.collection("messages")
			.orderBy("timestamp", "desc")
			.limit(Number(limit));

		const snapshot = await messagesRef.get();

		// convert to array and reverse so oldest messages come first
		const messages = snapshot.docs
			.map((doc) => ({
				id: doc.id,
				...doc.data(),
			}))
			.reverse();

		res.json({
			success: true,
			messages,
			pagination: {
				limit: Number(limit),
				page: Number(page),
				total: messages.length,
			},
		});
	} catch (err) {
		res
			.status(500)
			.json({ error: err.response?.data?.error?.message || err.message });
	}
});

// send message
router.post("/send", async (req, res) => {
	const { sender_id, recipient_id, message } = req.body;
	console.log("Sending message", sender_id, recipient_id, message);
	if (!sender_id || !recipient_id || !message)
		return res.status(400).json({ error: "Bad payload" });

	try {
		const accountSnap = await db
			.collection("instagram_accounts")
			.doc(String(sender_id))
			.get();
		const token = accountSnap.data().access_token;

		const resp = await axios.post(
			"https://graph.instagram.com/v23.0/me/messages",
			{
				recipient: { id: recipient_id },
				message: { text: message },
			},
			{ params: { access_token: token } }
		);
		// const msgTime = Math.floor(Date.now() / 1000);
		// await db
		// 	.collection("instagram_conversations")
		// 	.doc(`${recipient_id}_${sender_id}`)
		// 	.update({
		// 		messages: admin.firestore.FieldValue.arrayUnion({
		// 			sender_id,
		// 			recipient_id,
		// 			text: message,
		// 			timestamp: msgTime,
		// 		}),
		// 	});

		res.json({ success: true, message_id: resp.data.message_id });
	} catch (err) {
		res
			.status(500)
			.json({ error: err.response?.data?.error?.message || err.message });
	}
});

router.post("/set-interested", authenticateToken, async (req, res) => {
	try {
		const { sender_id, recipient_id, state } = req.body;
		const convoKey = [sender_id, recipient_id].sort().join("_");
		const convRef = db.collection("instagram_conversations").doc(convoKey);
		await convRef.update({ interested: state });
		res.json({ success: true });
	} catch (err) {
		res
			.status(500)
			.json({ error: err.response?.data?.error?.message || err.message });
		console.error(err);
	}
});

// switch campaign
router.post("/switch-campaign", authenticateToken, async (req, res) => {
	try {
		const { sender_id, recipient_id, campaign_id } = req.body;
		const convoKey = [sender_id, recipient_id].sort().join("_");

		const campaign_snap = await db
			.collection("campaigns")
			.doc(campaign_id)
			.get();
		if (!campaign_snap.exists) {
			return res
				.status(HTTP_STATUS.NOT_FOUND)
				.json(createResponse(false, null, "Campaign not found"));
		}

		const convRef = db.collection("instagram_conversations").doc(convoKey);
		await convRef.update({
			campaign_id,
			context: campaign_snap.data().context,
		});

		res.json({ success: true });
	} catch (err) {
		res
			.status(500)
			.json({ error: err.response?.data?.error?.message || err.message });
		console.error(err);
	}
});

// Add these routes to your existing chat.js file

// Get all available tags for a user
router.get("/tags", authenticateToken, async (req, res) => {
	try {
		const snap = await db
			.collection("instagram_accounts")
			.where("user", "==", req.user.uid)
			.get();

		const accountIds = snap.docs.map((doc) => doc.data().user_id);

		if (accountIds.length === 0) {
			return res.json({ success: true, tags: [] });
		}

		const conversationsSnap = await db
			.collection("instagram_conversations")
			.where("webhook_owner_id", "in", accountIds.map(String))
			.get();

		const allTags = new Set();
		conversationsSnap.forEach((doc) => {
			const tags = doc.data().tags || [];
			tags.forEach((tag) => allTags.add(tag));
		});

		res.json({ success: true, tags: Array.from(allTags) });
	} catch (err) {
		console.error(err);
		res.status(500).json({ error: err.message });
	}
});

// Add/remove tags to a conversation
router.post("/tags", authenticateToken, async (req, res) => {
	try {
		const { sender_id, recipient_id, tags } = req.body;

		if (!Array.isArray(tags)) {
			return res.status(400).json({ error: "Tags must be an array" });
		}

		const convoKey = [sender_id, recipient_id].sort().join("_");
		const convRef = db.collection("instagram_conversations").doc(convoKey);

		await convRef.update({ tags });

		res.json({ success: true });
	} catch (err) {
		console.error(err);
		res.status(500).json({ error: err.message });
	}
});

// Get available recipients (users who have messaged us)
router.get("/recipients/:businessAccountId", async (req, res) => {
	try {
		const { businessAccountId } = req.params;

		const usersSnapshot = await db
			.collection("instagram_users")
			.where("business_account_id", "==", businessAccountId)
			.where("can_receive_messages", "==", true)
			.get();

		const recipients = [];
		usersSnapshot.forEach((doc) => {
			recipients.push({
				user_id: doc.id,
				...doc.data(),
			});
		});

		res.json({ success: true, recipients });
	} catch (error) {
		console.error("Error fetching recipients:", error);
		res.status(500).json({ error: "Failed to fetch recipients" });
	}
});

module.exports = router;
