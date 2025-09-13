const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../middleware/auth");

const Account = require("../models/Account");
const Campaign = require("../models/Campaign");

router.use(authenticateToken);

function toFirestoreTimestamp(dateInput) {
	const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
	return {
		_seconds: Math.floor(date.getTime() / 1000),
		_nanoseconds: (date.getTime() % 1000) * 1000000,
	};
}

// GET /api/v1/account/overview
router.get("/overview", async (req, res) => {
	try {
		const userId = req.user.uid;

		const campaigns = await Campaign.find({ userId }).lean();
		const accounts = await Account.find({ userId }).lean();

		// Group accounts by campaignId
		const accByCampaign = accounts.reduce((acc, account) => {
			const cid = account.currentCampaignId || "_unassigned";
			acc[cid] = acc[cid] || [];
			acc[cid].push(account);
			return acc;
		}, {});

		const campaignList = campaigns.map((c) => ({
			id: c._id,
			name: c.name,
			status: c.status,
			platform: c.platform || "unknown",
			lastUpdated: c.lastUpdated,
			createdAt: c.createdAt,
			accounts: accByCampaign[c._id.toString()] || [],
		}));

		// Handle unassigned accounts
		if (accByCampaign._unassigned) {
			campaignList.push({
				id: "_unassigned",
				name: "Unassigned",
				status: "n/a",
				platform: "unknown",
				lastUpdated: null,
				createdAt: toFirestoreTimestamp(new Date()),
				accounts: accByCampaign._unassigned,
			});
		}

		// Sort by lastUpdated desc (handle timestamps)
		const toMillis = (ts) => {
			if (!ts) return 0;
			if (typeof ts === "number") return ts;
			if (ts._seconds) return ts._seconds * 1000;
			if (ts.getTime) return ts.getTime();
			return 0;
		};
		campaignList.sort(
			(a, b) => toMillis(b.lastUpdated) - toMillis(a.lastUpdated)
		);

		res.json({ success: true, data: { campaigns: campaignList } });
	} catch (err) {
		console.error("Account overview error:", err);
		res
			.status(500)
			.json({ success: false, message: "Failed to fetch overview" });
	}
});

// PATCH /api/v1/account/assign
router.patch("/assign", async (req, res) => {
	const { accountId, newCampaignId } = req.body;
	if (!accountId || newCampaignId === undefined) {
		return res.status(400).json({ success: false, message: "Missing params" });
	}
	try {
		const account = await Account.findOne({ widgetId: accountId });
		if (!account)
			return res
				.status(403)
				.json({ success: false, message: "Account not found" });
		if (account.userId !== req.user.uid)
			return res.status(403).json({ success: false, message: "Access denied" });

		if (newCampaignId) {
			const campaign = await Campaign.findById(newCampaignId);
			if (!campaign || campaign.platform !== account.platform) {
				return res.status(400).json({
					success: false,
					message: "Platform mismatch: cannot assign",
				});
			}
		}

		account.currentCampaignId = newCampaignId;
		account.lastUpdated = toFirestoreTimestamp(new Date());

		await account.save();

		res.json({ success: true, message: "Account reassigned" });
	} catch (err) {
		console.error("Assign error:", err);
		res
			.status(500)
			.json({ success: false, message: "Failed to assign account" });
	}
});

// PATCH /api/v1/account/assign-many
router.patch("/assign-many", async (req, res) => {
	const { accountIds, newCampaignId } = req.body;
	if (!Array.isArray(accountIds) || newCampaignId === undefined) {
		return res.status(400).json({ success: false, message: "Missing params" });
	}
	try {
		const campaign = await Campaign.findById(newCampaignId);
		for (const widgetId of accountIds) {
			const account = await Account.findOne({ widgetId });
			if (!account) continue;
			if (account.userId !== req.user.uid) continue;
			if (campaign && campaign.platform !== account.platform) continue;

			account.currentCampaignId = newCampaignId;
			account.lastUpdated = toFirestoreTimestamp(new Date());
			await account.save();
		}
		res.json({ success: true, message: "Accounts reassigned" });
	} catch (err) {
		console.error("Assign-many error:", err);
		res
			.status(500)
			.json({ success: false, message: "Failed to reassign accounts" });
	}
});

module.exports = router;

// const express = require("express");
// const router = express.Router();
// const { authenticateToken } = require("../middleware/auth");
// const { db, admin } = require("../config/firebase");
// const LeadService = require("../services/leadService");
// const createResponse = require("../utils/helpers").createResponse;
// const HTTP_STATUS = require("../utils/my_constants").HTTP_STATUS;

// router.use(authenticateToken);

// /* -------------------------------------------------------------
//    GET /api/v1/account/overview
//    ->  { campaigns: [{ id,name,status,accounts:[{..}]}] }
// ----------------------------------------------------------------*/
// router.get("/overview", async (req, res) => {
// 	try {
// 		// campaigns that belong to the user
// 		const campSnap = await db
// 			.collection("campaigns")
// 			.where("userId", "==", req.user.uid)
// 			.get();

// 		// accounts that belong to the user
// 		const accSnap = await db
// 			.collection("accounts")
// 			.where("userId", "==", req.user.uid)
// 			.get({ source: "server" });

