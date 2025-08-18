import axios from "axios";

// const API_BASE_URL = "https://the-dms-factory.onrender.com/api/v1";
const API_BASE_URL =
	process.env.NODE_ENV === "production"
		? "/api/v1"
		: "http://localhost:5000/api/v1";

// Create axios instance with default config
const axiosInstance = axios.create({
	baseURL: API_BASE_URL,
	withCredentials: true, // Important for cookies
	headers: {
		"Content-Type": "application/json",
	},
});

// Response interceptor to handle common response patterns
axiosInstance.interceptors.response.use(
	(response) => response.data,
	(error) => {
		// Only redirect on 401 for specific cases, not everything
		const isAuthCheckRoute = !window.location.pathname.startsWith("/login");
		if (
			isAuthCheckRoute &&
			error.response?.status === 401 &&
			error.config?.url?.includes("/auth/me")
		) {
			window.location.href = "/login";
		}
		return Promise.reject(error);
	}
);

export const authAPI = {
	login: async (email, password) => {
		return await axiosInstance.post("/auth/login", { email, password });
	},

	register: async (name, email, password) => {
		return await axiosInstance.post("/auth/register", {
			name,
			email,
			password,
		});
	},

	logout: async () => {
		return await axiosInstance.post("/auth/logout");
	},

	verifyAuth: async () => {
		return await axiosInstance.get("/auth/me");
	},
};

// Add this to your existing api.js file
export const campaignAPI = {
	createCampaign: async (campaignData) => {
		return await axiosInstance.post("/campaign/create", campaignData);
	},
	getCampaigns: async () => {
		return await axiosInstance.get("/campaign/");
	},
	getCampaignById: async (campaignId) => {
		return await axiosInstance.get(`/campaign/${campaignId}`);
	},
	updateCampaign: async (campaignId, campaignData) => {
		return await axiosInstance.put(`/campaign/${campaignId}`, campaignData);
	},
	deleteCampaign: async (campaignId) => {
		return await axiosInstance.delete(`/campaign/${campaignId}`);
	},

	startCampaign: async (campaignID, accountId, displayName) => {
		return await axiosInstance.post(
			`/campaign/start?campaignID=${campaignID}`,
			{
				displayName,
				widgetId: accountId,
			}
		);
	},

	startAllAccounts: async (campaignID) => {
		return await axiosInstance.patch(
			`/campaign/start-all?campaignId=${campaignID}`
		);
	},

	pauseCampaign: async (campaignID, accountId) => {
		await axiosInstance.patch(
			`/campaign/pause?campaignID=${campaignID}&accountId=${accountId}`
		);
	},

	pauseAllAccounts: async (campaignID) => {
		return await axiosInstance.patch(
			`/campaign/pause-all?campaignId=${campaignID}`
		);
	},
};

export const accountAPI = {
	getOverview: async () => await axiosInstance.get("/account/overview"),
	assign: async (accountId, newCampaignId) =>
		await axiosInstance.patch("/account/assign", { accountId, newCampaignId }),
	bulkAssign: async (accountIds, newCampaignId) =>
		await axiosInstance.patch("/account/assign-many", {
			accountIds,
			newCampaignId,
		}),
};

export const adminAPI = {
	// Get all pending users awaiting approval
	getPendingUsers: async () => {
		return await axiosInstance.get("/admin/pending-users");
	},

	// Approve a user's subscription
	approveUser: async (uid) => {
		return await axiosInstance.post(`/admin/approve-user/${uid}`);
	},

	// Get all users with pagination and filtering
	getAllUsers: async (page = 1, limit = 10, status = null) => {
		const params = new URLSearchParams({ page, limit });
		if (status) params.append("status", status);
		return await axiosInstance.get(`/admin/users?${params}`);
	},
};
