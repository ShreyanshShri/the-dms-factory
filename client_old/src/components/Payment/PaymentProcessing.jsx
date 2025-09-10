import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { userAPI } from "../../services/api";
import "../../styles/paymentProcessing.css";

export default function PaymentProcessing({ userEmail }) {
	const navigate = useNavigate();
	const [message, setMessage] = useState("Waiting for confirmation...");

	useEffect(() => {
		const interval = setInterval(async () => {
			try {
				const res = await userAPI.getPaymentStatus();

				if (res.subscriptionStatus === "approved") {
					clearInterval(interval);
					navigate("/dashboard");
				} else if (res.subscriptionStatus === "failed") {
					clearInterval(interval);
					setMessage("Payment failed. Please try again.");
				}
			} catch (err) {
				console.error("Error fetching payment status:", err);
			}
		}, 5000); // every 5 seconds

		return () => clearInterval(interval);
	}, [userEmail, navigate]);

	return (
		<div className="processing-container">
			<div className="processing-card">
				<h1>{message}</h1>
			</div>
		</div>
	);
}
