import { useState } from "react";
import { Check, Star, Crown, Zap, ArrowRight } from "lucide-react";
import { useAlert } from "../contexts/AlertContext";
import { useAuth } from "../contexts/AuthContext";
import { paymentAPI } from "../services/api";

const pricingPlans = [
	{
		id: "basic",
		name: "Basic",
		price: 55,
		icon: Zap,
		description: "Perfect for getting started with essential features",
		features: [
			"Up to 5 projects",
			"Basic analytics",
			"Email support",
			"Standard templates",
			"Mobile app access",
			"Basic integrations",
		],
		popular: false,
		status: "active",
	},
	{
		id: "standard",
		name: "Standard",
		price: 97,
		icon: Star,
		description: "Most popular choice for growing businesses",
		features: [
			"Up to 25 projects",
			"Advanced analytics",
			"Priority support",
			"Premium templates",
			"Mobile app access",
			"Advanced integrations",
			"Team collaboration",
			"Custom branding",
		],
		popular: true,
		status: "active",
	},
	{
		id: "premium",
		name: "Premium",
		price: 149,
		icon: Crown,
		description: "Everything you need for enterprise-level operations",
		features: [
			"Unlimited projects",
			"Real-time analytics",
			"24/7 phone support",
			"Custom templates",
			"Mobile app access",
			"Enterprise integrations",
			"Team collaboration",
			"White-label solutions",
			"API access",
			"Dedicated account manager",
		],
		popular: false,
		status: "active",
	},
];

