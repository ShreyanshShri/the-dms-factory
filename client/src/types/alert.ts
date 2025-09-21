// types/alert.ts
export type AlertType = "success" | "error" | "warning" | "info";

export interface AlertAction {
	label: string;
	onClick: () => void;
	variant?: "primary" | "secondary";
	closeOnClick?: boolean;
}

export interface Alert {
	id: number;
	type: AlertType;
	title?: string;
	message: string;
	duration?: number;
	showCloseButton?: boolean;
	actions?: AlertAction[];
}

export interface AlertOptions {
	type?: AlertType;
	title?: string;
	duration?: number;
	showCloseButton?: boolean;
	actions?: AlertAction[];
}

export interface AlertContextType {
	alerts: Alert[];
	addAlert: (alert: Partial<Alert>) => number;
	removeAlert: (id: number) => void;
	removeAllAlerts: () => void;
	success: (message: string, options?: Omit<AlertOptions, "type">) => number;
	error: (message: string, options?: Omit<AlertOptions, "type">) => number;
	warning: (message: string, options?: Omit<AlertOptions, "type">) => number;
	info: (message: string, options?: Omit<AlertOptions, "type">) => number;
}
