const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../middleware/auth");

const Billing = require("../models/Billing"); // Create Mongoose Billing model
router.use(authenticateToken);

// GET /api/v1/billing/history
router.get("/history", async (req, res) => {
	try {
		const billingRecords = await Billing.find({ email: req.user.email })
			.sort({ timestamp: -1 })
			.limit(50)
			.lean();

		// Format dates
		billingRecords.forEach((record) => {
			record.createdAt = record.createdAt || new Date(record.timestamp);
			record.timestamp = new Date(record.timestamp);
		});

		res.json({
			success: true,
			billingHistory: billingRecords,
			currentSubscription: req.user.subscription || null,
		});
	} catch (error) {
		console.error("Error fetching billing history:", error);
		res
			.status(500)
			.json({ success: false, message: "Failed to fetch billing history" });
	}
});

// GET /api/v1/billing/subscription
router.get("/subscription", async (req, res) => {
	try {
		const subscription = req.user.subscription || {};
		res.json({
			success: true,
			subscription: {
				tier: subscription.tier || "No active subscription",
				tierValue: subscription.tierValue || 0,
				status: subscription.status || "inactive",
				planId: subscription.planId || null,
				currentPeriodEnd: subscription.currentPeriodEnd || null,
				isActive: subscription.status === "active",
			},
		});
	} catch (error) {
		console.error("Error fetching subscription:", error);
		res
			.status(500)
			.json({
				success: false,
				message: "Failed to fetch subscription details",
			});
	}
});

module.exports = router;

// // routes/billing.js

// const express = require("express");
// const { db } = require("../config/firebase");
// const { authenticateToken } = require("../middleware/auth");
// const router = express.Router();

// // Get user's billing history
// router.get("/history", authenticateToken, async (req, res) => {
// 	try {
// 		const userEmail = req.user.email;

// 		const billingSnapshot = await db
// 			.collection("billing")
// 			.where("email", "==", userEmail)
// 			.orderBy("timestamp", "desc")
// 			.limit(50)
// 			.get();

// 		const billingHistory = billingSnapshot.docs.map((doc) => ({
// 			id: doc.id,
// 			...doc.data(),
// 			// Format dates for frontend
// 			createdAt:
// 				doc.data().createdAt?.toDate?.() || new Date(doc.data().timestamp),
// 			timestamp: new Date(doc.data().timestamp),
// 		}));

// 		res.json({
// 			success: true,
// 			billingHistory,
// 			currentSubscription: req.user.subscription || null,
// 		});
// 	} catch (error) {
// 		console.error("Error fetching billing history:", error);
// 		res.status(500).json({
// 			success: false,
// 			message: "Failed to fetch billing history",
// 		});
// 	}
// });

// // Get current subscription details
// router.get("/subscription", authenticateToken, async (req, res) => {
// 	try {
// 		const subscription = req.user.subscription || {};

// 		res.json({
// 			success: true,
// 			subscription: {
// 				tier: subscription.tier || "No active subscription",
// 				tierValue: subscription.tierValue || 0,
// 				status: subscription.status || "inactive",
// 				planId: subscription.planId || null,
// 				currentPeriodEnd: subscription.currentPeriodEnd || null,
// 				isActive: req.user.isSubscribed || false,
// 			},
// 		});
// 	} catch (error) {
// 		console.error("Error fetching subscription:", error);
// 		res.status(500).json({
// 			success: false,
// 			message: "Failed to fetch subscription details",
// 		});
// 	}
// });

// module.exports = router;
