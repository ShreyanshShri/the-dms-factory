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
					"https://thebuildfluence.com",
					"http://localhost:5000", // backend
					"file://", // Electron file protocol
					"app://./index.html", // Electron app protocol
					null, // Electron requests without origin
			  ]
			: [
					process.env.EXTENSION_URL ||
						"chrome-extension://onoibopfcnnjlfiofjbpcjbmfeioaagm",
					"chrome-extension://onoibopfcnnjlfiofjbpcjbmfeioaagm",
					"https://app.colddmspro.com",
					"https://colddmspro.com",
					"https://running.colddmspro.com",
					"https://the-dms-factory.onrender.com",
					"https://thebuildfluence.com",
					"http://localhost:5173", // Vite dev frontend
					"http://localhost:5000", // backend
					"http://localhost:3000", // backend
					"file://", // Electron file protocol
					"app://./index.html", // Electron app protocol
					null, // Electron requests without origin
					"https://6ff9140531a7.ngrok-free.app",
			  ];

	const corsOptions = {
		origin: function (origin, callback) {
			if (!origin || origin === "null" || allowedOrigins.includes(origin)) {
				callback(null, true);
			} else {
				console.error("❌ Blocked by CORS:", origin);
				callback(new Error("Not allowed by CORS"));
			}
		},
		credentials: true,
		methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
		allowedHeaders: ["Content-Type", "Authorization"],
	};

	app.use(cors(corsOptions));
	app.options("*", cors(corsOptions)); // Handle preflight
};

module.exports = { setupCors };
