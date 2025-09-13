const mongoose = require("mongoose");

const FirestoreTimestamp = {
	_seconds: Number,
	_nanoseconds: Number,
};

const AccountSchema = new mongoose.Schema({
	widgetId: String,
	userId: String,
	displayName: String,
	platform: String,
	createdAt: FirestoreTimestamp,
	currentCampaignId: String,
	status: { type: String, default: "ready" },
	lastUpdated: FirestoreTimestamp,
	pendingLeadsCount: { type: Number, default: 0 },
});

module.exports = mongoose.model("Account", AccountSchema);

// // models/Account.js
// const mongoose = require("mongoose");

// const FirestoreTimestamp = {
// 	_seconds: { type: Number, required: true },
// 	_nanoseconds: { type: Number, required: true },
// };

// const AccountSchema = new mongoose.Schema({
// 	widgetId: String,
// 	userId: String,
// 	displayName: String,
// 	platform: String,
// 	createdAt: { type: FirestoreTimestamp, required: true },
// 	currentCampaignId: String,
// 	status: { type: String, default: "ready" },
// 	lastUpdated: FirestoreTimestamp,
// 	pendingLeadsCount: { type: Number, default: 0 },
// });

// module.exports = mongoose.model("Account", AccountSchema);

// const { db, admin } = require("../config/firebase");

// class Account {
// 	constructor(data) {
// 		// immutable
// 		this.id = data.id; // This is now the Firestore document ID
// 		this.widgetId = data.widgetId; // Store widgetId as a separate field
// 		this.userId = data.userId;
// 		this.displayName = data.displayName;
// 		this.platform = data.platform;
// 		this.createdAt = data.createdAt || Date.now();

// 		// mutable
// 		this.currentCampaignId = data.currentCampaignId;
// 		this.status = data.status || "ready";
// 		this.lastUpdated = data.lastUpdated;
// 		this.pendingLeadsCount = data.pendingLeadsCount || 0;
// 	}

// 	static async findById(id) {
// 		try {
// 			const doc = await db.collection("accounts").doc(id).get();
// 			return doc.exists ? new Account({ id: doc.id, ...doc.data() }) : null;
// 		} catch (error) {
// 			console.error("Error finding account:", error);
// 			throw error;
// 		}
// 	}

// 	static async findByWidgetId(widgetId) {
// 		try {
// 			const snapshot = await db
// 				.collection("accounts")
// 				.where("widgetId", "==", widgetId)
// 				.limit(1)
// 				.get();

// 			if (snapshot.empty) return null;

// 			const doc = snapshot.docs[0];
// 			return new Account({ id: doc.id, ...doc.data() });
// 		} catch (error) {
// 			console.error("Error finding account by widgetId:", error);
// 			throw error;
// 		}
// 	}

// 	static async findByUserIdAndWidgetId(userId, widgetId) {
// 		try {
// 			const snapshot = await db
// 				.collection("accounts")
// 				.where("userId", "==", userId)
// 				.where("widgetId", "==", widgetId)
// 				.limit(1)
// 				.get();

// 			if (snapshot.empty) return null;

// 			const doc = snapshot.docs[0];
// 			return new Account({ id: doc.id, ...doc.data() });
// 		} catch (error) {
// 			console.error("Error finding account by userId and widgetId:", error);
// 			throw error;
// 		}
// 	}

// 	static async findByUserId(userId) {
// 		try {
// 			const snapshot = await db
// 				.collection("accounts")
// 				.where("userId", "==", userId)
// 				.get();
// 			const accounts = [];
// 			snapshot.forEach((doc) => {
// 				accounts.push(new Account({ id: doc.id, ...doc.data() }));
// 			});
// 			return accounts;
// 		} catch (error) {
// 			console.error("Error finding accounts by user:", error);
// 			throw error;
// 		}
// 	}

// 	static async create(accountData) {
// 		try {
// 			const docRef = await db.collection("accounts").add({
// 				userId: accountData.userId,
// 				widgetId: accountData.widgetId,
// 				displayName: accountData.displayName,
// 				platform: accountData.platform,
// 				status: accountData.status || "ready",
// 				currentCampaignId: accountData.currentCampaignId,
// 				pendingLeadsCount: accountData.pendingLeadsCount || 0,
// 				createdAt: accountData.createdAt || Date.now(),
// 				lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
// 			});

// 			return new Account({ id: docRef.id, ...accountData });
// 		} catch (error) {
// 			console.error("Error creating account:", error);
// 			throw error;
// 		}
// 	}

// 	async update(updateData) {
// 		try {
// 			const updates = {
// 				...updateData,
// 				lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
// 			};

// 			await db.collection("accounts").doc(this.id).update(updates);

// 			Object.assign(this, updateData);
// 			return this;
// 		} catch (error) {
// 			console.error("Error updating account:", error);
// 			throw error;
// 		}
// 	}

// 	async updateStatus(status) {
// 		try {
// 			this.status = status;
// 			await db.collection("accounts").doc(this.id).update({
// 				status: this.status,
// 				lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
// 			});
// 			return this;
// 		} catch (error) {
// 			console.error("Error updating account status:", error);
// 			throw error;
// 		}
// 	}

// 	async updatePendingLeadsCount(count) {
// 		try {
// 			this.pendingLeadsCount = count;
// 			await db.collection("accounts").doc(this.id).update({
// 				pendingLeadsCount: this.pendingLeadsCount,
// 				lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
// 			});
// 			return this;
// 		} catch (error) {
// 			console.error("Error updating pending leads count:", error);
// 			throw error;
// 		}
// 	}

// 	toJSON() {
// 		return {
// 			accountId: this.id,
// 			widgetId: this.widgetId,
// 			userId: this.userId,
// 			displayName: this.displayName,
// 			platform: this.platform,
// 			status: this.status,
// 			currentCampaignId: this.currentCampaignId,
// 			pendingLeadsCount: this.pendingLeadsCount,
// 			createdAt: this.createdAt,
// 			lastUpdated: this.lastUpdated,
// 		};
// 	}
// }

// module.exports = Account;
