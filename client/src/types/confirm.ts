// types/confirm.ts
import { ReactNode } from "react";

export type ConfirmVariant = "danger" | "warning" | "info" | "success";

export interface ConfirmOptions {
	title?: string;
	message?: string | ReactNode;
	confirmLabel?: string;
	cancelLabel?: string;
	variant?: ConfirmVariant;
	showCancelButton?: boolean;
	confirmButtonClass?: string;
	cancelButtonClass?: string;
}

export interface ConfirmContextType {
	confirm: (options: ConfirmOptions) => Promise<boolean>;
	handleClose: (confirmed: boolean) => void;
	state: ConfirmOptions & { isOpen: boolean };
}