// 		// group accounts by their currentCampaignId
// 		const accByCampaign = {};
// 		accSnap.forEach((doc) => {
// 			const acc = { id: doc.id, ...doc.data() };
// 			const cid = acc.currentCampaignId || "_unassigned";
// 			if (!accByCampaign[cid]) accByCampaign[cid] = [];
// 			accByCampaign[cid].push(acc);
// 		});

// 		// build campaign list
// 		const campaigns = [];
// 		campSnap.forEach((doc) => {
// 			const data = doc.data();
// 			campaigns.push({
// 				id: doc.id,
// 				name: data.name,
// 				status: data.status,
// 				platform: data.platform || "unknown",
// 				lastUpdated: data.lastUpdated,
// 				createdAt: data.createdAt,
// 				accounts: accByCampaign[doc.id] || [],
// 			});
// 		});

// 		// extract and remove unassigned if present
// 		const unassigned = accByCampaign._unassigned
// 			? {
// 					id: "_unassigned",
// 					name: "Unassigned",
// 					status: "n/a",
// 					platform: "unknown",
// 					lastUpdated: null,
// 					createdAt: Date.now(),
// 					accounts: accByCampaign._unassigned,
// 			  }
// 			: null;

// 		// sort campaigns by lastUpdated (desc)
// 		const toMillis = (ts) => {
// 			if (!ts) return 0;
// 			if (typeof ts === "number") return ts;
// 			if (ts.toMillis) return ts.toMillis();
// 			if (typeof ts._seconds === "number") return ts._seconds * 1000;
// 			return 0;
// 		};

// 		campaigns.sort((a, b) => toMillis(b.lastUpdated) - toMillis(a.lastUpdated));

// 		// append unassigned last
// 		if (unassigned) campaigns.push(unassigned);

// 		res.json(createResponse(true, { campaigns }));
// 	} catch (e) {
// 		console.error("overview error:", e);
// 		res
// 			.status(500)
// 			.json(createResponse(false, null, "Failed to fetch overview"));
// 	}
// });

// /* -------------------------------------------------------------
//    PATCH /api/v1/account/assign
//    body: { accountId, newCampaignId }
// ----------------------------------------------------------------*/
// router.patch("/assign", async (req, res) => {
// 	const { accountId, newCampaignId } = req.body;
// 	if (!accountId || newCampaignId === undefined)
// 		return res.status(400).json(createResponse(false, null, "Missing params"));

// 	try {
// 		// Find account by widgetId field, not document ID
// 		const accountSnapshot = await db
// 			.collection("accounts")
// 			.where("widgetId", "==", accountId)
// 			.limit(1)
// 			.get();

// 		if (accountSnapshot.empty) {
// 			return res
// 				.status(403)
// 				.json(createResponse(false, null, "Account not found"));
// 		}

// 		const accountDoc = accountSnapshot.docs[0];
// 		const accountData = accountDoc.data();

// 		// Verify account belongs to user
// 		if (accountData.userId !== req.user.uid) {
// 			return res.status(403).json(createResponse(false, null, "Access denied"));
// 		}

// 		// Verify platform match if assigning to a campaign
// 		const newCampaign = newCampaignId
// 			? await db.collection("campaigns").doc(newCampaignId).get()
// 			: null;

// 		if (newCampaign && newCampaign.data().platform !== accountData.platform) {
// 			return res
// 				.status(400)
// 				.json(createResponse(false, null, "Platform mismatch: cannot assign"));
// 		}

// 		// Update using the actual document ID
// 		await accountDoc.ref.update({
// 			currentCampaignId: newCampaignId,
// 			lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
// 		});

// 		res.json(createResponse(true, null, "Account reassigned"));
// 	} catch (e) {
// 		console.error("assign error:", e);
// 		res
// 			.status(500)
// 			.json(createResponse(false, null, "Failed to assign account"));
// 	}
// });

// /* -------------------------------------------------------------
//    PATCH /api/v1/account/assign-many
//    body: { accountIds: [..], newCampaignId }
// ----------------------------------------------------------------*/
// router.patch("/assign-many", async (req, res) => {
// 	const { accountIds, newCampaignId } = req.body;
// 	if (!Array.isArray(accountIds) || newCampaignId === undefined) {
// 		return res.status(400).json(createResponse(false, null, "Missing params"));
// 	}

// 	try {
// 		const batch = db.batch();

// 		for (const widgetId of accountIds) {
// 			const accountSnapshot = await db
// 				.collection("accounts")
// 				.where("widgetId", "==", widgetId)
// 				.limit(1)
// 				.get();

// 			if (accountSnapshot.empty) continue;
// 			const accountDoc = accountSnapshot.docs[0];
// 			const accountData = accountDoc.data();

// 			if (accountData.userId !== req.user.uid) continue;

// 			// check platform mismatch if assigning to a campaign
// 			if (newCampaignId) {
// 				const newCamp = await db
// 					.collection("campaigns")
// 					.doc(newCampaignId)
// 					.get();
// 				if (!newCamp.exists || newCamp.data().platform !== accountData.platform)
// 					continue;
// 			}

// 			batch.update(accountDoc.ref, {
// 				currentCampaignId: newCampaignId,
// 				lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
// 			});
// 		}

// 		await batch.commit();
// 		res.json(createResponse(true, null, "Accounts reassigned"));
// 	} catch (e) {
// 		console.error("assign-many error:", e);
// 		res
// 			.status(500)
// 			.json(createResponse(false, null, "Failed to reassign accounts"));
// 	}
// });

// module.exports = router;
