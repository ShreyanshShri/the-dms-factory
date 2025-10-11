// contexts/ConfirmContext.tsx
import React, {
	createContext,
	useContext,
	useState,
	useCallback,
	useRef,
	ReactNode,
} from "react";
import { ConfirmOptions, ConfirmContextType } from "../types/confirm";

const ConfirmContext = createContext<ConfirmContextType | undefined>(undefined);

export const useConfirm = (): ConfirmContextType => {
	const context = useContext(ConfirmContext);
	if (!context) {
		throw new Error("useConfirm must be used within a ConfirmProvider");
	}
	return context;
};

interface ConfirmProviderProps {
	children: ReactNode;
}

export const ConfirmProvider: React.FC<ConfirmProviderProps> = ({
	children,
}) => {
	const [state, setState] = useState<ConfirmOptions & { isOpen: boolean }>({
		isOpen: false,
	});
	const resolveRef = useRef<((value: boolean) => void) | null>(null);

	const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
		return new Promise<boolean>((resolve) => {
			setState({ ...options, isOpen: true });
			resolveRef.current = resolve;
		});
	}, []);

	const handleClose = useCallback((confirmed: boolean) => {
		setState((prev: any) => ({ ...prev, isOpen: false }));
		if (resolveRef.current) {
			resolveRef.current(confirmed);
			resolveRef.current = null;
		}
	}, []);

	const value: ConfirmContextType = {
		confirm,
		handleClose,
		state,
	};

	return (
		<ConfirmContext.Provider value={value}>{children}</ConfirmContext.Provider>
	);
};
