const express = require("express");
const { authenticateToken } = require("../middleware/auth");
const User = require("../models/User");
const { createResponse } = require("../utils/helpers");
const { HTTP_STATUS } = require("../utils/my_constants");

const router = express.Router();

router.use(authenticateToken);

router.get("/payment-status", async (req, res) => {
	res.status(200).json({
		success: true,
		subscriptionStatus: req.user.subscriptionStatus,
	});
});

// GET /api/v1/users/settings - Get user settings
router.get("/settings", async (req, res) => {
	try {
		const user = await User.findById(req.user.uid);

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

// PUT /api/v1/users/settings - Update user settings
router.put("/settings", async (req, res) => {
	try {
		const { notifications, privacy, displayName, email, timeZone } = req.body;

		const user = await User.findById(req.user.uid);

		if (!user) {
			return res
				.status(HTTP_STATUS.NOT_FOUND)
				.json(createResponse(false, null, "User not found"));
		}

		await user.updateSettings({
			notifications,
			privacy,
			displayName,
			email,
			timeZone,
		});

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
