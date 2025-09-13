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

// // routes/admin.js
// const express = require("express");
// const router = express.Router();
// const { db } = require("../config/firebase");
// const { authenticateAdmin } = require("../middleware/adminAuth");
// const User = require("../models/User");
// const { createResponse } = require("../utils/helpers");
// const { HTTP_STATUS } = require("../utils/my_constants");

// // GET /api/v1/admin/pending-users - Get all pending subscription requests
// router.get("/pending-users", authenticateAdmin, async (req, res) => {
// 	try {
// 		const pendingUsersSnapshot = await db
// 			.collection("users")
// 			.where("subscriptionStatus", "==", "pending")
// 			.get();

// 		const pendingUsers = pendingUsersSnapshot.docs.map((doc) => ({
// 			uid: doc.id,
// 			...doc.data(),
// 		}));

// 		// Remove sensitive data before sending
// 		const sanitizedUsers = pendingUsers.map((user) => {
// 			delete user.password;
// 			return user;
// 		});

// 		res.json(
// 			createResponse(
// 				true,
// 				sanitizedUsers,
// 				"Pending users retrieved successfully"
// 			)
// 		);
// 	} catch (error) {
// 		console.error("Error fetching pending users:", error);
// 		res
// 			.status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
// 			.json(createResponse(false, null, "Failed to fetch pending users"));
// 	}
// });

// // POST /api/v1/admin/approve-user/:uid - Approve a user's subscription
// router.post("/approve-user/:uid", authenticateAdmin, async (req, res) => {
// 	try {
// 		const { uid } = req.params;

// 		if (!uid) {
// 			return res
// 				.status(HTTP_STATUS.BAD_REQUEST)
// 				.json(createResponse(false, null, "User ID is required"));
// 		}

// 		const user = await User.findById(uid);

// 		if (!user) {
// 			return res
// 				.status(HTTP_STATUS.NOT_FOUND)
// 				.json(createResponse(false, null, "User not found"));
// 		}

// 		if (user.subscriptionStatus === "approved") {
// 			return res
// 				.status(HTTP_STATUS.BAD_REQUEST)
// 				.json(createResponse(false, null, "User already approved"));
// 		}

// 		// await user.approveSubscription();
// 		await db.collection("users").doc(uid).update({
// 			subscriptionStatus: "approved",
// 			isSubscribed: true,
// 		});

// 		const { password: _, ...userResponse } = user.toJSON();

// 		res.json(
// 			createResponse(
// 				true,
// 				userResponse,
// 				"User subscription approved successfully"
// 			)
// 		);
// 	} catch (error) {
// 		console.error("Error approving user:", error);
// 		res
// 			.status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
// 			.json(createResponse(false, null, "Failed to approve user"));
// 	}
// });

// // GET /api/v1/admin/users - Get all users (with pagination)
// router.get("/users", authenticateAdmin, async (req, res) => {
// 	try {
// 		const { page = 1, limit = 10, status } = req.query;

// 		let query = db.collection("users");

// 		if (status) {
// 			query = query.where("subscriptionStatus", "==", status);
// 		}

// 		const snapshot = await query
// 			.limit(parseInt(limit))
// 			.offset((parseInt(page) - 1) * parseInt(limit))
// 			.get();

// 		const users = snapshot.docs.map((doc) => {
// 			const userData = { uid: doc.id, ...doc.data() };
// 			delete userData.password;
// 			return userData;
// 		});

// 		res.json(
// 			createResponse(
// 				true,
// 				{
// 					users,
// 					page: parseInt(page),
// 					limit: parseInt(limit),
// 					total: snapshot.size,
// 				},
// 				"Users retrieved successfully"
// 			)
// 		);
// 	} catch (error) {
// 		console.error("Error fetching users:", error);
// 		res
// 			.status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
// 			.json(createResponse(false, null, "Failed to fetch users"));
// 	}
// });

// module.exports = router;
