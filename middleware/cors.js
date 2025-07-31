const cors = require("cors");

const setupCors = (app) => {
	const allowedOrigins = [
		// "chrome-extension://jljjfepaodplbddocioanpaejljnacco",
		// "chrome-extension://plfedpbcigbeimikfacphiajepnclkph",
		process.env.EXTENSION_KEY ||
			"chrome-extension://onoibopfcnnjlfiofjbpcjbmfeioaagm",
		"chrome-extension://onoibopfcnnjlfiofjbpcjbmfeioaagm",
		"https://app.colddmspro.com",
		"https://colddmspro.com",
		"https://running.colddmspro.com",
	];

	const corsOptions = {
		origin: (origin, callback) => {
			// Allow requests with no origin (Postman, curl)
			if (!origin || allowedOrigins.includes(origin)) {
				callback(null, true);
			} else {
				callback(new Error("Not allowed by CORS"));
			}
		},
		credentials: true,
		methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
		allowedHeaders: ["Content-Type", "Authorization", "Cookie"],
		exposedHeaders: ["Set-Cookie"],
	};

	app.use(cors(corsOptions));
	app.options("*", cors(corsOptions));
};

module.exports = { setupCors };
