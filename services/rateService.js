const { db, admin } = require("../config/firebase");
const moment = require("moment");

class RateService {
	static async getRateLimitInfo(accountId) {
		try {
			const today = moment().format("YYYY-MM-DD");
			const rateLimitDoc = await db
				.collection("dailyLimits")
				.doc(`${accountId}_${today}`)
				.get();

			if (!rateLimitDoc.exists) {
				// Create new rate limit document
				const initialData = {
					accountId,
					date: today,
					messagesSentToday: 0,
					messageLimitsMax: 41,
					createdAt: Date.now(),
				};

				await db
					.collection("dailyLimits")
					.doc(`${rateLimitDoc.id}`)
					.set(initialData);

				return {
					messagesSentToday: 0,
					messagesAllowedByNow: this.calculateAllowedByNow(41),
					messageLimitsMax: 41,
					remainingMessages: 41,
				};
			}

			const data = rateLimitDoc.data();
			const messagesAllowedByNow = this.calculateAllowedByNow(
				data.messageLimitsMax
			);

			return {
				messagesSentToday: data.messagesSentToday || 0,
				messagesAllowedByNow,
				messageLimitsMax: data.messageLimitsMax || 41,
				remainingMessages: Math.max(
					0,
					data.messageLimitsMax - data.messagesSentToday
				),
			};
		} catch (error) {
			console.error("Error getting rate limit info:", error);
			throw error;
		}
	}

	static calculateAllowedByNow(maxDaily) {
		const now = moment();
		const startOfDay = moment().startOf("day");
		const endOfDay = moment().endOf("day");

		const totalMinutesInDay = endOfDay.diff(startOfDay, "minutes");
		const minutesElapsed = now.diff(startOfDay, "minutes");

		const progressThroughDay = minutesElapsed / totalMinutesInDay;
		return Math.floor(maxDaily * progressThroughDay);
	}

	static async recordMessageSent(accountId) {
		try {
			const today = moment().format("YYYY-MM-DD");
			const rateLimitRef = db
				.collection("dailyLimits")
				.doc(`${accountId}_${today}`);

			await rateLimitRef.set(
				{
					messagesSentToday: admin.firestore.FieldValue.increment(1),
					lastMessageAt: admin.firestore.FieldValue.serverTimestamp(),
				},
				{ merge: true }
			);
		} catch (error) {
			console.error("Error recording message sent:", error);
			throw error;
		}
	}
}

module.exports = RateService;
