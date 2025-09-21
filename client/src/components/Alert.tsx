// components/Alert.tsx
import React, { useEffect, useState } from "react";
import {
	X,
	CheckCircle,
	XCircle,
	AlertTriangle,
	Info,
	LucideIcon,
} from "lucide-react";
import { Alert as AlertType } from "../types/alert";

interface AlertProps {
	alert: AlertType;
	onClose: (id: number) => void;
}

const AlertComponent: React.FC<AlertProps> = ({ alert, onClose }) => {
	const [isVisible, setIsVisible] = useState<boolean>(false);
	const [isRemoving, setIsRemoving] = useState<boolean>(false);

	useEffect(() => {
		// Trigger entrance animation
		const timer = setTimeout(() => setIsVisible(true), 10);
		return () => clearTimeout(timer);
	}, []);

	const handleClose = (): void => {
		setIsRemoving(true);
		setTimeout(() => onClose(alert.id), 300);
	};

	const getAlertStyles = (): string => {
		const baseStyles = "border-l-4 shadow-lg";

		switch (alert.type) {
			case "success":
				return `${baseStyles} bg-white dark:bg-gray-800 border-success-500`;
			case "error":
				return `${baseStyles} bg-white dark:bg-gray-800 border-red-500`;
			case "warning":
				return `${baseStyles} bg-white dark:bg-gray-800 border-warning-500`;
			default:
				return `${baseStyles} bg-white dark:bg-gray-800 border-primary-500`;
		}
	};

	const getIcon = (): React.ReactElement => {
		const iconClass = "h-5 w-5";

		const IconComponent: LucideIcon = (() => {
			switch (alert.type) {
				case "success":
					return CheckCircle;
				case "error":
					return XCircle;
				case "warning":
					return AlertTriangle;
				default:
					return Info;
			}
		})();

		const colorClass = (() => {
			switch (alert.type) {
				case "success":
					return "text-success-600 dark:text-success-400";
				case "error":
					return "text-red-600 dark:text-red-400";
				case "warning":
					return "text-warning-600 dark:text-warning-400";
				default:
					return "text-primary-600 dark:text-primary-400";
			}
		})();

		return <IconComponent className={`${iconClass} ${colorClass}`} />;
	};

	const getTitleColor = (): string => {
		switch (alert.type) {
			case "success":
				return "text-success-800 dark:text-success-200";
			case "error":
				return "text-red-800 dark:text-red-200";
			case "warning":
				return "text-warning-800 dark:text-warning-200";
			default:
				return "text-primary-800 dark:text-primary-200";
		}
	};

	return (
		<div
			className={`
        ${getAlertStyles()}
        rounded-lg p-4 mb-4 max-w-md w-full
        transform transition-all duration-300 ease-out
        ${
					isVisible && !isRemoving
						? "translate-x-0 opacity-100 scale-100"
						: "translate-x-full opacity-0 scale-95"
				}
      `}
		>
			<div className="flex items-start">
				<div className="flex-shrink-0">{getIcon()}</div>

				<div className="ml-3 flex-1">
					{alert.title && (
						<h3 className={`text-sm font-semibold ${getTitleColor()}`}>
							{alert.title}
						</h3>
					)}
					<div
						className={`text-sm ${
							alert.title ? "mt-1" : ""
						} text-gray-700 dark:text-gray-300`}
					>
						{alert.message}
					</div>

					{alert.actions && alert.actions.length > 0 && (
						<div className="mt-3 flex space-x-2">
							{alert.actions.map((action, index) => (
								<button
									key={index}
									onClick={() => {
										action.onClick();
										if (action.closeOnClick !== false) {
											handleClose();
										}
									}}
									className={`
                    px-3 py-1.5 text-xs font-medium rounded-md transition-colors
                    ${
											action.variant === "primary"
												? "bg-primary-600 hover:bg-primary-700 text-white"
												: "bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300"
										}
                  `}
								>
									{action.label}
								</button>
							))}
						</div>
					)}
				</div>

				{alert.showCloseButton && (
					<div className="ml-auto pl-3">
						<button
							onClick={handleClose}
							className="inline-flex text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 transition-colors"
							type="button"
							aria-label="Close alert"
						>
							<X className="h-4 w-4" />
						</button>
					</div>
				)}
			</div>
		</div>
	);
};

export default AlertComponent;
