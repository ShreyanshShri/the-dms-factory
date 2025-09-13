// models/Analytics.js
const mongoose = require("mongoose");

const FirestoreTimestamp = {
	_seconds: { type: Number, required: true },
	_nanoseconds: { type: Number, required: true },
};

const AnalyticsSchema = new mongoose.Schema({
	campaignID: String,
	accountID: String,
	leadID: String,
	username: String,
	message: String,
	status: { type: String, default: "unknown" },
	platform: { type: String, default: "instagram" },
	timestamp: FirestoreTimestamp,
	createdAt: FirestoreTimestamp,
});

module.exports =
	mongoose.models.Analytics || mongoose.model("Analytics", AnalyticsSchema);

// const { db, admin } = require("../config/firebase");

// class Analytics {
// 	constructor(data) {
// 		this.id = data.id;
// 		this.campaignID = data.campaignID;
// 		this.accountID = data.accountID;
// 		this.leadID = data.leadID;
// 		this.username = data.username;
// 		this.message = data.message;
// 		this.status = data.status;
// 		this.platform = data.platform;
// 		this.timestamp = data.timestamp;
// 		this.createdAt = data.createdAt || Date.now();
// 	}

// 	static async create(analyticsData) {
// 		try {
// 			const analytics = new Analytics(analyticsData);
// 			const docRef = await db.collection("analytics").add({
// 				campaignID: analytics.campaignID,
// 				accountID: analytics.accountID,
// 				leadID: analytics.leadID || "",
// 				username: analytics.username || "",
// 				message: analytics.message || "",
// 				status: analytics.status || "unknown",
// 				platform: analytics.platform || "instagram",
// 				timestamp: admin.firestore.FieldValue.serverTimestamp(),
// 				createdAt: analytics.createdAt,
// 			});

// 			analytics.id = docRef.id;
// 			return analytics;
// 		} catch (error) {
// 			console.error("Error creating analytics:", error);
// 			throw error;
// 		}
// 	}

// 	static async findByCampaign(campaignID, limit = 100) {
// 		try {
// 			const snapshot = await db
// 				.collection("analytics")
// 				.where("campaignID", "==", campaignID)
// 				.orderBy("timestamp", "desc")
// 				.limit(limit)
// 				.get();

// 			const analytics = [];
// 			snapshot.forEach((doc) => {
// 				analytics.push(new Analytics({ id: doc.id, ...doc.data() }));
// 			});

// 			return analytics;
// 		} catch (error) {
// 			console.error("Error finding analytics by campaign:", error);
// 			throw error;
// 		}
// 	}

// 	static async findByUsername(campaignID, username, limit = 10) {
// 		try {
// 			const snapshot = await db
// 				.collection("analytics")
// 				.where("campaignID", "==", campaignID)
// 				.where("username", "==", username)
// 				.orderBy("timestamp", "desc")
// 				.limit(limit)
// 				.get();

// 			const analytics = [];
// 			snapshot.forEach((doc) => {
// 				analytics.push(new Analytics({ id: doc.id, ...doc.data() }));
// 			});

// 			return analytics;
// 		} catch (error) {
// 			console.error("Error finding analytics by username:", error);
// 			throw error;
// 		}
// 	}

// 	static async getSuccessRate(campaignID, accountID) {
// 		try {
// 			const totalSnapshot = await db
// 				.collection("analytics")
// 				.where("campaignID", "==", campaignID)
// 				.where("accountID", "==", accountID)
// 				.get();

// 			const successSnapshot = await db
// 				.collection("analytics")
// 				.where("campaignID", "==", campaignID)
// 				.where("accountID", "==", accountID)
// 				.where("status", "==", "initialdmsent")
// 				.get();

// 			const total = totalSnapshot.size;
// 			const successful = successSnapshot.size;

// 			return {
// 				total,
// 				successful,
// 				failed: total - successful,
// 				successRate: total > 0 ? ((successful / total) * 100).toFixed(2) : 0,
// 			};
// 		} catch (error) {
// 			console.error("Error calculating success rate:", error);
// 			throw error;
// 		}
// 	}

// 	toJSON() {
// 		return {
// 			id: this.id,
// 			campaignID: this.campaignID,
// 			accountID: this.accountID,
// 			leadID: this.leadID,
// 			username: this.username,
// 			message: this.message,
// 			status: this.status,
// 			platform: this.platform,
// 			timestamp: this.timestamp,
// 			createdAt: this.createdAt,
// 		};
// 	}
// }

// module.exports = Analytics;
