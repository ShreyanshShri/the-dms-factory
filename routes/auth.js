const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const { generateToken } = require("../middleware/auth");
const User = require("../models/User");
const {
	createResponse,
	validateRequiredFields,
	isValidEmail,
} = require("../utils/helpers");
const { HTTP_STATUS, ERROR_MESSAGES } = require("../utils/my_constants");

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

		// Your validations (assumed present)...

		// Check if user exists
		const existingUser = await User.findOne({
			email: email.toLowerCase().trim(),
		});
		if (existingUser) {
			return res
				.status(400)
				.json({ error: "User with this email already exists" });
		}

		const hashedPassword = await bcrypt.hash(password, 12);
		const nowTimestamp = toFirestoreTimestamp(Date.now());

		const user = new User({
			uid: generateUID(), // your uid function
			name: name.trim(),
			email: email.toLowerCase().trim(),
			password: hashedPassword, // << properly saved password here
			role: "user",
			subscription: {
				status: "pending",
				updatedAt: nowTimestamp, // firestoretimestamp format
			},
			notifications: {
				email: true,
				push: true,
				sms: false,
				errors: true,
				limits: true,
				completion: true,
			},
			privacy: {
				dataSharing: false,
				analytics: true,
				marketing: false,
			},
			createdAt: nowTimestamp, // firestore timestamp object
			updatedAt: nowTimestamp,
		});

		await user.save();

		const token = generateToken(user.uid);
		res.cookie("jwt_token", token, {
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
			maxAge: 7 * 24 * 60 * 60 * 1000,
		});

		const userObj = user.toObject();
		delete userObj.password;

		res.status(201).json({
			success: true,
			data: { uid: user.uid, ...userObj },
			message: "User created successfully",
		});
	} catch (error) {
		console.error("Error creating user:", error);
		res.status(500).json({ error: "Internal server error" });
	}
});

// POST /api/v1/auth/login

