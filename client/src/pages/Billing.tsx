// Billing.tsx
import React, { useEffect, useState } from "react";
import {
	CreditCard,
	Calendar,
	CheckCircle,
	XCircle,
	Clock,
	AlertCircle,
	DollarSign,
	User,
	Shield,
} from "lucide-react";
import { billingAPI } from "../services/api";
import { useTheme } from "../contexts/ThemeContext";

interface BillingRecord {
	id: string;
	transactionId: string;
	amount: number;
	currency: string;
	status: string;
	tier: string;
	tierValue: number;
	eventType: string;
	paymentMethod: {
		type: string;
		cardBrand?: string;
		cardLast4?: string;
	};
	createdAt: string;
	timestamp: number;
}

interface Subscription {
	tier: string;
	tierValue: number;
	status: string;
	planId: string;
	currentPeriodEnd?: string;
	isActive: boolean;
}

const Billing: React.FC = () => {
	const [billingHistory, setBillingHistory] = useState<BillingRecord[]>([]);
	const [subscription, setSubscription] = useState<Subscription | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const { isDark } = useTheme();

	useEffect(() => {
		const fetchBillingData = async () => {
			try {
				setLoading(true);
				const [historyResponse, subscriptionResponse] = await Promise.all([
					billingAPI.getBillingHistory(),
					billingAPI.getSubscription(),
				]);

				setBillingHistory(historyResponse.billingHistory || []);
				setSubscription(subscriptionResponse.subscription || null);
				setError(null);
			} catch (err: any) {
				setError(
					err.response?.data?.message || "Failed to load billing information"
				);
				console.error("Billing fetch error:", err);
			} finally {
				setLoading(false);
			}
		};

		fetchBillingData();
	}, []);

	const getStatusIcon = (status: string) => {
		switch (status.toLowerCase()) {
			case "active":
			case "paid":
			case "succeeded":
				return <CheckCircle className="h-4 w-4 text-green-500" />;
			case "failed":
			case "expired":
				return <XCircle className="h-4 w-4 text-red-500" />;
			case "pending":
			case "cancelling":
				return <Clock className="h-4 w-4 text-yellow-500" />;
			default:
				return <AlertCircle className="h-4 w-4 text-gray-500" />;
		}
	};

	const getStatusBadge = (status: string) => {
		const baseClasses =
			"inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium";

		switch (status.toLowerCase()) {
			case "active":
			case "paid":
			case "succeeded":
				return `${baseClasses} bg-green-100 text-green-800`;
			case "failed":
			case "expired":
				return `${baseClasses} bg-red-100 text-red-800`;
			case "pending":
			case "cancelling":
				return `${baseClasses} bg-yellow-100 text-yellow-800`;
			default:
				return `${baseClasses} bg-gray-100 text-gray-800`;
		}
	};

	const getTierIcon = (tier: string) => {
		switch (tier.toLowerCase()) {
			case "premium":
				return <Shield className="h-5 w-5 text-purple-500" />;
			case "standard":
				return <User className="h-5 w-5 text-blue-500" />;
			case "basic":
				return <DollarSign className="h-5 w-5 text-green-500" />;
			default:
				return <AlertCircle className="h-5 w-5 text-gray-500" />;
		}
	};

	if (loading) {
		return (
			<div
				className={`flex items-center justify-center h-64 ${
					isDark ? "dark" : ""
				}`}
			>
				<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
				<span className="ml-2 text-gray-600">
					Loading billing information...
				</span>
			</div>
		);
	}

	if (error) {
		return (
			<div
				className={`bg-red-50 border border-red-200 rounded-lg p-6 ${
					isDark ? "dark" : ""
				}`}
			>
				<div className="flex items-center">
					<XCircle className="h-5 w-5 text-red-500 mr-2" />
					<span className="text-red-800">{error}</span>
				</div>
			</div>
		);
	}

	return (
		<div
			className={`space-y-6 container mx-auto px-6 py-6 ${
				isDark ? "dark" : ""
			}`}
		>
			{/* Page Header */}
			<div className="mb-8">
				<h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
					Billing & Subscription
				</h1>
				<p className="text-gray-600 dark:text-gray-400">
					Manage your subscription and view transaction history
				</p>
			</div>

			{/* Current Subscription Card */}
			<div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
				<div className="flex items-center justify-between mb-4">
					<h2 className="text-lg font-semibold text-gray-900 dark:text-white">
						Current Subscription
					</h2>
					{subscription && getStatusIcon(subscription.status)}
				</div>

				{subscription ? (
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
						<div className="flex items-center space-x-3">
							{getTierIcon(subscription.tier)}
							<div>
								<p className="text-sm text-gray-500 dark:text-gray-400">Plan</p>
								<p className="font-semibold text-gray-900 dark:text-white">
									{subscription.tier}
								</p>
							</div>
						</div>

						<div className="flex items-center space-x-3">
							<DollarSign className="h-5 w-5 text-green-500" />
							<div>
								<p className="text-sm text-gray-500 dark:text-gray-400">
									Price
								</p>
								<p className="font-semibold text-gray-900 dark:text-white">
									${subscription.tierValue}
								</p>
							</div>
						</div>

						<div className="flex items-center space-x-3">
							{getStatusIcon(subscription.status)}
							<div>
								<p className="text-sm text-gray-500 dark:text-gray-400">
									Status
								</p>
								<span className={getStatusBadge(subscription.status)}>
									{subscription.status}
								</span>
							</div>
						</div>

						{subscription.currentPeriodEnd && (
							<div className="flex items-center space-x-3">
								<Calendar className="h-5 w-5 text-blue-500" />
								<div>
									<p className="text-sm text-gray-500 dark:text-gray-400">
										Next Billing
									</p>
									<p className="font-semibold text-gray-900 dark:text-white">
										{new Date(
											subscription.currentPeriodEnd
										).toLocaleDateString()}
									</p>
								</div>
							</div>
						)}
					</div>
				) : (
					<div className="text-center py-8">
						<AlertCircle className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
						<p className="text-gray-600 dark:text-gray-400">
							No active subscription found
						</p>
					</div>
				)}
			</div>

			{/* Transaction History */}
			<div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
				<div className="p-6 border-b border-gray-200 dark:border-gray-700">
					<h2 className="text-lg font-semibold text-gray-900 dark:text-white">
						Transaction History
					</h2>
					<p className="text-sm text-gray-600 dark:text-gray-400">
						Your recent billing transactions and events
					</p>
				</div>

				<div className="overflow-hidden">
					{billingHistory.length === 0 ? (
						<div className="text-center py-12">
							<CreditCard className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
							<p className="text-gray-600 dark:text-gray-400">
								No transactions found
							</p>
						</div>
					) : (
						<div className="overflow-x-auto">
							<table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
								<thead className="bg-gray-50 dark:bg-gray-700">
									<tr>
										<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
											Date & Transaction
										</th>
										<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
											Plan & Amount
										</th>
										<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
											Payment Method
										</th>
										<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
											Status
										</th>
										<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
											Event Type
										</th>
									</tr>
								</thead>
								<tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
									{billingHistory.map((transaction) => (
										<tr
											key={transaction.id}
											className="hover:bg-gray-50 dark:hover:bg-gray-700"
										>
											<td className="px-6 py-4 whitespace-nowrap">
												<div>
													<div className="text-sm font-medium text-gray-900 dark:text-white">
														{new Date(
															transaction.createdAt
														).toLocaleDateString()}
													</div>
													<div className="text-sm text-gray-500 dark:text-gray-400">
														{transaction.transactionId || "N/A"}
													</div>
												</div>
											</td>
											<td className="px-6 py-4 whitespace-nowrap">
												<div className="flex items-center">
													{getTierIcon(transaction.tier)}
													<div className="ml-2">
														<div className="text-sm font-medium text-gray-900 dark:text-white">
															{transaction.tier}
														</div>
														<div className="text-sm text-gray-500 dark:text-gray-400">
															${transaction.amount}{" "}
															{transaction.currency?.toUpperCase()}
														</div>
													</div>
												</div>
											</td>
											<td className="px-6 py-4 whitespace-nowrap">
												<div className="flex items-center">
													<CreditCard className="h-4 w-4 text-gray-400 dark:text-gray-500 mr-2" />
													<div>
														<div className="text-sm text-gray-900 dark:text-white capitalize">
															{transaction.paymentMethod?.type || "N/A"}
														</div>
														{transaction.paymentMethod?.cardLast4 && (
															<div className="text-sm text-gray-500 dark:text-gray-400">
																•••• {transaction.paymentMethod.cardLast4}
															</div>
														)}
													</div>
												</div>
											</td>
											<td className="px-6 py-4 whitespace-nowrap">
												<span className={getStatusBadge(transaction.status)}>
													{transaction.status}
												</span>
											</td>
											<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 capitalize">
												{transaction.eventType.replace("_", " ")}
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					)}
				</div>
			</div>
		</div>
	);
};

export default Billing;
