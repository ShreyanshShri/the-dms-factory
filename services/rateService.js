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
