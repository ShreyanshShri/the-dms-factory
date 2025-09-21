// contexts/AlertContext.tsx
import React, {
	createContext,
	useContext,
	useState,
	useCallback,
	ReactNode,
} from "react";
import { Alert, AlertContextType, AlertOptions } from "../types/alert";

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export const useAlert = (): AlertContextType => {
	const context = useContext(AlertContext);
	if (!context) {
		throw new Error("useAlert must be used within an AlertProvider");
	}
	return context;
};

interface AlertProviderProps {
	children: ReactNode;
}

export const AlertProvider: React.FC<AlertProviderProps> = ({ children }) => {
	const [alerts, setAlerts] = useState<Alert[]>([]);

	const addAlert = useCallback((alertData: Partial<Alert>): number => {
		const id = Date.now() + Math.random();
		const newAlert: Alert = {
			id,
			type: "info",
			title: "",
			message: "",
			duration: 5000,
			showCloseButton: true,
			actions: [],
			...alertData,
		};

		setAlerts((prev) => [...prev, newAlert]);

		// Auto dismiss if duration is set
		if (newAlert.duration && newAlert.duration > 0) {
			setTimeout(() => {
				removeAlert(id);
			}, newAlert.duration);
		}

		return id;
	}, []);

	const removeAlert = useCallback((id: number): void => {
		setAlerts((prev) => prev.filter((alert) => alert.id !== id));
	}, []);

	const removeAllAlerts = useCallback((): void => {
		setAlerts([]);
	}, []);

	// Convenience methods
	const success = useCallback(
		(message: string, options: Omit<AlertOptions, "type"> = {}): number => {
			return addAlert({ type: "success", message, ...options });
		},
		[addAlert]
	);

	const error = useCallback(
		(message: string, options: Omit<AlertOptions, "type"> = {}): number => {
			return addAlert({ type: "error", message, ...options });
		},
		[addAlert]
	);

	const warning = useCallback(
		(message: string, options: Omit<AlertOptions, "type"> = {}): number => {
			return addAlert({ type: "warning", message, ...options });
		},
		[addAlert]
	);

	const info = useCallback(
		(message: string, options: Omit<AlertOptions, "type"> = {}): number => {
			return addAlert({ type: "info", message, ...options });
		},
		[addAlert]
	);

	const value: AlertContextType = {
		alerts,
		addAlert,
		removeAlert,
		removeAllAlerts,
		success,
		error,
		warning,
		info,
	};

	return (
		<AlertContext.Provider value={value}>{children}</AlertContext.Provider>
	);
};
