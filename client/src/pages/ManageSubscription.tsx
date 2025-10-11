import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { paymentAPI } from "../services/api";
import SubscriptionPage from "./SubscriptionPage";
import {
	CreditCard,
	Calendar,
	CheckCircle,
	AlertTriangle,
	ArrowUp,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useAlert } from "../contexts/AlertContext";
import { useConfirm } from "../contexts/ConfirmContext";

const ManageSubscription = () => {
	const { user, hasActiveSubscription } = useAuth();

	const alert = useAlert();
	const { confirm } = useConfirm();
	const [subscription, setSubscription] = useState<any>(null);
	const [billingHistory, setBillingHistory] = useState([]);
	const [loading, setLoading] = useState(true);
	const [actionLoading, setActionLoading] = useState(false);

	useEffect(() => {
		fetchSubscriptionData();
	}, [user]);

	const fetchSubscriptionData = async () => {
		try {
			const response = await paymentAPI.getManageSubscription();
			console.log(response);
			setSubscription(response.subscription);
			setBillingHistory(response.billingHistory);
		} catch (error) {
			console.error("Error fetching subscription:", error);
		} finally {
			setLoading(false);
		}
	};

	const handleUpgrade = async (newTier: any) => {
		setActionLoading(true);
		try {
			let response;
			if (subscription?.status === "trialing") {
				console.log("Upgrading from trial");
				response = await paymentAPI.upgradeFromTrial(newTier);
			} else {
				console.log("Upgrading subscription");
				response = await paymentAPI.upgradeSubscription(newTier);
			}
			window.location.href = response.checkoutUrl;
		} catch (error) {
			console.error("Upgrade failed:", error);
			alert.error("Upgrade failed. Please try again.");
		} finally {
			setActionLoading(false);
		}
	};

	const handleCancel = async (immediate = false) => {
		const confirmed = await confirm({
			title: "Cancel Subscription",
			message: immediate
				? "Cancel subscription immediately?"
				: "Cancel at period end?",
			variant: "danger",
			confirmLabel: "Yes, cancel",
		});
		if (!confirmed) return;

		setActionLoading(true);
		try {
			await paymentAPI.cancelSubscription(immediate);
			alert.success(
				immediate
					? "Subscription cancelled immediately"
					: "Subscription will cancel at period end"
			);
			fetchSubscriptionData(); // Refresh data
		} catch (error) {
			console.error("Cancellation failed:", error);
			alert.error("Cancellation failed. Please try again.");
		} finally {
			setActionLoading(false);
		}
	};

	const handleReactivate = async () => {
		setActionLoading(true);
		try {
			const res = await paymentAPI.reactivateSubscription();
			console.log(res);
			if (res.method === "checkout") {
				window.location.href = res.checkoutUrl;
			} else {
				alert.success("Subscription reactivated successfully!");
				fetchSubscriptionData(); // Refresh data
			}
		} catch (error) {
			console.error("Reactivation failed:", error);
			alert.error("Reactivation failed. Please try again.");
		} finally {
			setActionLoading(false);
		}
	};

	const getStatusBadge = () => {
		const status = subscription?.status;
		const statusColors = {
			trialing: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
			active:
				"bg-success-100 text-success-800 dark:bg-success-900 dark:text-success-300",
			past_due:
				"bg-warning-100 text-warning-800 dark:bg-warning-900 dark:text-warning-300",
			canceled: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
			incomplete: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
		} as any;

		return (
			<span
				className={`px-3 py-1 text-sm font-medium rounded-full ${
					statusColors[status] || "bg-gray-100 text-gray-800"
				}`}
			>
				{status === "trialing"
					? "Free Trial"
					: status?.charAt(0).toUpperCase() + status?.slice(1)}
			</span>
		);
	};

	const getTierUpgrades = () => {
		const tiers = ["basic", "standard", "premium"];
		if (!hasActiveSubscription()) return tiers;
		const currentTier = subscription?.tier;
		const currentIndex = tiers.indexOf(currentTier);
		return tiers.slice(currentIndex + 1);
	};

	// const getTierDowngrades = () => {
	// 	if (!hasActiveSubscription()) return [];
	// 	const currentTier = subscription?.tier;
	// 	const tiers = ["basic", "standard", "premium"];
	// 	const currentIndex = tiers.indexOf(currentTier);
	// 	return tiers.slice(0, currentIndex);
	// };

	const formatPrice = (tierValue: any) => {
		return `$${(tierValue / 100).toFixed(2)}`;
	};

	const formatDate = (dateString: any) => {
		return new Date(dateString).toLocaleDateString("en-US", {
			year: "numeric",
			month: "short",
			day: "numeric",
		});
	};

	if (loading) {
		return (
			<div className="flex items-center justify-center min-h-[400px]">
				<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
			</div>
		);
	}

	if (!subscription) {
		return (
			<div className="text-center py-12">
				<h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
					No Active Subscription
				</h2>
				<p className="text-gray-600 dark:text-gray-400 mb-6">
					You don't have an active subscription. Start your free trial today!
				</p>
				<button
					onClick={() => (window.location.href = "/subscription")}
					className="btn-primary"
				>
					View Plans
				</button>
			</div>
		);
	}

	if (user?.subscription?.hasUsedTrial === false) {
		return <SubscriptionPage />;
	}

	return (
		<div className="space-y-6 mx-8">
			{/* Page Header */}
			<div className="mb-8">
				<h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
					Manage Subscription
				</h1>
				<p className="text-gray-600 dark:text-gray-400">
					Manage your subscription, billing, and payment methods.
				</p>
			</div>

			{/* Current Subscription Card */}
			<div className="card p-6">
				<div className="flex items-start justify-between mb-6">
					<div className="flex items-center space-x-4">
						<div className="p-3 bg-primary-100 dark:bg-primary-900 rounded-lg">
							<CreditCard className="h-6 w-6 text-primary-600 dark:text-primary-400" />
						</div>
						<div>
							<h3 className="text-lg font-semibold text-gray-900 dark:text-white">
								Current Plan:{" "}
								{subscription.tier?.charAt(0).toUpperCase() +
									subscription.tier?.slice(1)}
							</h3>
							<p className="text-gray-600 dark:text-gray-400">
								${subscription.tierValue}.00/month
							</p>
						</div>
					</div>
					<div className="right flex gap-2">
						{subscription?.status === "trialing" && (
							<button
								onClick={() => handleUpgrade(subscription.tier)}
								className="btn-primary"
							>
								Upgrade to Full Version
							</button>
						)}
						{getStatusBadge()}
					</div>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
					<div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
						<Calendar className="h-5 w-5 text-gray-500 mx-auto mb-2" />
						<p className="text-sm text-gray-600 dark:text-gray-400">
							Days Remaining
						</p>
						<p className="text-lg font-semibold text-gray-900 dark:text-white">
							{subscription.daysRemaining || 0}
						</p>
					</div>

					<div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
						<CheckCircle className="h-5 w-5 text-gray-500 mx-auto mb-2" />
						<p className="text-sm text-gray-600 dark:text-gray-400">
							Renewal Date
						</p>
						<p className="text-lg font-semibold text-gray-900 dark:text-white">
							{subscription.currentPeriodEnd
								? formatDate(subscription.currentPeriodEnd)
								: "N/A"}
						</p>
					</div>

					<div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
						<AlertTriangle className="h-5 w-5 text-gray-500 mx-auto mb-2" />
						<p className="text-sm text-gray-600 dark:text-gray-400">
							Cancel at Period End
						</p>
						<p className="text-lg font-semibold text-gray-900 dark:text-white">
							{subscription.cancelAtPeriodEnd ? "Yes" : "No"}
						</p>
					</div>
				</div>

				{/* Action Buttons */}
				<div className="flex flex-wrap gap-3">
					{subscription.cancelAtPeriodEnd ||
					subscription.status === "canceled" ? (
						<button
							onClick={handleReactivate}
							disabled={actionLoading}
							className="btn-primary"
						>
							{actionLoading ? "Processing..." : "Reactivate Subscription"}
						</button>
					) : (
						<>
							{subscription.status === "active" && (
								<button
									onClick={() => handleCancel(false)}
									disabled={actionLoading}
									className="btn-secondary"
								>
									{actionLoading ? "Processing..." : "Cancel at Period End"}
								</button>
							)}
							<button
								onClick={() => handleCancel(true)}
								disabled={actionLoading}
								className="btn-danger"
							>
								{actionLoading ? "Processing..." : "Cancel Immediately"}
							</button>
						</>
					)}
				</div>
			</div>

			{/* Plan Changes */}
			<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
				{/* Upgrades */}
				{getTierUpgrades().length > 0 && (
					<div className="card p-6">
						<div className="flex items-center justify-between mb-4">
							<div className="flex items-center">
								<ArrowUp className="h-5 w-5 text-success-600 mr-2" />
								<h3 className="text-lg font-semibold text-gray-900 dark:text-white">
									Upgrade Plan
								</h3>
							</div>
							<Link
								to="/subscription"
								className="ml-2 text-sm font-medium text-primary-600 hover:underline dark:text-primary-500"
							>
								View All Plans
							</Link>
						</div>
						<div className="space-y-3">
							{getTierUpgrades().map((tier) => (
								<div
									key={tier}
									className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
								>
									<div>
										<p className="font-medium text-gray-900 dark:text-white">
											{tier.charAt(0).toUpperCase() + tier.slice(1)} Plan
										</p>
										<p className="text-sm text-gray-600 dark:text-gray-400">
											{formatPrice(
												tier === "standard"
													? 9700
													: tier === "premium"
													? 14900
													: 5500
											)}
											/month
										</p>
									</div>
									<button
										onClick={() => handleUpgrade(tier)}
										disabled={actionLoading}
										className="btn-primary text-sm"
									>
										Upgrade
									</button>
								</div>
							))}
							{/* {getTierDowngrades().map((tier) => (
								<div
									key={tier}
									className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
								>
									<div>
										<p className="font-medium text-gray-900 dark:text-white">
											{tier.charAt(0).toUpperCase() + tier.slice(1)} Plan
										</p>
										<p className="text-sm text-gray-600 dark:text-gray-400">
											{formatPrice(
												tier === "standard"
													? 9700
													: tier === "premium"
													? 14900
													: 4700
											)}
											/month
										</p>
									</div>
									<button
										onClick={() => handleUpgrade(tier)}
										disabled={actionLoading}
										className="btn-primary text-sm"
									>
										Downgrade
									</button>
								</div>
							))} */}
						</div>
					</div>
				)}

				{/* Billing History */}
				<div className="card p-6">
					<h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
						Recent Billing
					</h3>
					<div className="space-y-3">
						{billingHistory.length > 0 ? (
							billingHistory.map((transaction: any, index) => (
								<div
									key={index}
									className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
								>
									<div>
										<p className="font-medium text-gray-900 dark:text-white">
											{transaction.status === "succeeded"
												? "Payment"
												: "Failed Payment"}
										</p>
										<p className="text-sm text-gray-600 dark:text-gray-400">
											{formatDate(transaction.paidAt || transaction.createdAt)}
										</p>
										{/* {transaction.tier && (
											<p className="text-xs text-gray-500 dark:text-gray-500">
												{transaction.tier.charAt(0).toUpperCase() +
													transaction.tier.slice(1)}{" "}
												Plan
											</p>
										)} */}
									</div>
									<div className="text-right">
										<p className="font-medium text-gray-900 dark:text-white">
											${(transaction.amount / 100).toFixed(2)}{" "}
											{transaction.currency.toUpperCase()}
										</p>
										<span
											className={`text-xs px-2 py-1 rounded-full ${
												transaction.status === "succeeded"
													? "bg-success-100 text-success-800 dark:bg-success-900 dark:text-success-200"
													: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
											}`}
										>
											{transaction.status === "succeeded" ? "Paid" : "Failed"}
										</span>
										{transaction.invoiceUrl &&
											transaction.status === "succeeded" && (
												<a
													href={transaction.invoiceUrl}
													target="_blank"
													rel="noopener noreferrer"
													className="text-xs text-primary-600 dark:text-primary-400 hover:underline block mt-1"
												>
													View Invoice
												</a>
											)}
									</div>
								</div>
							))
						) : (
							<p className="text-gray-600 dark:text-gray-400 text-center py-4">
								No billing history yet
							</p>
						)}
					</div>
				</div>
			</div>
		</div>
	);
};

export default ManageSubscription;
