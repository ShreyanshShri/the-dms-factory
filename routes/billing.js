const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../middleware/auth");

const Billing = require("../models/Billing"); // Create Mongoose Billing model
router.use(authenticateToken);

// GET /api/v1/billing/history
router.get("/history", authenticateToken, async (req, res) => {
	try {
		// Get billing records for actual payments only
		const billingRecords = await Billing.find({
			userId: req.user._id.toString(),
			// eventType: {
			//     $in: ['invoice.payment_succeeded', 'invoice.payment_failed']
			// }
		})
			.sort({ createdAt: -1 })
			.limit(50)
			.select("-rawEventData") // Exclude heavy raw data
			.lean();

		res.json({
			success: true,
			billingHistory: billingRecords,
			currentSubscription: req.user.subscription || null,
		});
	} catch (error) {
		console.error("Error fetching billing history:", error);
		res.status(500).json({
			success: false,
			message: "Failed to fetch billing history",
		});
	}
});

module.exports = router;
