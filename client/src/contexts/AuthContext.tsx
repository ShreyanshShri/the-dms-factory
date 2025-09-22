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
export interface FirestoreTimestamp {
	_seconds: number;
	_nanoseconds: number;
}

export interface BillingHistoryItem {
	event?: string;
	amount?: number;
	currency?: string;
	status?: string;
	whopPaymentId?: string;
	processedAt?: Date;
	metadata?: Record<string, any>;
}

export interface Subscription {
	status?: "pending" | "active" | "trial" | "failed" | "expired" | "cancelled";
	lastEvent?: string;
	whopMembershipId?: string;
	tier?: string;
	tierValue?: number;
	planId?: string;

	// Period tracking
	renewalPeriodStart?: Date;
	renewalPeriodEnd?: Date;
	expiresAt?: Date;

	// Status flags
	valid?: boolean;
	licenseKey?: string;
	cancelAtPeriodEnd?: boolean;

	// Metadata and tracking
	metadata?: Record<string, any>;
	createdAt?: Date;
	updatedAt?: Date;

	// Payment tracking
	lastPaymentDate?: Date;
	nextBillingDate?: Date;
	trialEndsAt?: Date;
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
	createdAt?: FirestoreTimestamp;
	subscription?: Subscription;
	billingHistory?: BillingHistoryItem[];
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
	getSubscriptionTier: () => string;
	isTrialActive: () => boolean;
	canAccessFeature: (requiredTierValue?: number) => boolean;
	getSubscriptionTimeRemaining: () => number | null;
	getSubscriptionDaysRemaining: () => number | null;
	isSubscriptionExpired: () => boolean;
}

// ---- Helper Functions ----
const convertFirestoreTimestamp = (timestamp: FirestoreTimestamp): Date => {
	if (!timestamp || typeof timestamp._seconds !== "number") {
		return new Date();
	}
	return new Date(
		timestamp._seconds * 1000 + (timestamp._nanoseconds || 0) / 1000000
	);
};

const convertDateFields = (obj: any): any => {
	if (!obj) return obj;

	const converted = { ...obj };

	// Convert createdAt if it's a FirestoreTimestamp
	if (converted.createdAt && converted.createdAt._seconds) {
		converted.createdAt = convertFirestoreTimestamp(converted.createdAt);
	}

	// Convert subscription date fields
	if (converted.subscription) {
		const sub = converted.subscription;
		[
			"renewalPeriodStart",
			"renewalPeriodEnd",
			"expiresAt",
			"createdAt",
			"updatedAt",
			"lastPaymentDate",
			"nextBillingDate",
			"trialEndsAt",
		].forEach((field) => {
			if (sub[field]) {
				if (typeof sub[field] === "string") {
					sub[field] = new Date(sub[field]);
				} else if (sub[field]._seconds) {
					sub[field] = convertFirestoreTimestamp(sub[field]);
				}
			}
		});
	}

	// Convert billing history dates
	if (converted.billingHistory) {
		converted.billingHistory = converted.billingHistory.map((item: any) => ({
			...item,
			processedAt: item.processedAt ? new Date(item.processedAt) : undefined,
		}));
	}

	return converted;
};

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

	const transformUserData = (backendData: any): User => {
		const convertedData = convertDateFields(backendData);

		return {
			id: convertedData.uid || convertedData.id,
			uid: convertedData.uid,
			name: convertedData.name,
			email: convertedData.email,
			role: convertedData.role,
			createdAt: convertedData.createdAt,
			subscription: convertedData.subscription,
			billingHistory: convertedData.billingHistory,
			timeZone: convertedData.timeZone,
			notifications: convertedData.notifications,
			privacy: convertedData.privacy,
		};
	};

	const login = async (email: string, password: string) => {
		try {
			dispatch({ type: "SET_LOADING", payload: true });
			const response = await authAPI.login(email, password);

			if (response.success) {
				const userData = transformUserData(response.data);
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
				const userData = transformUserData(response.data);
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

	// Enhanced subscription helper functions
	const hasActiveSubscription = useCallback((): boolean => {
		if (!state.user?.subscription) return false;
		const sub = state.user.subscription;
		return (
			(sub.status === "active" || sub.status === "trial") && sub.valid !== false
		);
	}, [state.user]);

	const getSubscriptionStatus = useCallback((): string => {
		return state.user?.subscription?.status || "none";
	}, [state.user]);

	const getSubscriptionTier = useCallback((): string => {
		return state.user?.subscription?.tier || "none";
	}, [state.user]);

	const isTrialActive = useCallback((): boolean => {
		if (!state.user?.subscription) return false;
		const sub = state.user.subscription;
		const now = new Date();

		return (
			sub.status === "trial" &&
			sub.valid === true &&
			(!sub.trialEndsAt || sub.trialEndsAt > now) &&
			(!sub.expiresAt || sub.expiresAt > now)
		);
	}, [state.user]);

	const isSubscriptionExpired = useCallback((): boolean => {
		if (!state.user?.subscription) return true;
		const sub = state.user.subscription;
		const now = new Date();

		// Check various expiration conditions
		if (sub.status === "expired" || sub.valid === false) return true;
		if (sub.expiresAt && sub.expiresAt <= now) return true;
		if (sub.renewalPeriodEnd && sub.renewalPeriodEnd <= now) return true;
		if (sub.trialEndsAt && sub.trialEndsAt <= now && sub.status === "trial")
			return true;

		return false;
	}, [state.user]);

	const getSubscriptionTimeRemaining = useCallback((): number | null => {
		if (!state.user?.subscription) return null;
		const sub = state.user.subscription;
		const now = new Date();

		const expiryDate = sub.expiresAt || sub.renewalPeriodEnd || sub.trialEndsAt;
		if (!expiryDate) return null;

		const timeRemaining = expiryDate.getTime() - now.getTime();
		return Math.max(0, timeRemaining);
	}, [state.user]);

	const getSubscriptionDaysRemaining = useCallback((): number | null => {
		const timeRemaining = getSubscriptionTimeRemaining();
		if (timeRemaining === null) return null;

		return Math.max(0, Math.ceil(timeRemaining / (1000 * 60 * 60 * 24)));
	}, [getSubscriptionTimeRemaining]);

	const canAccessFeature = useCallback(
		(requiredTierValue?: number): boolean => {
			if (!state.user?.subscription) return false;

			const sub = state.user.subscription;

			// Check if subscription is valid and active
			if (isSubscriptionExpired() || !hasActiveSubscription()) return false;

			// If no tier value required, just check if subscription is active
			if (!requiredTierValue) return true;

			// Check if user's tier value meets or exceeds required value
			return (sub.tierValue || 0) >= requiredTierValue;
		},
		[state.user, hasActiveSubscription, isSubscriptionExpired]
	);

	useEffect(() => {
		const checkAuth = async () => {
			try {
				dispatch({ type: "SET_LOADING", payload: true });
				const response = await authAPI.verifyAuth();
				console.log("Auth response found", response);

				if (response.success) {
					const userData = transformUserData(response.data);
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
		getSubscriptionTier,
		isTrialActive,
		canAccessFeature,
		getSubscriptionTimeRemaining,
		getSubscriptionDaysRemaining,
		isSubscriptionExpired,
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
