import { WhopCheckoutEmbed } from "@whop/react/checkout";
import { Link, redirect } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "../../styles/payment.css";

export default function PaymentPortal() {
	const { user } = useAuth();
	if (
		user === null ||
		user === undefined ||
		user === "undefined" ||
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

	if (user.isSubscribed) {
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
			planId="plan_aXqVNsIW5DeJn"
			prefill={{ email: user.email }}
			disableEmail
			theme="dark"
			onComplete={(planId, receiptId) => {
				console.log(planId, receiptId);
				redirect("/dashboard");
			}}
		/>
	);
}
