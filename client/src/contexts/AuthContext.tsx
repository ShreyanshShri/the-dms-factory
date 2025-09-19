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
export interface Subscription {
	status?: string; // "pending", "active", "trial", "failed", "expired"
	lastEvent?: string;
	whopMembershipId?: string;
	tier?: string;
	tierValue?: number;
	planId?: string;
	expiresAt?: Date;
	currentPeriodEnd?: Date;
	valid?: boolean;
	licenseKey?: string;
	cancelAtPeriodEnd?: boolean;
	updatedAt?: Date;
	metadata?: Record<string, any>;
}

export interface Notifications {
	email: boolean;
	push: boolean;
	sms: boolean;
	errors: boolean;
	limits: boolean;
	completion: boolean;
}

export interface Privacy {
	dataSharing: boolean;
	analytics: boolean;
	marketing: boolean;
}

export interface User {
	id: string; // Maps to uid from schema
	uid: string;
	name?: string;
	email?: string;
	role: "admin" | "user" | string;
	createdAt?: Date;
	subscription?: Subscription;
	timeZone?: string;
	notifications?: Notifications;
	privacy?: Privacy;
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
	| { type: "CLEAR_ERROR" }
	| { type: "UPDATE_USER"; payload: Partial<User> }
	| { type: "UPDATE_SUBSCRIPTION"; payload: Subscription };

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
	updateUser: (userData: Partial<User>) => void;
	updateSubscription: (subscriptionData: Subscription) => void;
	hasActiveSubscription: () => boolean;
	getSubscriptionStatus: () => string;
	isTrialActive: () => boolean;
	canAccessFeature: (requiredTier?: string) => boolean;
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

		case "UPDATE_USER":
			return {
				...state,
				user: state.user ? { ...state.user, ...action.payload } : null,
			};

		case "UPDATE_SUBSCRIPTION":
			return {
				...state,
				user: state.user
					? { ...state.user, subscription: action.payload }
					: null,
			};

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
				// Transform backend data to match frontend User interface
				const userData: User = {
					id: response.data.uid || response.data.id,
					uid: response.data.uid,
					name: response.data.name,
					email: response.data.email,
					role: response.data.role,
					createdAt: response.data.createdAt,
					subscription: response.data.subscription,
					timeZone: response.data.timeZone,
					notifications: response.data.notifications,
					privacy: response.data.privacy,
				};

				dispatch({ type: "LOGIN_SUCCESS", payload: userData });

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
				// Transform backend data to match frontend User interface
				const userData: User = {
					id: response.data.uid || response.data.id,
					uid: response.data.uid,
					name: response.data.name,
					email: response.data.email,
					role: response.data.role,
					createdAt: response.data.createdAt,
					subscription: response.data.subscription,
					timeZone: response.data.timeZone,
					notifications: response.data.notifications,
					privacy: response.data.privacy,
				};

				dispatch({ type: "LOGIN_SUCCESS", payload: userData });
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

	const updateUser = useCallback((userData: Partial<User>) => {
		dispatch({ type: "UPDATE_USER", payload: userData });
	}, []);

	const updateSubscription = useCallback((subscriptionData: Subscription) => {
		dispatch({ type: "UPDATE_SUBSCRIPTION", payload: subscriptionData });
	}, []);

	// Subscription helper functions
	const hasActiveSubscription = useCallback((): boolean => {
		if (!state.user?.subscription) return false;
		const sub = state.user.subscription;
		return sub.status === "active" || sub.status === "trial";
	}, [state.user]);

	const getSubscriptionStatus = useCallback((): string => {
		return state.user?.subscription?.status || "none";
	}, [state.user]);

	const isTrialActive = useCallback((): boolean => {
		if (!state.user?.subscription) return false;
		const sub = state.user.subscription;
		return sub.status === "trial" && sub.valid === true;
	}, [state.user]);

	const canAccessFeature = useCallback(
		(requiredTier?: string): boolean => {
			if (!state.user?.subscription) return false;

			const sub = state.user.subscription;

			// If no tier required, just check if subscription is active
			if (!requiredTier) {
				return hasActiveSubscription();
			}

			// Check if user's tier matches or exceeds required tier
			if (sub.status === "active" || sub.status === "trial") {
				return (
					sub.tier === requiredTier ||
					(sub.tierValue && sub.tierValue >= getTierValue(requiredTier)) ||
					false
				);
			}

			return false;
		},
		[state.user, hasActiveSubscription]
	);

	// Helper function to convert tier names to numeric values for comparison
	const getTierValue = (tier: string): number => {
		const tierValues: Record<string, number> = {
			basic: 1,
			standard: 2,
			premium: 3,
			enterprise: 4,
		};
		return tierValues[tier.toLowerCase()] || 0;
	};

	useEffect(() => {
		const checkAuth = async () => {
			try {
				dispatch({ type: "SET_LOADING", payload: true });
				const response = await authAPI.verifyAuth();
				console.log("response found", response);

				if (response.success) {
					// Transform backend data to match frontend User interface
					const userData: User = {
						id: response.data.uid || response.data.id,
						uid: response.data.uid,
						name: response.data.name,
						email: response.data.email,
						role: response.data.role,
						createdAt: response.data.createdAt,
						subscription: response.data.subscription,
						timeZone: response.data.timeZone,
						notifications: response.data.notifications,
						privacy: response.data.privacy,
					};

					dispatch({ type: "LOGIN_SUCCESS", payload: userData });
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
		updateUser,
		updateSubscription,
		hasActiveSubscription,
		getSubscriptionStatus,
		isTrialActive,
		canAccessFeature,
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
