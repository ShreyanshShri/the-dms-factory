// routes/chat.js
const express = require("express");
const axios = require("axios");
const { db } = require("../config/firebase"); // your firebase config
const router = express.Router();

const IG_APP_ID = process.env.IG_APP_ID;
const IG_APP_SECRET = process.env.IG_APP_SECRET;
const IG_REDIRECT_URI = process.env.IG_REDIRECT_URI;

// STEP 1: Redirect user to IG login
router.get("/login", (req, res) => {
	const authUrl = `https://api.instagram.com/oauth/authorize
    ?client_id=${IG_APP_ID}
    &redirect_uri=${IG_REDIRECT_URI}
    &scope=user_profile,user_media
    &response_type=code`.replace(/\s+/g, "");

	res.redirect(authUrl);
});

// STEP 2: Handle redirect from IG and exchange code for token
router.get("/callback", async (req, res) => {
	const { code } = req.query;
	if (!code) return res.status(400).json({ error: "Missing code" });

	try {
		const tokenRes = await axios.post(
			"https://api.instagram.com/oauth/access_token",
			new URLSearchParams({
				client_id: IG_APP_ID,
				client_secret: IG_APP_SECRET,
				grant_type: "authorization_code",
				redirect_uri: IG_REDIRECT_URI,
				code,
			})
		);

		const { access_token, user_id } = tokenRes.data;

		// Save user to Firestore
		await db.collection("users").doc(user_id.toString()).set(
			{
				uid: user_id,
				name: "", // you can fetch profile data later
				email: "",
				createdAt: Date.now(),
				role: "user",
				isSubscribed: false,
				subscriptionStatus: "pending",
				updatedAt: Date.now(),
				igToken: access_token, // saving token
			},
			{ merge: true }
		);

		res.json({ success: true, access_token, user_id });
	} catch (err) {
		console.error("Error exchanging code:", err.response?.data || err.message);
		res.status(500).json({ error: "Failed to exchange code" });
	}
});

// STEP 3: Send IG DM (Business accounts only)
router.post("/send", async (req, res) => {
	const { userId, recipientId, message } = req.body;

	try {
		// Get user token from Firestore
		const userDoc = await db.collection("users").doc(userId.toString()).get();
		if (!userDoc.exists) {
			return res.status(404).json({ error: "User not found" });
		}

		const { igToken } = userDoc.data();

		// Send DM via Graph API
		const dmRes = await axios.post(
			`https://graph.facebook.com/v21.0/${recipientId}/messages`,
			{ message },
			{
				headers: { Authorization: `Bearer ${igToken}` },
			}
		);

		res.json({ success: true, response: dmRes.data });
	} catch (err) {
		console.error("Error sending DM:", err.response?.data || err.message);
		res.status(500).json({ error: "Failed to send DM" });
	}
});

module.exports = router;
