// components/AlertContainer.tsx
import React from "react";
import { useAlert } from "../contexts/AlertContext";
import AlertComponent from "./Alert";

const AlertContainer: React.FC = () => {
	const { alerts, removeAlert } = useAlert();

	if (alerts.length === 0) return null;

	return (
		<div className="fixed bottom-4 right-4 z-50 max-h-screen overflow-hidden">
			<div className="space-y-2">
				{alerts.map((alert) => (
					<AlertComponent key={alert.id} alert={alert} onClose={removeAlert} />
				))}
			</div>
		</div>
	);
};

export default AlertContainer;
