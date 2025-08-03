const { db, admin } = require("../config/firebase");

class Campaign {
	constructor(data) {
		// immutable (as in shouldnt be modified by within the server, only on instruction from the client)
		this.id = data.id;
		this.userId = data.userId;
		this.name = data.name;
		this.description = data.description;
		this.platform = data.platform; // 'instagram' or 'twitter'
		this.totalLeads = data.totalLeads || 0;
		this.variants = data.variants || [];
		this.workingHours = data.workingHours || { start: 0, end: 24 };
		this.messageLimits = data.messageLimits || { min: 35, max: 41 };
		this.followUser = data.followUser || false;
		this.autoLikeStory = data.autoLikeStory || false;
		this.autoLikeNewestPost = data.autoLikeNewestPost || false;
		this.withinWorkingHours = data.withinWorkingHours || true;
		this.createdAt = data.createdAt || Date.now();
		// mutable
		this.updatedAt = data.updatedAt || Date.now();
		this.status = data.status || "ready";
	}

	static async findById(campaignId) {
		try {
			const doc = await db.collection("campaigns").doc(campaignId).get();
			return doc.exists ? new Campaign({ id: doc.id, ...doc.data() }) : null;
		} catch (error) {
			console.error("Error finding campaign:", error);
			throw error;
		}
	}

	static async findByUserId(userId) {
		try {
			const snapshot = await db
				.collection("campaigns")
				.where("userId", "==", userId)
				.get();

			const campaigns = [];
			snapshot.forEach((doc) => {
				campaigns.push(new Campaign({ id: doc.id, ...doc.data() }));
			});

			return campaigns;
		} catch (error) {
			console.error("Error finding campaigns by user:", error);
			throw error;
		}
	}

	static async findByPlatform(userId, platform) {
		try {
			const snapshot = await db
				.collection("campaigns")
				.where("userId", "==", userId)
				.where("platform", "==", platform)
				.get();

			const campaigns = [];
			snapshot.forEach((doc) => {
				campaigns.push(new Campaign({ id: doc.id, ...doc.data() }));
			});

			return campaigns;
		} catch (error) {
			console.error("Error finding campaigns by platform:", error);
			throw error;
		}
	}

	async save() {
		try {
			this.updatedAt = Date.now();
			const campaignData = this.toFirestore();

			if (this.id) {
				await db.collection("campaigns").doc(this.id).update(campaignData);
			} else {
				const docRef = await db.collection("campaigns").add(campaignData);
				this.id = docRef.id;
			}

			return this;
		} catch (error) {
			console.error("Error saving campaign:", error);
			throw error;
		}
	}

	async updateStatus(status) {
		try {
			this.status = status;
			this.updatedAt = Date.now();

			await db.collection("campaigns").doc(this.id).update({
				status: this.status,
				updatedAt: this.updatedAt,
				lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
			});

			return this;
		} catch (error) {
			console.error("Error updating campaign status:", error);
			throw error;
		}
	}

	toFirestore() {
		return {
			userId: this.userId,
			name: this.name,
			description: this.description,
			platform: this.platform,
			status: this.status,
			totalLeads: this.totalLeads,
			variants: this.variants,
			workingHours: this.workingHours,
			messageLimits: this.messageLimits,
			followUser: this.followUser,
			autoLikeStory: this.autoLikeStory,
			autoLikeNewestPost: this.autoLikeNewestPost,
			withinWorkingHours: this.withinWorkingHours,
			createdAt: this.createdAt,
			updatedAt: this.updatedAt,
			lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
		};
	}

	toJSON() {
		return {
			id: this.id,
			userId: this.userId,
			name: this.name,
			description: this.description,
			platform: this.platform,
			status: this.status,
			totalLeads: this.totalLeads,
			variants: this.variants,
			workingHours: this.workingHours,
			messageLimits: this.messageLimits,
			followUser: this.followUser,
			autoLikeStory: this.autoLikeStory,
			autoLikeNewestPost: this.autoLikeNewestPost,
			withinWorkingHours: this.withinWorkingHours,
			createdAt: this.createdAt,
			updatedAt: this.updatedAt,
		};
	}
}

module.exports = Campaign;
