const jwt = require("jsonwebtoken");
const User = require("../models/User"); // Mongoose user model

const JWT_SECRET = process.env.JWT_SECRET || "your-super-secret-jwt-key";

const authenticateToken = async (req, res, next) => {
	try {
		const token = req.cookies.jwt_token;
		if (!token) {
			return res
				.status(401)
				.json({ success: false, message: "No token provided" });
		}

		const decoded = jwt.verify(token, JWT_SECRET);

		// Find user by uid
		const user = await User.findOne({ uid: decoded.uid }).lean();
		if (!user) {
			return res
				.status(401)
				.json({ success: false, message: "User not found" });
		}

		// Attach user and subscription info (nested subscription object)
		req.user = user;
		req.subscription = user.subscription || {};

		next();
	} catch (error) {
		console.error("Authentication error:", error);
		return res.status(401).json({ success: false, message: "Invalid token" });
	}
};

const generateToken = (uid) => {
	return jwt.sign({ uid, iat: Math.floor(Date.now() / 1000) }, JWT_SECRET);
};

module.exports = { authenticateToken, generateToken };

// const jwt = require("jsonwebtoken");
// const { db } = require("../config/firebase");

// const JWT_SECRET = process.env.JWT_SECRET || "your-super-secret-jwt-key";

// const authenticateToken = async (req, res, next) => {
// 	try {
// 		const token = req.cookies.jwt_token;

// 		if (!token) {
// 			return res
// 				.status(401)
// 				.json({ success: false, message: "No token provided" });
// 		}

// 		// Verify JWT
// 		const decoded = jwt.verify(token, JWT_SECRET);

// 		// Get user from Firestore
// 		const userDoc = await db.collection("users").doc(decoded.uid).get();

// 		if (!userDoc.exists) {
// 			return res
// 				.status(401)
// 				.json({ success: false, message: "User not found" });
// 		}

// 		req.user = { uid: decoded.uid, ...userDoc.data() };
// 		next();
// 	} catch (error) {
// 		console.error("Authentication error:", error);
// 		return res.status(401).json({ success: false, message: "Invalid token" });
// 	}
// };

// const generateToken = (uid) => {
// 	return jwt.sign({ uid, iat: Math.floor(Date.now() / 1000) }, JWT_SECRET);
// };

// module.exports = { authenticateToken, generateToken };
