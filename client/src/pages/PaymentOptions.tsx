import React from "react";
import { useNavigate } from "react-router-dom";
import { CreditCard, Star, Zap } from "lucide-react";
import { checkoutLinks } from "../../checkoutLinks";
import { useAuth } from "../contexts/AuthContext";

const PaymentPlans: React.FC = () => {
	const navigate = useNavigate();
	const { user } = useAuth();

	const planDetails = [
		{
			...checkoutLinks.find((plan: any) => plan.name === "Basic"),
			title: "Basic Plan",
			description: "Perfect for getting started with automated outreach",
			icon: CreditCard,
			features: [
				"Up to 500 DMs/month",
				"2 Social Accounts",
				"Basic Templates",
				"Email Support",
			],
			popular:
				user?.subscription?.status === "active"
					? checkoutLinks.find((plan: any) => plan.name === "Basic")?.planId ===
					  user?.subscription?.planId
					: false,
			color: "from-blue-500 to-blue-600",
		},
		{
			...checkoutLinks.find((plan) => plan.name === "Standard"),
			title: "Standard Plan",
			description: "Best for growing businesses and agencies",
			icon: Star,
			features: [
				"Up to 2,000 DMs/month",
				"5 Social Accounts",
				"Advanced Templates",
				"Priority Support",
				"Analytics Dashboard",
			],
			popular:
				user?.subscription?.status === "active"
					? checkoutLinks.find((plan: any) => plan.name === "Standard")
							?.planId === user?.subscription?.planId
					: true,
			color: "from-purple-500 to-purple-600",
		},
		{
			...checkoutLinks.find((plan) => plan.name === "Premium"),
			title: "Premium Plan",
			description: "Maximum results for enterprise and agencies",
			icon: Zap,
			features: [
				"Unlimited DMs",
				"Unlimited Accounts",
				"Custom Templates",
				"24/7 Support",
				"Advanced Analytics",
				"White Label",
			],
			popular:
				user?.subscription?.status === "active"
					? checkoutLinks.find((plan: any) => plan.name === "Premium")
							?.planId === user?.subscription?.planId
					: false,
			color: "from-orange-500 to-orange-600",
		},
	];

	console.log(
		"checkout options",
		checkoutLinks.find((plan: any) => plan.name === "Premium")?.planId
	);
	console.log("db data", user?.subscription?.planId);

	const handlePlanClick = (planId: string) => {
		navigate(`/payment-portal?planId=${planId}`);
	};

	return (
		<div className="min-h-screen bg-white dark:bg-gray-900 p-6">
			<div className="max-w-7xl mx-auto">
				{/* Header */}
				<div className="text-center mb-12">
					<h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
						Choose Your Plan
					</h1>
					<p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
						Select the perfect plan to scale your outreach and maximize your
						results
					</p>
				</div>

				{/* Payment Plans Grid */}
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
					{planDetails.map((plan) => {
						const Icon = plan.icon;
						return (
							<div
								key={plan.planId}
								onClick={() => handlePlanClick(plan.planId as any)}
								className={`relative bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 cursor-pointer transition-all duration-300 hover:shadow-xl hover:border-gray-300 dark:hover:border-gray-600 hover:-translate-y-1 ${
									plan.popular
										? "ring-2 ring-purple-500 dark:ring-purple-400"
										: ""
								}`}
							>
								{/* Popular Badge */}
								{plan.popular && (
									<div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
										<span className="bg-gradient-to-r from-purple-500 to-purple-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
											{user?.subscription?.status === "active"
												? "Current Plan"
												: "Most Popular"}
										</span>
									</div>
								)}

								{/* Plan Header */}
								<div className="flex items-center mb-4">
									<div
										className={`p-3 rounded-lg bg-gradient-to-r ${plan.color} text-white mr-4`}
									>
										<Icon className="w-6 h-6" />
									</div>
									<div>
										<h3 className="text-xl font-bold text-gray-900 dark:text-white">
											{plan.title}
										</h3>
										<div className="flex items-baseline">
											<span className="text-3xl font-bold text-gray-900 dark:text-white">
												${plan.value}
											</span>
											<span className="text-gray-600 dark:text-gray-400 ml-1">
												/month
											</span>
										</div>
									</div>
								</div>

								{/* Description */}
								<p className="text-gray-600 dark:text-gray-300 mb-6">
									{plan.description}
								</p>

								{/* Features */}
								<div className="space-y-3 mb-8">
									{plan.features.map((feature, index) => (
										<div key={index} className="flex items-center">
											<svg
												className="w-4 h-4 text-green-500 mr-3 flex-shrink-0"
												fill="currentColor"
												viewBox="0 0 20 20"
											>
												<path
													fillRule="evenodd"
													d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
													clipRule="evenodd"
												/>
											</svg>
											<span className="text-gray-700 dark:text-gray-300 text-sm">
												{feature}
											</span>
										</div>
									))}
								</div>

								{/* CTA Button */}
								<button
									className={`w-full py-3 px-6 rounded-lg font-semibold text-white transition-all duration-300 ${
										plan.popular
											? "bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700"
											: "bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800"
									} transform hover:scale-105`}
									onClick={(e) => {
										e.stopPropagation();
										handlePlanClick(plan.planId as string);
									}}
								>
									Get Started
								</button>

								{/* Plan ID for reference */}
								<div className="mt-4 text-xs text-gray-400 dark:text-gray-500 text-center">
									Plan ID: {plan.planId}
								</div>
							</div>
						);
					})}
				</div>

				{/* Additional Info */}
				<div className="mt-12 text-center">
					<p className="text-gray-600 dark:text-gray-400 mb-4">
						All plans include a 14-day free trial. Cancel anytime.
					</p>
					<div className="flex justify-center space-x-8 text-sm text-gray-500 dark:text-gray-400">
						<span className="flex items-center">
							<svg
								className="w-4 h-4 mr-2 text-green-500"
								fill="currentColor"
								viewBox="0 0 20 20"
							>
								<path
									fillRule="evenodd"
									d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
									clipRule="evenodd"
								/>
							</svg>
							No setup fees
						</span>
						<span className="flex items-center">
							<svg
								className="w-4 h-4 mr-2 text-green-500"
								fill="currentColor"
								viewBox="0 0 20 20"
							>
								<path
									fillRule="evenodd"
									d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
									clipRule="evenodd"
								/>
							</svg>
							Cancel anytime
						</span>
						<span className="flex items-center">
							<svg
								className="w-4 h-4 mr-2 text-green-500"
								fill="currentColor"
								viewBox="0 0 20 20"
							>
								<path
									fillRule="evenodd"
									d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
									clipRule="evenodd"
								/>
							</svg>
							24/7 support
						</span>
					</div>
				</div>
			</div>
		</div>
	);
};

export default PaymentPlans;
