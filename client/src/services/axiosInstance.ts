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

export default axiosInstance;
