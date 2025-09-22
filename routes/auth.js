const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const { generateToken } = require("../middleware/auth");
const User = require("../models/User");
const { createResponse, validateRequiredFields } = require("../utils/helpers");
const { ERROR_MESSAGES } = require("../utils/my_constants");
const { authenticateToken } = require("../middleware/auth");
const { optionalSubscription } = require("../middleware/subscribed");

// Helper to convert JS Date or timestamp (ms) into Firestore Timestamp shape
function toFirestoreTimestamp(dateInput) {
	const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
	const seconds = Math.floor(date.getTime() / 1000);
	const nanoseconds = (date.getTime() % 1000) * 1e6;
	return { _seconds: seconds, _nanoseconds: nanoseconds };
}

router.post("/register", async (req, res) => {
	try {
		const { name, email, password } = req.body;

		// Basic validation
		if (!name || !email || !password) {
			return res.status(400).json({
				success: false,
				error: "Name, email, and password are required",
			});
		}

		if (password.length < 6) {
			return res.status(400).json({
				success: false,
				error: "Password must be at least 6 characters long",
			});
		}

		// Check if user exists
		const existingUser = await User.findOne({
			email: email.toLowerCase().trim(),
		});

		if (existingUser) {
			return res.status(400).json({
				success: false,
				error: "User with this email already exists",
			});
		}

		const hashedPassword = await bcrypt.hash(password, 12);
		const now = new Date();

		const user = new User({
			uid: generateUID(), // your UID function
			name: name.trim(),
			email: email.toLowerCase().trim(),
			password: hashedPassword,
			role: "user",

			// Initialize subscription with defaults from schema
			subscription: {
				status: "pending", // Default from enum
				lastEvent: "user_registered",
				valid: false, // Default from schema
				cancelAtPeriodEnd: false, // Default from schema
				metadata: {}, // Default empty object
				createdAt: now,
				updatedAt: now,
			},

			// Initialize billing history as empty array
			billingHistory: [],

			// Default timezone
			timeZone: "UTC-5 (Eastern Time)",

			// Notification preferences (schema defaults will apply)
			notifications: {
				email: true,
				push: true,
				sms: false,
				errors: true,
				limits: true,
				completion: true,
			},

			// Privacy settings (schema defaults will apply)
			privacy: {
				dataSharing: false,
				analytics: true,
				marketing: false,
			},
		});

		await user.save();

		// Generate JWT token
		const token = generateToken(user.uid);
		res.cookie("jwt_token", token, {
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
			maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
		});

		// Return user data without password
		const userObj = user.toObject();
		delete userObj.password;

		console.log(`✅ New user registered: ${email} with UID: ${user.uid}`);

		res.status(201).json({
			success: true,
			data: {
				uid: user.uid,
				...userObj,
			},
			message: "User created successfully",
		});
	} catch (error) {
		console.error("❌ Error creating user:", error);

		// Handle duplicate key errors
		if (error.code === 11000) {
			const field = Object.keys(error.keyPattern)[0];
			return res.status(400).json({
				success: false,
				error: `${field} already exists`,
			});
		}

		// Handle validation errors
		if (error.name === "ValidationError") {
			const validationErrors = Object.values(error.errors).map(
				(err) => err.message
			);
			return res.status(400).json({
				success: false,
				error: "Validation failed",
				details: validationErrors,
			});
		}

		res.status(500).json({
			success: false,
			error: "Internal server error",
		});
	}
});

// POST /api/v1/auth/login

router.post("/login", async (req, res) => {
	try {
		const { email, password } = req.body;

		// Validate required fields
		const missingFields = validateRequiredFields(req.body, [
			"email",
			"password",
		]);
		if (missingFields.length > 0) {
			return res
				.status(400)
				.json(
					createResponse(
						false,
						null,
						`Missing required fields: ${missingFields.join(", ")}`
					)
				);
		}

		// Find user by email
		const user = await User.findOne({
			email: email.toLowerCase().trim(),
		});

		if (!user || !user.password) {
			return res
				.status(401)
				.json(createResponse(false, null, "Invalid email or password"));
		}

		// Verify password
		const isPasswordValid = await bcrypt.compare(password, user.password);
		if (!isPasswordValid) {
			return res
				.status(401)
				.json(createResponse(false, null, "Invalid email or password"));
		}

		// Generate JWT token
		const token = generateToken(user.uid);
		res.cookie("jwt_token", token, {
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
			maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
		});

		// Update last login time (using regular Date since timestamps: true handles updatedAt)
		user.lastLogin = new Date();
		// updatedAt will be automatically updated by timestamps: true

		await user.save();

		// Return user data without password
		const userResponse = user.toObject();
		delete userResponse.password;

		console.log(`✅ User logged in: ${email} (${user.uid})`);

		res.json(
			createResponse(
				true,
				{ uid: user.uid, ...userResponse },
				"Login successful"
			)
		);
	} catch (error) {
		console.error("❌ Error during login:", error);

		// Handle specific error types
		if (error.name === "ValidationError") {
			const validationErrors = Object.values(error.errors).map(
				(err) => err.message
			);
			return res
				.status(400)
				.json(
					createResponse(false, null, "Validation failed", validationErrors)
				);
		}

		res
			.status(500)
			.json(createResponse(false, null, ERROR_MESSAGES.INTERNAL_ERROR));
	}
});

// POST /api/v1/auth/logout
router.post("/logout", (req, res) => {
	res.clearCookie("jwt_token");
	res.json(createResponse(true, null, "Logged out successfully"));
});

router.get("/me", authenticateToken, optionalSubscription, async (req, res) => {
	try {
		const user = await User.findOne({ uid: req.user.uid }).lean();

		if (!user) {
			return res
				.status(401)
				.json({ success: false, message: "User not found" });
		}

		const { password, ...userData } = user;

		res.json({
			success: true,
			data: {
				uid: user.uid,
				...userData,
			},
			message: "User verified successfully",
		});
	} catch (error) {
		console.error("Error verifying user:", error);
		res.status(401).json({ success: false, message: "Invalid token" });
	}
});

function generateUID() {
	// Optionally use uuid or Mongo objectId string
	return require("uuid").v4();
}

module.exports = router;
