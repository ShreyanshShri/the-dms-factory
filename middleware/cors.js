const cors = require("cors");

const setupCors = (app) => {
	const allowedOrigins =
		process.env.NODE_ENV === "production"
			? [
					process.env.EXTENSION_URL ||
						"chrome-extension://onoibopfcnnjlfiofjbpcjbmfeioaagm",
					"chrome-extension://onoibopfcnnjlfiofjbpcjbmfeioaagm",
					"https://app.colddmspro.com",
					"https://colddmspro.com",
					"https://running.colddmspro.com",
					"https://the-dms-factory.onrender.com",
			  ]
			: [
					process.env.EXTENSION_URL ||
						"chrome-extension://onoibopfcnnjlfiofjbpcjbmfeioaagm",
					"chrome-extension://onoibopfcnnjlfiofjbpcjbmfeioaagm",
					"https://app.colddmspro.com",
					"https://colddmspro.com",
					"https://running.colddmspro.com",
					"https://the-dms-factory.onrender.com",
					"http://localhost:3000",
					"http://localhost:5000", // for testing
			  ];

	const corsOptions = {
		origin: function (origin, callback) {
			// console.log("CORS check for origin:", origin);
			if (!origin || allowedOrigins.includes(origin)) {
				callback(null, true);
			} else {
				console.log("❌ CORS blocked:", origin);
				callback(new Error("Not allowed by CORS"));
			}
		},
		credentials: true,
		methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
		allowedHeaders: ["Content-Type", "Authorization"],
		exposedHeaders: ["Set-Cookie"],
	};

	app.use(cors(corsOptions));
};

module.exports = { setupCors };
