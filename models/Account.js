const { db, admin } = require("../config/firebase");

class Account {
	constructor(data) {
		this.id = data.id; // This is the widgetId
		this.userId = data.userId;
		this.displayName = data.displayName;
		this.platform = data.platform;
		this.status = data.status || "ready";
		this.currentCampaignId = data.currentCampaignId;
		this.pendingLeadsCount = data.pendingLeadsCount || 0;
		this.createdAt = data.createdAt || Date.now();
		this.lastUpdated = data.lastUpdated;
	}

	static async findById(accountId) {
		try {
			const doc = await db.collection("accounts").doc(accountId).get();
			return doc.exists ? new Account({ id: doc.id, ...doc.data() }) : null;
		} catch (error) {
			console.error("Error finding account:", error);
			throw error;
		}
	}

	static async findByUserId(userId) {
		try {
			const snapshot = await db
				.collection("accounts")
				.where("userId", "==", userId)
				.get();

			const accounts = [];
			snapshot.forEach((doc) => {
				accounts.push(new Account({ id: doc.id, ...doc.data() }));
			});

			return accounts;
		} catch (error) {
			console.error("Error finding accounts by user:", error);
			throw error;
		}
	}

	static async createOrUpdate(accountData) {
		try {
			const account = new Account(accountData);
			await db.collection("accounts").doc(account.id).set(
				{
					userId: account.userId,
					displayName: account.displayName,
					platform: account.platform,
					status: account.status,
					currentCampaignId: account.currentCampaignId,
					pendingLeadsCount: account.pendingLeadsCount,
					createdAt: account.createdAt,
					lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
				},
				{ merge: true }
			);

			return account;
		} catch (error) {
			console.error("Error creating/updating account:", error);
			throw error;
		}
	}

	async updateStatus(status) {
		try {
			this.status = status;
			await db.collection("accounts").doc(this.id).update({
				status: this.status,
				lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
			});
			return this;
		} catch (error) {
			console.error("Error updating account status:", error);
			throw error;
		}
	}

	async updatePendingLeadsCount(count) {
		try {
			this.pendingLeadsCount = count;
			await db.collection("accounts").doc(this.id).update({
				pendingLeadsCount: this.pendingLeadsCount,
				lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
			});
			return this;
		} catch (error) {
			console.error("Error updating pending leads count:", error);
			throw error;
		}
	}

	toJSON() {
		return {
			accountId: this.id,
			userId: this.userId,
			displayName: this.displayName,
			platform: this.platform,
			status: this.status,
			currentCampaignId: this.currentCampaignId,
			pendingLeadsCount: this.pendingLeadsCount,
			createdAt: this.createdAt,
			lastUpdated: this.lastUpdated,
		};
	}
}

module.exports = Account;
