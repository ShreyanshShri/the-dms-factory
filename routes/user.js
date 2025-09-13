const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../middleware/auth");
const User = require("../models/User");
const { createResponse } = require("../utils/helpers");
const { HTTP_STATUS } = require("../utils/my_constants");

router.use(authenticateToken);

// Get subscription status
router.get("/payment-status", (req, res) => {
	res.status(200).json({
		success: true,
		subscriptionStatus: req.user.subscription?.status || "none",
	});
});

// Get user settings
router.get("/settings", async (req, res) => {
	try {
		const user = await User.findOne({ uid: req.user.uid }).lean();
		if (!user) {
			return res
				.status(HTTP_STATUS.NOT_FOUND)
				.json(createResponse(false, null, "User not found"));
		}

		res.json(
			createResponse(
				true,
				{
					displayName: user.name,
					email: user.email,
					timeZone: user.timeZone,
					notifications: user.notifications,
					privacy: user.privacy,
				},
				"Settings retrieved successfully"
			)
		);
	} catch (error) {
		console.error("Error fetching settings:", error);
		res
			.status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
			.json(createResponse(false, null, "Failed to fetch settings"));
	}
});

// Update user settings
router.put("/settings", async (req, res) => {
	try {
		const { notifications, privacy, displayName, email, timeZone } = req.body;

		const user = await User.findOne({ uid: req.user.uid });
		if (!user) {
			return res
				.status(HTTP_STATUS.NOT_FOUND)
				.json(createResponse(false, null, "User not found"));
		}

		if (notifications)
			user.notifications = { ...user.notifications, ...notifications };
		if (privacy) user.privacy = { ...user.privacy, ...privacy };
		if (displayName !== undefined) user.name = displayName;
		if (email !== undefined) user.email = email;
		if (timeZone !== undefined) user.timeZone = timeZone;

		await user.save();

		res.json(
			createResponse(
				true,
				{
					displayName: user.name,
					email: user.email,
					timeZone: user.timeZone,
					notifications: user.notifications,
					privacy: user.privacy,
				},
				"Settings updated successfully"
			)
		);
	} catch (error) {
		console.error("Error updating settings:", error);
		res
			.status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
			.json(createResponse(false, null, "Failed to update settings"));
	}
});

module.exports = router;
