const mongoose = require("mongoose");

const FirestoreTimestamp = {
	_seconds: { type: Number, required: true },
	_nanoseconds: { type: Number, required: true },
};

const UserSchema = new mongoose.Schema({
	uid: { type: String, required: true, unique: true },
	name: { type: String },
	email: { type: String },
	password: { type: String, required: true },
	createdAt: FirestoreTimestamp,
	role: { type: String, default: "user" },

	// Only subscription object for all subscription logic
	subscription: {
		status: { type: String }, // e.g., "pending", "active", "trial", "failed", "expired"
		lastEvent: { type: String },
		whopMembershipId: { type: String },
		tier: { type: String },
		tierValue: { type: Number },
		planId: { type: String },
		expiresAt: { type: Date },
		currentPeriodEnd: { type: Date },
		valid: { type: Boolean },
		licenseKey: { type: String },
		cancelAtPeriodEnd: { type: Boolean },
		updatedAt: FirestoreTimestamp, // Use object to match Firestore pattern, or Date type (if consistent everywhere)
		metadata: {},
		// Add more fields as needed from your webhook
	},
	timeZone: { type: String, default: "UTC-5 (Eastern Time)" },
	notifications: {
		email: { type: Boolean, default: true },
		push: { type: Boolean, default: true },
		sms: { type: Boolean, default: false },
		errors: { type: Boolean, default: true },
		limits: { type: Boolean, default: true },
		completion: { type: Boolean, default: true },
	},
	privacy: {
		dataSharing: { type: Boolean, default: false },
		analytics: { type: Boolean, default: true },
		marketing: { type: Boolean, default: false },
	},
});

module.exports = mongoose.model("User", UserSchema);

// const { db } = require("../config/firebase");

// class User {
// 	constructor(data) {
// 		// immutables
// 		this.uid = data.uid;
// 		this.name = data.name;
// 		this.email = data.email;
// 		this.createdAt = data.createdAt || Date.now();
// 		this.role = data.role || "user";

// 		// mutables
// 		this.isSubscribed = data.isSubscribed || false;
// 		this.subscriptionStatus = data.subscriptionStatus || "pending"; // approved, pending, failed
// 		this.updatedAt = data.updatedAt || Date.now();

// 		// Settings
// 		this.timeZone = data.timeZone || "UTC-5 (Eastern Time)";
// 		this.notifications = data.notifications || {
// 			email: true,
// 			push: true,
// 			sms: false,
// 			errors: true,
// 			limits: true,
// 			completion: true,
// 		};

// 		this.privacy = data.privacy || {
// 			dataSharing: false,
// 			analytics: true,
// 			marketing: false,
// 		};
// 	}

// 	static async findById(uid) {
// 		try {
// 			const doc = await db.collection("users").doc(uid).get();
// 			return doc.exists ? new User({ uid: doc.id, ...doc.data() }) : null;
// 		} catch (error) {
// 			console.error("Error finding user:", error);
// 			throw error;
// 		}
// 	}

// 	static async create(userData) {
// 		try {
// 			const user = new User(userData);
// 			await db.collection("users").doc(user.uid).set({
// 				name: user.name,
// 				email: user.email,
// 				isSubscribed: user.isSubscribed,
// 				timeZone: user.timeZone,
// 				notifications: user.notifications,
// 				privacy: user.privacy,
// 				createdAt: user.createdAt,
// 				updatedAt: user.updatedAt,
// 			});
// 			return user;
// 		} catch (error) {
// 			console.error("Error creating user:", error);
// 			throw error;
// 		}
// 	}

// 	async save() {
// 		try {
// 			this.updatedAt = Date.now();
// 			await db.collection("users").doc(this.uid).update({
// 				name: this.name,
// 				email: this.email,
// 				isSubscribed: this.isSubscribed,
// 				timeZone: this.timeZone,
// 				notifications: this.notifications,
// 				privacy: this.privacy,
// 				updatedAt: this.updatedAt,
// 			});
// 			return this;
// 		} catch (error) {
// 			console.error("Error saving user:", error);
// 			throw error;
// 		}
// 	}

// 	async updateSettings(settings) {
// 		try {
// 			const updateData = {
// 				updatedAt: Date.now(),
// 			};

// 			if (settings.notifications) {
// 				this.notifications = {
// 					...this.notifications,
// 					...settings.notifications,
// 				};
// 				updateData.notifications = this.notifications;
// 			}

// 			if (settings.privacy) {
// 				this.privacy = { ...this.privacy, ...settings.privacy };
// 				updateData.privacy = this.privacy;
// 			}

// 			if (settings.displayName !== undefined) {
// 				this.name = settings.displayName;
// 				updateData.name = this.name;
// 			}

// 			if (settings.email !== undefined) {
// 				this.email = settings.email;
// 				updateData.email = this.email;
// 			}

// 			if (settings.timeZone !== undefined) {
// 				this.timeZone = settings.timeZone;
// 				updateData.timeZone = this.timeZone;
// 			}

// 			await db.collection("users").doc(this.uid).update(updateData);
// 			return this;
// 		} catch (error) {
// 			console.error("Error updating settings:", error);
// 			throw error;
// 		}
// 	}

// 	toJSON() {
// 		return {
// 			uid: this.uid,
// 			name: this.name,
// 			email: this.email,
// 			isSubscribed: this.isSubscribed,
// 			timeZone: this.timeZone,
// 			notifications: this.notifications,
// 			privacy: this.privacy,
// 			createdAt: this.createdAt,
// 			updatedAt: this.updatedAt,
// 		};
// 	}
// }

// module.exports = User;
