// components/Confirm.tsx
import React, { useEffect, useRef } from "react";
import { X, AlertTriangle, Info, CheckCircle } from "lucide-react";
import { ConfirmVariant } from "../types/confirm";

interface ConfirmProps {
	isOpen: boolean;
	title?: string;
	message: string | React.ReactNode;
	confirmLabel?: string;
	cancelLabel?: string;
	variant?: ConfirmVariant;
	showCancelButton?: boolean;
	onConfirm: () => void;
	onCancel: () => void;
}

const ConfirmComponent: React.FC<ConfirmProps> = ({
	isOpen,
	title,
	message,
	confirmLabel = "Confirm",
	cancelLabel = "Cancel",
	variant = "info",
	showCancelButton = true,
	onConfirm,
	onCancel,
}) => {
	const confirmButtonRef = useRef<HTMLButtonElement>(null);
	const cancelButtonRef = useRef<HTMLButtonElement>(null);
	const dialogRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (isOpen) {
			// Focus the confirm button when dialog opens
			cancelButtonRef.current?.focus();

			// Trap focus within dialog
			const handleKeyDown = (e: KeyboardEvent) => {
				if (e.key === "Escape") {
					onCancel();
				}

				if (e.key === "Tab") {
					const focusableElements = dialogRef.current?.querySelectorAll(
						'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
					);
					if (!focusableElements || focusableElements.length === 0) return;

					const firstElement = focusableElements[0] as HTMLElement;
					const lastElement = focusableElements[
						focusableElements.length - 1
					] as HTMLElement;

					if (e.shiftKey && document.activeElement === firstElement) {
						e.preventDefault();
						lastElement.focus();
					} else if (!e.shiftKey && document.activeElement === lastElement) {
						e.preventDefault();
						firstElement.focus();
					}
				}
			};

			document.addEventListener("keydown", handleKeyDown);
			return () => document.removeEventListener("keydown", handleKeyDown);
		}
	}, [isOpen, onCancel]);

	const getVariantStyles = () => {
		switch (variant) {
			case "danger":
				return {
					icon: AlertTriangle,
					iconColor: "text-red-600",
					iconBg: "bg-red-100 dark:bg-red-900/30",
					buttonClass:
						"bg-red-600 hover:bg-red-700 focus:ring-red-500 text-white",
				};
			case "warning":
				return {
					icon: AlertTriangle,
					iconColor: "text-warning-600",
					iconBg: "bg-warning-100 dark:bg-warning-900/30",
					buttonClass:
						"bg-warning-600 hover:bg-warning-700 focus:ring-warning-500 text-white",
				};
			case "success":
				return {
					icon: CheckCircle,
					iconColor: "text-success-600",
					iconBg: "bg-success-100 dark:bg-success-900/30",
					buttonClass:
						"bg-success-600 hover:bg-success-700 focus:ring-success-500 text-white",
				};
			default:
				return {
					icon: Info,
					iconColor: "text-primary-600",
					iconBg: "bg-primary-100 dark:bg-primary-900/30",
					buttonClass:
						"bg-primary-600 hover:bg-primary-700 focus:ring-primary-500 text-white",
				};
		}
	};

	const variantStyles = getVariantStyles();
	const Icon = variantStyles.icon;

	if (!isOpen) return null;

	return (
		<div
			className="fixed inset-0 z-50 overflow-y-auto"
			aria-labelledby="confirm-title"
			aria-describedby="confirm-description"
			role="alertdialog"
			aria-modal="true"
		>
			{/* Backdrop */}
			<div
				className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
				onClick={onCancel}
				aria-hidden="true"
			/>

			{/* Center container */}
			<div className="flex min-h-full items-center justify-center p-4">
				<div
					ref={dialogRef}
					className="relative w-full max-w-md transform overflow-hidden rounded-lg bg-white dark:bg-gray-800 shadow-xl transition-all"
				>
					<div className="p-6">
						{/* Icon and Title */}
						<div className="flex items-start">
							<div
								className={`flex-shrink-0 rounded-full p-3 ${variantStyles.iconBg}`}
							>
								<Icon className={`h-6 w-6 ${variantStyles.iconColor}`} />
							</div>

							<div className="ml-4 flex-1">
								{title && (
									<h3
										id="confirm-title"
										className="text-lg font-semibold text-gray-900 dark:text-white"
									>
										{title}
									</h3>
								)}
								<div
									id="confirm-description"
									className={`${
										title ? "mt-2" : ""
									} text-sm text-gray-600 dark:text-gray-300`}
								>
									{message}
								</div>
							</div>

							{showCancelButton && (
								<button
									onClick={onCancel}
									className="ml-2 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 transition-colors"
									aria-label="Close dialog"
								>
									<X className="h-5 w-5" />
								</button>
							)}
						</div>

						{/* Actions */}
						<div className="mt-6 flex justify-end space-x-3">
							{showCancelButton && (
								<button
									ref={cancelButtonRef}
									onClick={onCancel}
									className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
								>
									{cancelLabel}
								</button>
							)}
							<button
								ref={confirmButtonRef}
								onClick={onConfirm}
								className={`px-4 py-2 text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors ${variantStyles.buttonClass}`}
							>
								{confirmLabel}
							</button>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default ConfirmComponent;
