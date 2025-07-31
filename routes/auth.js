const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const { generateToken } = require("../middleware/auth");
const { db } = require("../config/firebase");
const User = require("../models/User");
const {
	createResponse,
	validateRequiredFields,
	isValidEmail,
} = require("../utils/helpers");
const {
	HTTP_STATUS,
	ERROR_MESSAGES,
	SUCCESS_MESSAGES,
} = require("../utils/my_constants");

// POST /api/v1/auth/register - Create new user
router.post("/register", async (req, res) => {
	try {
		const { name, email, password } = req.body;

		// Validate required fields
		const missingFields = validateRequiredFields(req.body, [
			"name",
			"email",
			"password",
		]);
		if (missingFields.length > 0) {
			return res
				.status(HTTP_STATUS.BAD_REQUEST)
				.json(
					createResponse(
						false,
						null,
						`Missing required fields: ${missingFields.join(", ")}`
					)
				);
		}

		// Validate email format
		if (!isValidEmail(email)) {
			return res
				.status(HTTP_STATUS.BAD_REQUEST)
				.json(createResponse(false, null, "Invalid email format"));
		}

		// Validate password length
		if (password.length < 6) {
			return res
				.status(HTTP_STATUS.BAD_REQUEST)
				.json(
					createResponse(
						false,
						null,
						"Password must be at least 6 characters long"
					)
				);
		}

		// Check if user already exists
		const existingUserQuery = await db
			.collection("users")
			.where("email", "==", email.toLowerCase())
			.get();

		if (!existingUserQuery.empty) {
			return res
				.status(HTTP_STATUS.BAD_REQUEST)
				.json(
					createResponse(false, null, "User with this email already exists")
				);
		}

		// Hash password
		const saltRounds = 12;
		const hashedPassword = await bcrypt.hash(password, saltRounds);

		// Create user document
		const userRef = db.collection("users").doc();
		const uid = userRef.id;

		const userData = {
			name: name.trim(),
			email: email.toLowerCase().trim(),
			password: hashedPassword,
			isSubscribed: true,
			createdAt: Date.now(),
			updatedAt: Date.now(),
		};

		await userRef.set(userData);

		// Generate JWT token
		const token = generateToken(uid);

		// Set JWT cookie
		res.cookie("jwt_token", token, {
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			sameSite: "None",
			maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
		});

		// Return user data (without password)
		const { password: _, ...userResponse } = userData;

		res.status(HTTP_STATUS.CREATED).json(
			createResponse(
				true,
				{
					uid,
					...userResponse,
				},
				"User created successfully"
			)
		);
	} catch (error) {
		console.error("Error creating user:", error);
		res
			.status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
			.json(createResponse(false, null, ERROR_MESSAGES.INTERNAL_ERROR));
	}
});

// POST /api/v1/auth/login - User login
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
				.status(HTTP_STATUS.BAD_REQUEST)
				.json(
					createResponse(
						false,
						null,
						`Missing required fields: ${missingFields.join(", ")}`
					)
				);
		}

		// Find user by email
		const userQuery = await db
			.collection("users")
			.where("email", "==", email.toLowerCase().trim())
			.get();

		if (userQuery.empty) {
			return res
				.status(HTTP_STATUS.UNAUTHORIZED)
				.json(createResponse(false, null, "Invalid email or password"));
		}

		const userDoc = userQuery.docs[0];
		const userData = userDoc.data();
		const uid = userDoc.id;

		// Verify password
		const isPasswordValid = await bcrypt.compare(password, userData.password);
		if (!isPasswordValid) {
			return res
				.status(HTTP_STATUS.UNAUTHORIZED)
				.json(createResponse(false, null, "Invalid email or password"));
		}

		// Generate JWT token
		const token = generateToken(uid);

		// Set JWT cookie
		res.cookie("jwt_token", token, {
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			sameSite: "None",
			maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
		});

		// Update last login
		await db.collection("users").doc(uid).update({
			lastLogin: Date.now(),
			updatedAt: Date.now(),
		});

		// Return user data (without password)
		const { password: _, ...userResponse } = userData;

		res.json(
			createResponse(
				true,
				{
					uid,
					...userResponse,
				},
				"Login successful"
			)
		);
	} catch (error) {
		console.error("Error during login:", error);
		res
			.status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
			.json(createResponse(false, null, ERROR_MESSAGES.INTERNAL_ERROR));
	}
});

// POST /api/v1/auth/logout - User logout
router.post("/logout", (req, res) => {
	res.clearCookie("jwt_token");
	res.json(createResponse(true, null, "Logged out successfully"));
});

module.exports = router;
