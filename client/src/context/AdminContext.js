// contexts/AdminContext.js
import { createContext, useContext, useReducer, useCallback } from "react";
import { adminAPI } from "../services/api";
import { useAuth } from "./AuthContext";

const AdminContext = createContext();

const initialState = {
	pendingUsers: [],
	allUsers: [],
	loading: false,
	error: null,
	currentPage: 1,
	totalUsers: 0,
};

const adminReducer = (state, action) => {
	switch (action.type) {
		case "SET_LOADING":
			return { ...state, loading: action.payload };
		case "SET_PENDING_USERS":
			return { ...state, pendingUsers: action.payload, loading: false };
		case "SET_ALL_USERS":
			return {
				...state,
				allUsers: action.payload.users,
				currentPage: action.payload.page,
				totalUsers: action.payload.total,
				loading: false,
			};
		case "APPROVE_USER_SUCCESS":
			return {
				...state,
				pendingUsers: state.pendingUsers.filter(
					(user) => user.uid !== action.payload
				),
				loading: false,
			};
		case "SET_ERROR":
			return { ...state, error: action.payload, loading: false };
		case "CLEAR_ERROR":
			return { ...state, error: null };
		default:
			return state;
	}
};

export const AdminProvider = ({ children }) => {
	const [state, dispatch] = useReducer(adminReducer, initialState);
	const { user } = useAuth();

	// Check if current user is admin
	const isAdmin = user?.role === "admin";

	const fetchPendingUsers = useCallback(async () => {
		if (!isAdmin) return;

		try {
			dispatch({ type: "SET_LOADING", payload: true });
			const response = await adminAPI.getPendingUsers();

			if (response.success) {
				dispatch({ type: "SET_PENDING_USERS", payload: response.data });
			} else {
				dispatch({ type: "SET_ERROR", payload: response.message });
			}
		} catch (error) {
			dispatch({
				type: "SET_ERROR",
				payload:
					error.response?.data?.message || "Failed to fetch pending users",
			});
		}
	}, [isAdmin]);

	const fetchAllUsers = useCallback(
		async (page = 1, status = null) => {
			if (!isAdmin) return;

			try {
				dispatch({ type: "SET_LOADING", payload: true });
				const response = await adminAPI.getAllUsers(page, 10, status);

				if (response.success) {
					dispatch({ type: "SET_ALL_USERS", payload: response.data });
				} else {
					dispatch({ type: "SET_ERROR", payload: response.message });
				}
			} catch (error) {
				dispatch({
					type: "SET_ERROR",
					payload: error.response?.data?.message || "Failed to fetch users",
				});
			}
		},
		[isAdmin]
	);

	const approveUser = useCallback(
		async (uid) => {
			if (!isAdmin) return;

			try {
				dispatch({ type: "SET_LOADING", payload: true });
				const response = await adminAPI.approveUser(uid);

				if (response.success) {
					dispatch({ type: "APPROVE_USER_SUCCESS", payload: uid });
					return { success: true };
				} else {
					dispatch({ type: "SET_ERROR", payload: response.message });
					return { success: false, error: response.message };
				}
			} catch (error) {
				const errorMessage =
					error.response?.data?.message || "Failed to approve user";
				dispatch({ type: "SET_ERROR", payload: errorMessage });
				return { success: false, error: errorMessage };
			}
		},
		[isAdmin]
	);

	const clearError = useCallback(() => {
		dispatch({ type: "CLEAR_ERROR" });
	}, []);

	const value = {
		...state,
		isAdmin,
		fetchPendingUsers,
		fetchAllUsers,
		approveUser,
		clearError,
	};

	return (
		<AdminContext.Provider value={value}>{children}</AdminContext.Provider>
	);
};

export const useAdmin = () => {
	const context = useContext(AdminContext);
	if (!context) {
		throw new Error("useAdmin must be used within an AdminProvider");
	}
	return context;
};
