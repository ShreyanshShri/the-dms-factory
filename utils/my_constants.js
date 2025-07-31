// API Constants
const API_ENDPOINTS = {
	CAMPAIGNS: "/api/v1/campaign",
	START: "/start",
	PAUSE: "/pause",
	ACCOUNT_STATUS: "/account-status",
	CAMPAIGN_STATUS: "/campaign-status",
	FETCH_LEADS: "/fetch-leads",
	FETCH_LEAD: "/fetch-lead",
	SET_LEAD_STATUS: "/set-lead-status",
	CHECK_RESPONSE: "/check-response",
	ANALYTICS: "/analytics",
};

// Campaign Status
const CAMPAIGN_STATUS = {
	READY: "ready",
	ACTIVE: "active",
	PAUSED: "paused",
	COMPLETED: "completed",
	FAILED: "failed",
};

// Account Status
const ACCOUNT_STATUS = {
	READY: "ready",
	ACTIVE: "active",
	PAUSED: "paused",
	FAILED: "failed",
};

// Lead Status
const LEAD_STATUS = {
	READY: "ready",
	SENDING: "sending",
	SENT: "sent",
	FAILED: "failed",
};

// Lead Types
const LEAD_TYPES = {
	INITIAL: "initial",
	FOLLOW_UP: "followUp",
};

// Platforms
const PLATFORMS = {
	INSTAGRAM: "instagram",
	TWITTER: "twitter",
};

// Analytics Status
const ANALYTICS_STATUS = {
	INITIAL_DM_SENT: "initialdmsent",
	FOLLOW_UP: "followup",
	FAILED: "failed",
	ERROR_DURING_WRITE: "error_during_write",
};

// Rate Limiting
const RATE_LIMITS = {
	DEFAULT_DAILY_MAX: 41,
	DEFAULT_DAILY_MIN: 35,
	BATCH_SIZE: 8,
	TIMEOUT_DURATION: 15000, // 15 seconds
	MIN_DELAY: 10000, // 10 seconds
	MAX_DELAY: 30000, // 30 seconds
	RETRY_ATTEMPTS: 3,
};

// Working Hours
const WORKING_HOURS = {
	DEFAULT_START: 0,
	DEFAULT_END: 24,
	TIMEZONE: "America/New_York",
};

// HTTP Status Codes
const HTTP_STATUS = {
	OK: 200,
	CREATED: 201,
	BAD_REQUEST: 400,
	UNAUTHORIZED: 401,
	FORBIDDEN: 403,
	NOT_FOUND: 404,
	INTERNAL_SERVER_ERROR: 500,
};

// Error Messages
const ERROR_MESSAGES = {
	MISSING_PARAMETERS: "Missing required parameters",
	CAMPAIGN_NOT_FOUND: "Campaign not found",
	ACCOUNT_NOT_FOUND: "Account not found",
	LEAD_NOT_FOUND: "Lead not found",
	USER_NOT_FOUND: "User not found",
	INVALID_TOKEN: "Invalid token",
	UNAUTHORIZED: "Unauthorized access",
	INTERNAL_ERROR: "Internal server error",
	CAMPAIGN_START_FAILED: "Failed to start campaign",
	CAMPAIGN_PAUSE_FAILED: "Failed to pause campaign",
	LEADS_FETCH_FAILED: "Failed to fetch leads",
	ANALYTICS_FAILED: "Failed to record analytics",
};

// Success Messages
const SUCCESS_MESSAGES = {
	CAMPAIGN_STARTED: "Campaign started successfully",
	CAMPAIGN_PAUSED: "Campaign paused successfully",
	LEAD_STATUS_UPDATED: "Lead status updated successfully",
	ANALYTICS_RECORDED: "Analytics recorded successfully",
};

module.exports = {
	API_ENDPOINTS,
	CAMPAIGN_STATUS,
	ACCOUNT_STATUS,
	LEAD_STATUS,
	LEAD_TYPES,
	PLATFORMS,
	ANALYTICS_STATUS,
	RATE_LIMITS,
	WORKING_HOURS,
	HTTP_STATUS,
	ERROR_MESSAGES,
	SUCCESS_MESSAGES,
};
