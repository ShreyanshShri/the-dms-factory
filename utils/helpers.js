const moment = require("moment-timezone");
const { v4: uuidv4 } = require("uuid");
const { WORKING_HOURS, RATE_LIMITS } = require("./my_constants");

/**
 * Generate a unique widget ID
 * @param {string} displayName - Display name for the account
 * @returns {string} Generated widget ID
 */
const generateWidgetId = (displayName) => {
	const cleanName = displayName.replace(/\s+/g, "_").toLowerCase();
	const uniqueId = uuidv4().split("-")[0];
	return `${cleanName}_${uniqueId}`;
};

/**
 * Check if current time is within working hours
 * @param {Object} workingHours - Object with start and end hours
 * @returns {boolean} Whether current time is within working hours
 */
const isWithinWorkingHours = (workingHours = { start: 0, end: 24 }) => {
	const now = moment().tz(WORKING_HOURS.TIMEZONE);
	const currentHour = now.hour();
	return currentHour >= workingHours.start && currentHour < workingHours.end;
};

/**
 * Get working hours progress information
 * @returns {Object} Progress information
 */
const getWorkingHoursProgress = () => {
	const now = moment().tz(WORKING_HOURS.TIMEZONE);
	const currentHour = now.hour();
	const currentMinute = now.minute();

	const totalMinutesInWorkDay = 24 * 60; // Assuming 24-hour work day
	const minutesElapsed = currentHour * 60 + currentMinute;

	const progressPercentage = Math.floor(
		(minutesElapsed / totalMinutesInWorkDay) * 100
	);
	const currentTimeET = now.format("HH:mm");
	const dateFormatted = now.format("DD-MM-YYYY");

	return {
		progressThroughWorkDay: `${progressPercentage}%`,
		currentTimeET,
		dateFormatted,
	};
};

/**
 * Calculate messages allowed by current time based on daily limit
 * @param {number} maxDaily - Maximum daily messages
 * @returns {number} Messages allowed by now
 */
const calculateAllowedByNow = (maxDaily) => {
	const now = moment().tz(WORKING_HOURS.TIMEZONE);
	const startOfDay = moment().tz(WORKING_HOURS.TIMEZONE).startOf("day");
	const endOfDay = moment().tz(WORKING_HOURS.TIMEZONE).endOf("day");

	const totalMinutesInDay = endOfDay.diff(startOfDay, "minutes");
	const minutesElapsed = now.diff(startOfDay, "minutes");

	const progressThroughDay = minutesElapsed / totalMinutesInDay;
	return Math.floor(maxDaily * progressThroughDay);
};

/**
 * Generate random delay between min and max values
 * @param {number} min - Minimum delay in milliseconds
 * @param {number} max - Maximum delay in milliseconds
 * @returns {number} Random delay
 */
const getRandomDelay = (
	min = RATE_LIMITS.MIN_DELAY,
	max = RATE_LIMITS.MAX_DELAY
) => {
	return Math.floor(Math.random() * (max - min + 1)) + min;
};

/**
 * Sleep for specified duration
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise} Promise that resolves after delay
 */
const sleep = (ms) => {
	return new Promise((resolve) => setTimeout(resolve, ms));
};

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} Whether email is valid
 */
const isValidEmail = (email) => {
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	return emailRegex.test(email);
};

/**
 * Sanitize username by removing @ and trimming
 * @param {string} username - Username to sanitize
 * @returns {string} Sanitized username
 */
const sanitizeUsername = (username) => {
	return username.replace("@", "").trim();
};

/**
 * Format timestamp for logging
 * @param {Date|number} timestamp - Timestamp to format
 * @returns {string} Formatted timestamp
 */
const formatTimestamp = (timestamp) => {
	return moment(timestamp)
		.tz(WORKING_HOURS.TIMEZONE)
		.format("YYYY-MM-DD HH:mm:ss z");
};

/**
 * Create standardized API response
 * @param {boolean} success - Whether the operation was successful
 * @param {*} data - Response data
 * @param {string} message - Response message
 * @param {string} error - Error message if any
 * @returns {Object} Standardized response object
 */
const createResponse = (success, data = null, message = null, error = null) => {
	const response = { success };

	if (data !== null) response.data = data;
	if (message) response.message = message;
	if (error) response.error = error;

	return response;
};

/**
 * Validate required fields in request
 * @param {Object} data - Data to validate
 * @param {Array} requiredFields - Array of required field names
 * @returns {Array} Array of missing fields
 */
const validateRequiredFields = (data, requiredFields) => {
	const missingFields = [];

	requiredFields.forEach((field) => {
		if (
			!data[field] ||
			(typeof data[field] === "string" && data[field].trim() === "")
		) {
			missingFields.push(field);
		}
	});

	return missingFields;
};

/**
 * Parse Firebase timestamp to JavaScript Date
 * @param {Object} firebaseTimestamp - Firebase timestamp object
 * @returns {Date} JavaScript Date object
 */
const parseFirebaseTimestamp = (firebaseTimestamp) => {
	if (!firebaseTimestamp || !firebaseTimestamp._seconds) {
		return new Date();
	}

	return new Date(
		firebaseTimestamp._seconds * 1000 + firebaseTimestamp._nanoseconds / 1000000
	);
};

/**
 * Convert JavaScript Date to Firebase timestamp format
 * @param {Date} date - JavaScript Date object
 * @returns {Object} Firebase timestamp format
 */
const toFirebaseTimestamp = (date = new Date()) => {
	const seconds = Math.floor(date.getTime() / 1000);
	const nanoseconds = (date.getTime() % 1000) * 1000000;

	return {
		_seconds: seconds,
		_nanoseconds: nanoseconds,
	};
};

/**
 * Calculate success rate percentage
 * @param {number} successful - Number of successful operations
 * @param {number} total - Total number of operations
 * @returns {string} Success rate as percentage string
 */
const calculateSuccessRate = (successful, total) => {
	if (total === 0) return "0.00";
	return ((successful / total) * 100).toFixed(2);
};

/**
 * Retry async operation with exponential backoff
 * @param {Function} operation - Async operation to retry
 * @param {number} maxRetries - Maximum number of retries
 * @param {number} baseDelay - Base delay in milliseconds
 * @returns {Promise} Promise that resolves with operation result
 */
const retryWithBackoff = async (
	operation,
	maxRetries = RATE_LIMITS.RETRY_ATTEMPTS,
	baseDelay = 1000
) => {
	let lastError;

	for (let i = 0; i <= maxRetries; i++) {
		try {
			return await operation();
		} catch (error) {
			lastError = error;

			if (i === maxRetries) break;

			const delay = baseDelay * Math.pow(2, i);
			await sleep(delay);
		}
	}

	throw lastError;
};

module.exports = {
	generateWidgetId,
	isWithinWorkingHours,
	getWorkingHoursProgress,
	calculateAllowedByNow,
	getRandomDelay,
	sleep,
	isValidEmail,
	sanitizeUsername,
	formatTimestamp,
	createResponse,
	validateRequiredFields,
	parseFirebaseTimestamp,
	toFirebaseTimestamp,
	calculateSuccessRate,
	retryWithBackoff,
};
