import React from "react";
import { Link } from "react-router-dom";
import { XCircle, ArrowLeft, Mail } from "lucide-react";
import { useAlert } from "../contexts/AlertContext";

const CancelPage = () => {
	const alert = useAlert();

	React.useEffect(() => {
		alert.error("Payment was canceled. No charges were made.");
	}, [alert]);

	return (
		<div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
			<div className="max-w-2xl mx-auto">
				<div className="card p-8 md:p-12 text-center">
					<div className="p-4 bg-red-100 dark:bg-red-900 rounded-full w-fit mx-auto mb-6">
						<XCircle className="w-12 h-12 text-red-600 dark:text-red-400" />
					</div>

					<h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
						Payment Canceled
					</h1>

					<p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
						No worries! Your payment was canceled and no charges were made. You
						can try again anytime or contact us if you need help.
					</p>

					<div className="space-y-4">
						<Link
							to="/pricing"
							className="inline-flex items-center bg-primary-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors"
						>
							<ArrowLeft className="w-5 h-5 mr-2" />
							Back to Pricing
						</Link>

						<div className="text-center">
							<p className="text-gray-500 dark:text-gray-400 mb-2 flex items-center justify-center">
								<Mail className="w-4 h-4 mr-2" />
								Need help?
							</p>
							<Link
								to="/contact"
								className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 font-medium"
							>
								Contact our support team
							</Link>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default CancelPage;
