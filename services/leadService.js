const { v4: uuidv4 } = require("uuid");
const Lead = require("../models/Lead");
const Account = require("../models/Account");

function toFirestoreTimestamp(dateInput) {
	const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
	return {
		_seconds: Math.floor(date.getTime() / 1000),
		_nanoseconds: (date.getTime() % 1000) * 1000000,
	};
}

class LeadService {
	static async assignLeadsToAccount(campaignId, widgetId, count = 24) {
		if (campaignId === undefined || widgetId === undefined) return 0;
		// Find account by widgetId
		const account = await Account.findOne({ widgetId });
		if (!account) {
			console.error(`Account not found: ${widgetId}`);
			return 0;
		}
		// Check already assigned leads
		const assignedLeads = await Lead.find({
			campaignId,
			assignedAccount: widgetId,
			status: "ready",
		}).limit(count);
		if (assignedLeads.length > 0) {
			return assignedLeads.length;
		}
		// Assign unassigned leads
		const unassignedLeads = await Lead.find({
			campaignId,
			assignedAccount: "",
			status: { $in: ["ready", "failed"] },
		}).limit(count);
		const now = toFirestoreTimestamp(new Date());
		for (const lead of unassignedLeads) {
			lead.assignedAccount = widgetId;
			lead.lastReassignedAt = now;
			lead.assignedAt = now;
			await lead.save();
		}
		account.pendingLeadsCount = unassignedLeads.length;
		await account.save();
		return unassignedLeads.length;
	}

	static async unAssignLeads(campaignId, widgetId, count = 24) {
		const account = await Account.findOne({ widgetId });
		if (!account) {
			console.error(`Account not found: ${widgetId}`);
			return 0;
		}
		const leads = await Lead.find({
			campaignId,
			assignedAccount: widgetId,
			status: { $in: ["ready", "failed"] },
		});
		const now = toFirestoreTimestamp(new Date());
		for (const lead of leads) {
			lead.assignedAccount = "";
			lead.lastReassignedAt = now;
			lead.status = "ready";
			lead.previousAccount = widgetId;
			lead.reassignmentCount = (lead.reassignmentCount || 0) + 1;
			await lead.save();
		}
		account.pendingLeadsCount = 0;
		await account.save();
		return leads.length;
	}

	static async fetchLeadsForProcessing(campaignId, widgetId, batchSize = 8) {
		const account = await Account.findOne({ widgetId });
		if (!account) {
			console.error(`Account not found: ${widgetId}`);
			return [];
		}
		const leads = await Lead.find({
			campaignId,
			assignedAccount: widgetId,
			status: "ready",
		}).limit(batchSize);
		return leads;
	}

	static async createLeadsFromCampaign(campaignId, leadsList) {
		const now = new Date();
		const firestoreTimestamp = {
			_seconds: Math.floor(now.getTime() / 1000),
			_nanoseconds: now.getMilliseconds() * 1e6,
		};

		const docs = leadsList.map(
			(username) =>
				new Lead({
					campaignId,
					username: username.trim(),
					type: "initial",
					status: "ready",
					sent: false,
					baseDate: firestoreTimestamp,
					assignedAt: firestoreTimestamp,
					lastReassignedAt: firestoreTimestamp,
					assignedAccount: "",
					followUps: [],
				})
		);

		await Lead.insertMany(docs);
		return docs.length;
	}
}

module.exports = LeadService;