router.post("/login", async (req, res) => {
	try {
		const { email, password } = req.body;

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

		const user = await User.findOne({ email: email.toLowerCase().trim() });
		if (!user || !user.password) {
			return res
				.status(401)
				.json(createResponse(false, null, "Invalid email or password"));
		}

		const isPasswordValid = await bcrypt.compare(password, user.password);
		if (!isPasswordValid) {
			return res
				.status(401)
				.json(createResponse(false, null, "Invalid email or password"));
		}

		const token = generateToken(user.uid);
		res.cookie("jwt_token", token, {
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			sameSite: process.env.NODE_ENV === "production" ? "None" : "lax",
			maxAge: 7 * 24 * 60 * 60 * 1000,
		});

		// Set lastLogin and updatedAt as FirestoreTimestamp objects
		const nowTimestamp = toFirestoreTimestamp(new Date());

		user.lastLogin = nowTimestamp;
		user.updatedAt = nowTimestamp;

		await user.save();

		const userResponse = user.toObject();
		delete userResponse.password;

		res.json(
			createResponse(
				true,
				{ uid: user.uid, ...userResponse },
				"Login successful"
			)
		);
	} catch (error) {
		console.error("Error during login:", error);
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

function generateUID() {
	// Optionally use uuid or Mongo objectId string
	return require("uuid").v4();
}

module.exports = router;

// const express = require("express");
// const router = express.Router();
// const bcrypt = require("bcryptjs");
// const { generateToken } = require("../middleware/auth");
// const { db } = require("../config/firebase");
// const User = require("../models/User");
// const {
// 	createResponse,
// 	validateRequiredFields,
// 	isValidEmail,
// } = require("../utils/helpers");
// const {
// 	HTTP_STATUS,
// 	ERROR_MESSAGES,
// 	SUCCESS_MESSAGES,
// } = require("../utils/my_constants");

// // POST /api/v1/auth/register - Create new user
// router.post("/register", async (req, res) => {
// 	try {
// 		const { name, email, password } = req.body;

// 		// Validate required fields
// 		const missingFields = validateRequiredFields(req.body, [
// 			"name",
// 			"email",
// 			"password",
// 		]);
// 		if (missingFields.length > 0) {
// 			return res
// 				.status(HTTP_STATUS.BAD_REQUEST)
// 				.json(
// 					createResponse(
// 						false,
// 						null,
// 						`Missing required fields: ${missingFields.join(", ")}`
// 					)
// 				);
// 		}

// 		// Validate email format
// 		if (!isValidEmail(email)) {
// 			return res
// 				.status(HTTP_STATUS.BAD_REQUEST)
// 				.json(createResponse(false, null, "Invalid email format"));
// 		}

// 		// Validate password length
// 		if (password.length < 6) {
// 			return res
// 				.status(HTTP_STATUS.BAD_REQUEST)
// 				.json(
// 					createResponse(
// 						false,
// 						null,
// 						"Password must be at least 6 characters long"
// 					)
// 				);
// 		}

// 		// Check if user already exists
// 		const existingUserQuery = await db
// 			.collection("users")
// 			.where("email", "==", email.toLowerCase())
// 			.get();

// 		if (!existingUserQuery.empty) {
// 			return res
// 				.status(HTTP_STATUS.BAD_REQUEST)
// 				.json(
// 					createResponse(false, null, "User with this email already exists")
// 				);
// 		}

// 		// Hash password
// 		const saltRounds = 12;
// 		const hashedPassword = await bcrypt.hash(password, saltRounds);

// 		// Create user document
// 		const userRef = db.collection("users").doc();
// 		const uid = userRef.id;

// 		// In auth.js, update the userData object in the register route:

// 		const userData = {
// 			name: name.trim(),
// 			email: email.toLowerCase().trim(),
// 			password: hashedPassword,
// 			role: "user",
// 			isSubscribed: false,
// 			subscriptionStatus: "pending",
// 			notifications: {
// 				email: true,
// 				push: true,
// 				sms: false,
// 				errors: true,
// 				limits: true,
// 				completion: true,
// 			},
// 			privacy: {
// 				dataSharing: false,
// 				analytics: true,
// 				marketing: false,
// 			},
// 			createdAt: Date.now(),
// 			updatedAt: Date.now(),
// 		};

// 		await userRef.set(userData);

// 		// Generate JWT token
// 		const token = generateToken(uid);

// 		// Set JWT cookie
// 		res.cookie("jwt_token", token, {
// 			httpOnly: true,
// 			secure: process.env.NODE_ENV === "production",
// 			sameSite: process.env.NODE_ENV === "production" ? "None" : "lax",
// 			maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
// 		});

// 		// Return user data (without password)
// 		const { password: _, ...userResponse } = userData;

// 		res.status(HTTP_STATUS.CREATED).json(
// 			createResponse(
// 				true,
// 				{
// 					uid,
// 					...userResponse,
// 				},
// 				"User created successfully"
// 			)
// 		);
// 	} catch (error) {
// 		console.error("Error creating user:", error);
// 		res
// 			.status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
// 			.json(createResponse(false, null, ERROR_MESSAGES.INTERNAL_ERROR));
// 	}
// });

// // POST /api/v1/auth/login - User login
// router.post("/login", async (req, res) => {
// 	try {
// 		const { email, password } = req.body;

// 		// Validate required fields
// 		const missingFields = validateRequiredFields(req.body, [
// 			"email",
// 			"password",
// 		]);
// 		if (missingFields.length > 0) {
// 			return res
// 				.status(HTTP_STATUS.BAD_REQUEST)
// 				.json(
// 					createResponse(
// 						false,
// 						null,
// 						`Missing required fields: ${missingFields.join(", ")}`
// 					)
// 				);
// 		}

// 		// Find user by email
// 		const userQuery = await db
// 			.collection("users")
// 			.where("email", "==", email.toLowerCase().trim())
// 			.get();

// 		if (userQuery.empty) {
// 			return res
// 				.status(HTTP_STATUS.UNAUTHORIZED)
// 				.json(createResponse(false, null, "Invalid email or password"));
// 		}

// 		const userDoc = userQuery.docs[0];
// 		const userData = userDoc.data();
// 		const uid = userDoc.id;

// 		// Verify password
// 		const isPasswordValid = await bcrypt.compare(password, userData.password);
// 		if (!isPasswordValid) {
// 			return res
// 				.status(HTTP_STATUS.UNAUTHORIZED)
// 				.json(createResponse(false, null, "Invalid email or password"));
// 		}

// 		// Generate JWT token
// 		const token = generateToken(uid);

// 		// Set JWT cookie
// 		res.cookie("jwt_token", token, {
// 			httpOnly: true,
// 			secure: process.env.NODE_ENV === "production",
// 			sameSite: process.env.NODE_ENV === "production" ? "None" : "lax",
// 			maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
// 		});

// 		// Update last login
// 		await db.collection("users").doc(uid).update({
// 			lastLogin: Date.now(),
// 			updatedAt: Date.now(),
// 		});

// 		// Return user data (without password)
// 		const { password: _, ...userResponse } = userData;

// 		res.json(
// 			createResponse(
// 				true,
// 				{
// 					uid,
// 					...userResponse,
// 				},
// 				"Login successful"
// 			)
// 		);
// 	} catch (error) {
// 		console.error("Error during login:", error);
// 		res
// 			.status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
// 			.json(createResponse(false, null, ERROR_MESSAGES.INTERNAL_ERROR));
// 	}
// });

// // POST /api/v1/auth/logout - User logout
// router.post("/logout", (req, res) => {
// 	res.clearCookie("jwt_token");
// 	res.json(createResponse(true, null, "Logged out successfully"));
// });

// module.exports = router;
