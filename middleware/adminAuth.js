const jwt = require("jsonwebtoken");
const User = require("../models/User");

const JWT_SECRET = process.env.JWT_SECRET || "your-super-secret-jwt-key";

const authenticateAdmin = async (req, res, next) => {
	try {
		const token = req.cookies.jwt_token;
		if (!token) {
			return res
				.status(401)
				.json({ success: false, message: "No token provided" });
		}

		const decoded = jwt.verify(token, JWT_SECRET);
		const user = await User.findOne({ uid: decoded.uid }).lean();

		if (!user) {
			return res
				.status(401)
				.json({ success: false, message: "User not found" });
		}

		if (user.role !== "admin") {
			return res.status(403).json({
				success: false,
				message: "Access denied. Admin role required.",
			});
		}

		req.user = user;
		req.subscription = user.subscription || {};

		next();
	} catch (error) {
		console.error("Admin authentication error:", error);
		return res.status(401).json({ success: false, message: "Invalid token" });
	}
};

module.exports = { authenticateAdmin };