const SubscriptionPage = () => {
	const [loading, setLoading] = useState(null);
	const alert = useAlert();
	const { user } = useAuth();

	const handleSubscribe = async (plan: any) => {
		setLoading(plan.id);

		try {
			if (!user) {
				alert.error("Please log in to subscribe to a plan");
				return;
			}

			const response = await paymentAPI.createSubscription(plan.id);

			window.location.href = response.checkoutUrl;
		} catch (error: any) {
			console.error("Subscription error:", error);
			alert.error(error.message || "Failed to create subscription");
		} finally {
			setLoading(null);
		}
	};

	return (
		<div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
			<div className="max-w-7xl mx-auto">
				{/* Header Section */}
				<div className="text-center mb-12">
					<div className="inline-flex items-center px-4 py-2 rounded-full bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-300 text-sm font-medium mb-6">
						<Star className="w-4 h-4 mr-2" />
						14-Day Free Trial
					</div>

					<h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
						Choose Your Perfect Plan
					</h1>

					<p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
						Start with a 14-day free trial on any plan. Upgrade, downgrade, or
						cancel anytime.
					</p>
				</div>

				{/* Pricing Cards */}
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
					{pricingPlans.map((plan) => {
						const Icon = plan.icon;
						return (
							<div
								key={plan.id}
								className={`card p-6 hover:shadow-lg transition-all duration-200 group relative ${
									plan.popular
										? "ring-2 ring-primary-500 transform scale-105"
										: ""
								}`}
							>
								{/* Popular Badge */}
								{plan.popular && (
									<div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
										<span className="bg-primary-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
											Most Popular
										</span>
									</div>
								)}

								{/* Plan Header */}
								<div className="flex items-start justify-between mb-4">
									<div className="p-3 bg-primary-100 dark:bg-primary-900 rounded-lg group-hover:bg-primary-200 dark:group-hover:bg-primary-800 transition-colors">
										<Icon className="h-6 w-6 text-primary-600 dark:text-primary-400" />
									</div>
									<span
										className={`px-2 py-1 text-xs font-medium rounded-full ${
											plan.status === "active"
												? "bg-success-100 text-success-800 dark:bg-success-900 dark:text-success-300"
												: "bg-warning-100 text-warning-800 dark:bg-warning-900 dark:text-warning-300"
										}`}
									>
										{plan.status === "active" ? "Active" : "Beta"}
									</span>
								</div>

								{/* Plan Details */}
								<h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
									{plan.name}
								</h3>
								<p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
									{plan.description}
								</p>

								{/* Price */}
								<div className="mb-6">
									<div className="flex items-baseline">
										<span className="text-4xl font-bold text-gray-900 dark:text-white">
											${plan.price}
										</span>
										<span className="text-lg text-gray-500 dark:text-gray-400 ml-2">
											/month
										</span>
									</div>
									<div className="text-sm text-success-600 dark:text-success-400 font-medium mt-1">
										First 14 days free!
									</div>
								</div>

								{/* Features List */}
								<ul className="space-y-3 mb-8">
									{plan.features.map((feature, index) => (
										<li key={index} className="flex items-start">
											<Check className="w-4 h-4 text-success-500 mr-3 mt-0.5 flex-shrink-0" />
											<span className="text-gray-700 dark:text-gray-300 text-sm">
												{feature}
											</span>
										</li>
									))}
								</ul>

								{/* CTA Button */}
								<button
									onClick={() => handleSubscribe(plan)}
									disabled={loading === plan.id}
									className={`w-full py-3 px-4 rounded-lg font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center ${
										plan.popular
											? "bg-primary-600 text-white hover:bg-primary-700 dark:bg-primary-600 dark:hover:bg-primary-700"
											: "bg-gray-900 text-white hover:bg-gray-800 dark:bg-gray-800 dark:hover:bg-gray-700"
									}`}
								>
									{loading === plan.id ? (
										<div className="flex items-center">
											<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
											Processing...
										</div>
									) : (
										<>
											Start Free Trial
											<ArrowRight className="w-4 h-4 ml-2" />
										</>
									)}
								</button>
							</div>
						);
					})}
				</div>

				{/* Trust Indicators */}
				<div className="text-center mb-12">
					<div className="inline-flex items-center space-x-6 text-sm text-gray-500 dark:text-gray-400">
						<div className="flex items-center">
							<Check className="w-4 h-4 text-success-500 mr-1" />
							Cancel anytime
						</div>
						<div className="flex items-center">
							<Check className="w-4 h-4 text-success-500 mr-1" />
							Secure payment
						</div>
						<div className="flex items-center">
							<Check className="w-4 h-4 text-success-500 mr-1" />
							Instant access
						</div>
					</div>
				</div>

				{/* FAQ Section */}
				<div className="max-w-4xl mx-auto">
					<h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-8">
						Frequently Asked Questions
					</h2>

					<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
						<div className="card p-6 hover:shadow-md transition-all duration-200">
							<h3 className="font-semibold text-gray-900 dark:text-white mb-2">
								How does the free trial work?
							</h3>
							<p className="text-gray-600 dark:text-gray-400 text-sm">
								Start any plan with a 14-day free trial. No credit card required
								upfront. You'll only be charged after your trial ends.
							</p>
						</div>

						<div className="card p-6 hover:shadow-md transition-all duration-200">
							<h3 className="font-semibold text-gray-900 dark:text-white mb-2">
								Can I upgrade or downgrade?
							</h3>
							<p className="text-gray-600 dark:text-gray-400 text-sm">
								Yes! You can change your plan anytime. Upgrades take effect
								immediately, and downgrades take effect at your next billing
								cycle.
							</p>
						</div>

						<div className="card p-6 hover:shadow-md transition-all duration-200">
							<h3 className="font-semibold text-gray-900 dark:text-white mb-2">
								What payment methods do you accept?
							</h3>
							<p className="text-gray-600 dark:text-gray-400 text-sm">
								We accept all major credit cards (Visa, MasterCard, American
								Express) and other payment methods through Stripe.
							</p>
						</div>

						<div className="card p-6 hover:shadow-md transition-all duration-200">
							<h3 className="font-semibold text-gray-900 dark:text-white mb-2">
								Is my data secure?
							</h3>
							<p className="text-gray-600 dark:text-gray-400 text-sm">
								Absolutely. We use enterprise-grade security and all payments
								are processed securely through Stripe with bank-level
								encryption.
							</p>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default SubscriptionPage;
