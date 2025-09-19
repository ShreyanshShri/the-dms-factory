import React from "react";
import {
	Mail,
	Phone,
	MessageCircle,
	Users,
	Calendar,
	ExternalLink,
	Copy,
} from "lucide-react";

const ContactMe: React.FC = () => {
	const [copiedField, setCopiedField] = React.useState<string | null>(null);

	const contactMethods = [
		{
			id: "1",
			name: "Email",
			description: "Send me an email for business inquiries or collaboration",
			icon: Mail,
			value: "contact@yourname.com",
			action: "mailto:contact@yourname.com",
			status: "preferred",
			responseTime: "Within 24 hours",
		},
		{
			id: "2",
			name: "Telegram",
			description: "Quick messaging for urgent matters or casual chat",
			icon: MessageCircle,
			value: "@yourusername",
			action: "https://t.me/yourusername",
			status: "active",
			responseTime: "Within 2 hours",
		},
		{
			id: "3",
			name: "Mobile",
			description: "Call or WhatsApp for immediate assistance",
			icon: Phone,
			value: "+1 (555) 123-4567",
			action: "tel:+15551234567",
			status: "active",
			responseTime: "9 AM - 6 PM EST",
		},
		{
			id: "4",
			name: "Whop Community",
			description: "Join our exclusive community for updates and networking",
			icon: Users,
			value: "Join Community",
			action: "https://whop.com/yourcommunity",
			status: "active",
			responseTime: "Active daily",
		},
		{
			id: "5",
			name: "Schedule Meeting",
			description: "Book a 30-minute consultation call at your convenience",
			icon: Calendar,
			value: "Book a Call",
			action: "https://calendly.com/yourname",
			status: "active",
			responseTime: "Same day booking",
		},
	];

	const copyToClipboard = (text: string, field: string) => {
		navigator.clipboard.writeText(text).then(() => {
			setCopiedField(field);
			setTimeout(() => setCopiedField(null), 2000);
		});
	};

	const handleAction = (method: (typeof contactMethods)[0]) => {
		if (method.name === "Email" || method.name === "Mobile") {
			copyToClipboard(method.value, method.id);
		} else if (method.action && method.action !== "#") {
			window.open(method.action, "_blank");
		}
	};

	const getStatusColor = (status: string) => {
		switch (status) {
			case "preferred":
				return "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20";
			case "active":
				return "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20";
			case "beta":
				return "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20";
			default:
				return "text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/20";
		}
	};

	return (
		<div className="min-h-screen bg-gradient-to-br from-gray-50 to-white dark:from-gray-950 dark:to-gray-900">
			<div className="container mx-auto px-4 py-12">
				{/* Header */}
				<div className="text-center mb-12">
					<h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
						Get In Touch
					</h1>
					<p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
						Let's connect! Choose your preferred method to reach out for
						collaborations, questions, or just to say hello.
					</p>
				</div>

				{/* Contact Methods Grid */}
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
					{contactMethods.map((method) => {
						const IconComponent = method.icon;
						return (
							<div
								key={method.id}
								className="group relative bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg dark:hover:shadow-2xl transition-all duration-300 hover:border-blue-300 dark:hover:border-blue-600 cursor-pointer"
								onClick={() => handleAction(method)}
							>
								{/* Status Badge */}
								<div
									className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
										method.status
									)} mb-4`}
								>
									{method.status.charAt(0).toUpperCase() +
										method.status.slice(1)}
								</div>

								{/* Icon */}
								<div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center mb-4 group-hover:bg-blue-200 dark:group-hover:bg-blue-900/50 transition-colors">
									<IconComponent className="w-6 h-6 text-blue-600 dark:text-blue-400" />
								</div>

								{/* Content */}
								<div className="mb-4">
									<h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
										{method.name}
									</h3>
									<p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed mb-3">
										{method.description}
									</p>
									<div className="flex items-center justify-between">
										<span className="text-blue-600 dark:text-blue-400 font-medium">
											{method.value}
										</span>
										{(method.name === "Email" || method.name === "Mobile") && (
											<div className="flex items-center">
												{copiedField === method.id ? (
													<span className="text-emerald-600 dark:text-emerald-400 text-xs">
														Copied!
													</span>
												) : (
													<Copy className="w-4 h-4 text-gray-400 dark:text-gray-500" />
												)}
											</div>
										)}
										{method.action &&
											method.action !== "#" &&
											!method.action.includes("mailto") &&
											!method.action.includes("tel") && (
												<ExternalLink className="w-4 h-4 text-gray-400 dark:text-gray-500 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors" />
											)}
									</div>
								</div>

								{/* Response Time */}
								<div className="text-xs text-gray-500 dark:text-gray-400 pt-3 border-t border-gray-100 dark:border-gray-700">
									Response time: {method.responseTime}
								</div>

								{/* Hover Effect */}
								<div className="absolute inset-0 bg-blue-500/5 dark:bg-blue-400/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
							</div>
						);
					})}
				</div>

				{/* Additional Info Section */}
				{/* <div className="mt-16 text-center">
					<div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-8 max-w-4xl mx-auto">
						<h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
							Why Connect With Me?
						</h2>
						<div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
							<div className="text-center">
								<div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center mx-auto mb-3">
									<Users className="w-6 h-6 text-purple-600 dark:text-purple-400" />
								</div>
								<h3 className="font-semibold text-gray-900 dark:text-white mb-2">
									Collaboration
								</h3>
								<p className="text-gray-600 dark:text-gray-300 text-sm">
									Always open to exciting projects and partnerships
								</p>
							</div>
							<div className="text-center">
								<div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center mx-auto mb-3">
									<MessageCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
								</div>
								<h3 className="font-semibold text-gray-900 dark:text-white mb-2">
									Quick Response
								</h3>
								<p className="text-gray-600 dark:text-gray-300 text-sm">
									Fast replies and clear communication guaranteed
								</p>
							</div>
							<div className="text-center">
								<div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-xl flex items-center justify-center mx-auto mb-3">
									<ExternalLink className="w-6 h-6 text-orange-600 dark:text-orange-400" />
								</div>
								<h3 className="font-semibold text-gray-900 dark:text-white mb-2">
									Multiple Channels
								</h3>
								<p className="text-gray-600 dark:text-gray-300 text-sm">
									Reach me through your preferred communication method
								</p>
							</div>
						</div>
					</div>
				</div> */}

				{/* Call to Action */}
				{/* <div className="mt-12 text-center">
					<p className="text-gray-600 dark:text-gray-300 mb-6">
						Don't see your preferred contact method?
					</p>
					<button
						onClick={() => window.open("mailto:contact@yourname.com", "_blank")}
						className="inline-flex items-center px-8 py-3 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-medium rounded-xl transition-colors duration-200"
					>
						<Mail className="w-5 h-5 mr-2" />
						Send Email Anyway
					</button>
				</div> */}
			</div>
		</div>
	);
};

export default ContactMe;
