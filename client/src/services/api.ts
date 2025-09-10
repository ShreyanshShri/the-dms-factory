import axiosInstance from "./axiosInstance";
import type {
	DashboardStats,
	PerformanceData,
	CampaignRanking,
	RecentActivity,
	ApiResponse,
	CampaignAnalytics,
	CampaignMetrics,
	CampaignData,
} from "../types/dashboard";

// Response interceptor to handle common response patterns
axiosInstance.interceptors.response.use(
	(response) => response.data,
	(error) => {
		const publicRoutes = ["/", "/privacy-policy", "/login", "/register"];
		const isPublicRoute = publicRoutes.includes(window.location.pathname);
		const isAuthCheckRoute = !isPublicRoute;

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

// console.log(
// 	"response interceptors:",
// 	axiosInstance.interceptors.response.handlers.length
// );

export const authAPI = {
	login: async (email: string, password: string): Promise<ApiResponse<any>> => {
		return await axiosInstance.post("/auth/login", { email, password });
	},

	register: async (
		name: string,
		email: string,
		password: string
	): Promise<ApiResponse<any>> => {
		return await axiosInstance.post("/auth/register", {
			name,
			email,
			password,
		});
	},

	logout: async (): Promise<any> => {
		return await axiosInstance.post("/auth/logout");
	},

	verifyAuth: async (): Promise<ApiResponse<any>> => {
		return await axiosInstance.get("/auth/me");
	},
};

export const campaignAPI = {
	createCampaign: async (campaignData: any): Promise<ApiResponse<any>> => {
		return await axiosInstance.post("/campaign/create", campaignData);
	},

	getCampaigns: async (): Promise<any> => {
		return await axiosInstance.get("/campaign/");
	},

	getCampaignById: async (campaignId: string): Promise<ApiResponse<any>> => {
		return await axiosInstance.get(`/campaign/${campaignId}`);
	},

	updateCampaign: async (
		campaignId: string,
		campaignData: any
	): Promise<ApiResponse<any>> => {
		return await axiosInstance.put(`/campaign/${campaignId}`, campaignData);
	},

	deleteCampaign: async (campaignId: string): Promise<ApiResponse<any>> => {
		return await axiosInstance.delete(`/campaign/${campaignId}`);
	},

	startCampaign: async (
		campaignID: string,
		accountId: string,
		displayName: string
	): Promise<ApiResponse<any>> => {
		return await axiosInstance.post(
			`/campaign/start?campaignID=${campaignID}`,
			{
				displayName,
				widgetId: accountId,
			}
		);
	},

	startAllAccounts: async (campaignID: string): Promise<ApiResponse<any>> => {
		return await axiosInstance.patch(
			`/campaign/start-all?campaignId=${campaignID}`
		);
	},

	pauseCampaign: async (
		campaignID: string,
		accountId: string
	): Promise<void> => {
		await axiosInstance.patch(
			`/campaign/pause?campaignID=${campaignID}&accountId=${accountId}`
		);
	},

	pauseAllAccounts: async (campaignID: string): Promise<ApiResponse<any>> => {
		return await axiosInstance.patch(
			`/campaign/pause-all?campaignId=${campaignID}`
		);
	},

	getAnalytics: async (params: Record<string, string>): Promise<any> => {
		const queryString = new URLSearchParams(params).toString();
		return await axiosInstance.get(`/campaign/analytics?${queryString}`);
	},

	getTrend: async (params: Record<string, string>): Promise<any> => {
		const qs = new URLSearchParams(params).toString();
		return await axiosInstance.get(`/campaign/analytics/trend?${qs}`);
	},
};

export const accountAPI = {
	getOverview: async (): Promise<ApiResponse<any>> =>
		await axiosInstance.get("/account/overview"),

	assign: async (
		accountId: string,
		newCampaignId: string
	): Promise<ApiResponse<any>> =>
		await axiosInstance.patch("/account/assign", { accountId, newCampaignId }),

	bulkAssign: async (
		accountIds: string[],
		newCampaignId: string
	): Promise<ApiResponse<any>> =>
		await axiosInstance.patch("/account/assign-many", {
			accountIds,
			newCampaignId,
		}),
};

export const adminAPI = {
	getPendingUsers: async (): Promise<ApiResponse<any>> => {
		return await axiosInstance.get("/admin/pending-users");
	},

	approveUser: async (uid: string): Promise<ApiResponse<any>> => {
		return await axiosInstance.post(`/admin/approve-user/${uid}`);
	},

	getAllUsers: async (
		page: number = 1,
		limit: number = 10,
		status: string | null = null
	): Promise<ApiResponse<any>> => {
		const params = new URLSearchParams({
			page: page.toString(),
			limit: limit.toString(),
		});
		if (status) params.append("status", status);
		return await axiosInstance.get(`/admin/users?${params}`);
	},
};

export const userAPI = {
	getPaymentStatus: async (): Promise<any> => {
		return await axiosInstance.get("/users/payment-status");
	},

	getSettings: async (): Promise<any> => {
		return await axiosInstance.get("/users/settings");
	},

	updateSettings: async (settings: {
		notifications?: Record<string, boolean>;
		privacy?: Record<string, boolean>;
		displayName?: string;
		email?: string;
		timeZone?: string;
	}): Promise<ApiResponse<any>> => {
		return await axiosInstance.put("/users/settings", settings);
	},
};

export const chatAPI = {
	login: async (): Promise<any> => {
		return await axiosInstance.get("/chats/login");
	},
};

// Dashboard API with proper TypeScript types
export const dashboardAPI = {
	getStats: async (): Promise<ApiResponse<DashboardStats>> => {
		return await axiosInstance.get("/dashboard/stats");
	},

	getPerformance: async (
		timeRange: number = 7
	): Promise<ApiResponse<{ daily: PerformanceData }>> => {
		return await axiosInstance.get(
			`/dashboard/performance?timeRange=${timeRange}`
		);
	},

	getCampaignRankings: async (): Promise<ApiResponse<CampaignRanking[]>> => {
		return await axiosInstance.get("/dashboard/campaign-rankings");
	},

	getRecentActivity: async (
		limit: number = 10
	): Promise<ApiResponse<RecentActivity[]>> => {
		return await axiosInstance.get(`/dashboard/recent-activity?limit=${limit}`);
	},

	// Campaign-specific dashboard methods
	getCampaignMetrics: async (): Promise<ApiResponse<CampaignMetrics>> => {
		return await axiosInstance.get("/dashboard/campaign-metrics");
	},

	getCampaignsWithAnalytics: async (): Promise<ApiResponse<CampaignData[]>> => {
		return await axiosInstance.get("/dashboard/campaigns-analytics");
	},

	getCampaignAnalytics: async (
		campaignId: string
	): Promise<ApiResponse<CampaignAnalytics>> => {
		return await axiosInstance.get(
			`/dashboard/campaign-analytics/${campaignId}`
		);
	},
	getRecentMessages: async (limit: number = 50): Promise<any> => {
		return await axiosInstance.get(`/dashboard/recent-messages?limit=${limit}`);
	},
};

// Add this to your api.ts file

export const billingAPI = {
	getBillingHistory: async (): Promise<any> => {
		return await axiosInstance.get("/billing/history");
	},

	getSubscription: async (): Promise<any> => {
		return await axiosInstance.get("/billing/subscription");
	},
};
