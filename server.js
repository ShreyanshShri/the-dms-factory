require("dotenv").config();

const express = require("express");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const cookieParser = require("cookie-parser");
const path = require("path");
const { setupCors } = require("./middleware/cors");
const campaignRoutes = require("./routes/campaign");
const authRoutes = require("./routes/auth");
const accountRoutes = require("./routes/account");
const adminRoutes = require("./routes/admin");
const webhookRoutes = require("./routes/webhook");
const chatRoutes = require("./routes/chat");
const userRoutes = require("./routes/user");
const crmRoutes = require("./routes/crm");
const dashboardRoutes = require("./routes/dashboard");
const billingRoutes = require("./routes/billing");
const User = require("./models/User");
const { authenticateToken } = require("./middleware/auth");
const { createProxyMiddleware } = require("http-proxy-middleware");
const connectDB = require("./config/dbConnect");

const { connect } = require("http2");

const app = express();

connectDB();

// CORS setup
setupCors(app);

// Security middleware
app.set("trust proxy", 1);
app.use(
	helmet.contentSecurityPolicy({
		directives: {
			defaultSrc: ["'self'"],
			scriptSrc: ["'self'", "https://js.whop.com", "https://whop.com"],
			frameSrc: ["'self'", "https://js.whop.com", "https://whop.com"], // Allow iframe from Whop
			connectSrc: ["'self'", "https://js.whop.com", "https://whop.com"],
			imgSrc: ["'self'", "data:", "https://js.whop.com", "https://whop.com"],
		},
	})
);

app.use("/api/v1/webhooks", webhookRoutes);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

app.use(cookieParser());

// Rate limiting
const limiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	max: 1000,
	message: "Too many requests from this IP",
});
app.use("/api/", limiter);

// Routes
app.use("/api/v1/campaign", campaignRoutes);
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/account", accountRoutes);
app.use("/api/v1/admin", adminRoutes);
app.use("/api/v1/chats", chatRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/crm", crmRoutes);
app.use("/api/v1/dashboard", dashboardRoutes);
app.use("/api/v1/billing", billingRoutes);

// Health check
app.get("/health", (req, res) => {
	res.status(200).json({ status: "OK", timestamp: new Date().toISOString() });
});

// In your auth routes - with auth middleware applied
app.get("/api/v1/auth/me", authenticateToken, async (req, res) => {
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

if (process.env.NODE_ENV !== "production") {
	app.use(
		/^\/(?!api\/).*$/, // This regex excludes paths that start with /api/
		createProxyMiddleware({
			target: "http://localhost:3000",
			changeOrigin: true,
		})
	);
}

// Error handling middleware
app.use((err, req, res, next) => {
	console.error(err.stack);
	res.status(500).json({
		success: false,
		message: "Internal server error",
		error: process.env.NODE_ENV === "development" ? err.message : undefined,
	});
});

// Serve frontend
app.use(express.static(path.join(__dirname, "./client/dist")));

app.get("*", (req, res) => {
	res.sendFile(path.join(__dirname, "./client/dist/index.html"));
});

// Only start server if not in test environment
let server;
const PORT = process.env.PORT || 5000;
if (process.env.NODE_ENV !== "test") {
	server = app.listen(PORT, "0.0.0.0", () => {
		console.log(`ColdDMs Pro Backend running on port ${PORT}`);
	});
}

// Export both app and server for testing
module.exports = { app, server };
