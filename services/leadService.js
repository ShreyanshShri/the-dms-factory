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

// const { db, admin } = require("../config/firebase");
// const { v4: uuidv4 } = require("uuid");

// class LeadService {
// 	static async assignLeadsToAccount(campaignID, accountId, count = 24) {
// 		if (campaignID === undefined || accountId === undefined) {
// 			console.log(accountId);
// 			return 0;
// 		}
// 		try {
// 			// Find account by widgetId field
// 			const accountSnapshot = await db
// 				.collection("accounts")
// 				.where("widgetId", "==", accountId)
// 				.limit(1)
// 				.get();

// 			if (accountSnapshot.empty) {
// 				console.error(`Account not found: ${accountId}`);
// 				return 0;
// 			}

// 			const actualAccountId = accountSnapshot.docs[0].id;

// 			// Check if leads are already assigned to the account
// 			const assignedLeadsSnapshot = await db
// 				.collection("leads")
// 				.where("campaignId", "==", campaignID)
// 				.where("assignedAccount", "==", accountId)
// 				.where("status", "==", "ready")
// 				.limit(count)
// 				.get();

// 			if (assignedLeadsSnapshot.size > 0) {
// 				console.log(
// 					`${assignedLeadsSnapshot.size} Leads already assigned to account ${accountId}`
// 				);
// 				return assignedLeadsSnapshot.size;
// 			}

// 			// Get unassigned leads for this campaign
// 			const leadsSnapshot = await db
// 				.collection("leads")
// 				.where("campaignId", "==", campaignID)
// 				.where("assignedAccount", "==", "")
// 				.where("status", "==", "ready")
// 				.limit(count)
// 				.get();

// 			const batch = db.batch();
// 			const assignedAt = admin.firestore.FieldValue.serverTimestamp();

// 			leadsSnapshot.forEach((doc) => {
// 				const data = doc.data();
// 				if (data.assignedAt === null) {
// 					batch.update(doc.ref, {
// 						assignedAccount: accountId,
// 						lastReassignedAt: assignedAt,
// 						assignedAt: assignedAt,
// 					});
// 				} else {
// 					batch.update(doc.ref, {
// 						assignedAccount: accountId,
// 						lastReassignedAt: assignedAt,
// 					});
// 				}
// 			});

// 			await batch.commit();

// 			await db.collection("accounts").doc(actualAccountId).update({
// 				pendingLeadsCount: leadsSnapshot.size,
// 			});

// 			console.log(
// 				`Assigned ${leadsSnapshot.size} leads to account ${accountId}`
// 			);
// 			return leadsSnapshot.size;
// 		} catch (error) {
// 			console.error("Error assigning leads:", error);
// 			throw error;
// 		}
// 	}

// 	static async unAssignLeads(campaignID, accountId, count = 24) {
// 		try {
// 			// Find account by widgetId field
// 			const accountSnapshot = await db
// 				.collection("accounts")
// 				.where("widgetId", "==", accountId)
// 				.limit(1)
// 				.get();

// 			if (accountSnapshot.empty) {
// 				console.error(`Account not found: ${accountId}`);
// 				return 0;
// 			}

// 			const actualAccountId = accountSnapshot.docs[0].id;

// 			console.log("testing: from unassign leads", campaignID, accountId);

// 			const leadsSnapshot = await db
// 				.collection("leads")
// 				.where("campaignId", "==", campaignID)
// 				.where("assignedAccount", "==", accountId)
// 				.where("status", "==", "ready")
// 				.get();

// 			const batch = db.batch();
// 			const assignedAt = admin.firestore.FieldValue.serverTimestamp();

// 			leadsSnapshot.forEach((doc) => {
// 				const data = doc.data();
// 				batch.update(doc.ref, {
// 					assignedAccount: "",
// 					lastReassignedAt: assignedAt,
// 					status: "ready",
// 					previousAccount: data.assignedAccount,
// 					reassignmentCount: data.reassignmentCount + 1,
// 				});
// 			});

// 			await batch.commit();

// 			await db.collection("accounts").doc(actualAccountId).update({
// 				pendingLeadsCount: 0,
// 			});

// 			console.log(`Unassigned ${leadsSnapshot.size} leads from ${accountId}`);
// 			return leadsSnapshot.size;
// 		} catch (error) {
// 			console.error("Error unassigning leads:", error);
// 			throw error;
// 		}
// 	}

// 	static async fetchLeadsForProcessing(campaignID, accountId, batchSize = 8) {
// 		try {
// 			// Find account by widgetId field
// 			const accountSnapshot = await db
// 				.collection("accounts")
// 				.where("widgetId", "==", accountId)
// 				.limit(1)
// 				.get();

// 			if (accountSnapshot.empty) {
// 				console.error(`Account not found: ${accountId}`);
// 				return [];
// 			}

// 			const leadsSnapshot = await db
// 				.collection("leads")
// 				.where("campaignId", "==", campaignID)
// 				.where("assignedAccount", "==", accountId)
// 				.where("status", "==", "ready")
// 				.limit(batchSize)
// 				.get();

// 			const leads = [];
// 			leadsSnapshot.forEach((doc) => {
// 				const data = doc.data();
// 				leads.push({
// 					id: doc.id,
// 					...data,
// 					assignedAt: data.assignedAt
// 						? {
// 								_seconds: Math.floor(data.assignedAt.toDate().getTime() / 1000),
// 								_nanoseconds:
// 									(data.assignedAt.toDate().getTime() % 1000) * 1000000,
// 						  }
// 						: null,
// 				});
// 			});

// 			return leads;
// 		} catch (error) {
// 			console.error("Error fetching leads:", error);
// 			throw error;
// 		}
// 	}

// 	static async createLeadsFromCampaign(campaignID, leadsList) {
// 		try {
// 			const batchSize = 500;
// 			const batches = [];

// 			for (let i = 0; i < leadsList.length; i += batchSize) {
// 				batches.push(leadsList.slice(i, i + batchSize));
// 			}

// 			for (const batchLeads of batches) {
// 				const batch = db.batch();
// 				const now = Date.now();

// 				batchLeads.forEach((username) => {
// 					const leadRef = db.collection("leads").doc();
// 					batch.set(leadRef, {
// 						campaignId: campaignID,
// 						username: username.trim(),
// 						type: "initial",
// 						status: "ready",
// 						sent: false,
// 						baseDate: now,
// 						assignedAccount: "",
// 						followUps: [],
// 					});
// 				});

// 				await batch.commit();
// 			}

// 			console.log(
// 				`Created ${leadsList.length} leads for campaign ${campaignID}`
// 			);
// 			return leadsList.length;
// 		} catch (error) {
// 			console.error("Error creating leads from campaign:", error);
// 			throw error;
// 		}
// 	}
// }

// module.exports = LeadService;
