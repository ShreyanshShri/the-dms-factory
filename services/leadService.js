const { db, admin } = require("../config/firebase");
const { v4: uuidv4 } = require("uuid");

class LeadService {
	static async assignLeadsToAccount(campaignID, accountId, count = 200) {
		try {
			// Get unassigned leads for this campaign
			const leadsSnapshot = await db
				.collection("leads")
				.where("campaignId", "==", campaignID)
				.where("assignedAccount", "==", "")
				.limit(count)
				.get();

			const batch = db.batch();
			const assignedAt = admin.firestore.FieldValue.serverTimestamp();

			// this.lastReassignedAt = data.lastReassignedAt || null;
			// this.previousAccount = data.previousAccount || null;
			// this.reassignmentCount = data.reassignmentCount || 0;

			leadsSnapshot.forEach((doc) => {
				const data = doc.data();
				if (data.assignedAccount === "") {
					// if lead is assigned for the first time
					batch.update(doc.ref, {
						assignedAccount: accountId,
						lastReassignedAt: assignedAt,
						assignedAt: assignedAt, // update assignedAt
						status: "ready",
					});
				} else {
					// else dont update assignedAt
					batch.update(doc.ref, {
						assignedAccount: accountId,
						lastReassignedAt: assignedAt,
						status: "ready",
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

	static async unAssignLeads(campaignID, count = 200) {
		try {
			// Get unassigned leads for this campaign
			const leadsSnapshot = await db
				.collection("leads")
				.where("campaignId", "==", campaignID)
				// .where("assignedAccount", "==", "")
				.limit(count)
				.get();

			const batch = db.batch();
			const assignedAt = admin.firestore.FieldValue.serverTimestamp();

			// this.lastReassignedAt = data.lastReassignedAt || null;
			// this.previousAccount = data.previousAccount || null;
			// this.reassignmentCount = data.reassignmentCount || 0;

			leadsSnapshot.forEach((doc) => {
				// else dont update assignedAt
				batch.update(doc.ref, {
					assignedAccount: "",
					lastReassignedAt: assignedAt,
					status: "ready",
				});
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
