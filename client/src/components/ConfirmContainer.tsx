// components/ConfirmContainer.tsx
import React from "react";
import { useConfirm } from "../contexts/ConfirmContext";
import ConfirmComponent from "./Confirm";

const ConfirmContainer: React.FC = () => {
	const { state, handleClose } = useConfirm();

	return (
		<ConfirmComponent
			isOpen={state.isOpen}
			title={state.title}
			message={state.message || ""}
			confirmLabel={state.confirmLabel}
			cancelLabel={state.cancelLabel}
			variant={state.variant}
			showCancelButton={state.showCancelButton}
			onConfirm={() => handleClose(true)}
			onCancel={() => handleClose(false)}
		/>
	);
};

export default ConfirmContainer;
