// lib/igToken.js
const { db } = require("../config/firebase");

/**
 * Get the long-lived Instagram access-token for a given thread.
 * @param {string} threadID – Instagram thread / conversation ID
 * @returns {Promise<string>} token
 */
module.exports.tokenForThread = async function tokenForThread(threadID) {
	// 1️⃣ Which IG account owns this thread?
	const convoSnap = await db
		.collection("instagram_conversations")
		.doc(String(threadID))
		.get();

	if (!convoSnap.exists) throw new Error("Unknown thread ID");

	const { ig_account_id } = convoSnap.data();

	// 2️⃣ Fetch the token for that IG account
	const acctSnap = await db
		.collection("instagram_accounts")
		.doc(String(ig_account_id))
		.get();

	if (!acctSnap.exists) throw new Error("IG account not found");

	const { access_token } = acctSnap.data();
	if (!access_token) throw new Error("No token stored for account");

	return access_token;
};
