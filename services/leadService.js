const { db, admin } = require("../config/firebase");
const { v4: uuidv4 } = require("uuid");

class LeadService {
	static async assignLeadsToAccount(campaignID, accountId, count = 24) {
		try {
			// Check if leads are already assigned to the account
			const assignedLeadsSnapshot = await db
				.collection("leads")
				.where("campaignId", "==", campaignID)
				.where("assignedAccount", "==", accountId)
				.where("status", "==", "ready")
				.limit(count)
				.get();
			if (assignedLeadsSnapshot.size > 0) {
				console.log(
					`${assignedLeadsSnapshot.size} Leads already assigned to account ${accountId}`
				);
				return assignedLeadsSnapshot.size;
			}

			// Get unassigned leads for this campaign
			const leadsSnapshot = await db
				.collection("leads")
				.where("campaignId", "==", campaignID)
				.where("assignedAccount", "==", "")
				.where("status", "==", "ready")
				.limit(count)
				.get();

			const batch = db.batch();
			const assignedAt = admin.firestore.FieldValue.serverTimestamp();

			leadsSnapshot.forEach((doc) => {
				const data = doc.data();
				if (data.assignedAt === null) {
					// if lead is assigned for the first time
					batch.update(doc.ref, {
						assignedAccount: accountId,
						lastReassignedAt: assignedAt,
						assignedAt: assignedAt, // update assignedAt
					});
				} else {
					// else dont update assignedAt
					batch.update(doc.ref, {
						assignedAccount: accountId,
						lastReassignedAt: assignedAt,
					});
				}
			});

			await batch.commit();

			console.log(
				`Assigned ${leadsSnapshot.size} leads to account ${accountId}`
			);
			return leadsSnapshot.size;
		} catch (error) {
			console.error("Error assigning leads:", error);
			throw error;
		}
	}

	static async unAssignLeads(campaignID, accountId, count = 24) {
		try {
			// Get unassigned leads for this campaign
			// .where("assignedAccount", "==", "")
			console.log("testing: from unassign leads", campaignID, accountId);
			const leadsSnapshot = await db
				.collection("leads")
				.where("campaignId", "==", campaignID)
				.where("assignedAccount", "==", accountId)
				.where("status", "==", "ready")
				.get();

			const batch = db.batch();
			const assignedAt = admin.firestore.FieldValue.serverTimestamp();

			// this.lastReassignedAt = data.lastReassignedAt || null;
			// this.previousAccount = data.previousAccount || null;
			// this.reassignmentCount = data.reassignmentCount || 0;

			leadsSnapshot.forEach((doc) => {
				// else dont update assignedAt
				const data = doc.data();
				batch.update(doc.ref, {
					assignedAccount: "",
					lastReassignedAt: assignedAt,
					status: "ready",
					previousAccount: data.assignedAccount,
					reassignmentCount: data.reassignmentCount + 1,
				});
			});

			await batch.commit();

			console.log(`Unassigned ${leadsSnapshot.size} leads from ${accountId}`);
			return leadsSnapshot.size;
		} catch (error) {
			console.error("Error unassigning leads:", error);
			throw error;
		}
	}

	static async fetchLeadsForProcessing(campaignID, accountId, batchSize = 8) {
		try {
			const leadsSnapshot = await db
				.collection("leads")
				.where("campaignId", "==", campaignID)
				.where("assignedAccount", "==", accountId)
				.where("status", "==", "ready")
				.limit(batchSize)
				.get();

			const leads = [];
			leadsSnapshot.forEach((doc) => {
				const data = doc.data();
				leads.push({
					id: doc.id,
					...data,
					assignedAt: data.assignedAt
						? {
								_seconds: Math.floor(data.assignedAt.toDate().getTime() / 1000),
								_nanoseconds:
									(data.assignedAt.toDate().getTime() % 1000) * 1000000,
						  }
						: null,
				});
			});

			return leads;
		} catch (error) {
			console.error("Error fetching leads:", error);
			throw error;
		}
	}

	static async createLeadsFromCampaign(campaignID, leadsList) {
		try {
			const batchSize = 500; // Firestore batch limit
			const batches = [];

			// Split leads into batches
			for (let i = 0; i < leadsList.length; i += batchSize) {
				batches.push(leadsList.slice(i, i + batchSize));
			}

			// Process each batch
			for (const batchLeads of batches) {
				const batch = db.batch();
				const now = Date.now();

				batchLeads.forEach((username) => {
					const leadRef = db.collection("leads").doc();
					batch.set(leadRef, {
						campaignId: campaignID,
						username: username.trim(),
						type: "initial",
						status: "ready",
						sent: false,
						baseDate: now,
						assignedAccount: "",
						followUps: [],
					});
				});

				await batch.commit();
			}

			console.log(
				`Created ${leadsList.length} leads for campaign ${campaignID}`
			);
			return leadsList.length;
		} catch (error) {
			console.error("Error creating leads from campaign:", error);
			throw error;
		}
	}
}

module.exports = LeadService;
