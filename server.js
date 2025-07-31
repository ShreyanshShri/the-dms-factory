const express = require("express");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const { setupCors } = require("./middleware/cors");
const campaignRoutes = require("./routes/campaign");
const authRoutes = require("./routes/auth");

const app = express();

// Security middleware
app.use(helmet());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// CORS setup
setupCors(app);

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

// Health check
app.get("/health", (req, res) => {
	res.status(200).json({ status: "OK", timestamp: new Date().toISOString() });
});

app.get("/", (req, res) => {
	res.status(200).json({ status: "OK", timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
	console.error(err.stack);
	res.status(500).json({
		success: false,
		message: "Internal server error",
		error: process.env.NODE_ENV === "development" ? err.message : undefined,
	});
});

// 404 handler
app.use("*", (req, res) => {
	res.status(404).json({ success: false, message: "Route not found" });
});

// Only start server if not in test environment
let server;
const PORT = process.env.PORT || 3000;
if (process.env.NODE_ENV !== "test") {
	server = app.listen(PORT, "0.0.0.0", () => {
		console.log(`ColdDMs Pro Backend running on port ${PORT}`);
	});
}

// Export both app and server for testing
module.exports = { app, server };
