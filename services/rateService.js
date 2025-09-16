const moment = require("moment-timezone");
const DailyLimit = require("../models/DailyLimit"); // Assume you have such a model
const Campaign = require("../models/Campaign");
const { toFirebaseTimestamp } = require("../utils/helpers");

function toFirestoreTimestamp(dateInput) {
	const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
	return {
		_seconds: Math.floor(date.getTime() / 1000),
		_nanoseconds: (date.getTime() % 1000) * 1000000,
	};
}

class RateService {
	static async getRateLimitInfo(
		accountId,
		workingHours = { start: 0, end: 24 },
		messageLimits = { min: 35, max: 41 }
	) {
		const now = toFirestoreTimestamp(new Date());
		const today = moment().tz("America/Los_Angeles").format("YYYY-MM-DD");
		let dailyLimit = await DailyLimit.findOne({ accountId, date: today });
		if (!dailyLimit) {
			dailyLimit = await DailyLimit.create({
				accountId,
				date: today,
				messagesSentToday: 0,
				messageLimitsMax: messageLimits.max,
				minMsgLimit: messageLimits.min,
				workingHours,
				createdAt: now,
			});
		}
		const messagesAllowedByNow = this.calculateAllowedByNow(
			dailyLimit.messageLimitsMax,
			dailyLimit.minMsgLimit,
			dailyLimit.workingHours
		);
		return {
			messagesSentToday: dailyLimit.messagesSentToday,
			messagesAllowedByNow,
			messageLimitsMax: dailyLimit.messageLimitsMax,
			minMsgLimit: dailyLimit.minMsgLimit,
			remainingMessages: Math.max(
				0,
				dailyLimit.messageLimitsMax - dailyLimit.messagesSentToday
			),
			workingHours: dailyLimit.workingHours,
		};
	}

	static calculateAllowedByNow(
		maxDaily,
		minMsgLimit,
		workingHours = { start: 0, end: 24 }
	) {
		const now = moment().tz("America/Los_Angeles");
		const currentHour = now.hour() + now.minute() / 60;
		const { start, end } = workingHours;
		if (currentHour < start) return minMsgLimit;
		if (currentHour >= end) return maxDaily;
		const totalWorkingHours = end - start;
		const hoursElapsed = currentHour - start;
		const progressThroughWorkingHours = hoursElapsed / totalWorkingHours;
		const timeBasedAllowance = Math.floor(
			maxDaily * progressThroughWorkingHours
		);
		return Math.max(minMsgLimit, timeBasedAllowance);
	}

	static async recordMessageSent(accountId, campaignId) {
		const today = moment().tz("America/Los_Angeles").format("YYYY-MM-DD");
		const now = toFirestoreTimestamp(new Date());
		let dailyLimit = await DailyLimit.findOne({ accountId, date: today });
		if (!dailyLimit) {
			const campaign = await Campaign.findById(campaignId);
			dailyLimit = await DailyLimit.create({
				accountId,
				campaignId,
				date: today,
				messagesSentToday: 1,
				messageLimitsMax: campaign?.messageLimits?.max || 41,
				minMsgLimit: campaign?.messageLimits?.min || 35,
				workingHours: campaign?.workingHours || { start: 0, end: 24 },
				createdAt: now,
				lastMessageAt: now,
			});
		} else {
			dailyLimit.messagesSentToday += 1;
			dailyLimit.lastMessageAt = now;
			await dailyLimit.save();
		}
	}

	static async getCampaignData(campaignId) {
		const campaign = await Campaign.findById(campaignId);
		if (!campaign) {
			return {
				workingHours: { start: 0, end: 24 },
				messageLimits: { min: 35, max: 41 },
			};
		}
		return {
			workingHours: campaign.workingHours,
			messageLimits: campaign.messageLimits,
		};
	}
}

module.exports = RateService;

// const { db, admin } = require("../config/firebase");
// const moment = require("moment-timezone");

// class RateService {
// 	static async getRateLimitInfo(
// 		accountId,
// 		workingHours = { start: 0, end: 24 },
// 		messageLimits = { min: 35, max: 41 }
// 	) {
// 		try {
// 			const today = moment().tz("America/Los_Angeles").format("YYYY-MM-DD");
// 			const rateLimitRef = db
// 				.collection("dailyLimits")
// 				.doc(`${accountId}_${today}`);

// 			// Use a transaction to handle race conditions
// 			const result = await db.runTransaction(async (transaction) => {
// 				const rateLimitDoc = await transaction.get(rateLimitRef);

// 				if (!rateLimitDoc.exists) {
// 					// Create new rate limit document
// 					const initialData = {
// 						accountId,
// 						date: today,
// 						messagesSentToday: 0,
// 						messageLimitsMax: messageLimits.max,
// 						minMsgLimit: messageLimits.min,
// 						workingHours,
// 						createdAt: Date.now(),
// 					};

// 					transaction.set(rateLimitRef, initialData);
// 					return initialData;
// 				} else {
// 					const data = rateLimitDoc.data();

