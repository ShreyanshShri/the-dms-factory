const admin = require("firebase-admin");

// Initialize Firebase Admin with your service account key
// const serviceAccount = require("./firebase-service-account.json");

const credential = {
	projectId: process.env.FIREBASE_PROJECT_ID,
	clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
	privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
};

admin.initializeApp({
	credential: admin.credential.cert(credential),
	databaseURL: "https://cold-dms.firebaseio.com", // optional unless using Realtime DB
});

const db = admin.firestore();

module.exports = { admin, db };
