const { db } = require("../config/firebase");

class User {
	constructor(data) {
		this.uid = data.uid;
		this.name = data.name;
		this.email = data.email;
		this.isSubscribed = data.isSubscribed || true;
		this.createdAt = data.createdAt || Date.now();
		this.updatedAt = data.updatedAt || Date.now();
	}

	static async findById(uid) {
		try {
			const doc = await db.collection("users").doc(uid).get();
			return doc.exists ? new User({ uid: doc.id, ...doc.data() }) : null;
		} catch (error) {
			console.error("Error finding user:", error);
			throw error;
		}
	}

	static async create(userData) {
		try {
			const user = new User(userData);
			await db.collection("users").doc(user.uid).set({
				name: user.name,
				email: user.email,
				isSubscribed: user.isSubscribed,
				createdAt: user.createdAt,
				updatedAt: user.updatedAt,
			});
			return user;
		} catch (error) {
			console.error("Error creating user:", error);
			throw error;
		}
	}

	async save() {
		try {
			this.updatedAt = Date.now();
			await db.collection("users").doc(this.uid).update({
				name: this.name,
				email: this.email,
				isSubscribed: this.isSubscribed,
				updatedAt: this.updatedAt,
			});
			return this;
		} catch (error) {
			console.error("Error saving user:", error);
			throw error;
		}
	}

	toJSON() {
		return {
			uid: this.uid,
			name: this.name,
			email: this.email,
			isSubscribed: this.isSubscribed,
			createdAt: this.createdAt,
			updatedAt: this.updatedAt,
		};
	}
}

module.exports = User;
