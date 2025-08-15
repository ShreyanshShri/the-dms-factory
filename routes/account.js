const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../middleware/auth");
const { db, admin } = require("../config/firebase");
const LeadService = require("../services/leadService");
const createResponse = require("../utils/helpers").createResponse;
const HTTP_STATUS = require("../utils/my_constants").HTTP_STATUS;

router.use(authenticateToken);

/* -------------------------------------------------------------
   GET /api/v1/account/overview
   ->  { campaigns: [{ id,name,status,accounts:[{..}]}] }
----------------------------------------------------------------*/
router.get("/overview", async (req, res) => {
	try {
		// campaigns that belong to the user
		const campSnap = await db
			.collection("campaigns")
			.where("userId", "==", req.user.uid)
			.get();

		// accounts that belong to the user
		const accSnap = await db
			.collection("accounts")
			.where("userId", "==", req.user.uid)
			.get();

		// group accounts by their currentCampaignId
		const accByCampaign = {};
		accSnap.forEach((doc) => {
			const acc = { id: doc.id, ...doc.data() };
			const cid = acc.currentCampaignId || "_unassigned";
			if (!accByCampaign[cid]) accByCampaign[cid] = [];
			accByCampaign[cid].push(acc);
		});

		// build campaign list
		const campaigns = [];
		campSnap.forEach((doc) => {
			const data = doc.data();
			campaigns.push({
				id: doc.id,
				name: data.name,
				status: data.status,
				platform: data.platform || "unknown",
				lastUpdated: data.lastUpdated,
				createdAt: data.createdAt,
				accounts: accByCampaign[doc.id] || [],
			});
		});

		// extract and remove unassigned if present
		const unassigned = accByCampaign._unassigned
			? {
					id: "_unassigned",
					name: "Unassigned",
					status: "n/a",
					platform: "unknown",
					lastUpdated: null,
					createdAt: Date.now(),
					accounts: accByCampaign._unassigned,
			  }
			: null;

		// sort campaigns by lastUpdated (desc)
		const toMillis = (ts) => {
			if (!ts) return 0;
			if (typeof ts === "number") return ts;
			if (ts.toMillis) return ts.toMillis();
			if (typeof ts._seconds === "number") return ts._seconds * 1000;
			return 0;
		};

		campaigns.sort((a, b) => toMillis(b.lastUpdated) - toMillis(a.lastUpdated));

		// append unassigned last
		if (unassigned) campaigns.push(unassigned);

		res.json(createResponse(true, { campaigns }));
	} catch (e) {
		console.error("overview error:", e);
		res
			.status(500)
			.json(createResponse(false, null, "Failed to fetch overview"));
	}
});

/* -------------------------------------------------------------
   PATCH /api/v1/account/assign
   body: { accountId, newCampaignId }
----------------------------------------------------------------*/
router.patch("/assign", async (req, res) => {
	const { accountId, newCampaignId } = req.body;
	if (!accountId || newCampaignId === undefined)
		return res.status(400).json(createResponse(false, null, "Missing params"));

	try {
		// Find account by widgetId field, not document ID
		const accountSnapshot = await db
			.collection("accounts")
			.where("widgetId", "==", accountId)
			.limit(1)
			.get();

		if (accountSnapshot.empty) {
			return res
				.status(403)
				.json(createResponse(false, null, "Account not found"));
		}

		const accountDoc = accountSnapshot.docs[0];
		const accountData = accountDoc.data();

		// Verify account belongs to user
		if (accountData.userId !== req.user.uid) {
			return res.status(403).json(createResponse(false, null, "Access denied"));
		}

		// Verify platform match if assigning to a campaign
		const newCampaign = newCampaignId
			? await db.collection("campaigns").doc(newCampaignId).get()
			: null;

		if (newCampaign && newCampaign.data().platform !== accountData.platform) {
			return res
				.status(400)
				.json(createResponse(false, null, "Platform mismatch: cannot assign"));
		}

		// Update using the actual document ID
		await accountDoc.ref.update({
			currentCampaignId: newCampaignId,
			lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
		});

		res.json(createResponse(true, null, "Account reassigned"));
	} catch (e) {
		console.error("assign error:", e);
		res
			.status(500)
			.json(createResponse(false, null, "Failed to assign account"));
	}
});

module.exports = router;
