const admin = require("firebase-admin");

// Initialize Firebase Admin with your service account key
const serviceAccount = require("./firebase-service-account.json");

admin.initializeApp({
	credential: admin.credential.cert(serviceAccount),
	databaseURL: "https://cold-dms.firebaseio.com", // optional unless using Realtime DB
});

const db = admin.firestore();

module.exports = { admin, db };

// 🔍 Test Firebase Connection (add this block to the end)
(async () => {
	try {
		await db.collection("test").doc("hello").set({ hello: "world" });
		console.log("✅ Firestore write successful.");
	} catch (err) {
		console.error("❌ Firebase connection failed:", err);
	}
})();
