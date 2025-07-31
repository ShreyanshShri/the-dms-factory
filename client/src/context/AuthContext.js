import { createContext, useContext, useReducer, useEffect } from "react";
import { authAPI } from "../services/api";

const AuthContext = createContext();

const initialState = {
	user: null,
	isAuthenticated: false,
	loading: true,
	error: null,
};

const authReducer = (state, action) => {
	switch (action.type) {
		case "SET_LOADING":
			return { ...state, loading: action.payload };
		case "LOGIN_SUCCESS":
			return {
				...state,
				user: action.payload,
				isAuthenticated: true,
				loading: false,
				error: null,
			};
		case "LOGIN_ERROR":
			return {
				...state,
				user: null,
				isAuthenticated: false,
				loading: false,
				error: action.payload,
			};
		case "LOGOUT":
			return {
				...state,
				user: null,
				isAuthenticated: false,
				loading: false,
				error: null,
			};
		case "CLEAR_ERROR":
			return { ...state, error: null };
		default:
			return state;
	}
};

export const AuthProvider = ({ children }) => {
	const [state, dispatch] = useReducer(authReducer, initialState);

	const login = async (email, password) => {
		try {
			dispatch({ type: "SET_LOADING", payload: true });
			const response = await authAPI.login(email, password);

			if (response.success) {
				dispatch({ type: "LOGIN_SUCCESS", payload: response.data });
				return { success: true };
			} else {
				dispatch({ type: "LOGIN_ERROR", payload: response.message });
				return { success: false, error: response.message };
			}
		} catch (error) {
			const errorMessage = error.response?.data?.message || "Login failed";
			dispatch({ type: "LOGIN_ERROR", payload: errorMessage });
			return { success: false, error: errorMessage };
		}
	};

	const register = async (name, email, password) => {
		try {
			dispatch({ type: "SET_LOADING", payload: true });
			const response = await authAPI.register(name, email, password);

			if (response.success) {
				dispatch({ type: "LOGIN_SUCCESS", payload: response.data });
				return { success: true };
			} else {
				dispatch({ type: "LOGIN_ERROR", payload: response.message });
				return { success: false, error: response.message };
			}
		} catch (error) {
			const errorMessage =
				error.response?.data?.message || "Registration failed";
			dispatch({ type: "LOGIN_ERROR", payload: errorMessage });
			return { success: false, error: errorMessage };
		}
	};

	const logout = async () => {
		try {
			await authAPI.logout();
		} catch (error) {
			console.error("Logout error:", error);
		} finally {
			dispatch({ type: "LOGOUT" });
		}
	};

	const clearError = () => {
		dispatch({ type: "CLEAR_ERROR" });
	};

	useEffect(() => {
		// Check if user is already authenticated on app load
		const checkAuth = async () => {
			try {
				dispatch({ type: "SET_LOADING", payload: true });

				// Actually verify the cookie with your backend
				const response = await authAPI.verifyAuth(); // You need this endpoint
				console.log("response found", response);

				if (response.success) {
					// Cookie is valid - user is authenticated
					dispatch({ type: "LOGIN_SUCCESS", payload: response.data });
				} else {
					// Cookie invalid or doesn't exist
					dispatch({ type: "SET_LOADING", payload: false });
				}
			} catch (error) {
				// Cookie verification failed
				console.log("Auth verification failed:", error);
				dispatch({ type: "SET_LOADING", payload: false });
			}
		};

		checkAuth();
	}, []);

	const value = {
		...state,
		login,
		register,
		logout,
		clearError,
	};

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
	const context = useContext(AuthContext);
	if (!context) {
		throw new Error("useAuth must be used within an AuthProvider");
	}
	return context;
};
