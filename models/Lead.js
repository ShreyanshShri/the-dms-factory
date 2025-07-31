const { db, admin } = require("../config/firebase");

class Lead {
	constructor(data) {
		this.id = data.id;
		this.campaignId = data.campaignId;
		this.username = data.username;
		this.type = data.type || "initial";
		this.status = data.status || "ready";
		this.sent = data.sent || false;
		this.baseDate = data.baseDate;
		this.assignedAccount = data.assignedAccount || "";
		this.assignedAt = data.assignedAt;
		this.lastReassignedAt = data.lastReassignedAt || null;
		this.previousAccount = data.previousAccount || null;
		this.reassignmentCount = data.reassignmentCount || 0;
		this.followUps = data.followUps || [];
	}

	static async findById(leadId) {
		try {
			const doc = await db.collection("leads").doc(leadId).get();
			return doc.exists ? new Lead({ id: doc.id, ...doc.data() }) : null;
		} catch (error) {
			console.error("Error finding lead:", error);
			throw error;
		}
	}

	static async findByCampaign(campaignId, limit = 50) {
		try {
			const snapshot = await db
				.collection("leads")
				.where("campaignId", "==", campaignId)
				.limit(limit)
				.get();

			const leads = [];
			snapshot.forEach((doc) => {
				leads.push(new Lead({ id: doc.id, ...doc.data() }));
			});

			return leads;
		} catch (error) {
			console.error("Error finding leads by campaign:", error);
			throw error;
		}
	}

	static async findAssignedLeads(
		campaignId,
		accountId,
		status = "ready",
		limit = 8
	) {
		try {
			const snapshot = await db
				.collection("leads")
				.where("campaignId", "==", campaignId)
				.where("assignedAccount", "==", accountId)
				.where("status", "==", status)
				.limit(limit)
				.get();

			const leads = [];
			snapshot.forEach((doc) => {
				const data = doc.data();
				leads.push(
					new Lead({
						id: doc.id,
						...data,
						assignedAt: data.assignedAt
							? {
									_seconds: Math.floor(
										data.assignedAt.toDate().getTime() / 1000
									),
									_nanoseconds:
										(data.assignedAt.toDate().getTime() % 1000) * 1000000,
							  }
							: null,
					})
				);
			});

			return leads;
		} catch (error) {
			console.error("Error finding assigned leads:", error);
			throw error;
		}
	}

	static async findUnassignedLeads(campaignId, limit = 200) {
		try {
			const snapshot = await db
				.collection("leads")
				.where("campaignId", "==", campaignId)
				.where("assignedAccount", "==", "")
				.limit(limit)
				.get();

			const leads = [];
			snapshot.forEach((doc) => {
				leads.push(new Lead({ id: doc.id, ...doc.data() }));
			});

			return leads;
		} catch (error) {
			console.error("Error finding unassigned leads:", error);
			throw error;
		}
	}

	static async bulkCreate(campaignId, usernames) {
		try {
			const batch = db.batch();
			const now = Date.now();
			const leads = [];

			usernames.forEach((username) => {
				const leadRef = db.collection("leads").doc();
				const lead = new Lead({
					id: leadRef.id,
					campaignId,
					username: username.trim(),
					type: "initial",
					status: "ready",
					sent: false,
					baseDate: now,
					assignedAccount: "",
					followUps: [],
				});

				batch.set(leadRef, {
					campaignId: lead.campaignId,
					username: lead.username,
					type: lead.type,
					status: lead.status,
					sent: lead.sent,
					baseDate: lead.baseDate,
					assignedAccount: lead.assignedAccount,
					followUps: lead.followUps,
				});

				leads.push(lead);
			});

			await batch.commit();
			return leads;
		} catch (error) {
			console.error("Error bulk creating leads:", error);
			throw error;
		}
	}

	static async bulkAssign(campaignId, accountId, count = 200) {
		try {
			const snapshot = await db
				.collection("leads")
				.where("campaignId", "==", campaignId)
				.where("assignedAccount", "==", "")
				.limit(count)
				.get();

			const batch = db.batch();
			const assignedAt = admin.firestore.FieldValue.serverTimestamp();

			snapshot.forEach((doc) => {
				batch.update(doc.ref, {
					assignedAccount: accountId,
					assignedAt,
					status: "ready",
				});
			});

			await batch.commit();
			return snapshot.size;
		} catch (error) {
			console.error("Error bulk assigning leads:", error);
			throw error;
		}
	}

	async updateStatus(status) {
		try {
			this.status = status;
			await db.collection("leads").doc(this.id).update({
				status: this.status,
				lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
			});
			return this;
		} catch (error) {
			console.error("Error updating lead status:", error);
			throw error;
		}
	}

	async markAsSent() {
		try {
			this.sent = true;
			this.status = "sent";
			await db.collection("leads").doc(this.id).update({
				sent: this.sent,
				status: this.status,
				lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
			});
			return this;
		} catch (error) {
			console.error("Error marking lead as sent:", error);
			throw error;
		}
	}

	toJSON() {
		return {
			id: this.id,
			campaignId: this.campaignId,
			username: this.username,
			type: this.type,
			status: this.status,
			sent: this.sent,
			baseDate: this.baseDate,
			baseDateTimestamp: this.baseDate,
			assignedAccount: this.assignedAccount,
			assignedAt: this.assignedAt,
			followUps: this.followUps,
		};
	}
}

module.exports = Lead;
