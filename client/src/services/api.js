import axios from "axios";

// const API_BASE_URL = "https://the-dms-factory.onrender.com/api/v1";
const API_BASE_URL = "/api/v1";
// const API_BASE_URL = "http://localhost:5000/api/v1"; // for testing

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
		if (
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
};
