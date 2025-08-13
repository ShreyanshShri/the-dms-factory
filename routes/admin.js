// routes/admin.js
const express = require("express");
const router = express.Router();
const { db } = require("../config/firebase");
const { authenticateAdmin } = require("../middleware/adminAuth");
const User = require("../models/User");
const { createResponse } = require("../utils/helpers");
const { HTTP_STATUS } = require("../utils/my_constants");

// GET /api/v1/admin/pending-users - Get all pending subscription requests
router.get("/pending-users", authenticateAdmin, async (req, res) => {
	try {
		const pendingUsersSnapshot = await db
			.collection("users")
			.where("subscriptionStatus", "==", "pending")
			.get();

		const pendingUsers = pendingUsersSnapshot.docs.map((doc) => ({
			uid: doc.id,
			...doc.data(),
		}));

		// Remove sensitive data before sending
		const sanitizedUsers = pendingUsers.map((user) => {
			delete user.password;
			return user;
		});

		res.json(
			createResponse(
				true,
				sanitizedUsers,
				"Pending users retrieved successfully"
			)
		);
	} catch (error) {
		console.error("Error fetching pending users:", error);
		res
			.status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
			.json(createResponse(false, null, "Failed to fetch pending users"));
	}
});

// POST /api/v1/admin/approve-user/:uid - Approve a user's subscription
router.post("/approve-user/:uid", authenticateAdmin, async (req, res) => {
	try {
		const { uid } = req.params;

		if (!uid) {
			return res
				.status(HTTP_STATUS.BAD_REQUEST)
				.json(createResponse(false, null, "User ID is required"));
		}

		const user = await User.findById(uid);

		if (!user) {
			return res
				.status(HTTP_STATUS.NOT_FOUND)
				.json(createResponse(false, null, "User not found"));
		}

		if (user.subscriptionStatus === "approved") {
			return res
				.status(HTTP_STATUS.BAD_REQUEST)
				.json(createResponse(false, null, "User already approved"));
		}

		// await user.approveSubscription();
		await db.collection("users").doc(uid).update({
			subscriptionStatus: "approved",
			isSubscribed: true,
		});

		const { password: _, ...userResponse } = user.toJSON();

		res.json(
			createResponse(
				true,
				userResponse,
				"User subscription approved successfully"
			)
		);
	} catch (error) {
		console.error("Error approving user:", error);
		res
			.status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
			.json(createResponse(false, null, "Failed to approve user"));
	}
});

// GET /api/v1/admin/users - Get all users (with pagination)
router.get("/users", authenticateAdmin, async (req, res) => {
	try {
		const { page = 1, limit = 10, status } = req.query;

		let query = db.collection("users");

		if (status) {
			query = query.where("subscriptionStatus", "==", status);
		}

		const snapshot = await query
			.limit(parseInt(limit))
			.offset((parseInt(page) - 1) * parseInt(limit))
			.get();

		const users = snapshot.docs.map((doc) => {
			const userData = { uid: doc.id, ...doc.data() };
			delete userData.password;
			return userData;
		});

		res.json(
			createResponse(
				true,
				{
					users,
					page: parseInt(page),
					limit: parseInt(limit),
					total: snapshot.size,
				},
				"Users retrieved successfully"
			)
		);
	} catch (error) {
		console.error("Error fetching users:", error);
		res
			.status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
			.json(createResponse(false, null, "Failed to fetch users"));
	}
});

module.exports = router;
