import {
	createContext,
	useContext,
	useReducer,
	useEffect,
	useCallback,
	ReactNode,
} from "react";
import { authAPI } from "../services/api";

// ---- Types ----
export interface User {
	id: string;
	name: string;
	email: string;
	role: "admin" | "user" | string;
	// add any extra fields your backend sends
}

interface AuthState {
	user: User | null;
	isAuthenticated: boolean;
	loading: boolean;
	error: string | null;
}

type AuthAction =
	| { type: "SET_LOADING"; payload: boolean }
	| { type: "LOGIN_SUCCESS"; payload: User }
	| { type: "LOGIN_ERROR"; payload: string }
	| { type: "LOGOUT" }
	| { type: "CLEAR_ERROR" };

interface AuthContextType extends AuthState {
	login: (
		email: string,
		password: string
	) => Promise<{ success: boolean; error?: string }>;
	register: (
		name: string,
		email: string,
		password: string
	) => Promise<{ success: boolean; error?: string }>;
	logout: () => Promise<any>;
	clearError: () => void;
}

// ---- Reducer ----
const initialState: AuthState = {
	user: null,
	isAuthenticated: false,
	loading: true,
	error: null,
};

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
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

// ---- Context ----
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ---- Provider ----
export const AuthProvider = ({ children }: { children: ReactNode }) => {
	const [state, dispatch] = useReducer(authReducer, initialState);

	const login = async (email: string, password: string) => {
		try {
			dispatch({ type: "SET_LOADING", payload: true });
			const response = await authAPI.login(email, password);

			if (response.success) {
				dispatch({ type: "LOGIN_SUCCESS", payload: response.data });

				if (response.data.role === "admin") {
					window.location.href = "/admin";
				} else {
					window.location.href = "/dashboard";
				}

				return { success: true };
			} else {
				dispatch({ type: "LOGIN_ERROR", payload: response.message as string });
				return { success: false, error: response.message };
			}
		} catch (error: any) {
			const errorMessage = error.response?.data?.message || "Login failed";
			dispatch({ type: "LOGIN_ERROR", payload: errorMessage });
			return { success: false, error: errorMessage };
		}
	};

	const register = async (name: string, email: string, password: string) => {
		try {
			dispatch({ type: "SET_LOADING", payload: true });
			const response = await authAPI.register(name, email, password);

			if (response.success) {
				dispatch({ type: "LOGIN_SUCCESS", payload: response.data });
				return { success: true };
			} else {
				dispatch({ type: "LOGIN_ERROR", payload: response.message as string });
				return { success: false, error: response.message };
			}
		} catch (error: any) {
			const errorMessage =
				error.response?.data?.message || "Registration failed";
			dispatch({ type: "LOGIN_ERROR", payload: errorMessage });
			return { success: false, error: errorMessage };
		}
	};

	const logout = async () => {
		let response;
		try {
			response = await authAPI.logout();
		} catch (error) {
			console.error("Logout error:", error);
		} finally {
			dispatch({ type: "LOGOUT" });
			return response;
		}
	};

	const clearError = useCallback(() => {
		dispatch({ type: "CLEAR_ERROR" });
	}, []);

	useEffect(() => {
		const checkAuth = async () => {
			try {
				dispatch({ type: "SET_LOADING", payload: true });

				const response = await authAPI.verifyAuth();
				console.log("response found", response);

				if (response.success) {
					dispatch({ type: "LOGIN_SUCCESS", payload: response.data });
				} else {
					dispatch({ type: "SET_LOADING", payload: false });
				}
			} catch (error) {
				console.log("Auth verification failed:", error);
				dispatch({ type: "SET_LOADING", payload: false });
			}
		};

		checkAuth();
	}, []);

	const value: AuthContextType = {
		...state,
		login,
		register,
		logout,
		clearError,
	};

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// ---- Hook ----
export const useAuth = (): AuthContextType => {
	const context = useContext(AuthContext);
	if (!context) {
		throw new Error("useAuth must be used within an AuthProvider");
	}
	return context;
};
