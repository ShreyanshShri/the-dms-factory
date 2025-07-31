module.exports = {
	testEnvironment: "node",
	setupFilesAfterEnv: ["<rootDir>/test/setup.js"],
	testMatch: ["**/test/**/*.test.js"],
	collectCoverageFrom: [
		"routes/**/*.js",
		"services/**/*.js",
		"models/**/*.js",
		"middleware/**/*.js",
		"!**/node_modules/**",
	],
	coverageThreshold: {
		global: {
			branches: 80,
			functions: 80,
			lines: 80,
			statements: 80,
		},
	},
};
