import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { CheckCircle, XCircle, ArrowRight } from "lucide-react";
import { useAlert } from "../contexts/AlertContext";
import { paymentAPI } from "../services/api";

interface SessionResponse {
	success: boolean;
	payment_status: string;
	mode: "subscription" | "payment";
	customer: {
		email: string;
		name?: string;
	};
	metadata: {
		userId: string;
		tier: string;
		type?: string;
	};
	amount_total?: number;
	currency?: string;
	subscription?: {
		id: string;
		status: string;
	};
	payment_intent?: string;
}

const SuccessPage = () => {
	const [searchParams] = useSearchParams();
	const [sessionData, setSessionData] = useState<SessionResponse | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(false);
	const alert = useAlert();
	const sessionId = searchParams.get("session_id");

	useEffect(() => {
		const verifyPayment = async () => {
			if (!sessionId) {
				setError(true);
				setLoading(false);
				alert.error("Invalid session. Please try subscribing again.");
				return;
			}

			try {
				const response = await paymentAPI.getCheckoutConfirmation(sessionId);

				if (response.success && response.payment_status === "paid") {
					setSessionData(response);
					alert.success("Payment successful! Welcome aboard! 🎉");
				} else {
					setError(true);
					alert.error("Payment failed or pending. Please contact support.");
				}
			} catch (error) {
				console.error("Error verifying payment:", error);
				setError(true);
				alert.error("Error verifying payment. Please contact support.");
			} finally {
				setLoading(false);
			}
		};

		verifyPayment();
	}, [sessionId]);

	if (loading) {
		return (
			<div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
				<div className="card p-8 text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
					<p className="text-gray-600 dark:text-gray-400">
						Verifying your payment...
					</p>
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
				<div className="max-w-2xl mx-auto">
					<div className="card p-8 md:p-12 text-center">
						<div className="p-4 bg-error-100 dark:bg-error-900 rounded-full w-fit mx-auto mb-6">
							<XCircle className="w-12 h-12 text-error-600 dark:text-error-400" />
						</div>

						<h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
							Payment Verification Failed
						</h1>

						<p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
							We couldn't verify your payment. Please try again or contact
							support if the issue persists.
						</p>

						<div className="space-y-4">
							<Link
								to="/subscription"
								className="inline-flex items-center bg-primary-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors"
							>
								Try Again
								<ArrowRight className="w-5 h-5 ml-2" />
							</Link>
						</div>
					</div>
				</div>
			</div>
		);
	}

	const transactionId =
		sessionData?.payment_intent ||
		sessionData?.subscription?.id ||
		sessionId ||
		"";
	console.log("Transaction ID:", transactionId);
	const amount = sessionData?.amount_total
		? (sessionData.amount_total / 100).toFixed(2)
		: null;

	return (
		<div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
			<div className="max-w-2xl mx-auto">
				<div className="card p-8 md:p-12 text-center">
					<div className="p-4 bg-success-100 dark:bg-success-900 rounded-full w-fit mx-auto mb-6">
						<CheckCircle className="w-12 h-12 text-success-600 dark:text-success-400" />
					</div>

					<h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
						Payment Successful! 🎉
					</h1>

					<p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
						Your transaction has been completed successfully.
					</p>

					<div className="card p-6 mb-8 bg-gray-50 dark:bg-gray-800">
						{/* <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center justify-center">
							<Receipt className="w-5 h-5 mr-2" />
							Transaction Details
						</h3> */}
						<div className="space-y-3 text-left">
							<div className="flex justify-between items-center">
								<span className="text-gray-600 dark:text-gray-400">
									Transaction ID:
								</span>
								<span className="text-gray-900 dark:text-white font-mono text-sm">
									{transactionId}
								</span>
							</div>
							<div className="flex justify-between items-center">
								<span className="text-gray-600 dark:text-gray-400">
									Status:
								</span>
								<span className="text-success-600 dark:text-success-400 font-medium capitalize">
									{sessionData?.payment_status}
								</span>
							</div>
							{amount && (
								<div className="flex justify-between items-center">
									<span className="text-gray-600 dark:text-gray-400">
										Amount:
									</span>
									<span className="text-gray-900 dark:text-white font-semibold text-lg">
										${amount} {sessionData?.currency?.toUpperCase()}
									</span>
								</div>
							)}
							<div className="flex justify-between items-center">
								<span className="text-gray-600 dark:text-gray-400">Plan:</span>
								<span className="text-gray-900 dark:text-white font-medium capitalize">
									{sessionData?.metadata?.tier}
								</span>
							</div>
							<div className="flex justify-between items-center">
								<span className="text-gray-600 dark:text-gray-400">Email:</span>
								<span className="text-gray-900 dark:text-white font-medium">
									{sessionData?.customer?.email}
								</span>
							</div>
						</div>
					</div>

					<div className="space-y-4">
						<Link
							to="/dashboard"
							className="inline-flex items-center bg-primary-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors"
						>
							Go to Dashboard
							<ArrowRight className="w-5 h-5 ml-2" />
						</Link>
					</div>
				</div>
			</div>
		</div>
	);
};

export default SuccessPage;
