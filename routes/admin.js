const express = require("express");
const router = express.Router();
const { authenticateAdmin } = require("../middleware/adminAuth");
const User = require("../models/User");

// GET /api/v1/admin/pending-users
router.get("/pending-users", authenticateAdmin, async (req, res) => {
	try {
		const pendingUsers = await User.find({
			"subscription.status": "pending",
		}).lean();

		const sanitizedUsers = pendingUsers.map(({ password, ...user }) => user);

		res.json({
			success: true,
			data: sanitizedUsers,
			message: "Pending users retrieved successfully",
		});
	} catch (error) {
		console.error("Error fetching pending users:", error);
		res
			.status(500)
			.json({ success: false, message: "Failed to fetch pending users" });
	}
});

// POST /api/v1/admin/approve-user/:uid
router.post("/approve-user/:uid", authenticateAdmin, async (req, res) => {
	try {
		const { uid } = req.params;
		if (!uid)
			return res
				.status(400)
				.json({ success: false, message: "User ID is required" });

		const user = await User.findOne({ uid });
		if (!user)
			return res
				.status(404)
				.json({ success: false, message: "User not found" });

		if (user.subscription?.status === "approved") {
			return res
				.status(400)
				.json({ success: false, message: "User already approved" });
		}

		user.subscription = {
			...user.subscription,
			status: "approved",
			updatedAt: Date.now(),
		};
		await user.save();

		const { password, ...userResponse } = user.toObject();
		res.json({
			success: true,
			data: userResponse,
			message: "User subscription approved successfully",
		});
	} catch (error) {
		console.error("Error approving user:", error);
		res.status(500).json({ success: false, message: "Failed to approve user" });
	}
});

// GET /api/v1/admin/users
router.get("/users", authenticateAdmin, async (req, res) => {
	try {
		const { page = 1, limit = 10, status } = req.query;
		const filter = {};
		if (status) filter["subscription.status"] = status;

		const skip = (page - 1) * limit;
		const users = await User.find(filter)
			.skip(skip)
			.limit(parseInt(limit))
			.lean();

		const sanitizedUsers = users.map(({ password, ...user }) => user);

		const total = await User.countDocuments(filter);

		res.json({
			success: true,
			data: sanitizedUsers,
			page: parseInt(page),
			limit: parseInt(limit),
			total,
			message: "Users retrieved successfully",
		});
	} catch (error) {
		console.error("Error fetching users:", error);
		res.status(500).json({ success: false, message: "Failed to fetch users" });
	}
});

module.exports = router;
