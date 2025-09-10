import { WhopCheckoutEmbed } from "@whop/checkout/react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function PaymentPortal() {
	const { user }: { user: any } = useAuth();
	const navigate = useNavigate();
	const params = new URLSearchParams(window.location.search);
	const planId = params.get("planId") || "plan_KUuUHqMFyFG1U";

	if (
		user === null ||
		user === undefined ||
		user.email === null ||
		user.email === undefined ||
		user.email === "undefined"
	) {
		return (
			<div className="admin-dashboard">
				<div className="access-denied">
					<h2>Please Login to continue...</h2>
					<Link to="/login">
						<button className="login-button">Login</button>
					</Link>
				</div>
			</div>
		);
	}

	const subscription = user.subscription || {};
	const notExpired =
		!subscription?.expiresAt || new Date(subscription?.expiresAt) > new Date();
	if (user?.subscription?.status === "active" && notExpired) {
		return (
			<div className="admin-dashboard">
				<div className="access-denied">
					<h2>You are already subscribed...</h2>
					<Link to="/dashboard">
						<button className="login-button">Go to Dashboard</button>
					</Link>
				</div>
			</div>
		);
	}

	return (
		<WhopCheckoutEmbed
			planId={planId}
			prefill={{ email: user.email }}
			disableEmail
			theme="dark"
			onComplete={(planId: any, receiptId: any) => {
				console.log(planId, receiptId);
				navigate(`/dashboard?receiptId=${receiptId}`);
			}}
		/>
	);
}