// 					// Check if document is missing essential fields (created by recordMessageSent)
// 					const needsUpdate = !data.messageLimitsMax || !data.workingHours;

// 					if (needsUpdate) {
// 						const updateData = {
// 							messageLimitsMax: data.messageLimitsMax || messageLimits.max,
// 							minMsgLimit: data.minMsgLimit || messageLimits.min,
// 							workingHours: data.workingHours || workingHours,
// 							accountId: data.accountId || accountId,
// 							date: data.date || today,
// 						};

// 						transaction.update(rateLimitRef, updateData);
// 						return { ...data, ...updateData };
// 					}

// 					return data;
// 				}
// 			});

// 			const messagesAllowedByNow = this.calculateAllowedByNow(
// 				result.messageLimitsMax,
// 				result.minMsgLimit,
// 				result.workingHours
// 			);

// 			return {
// 				messagesSentToday: result.messagesSentToday || 0,
// 				messagesAllowedByNow,
// 				messageLimitsMax: result.messageLimitsMax,
// 				minMsgLimit: result.minMsgLimit,
// 				remainingMessages: Math.max(
// 					0,
// 					result.messageLimitsMax - (result.messagesSentToday || 0)
// 				),
// 				workingHours: result.workingHours,
// 			};
// 		} catch (error) {
// 			console.error("Error getting rate limit info:", error);
// 			throw error;
// 		}
// 	}

// 	static calculateAllowedByNow(
// 		maxDaily,
// 		minMsgLimit,
// 		workingHours = { start: 0, end: 24 }
// 	) {
// 		const now = moment().tz("America/Los_Angeles");
// 		const currentHour = now.hour() + now.minute() / 60;

// 		const { start, end } = workingHours;

// 		// If current time is before working hours start
// 		if (currentHour < start) {
// 			return minMsgLimit; // Return minimum instead of 0
// 		}

// 		// If current time is after working hours end
// 		if (currentHour >= end) {
// 			return maxDaily;
// 		}

// 		// Calculate progress through working hours
// 		const totalWorkingHours = end - start;
// 		const hoursElapsed = currentHour - start;
// 		const progressThroughWorkingHours = hoursElapsed / totalWorkingHours;

// 		// Ensure minimum is always respected
// 		const timeBasedAllowance = Math.floor(
// 			maxDaily * progressThroughWorkingHours
// 		);
// 		return Math.max(minMsgLimit, timeBasedAllowance);
// 	}

// 	static async recordMessageSent(accountId, campaignId) {
// 		try {
// 			const today = moment().tz("America/Los_Angeles").format("YYYY-MM-DD");
// 			const rateLimitRef = db
// 				.collection("dailyLimits")
// 				.doc(`${accountId}_${today}`);

// 			// Use transaction to ensure document is properly initialized
// 			await db.runTransaction(async (transaction) => {
// 				const doc = await transaction.get(rateLimitRef);

// 				if (!doc.exists) {
// 					// Fetch campaign data only when creating new document
// 					const campaignData = await this.getCampaignData(campaignId);

// 					const initialData = {
// 						accountId,
// 						campaignId, // Store campaign ID for reference
// 						date: today,
// 						messagesSentToday: 1, // Start with 1 since we're recording a message
// 						messageLimitsMax: campaignData.messageLimits?.max || 41,
// 						minMsgLimit: campaignData.messageLimits?.min || 35,
// 						workingHours: campaignData.workingHours || { start: 0, end: 24 },
// 						createdAt: Date.now(),
// 						lastMessageAt: admin.firestore.FieldValue.serverTimestamp(),
// 					};

// 					transaction.set(rateLimitRef, initialData);
// 				} else {
// 					// Document exists, just increment counter
// 					const updateData = {
// 						messagesSentToday: admin.firestore.FieldValue.increment(1),
// 						lastMessageAt: admin.firestore.FieldValue.serverTimestamp(),
// 					};

// 					transaction.update(rateLimitRef, updateData);
// 				}
// 			});
// 		} catch (error) {
// 			console.error("Error recording message sent:", error);
// 			throw error;
// 		}
// 	}

// 	// Helper method to fetch campaign data
// 	static async getCampaignData(campaignId) {
// 		try {
// 			const campaignDoc = await db
// 				.collection("campaigns")
// 				.doc(campaignId)
// 				.get();

// 			if (!campaignDoc.exists) {
// 				console.warn(`Campaign ${campaignId} not found, using defaults`);
// 				return {
// 					workingHours: { start: 0, end: 24 },
// 					messageLimits: { min: 35, max: 41 },
// 				};
// 			}

// 			return campaignDoc.data();
// 		} catch (error) {
// 			console.error(`Error fetching campaign data for ${campaignId}:`, error);
// 			// Return defaults on error
// 			return {
// 				workingHours: { start: 0, end: 24 },
// 				messageLimits: { min: 35, max: 41 },
// 			};
// 		}
// 	}
// }

// module.exports = RateService;
