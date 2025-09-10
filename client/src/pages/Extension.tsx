import React from "react";
import {
	Download,
	FileArchive,
	Chrome,
	Settings,
	Globe,
	Play,
	Wrench,
	Smartphone,
	Lock,
} from "lucide-react";

const ExtensionDownload: React.FC = () => {
	const installSteps = [
		{
			id: "1",
			step: "Step 1",
			name: "Download the .ZIP File",
			description:
				"Click the download button to get the Chrome extension .ZIP file to your computer. The file contains all necessary extension files.",
			icon: Download,
			status: "required",
		},
		{
			id: "2",
			step: "Step 2",
			name: "Extract the .ZIP File",
			description:
				"Double-click the downloaded file to extract the extension folder. Right-click and select 'Extract All' on Windows or double-click on Mac.",
			icon: FileArchive,
			status: "required",
		},
		{
			id: "3",
			step: "Step 3",
			name: "Open Chrome Extensions",
			description:
				"Navigate to chrome://extensions/ in your Chrome browser. You can also access this via Chrome menu > More tools > Extensions.",
			icon: Chrome,
			status: "required",
		},
		{
			id: "4",
			step: "Step 4",
			name: "Enable Developer Mode",
			description:
				"Toggle on 'Developer mode' in the top-right corner of the extensions page. This allows you to install extensions from outside the Chrome Web Store.",
			icon: Settings,
			status: "required",
		},
		{
			id: "5",
			step: "Step 5",
			name: "Set Browser Language",
			description:
				"Ensure your browser language is set to English for optimal functionality. Go to Chrome Settings > Languages and set English as your primary language.",
			icon: Globe,
			status: "recommended",
		},
		{
			id: "6",
			step: "Step 6",
			name: "Install & Launch",
			description:
				"Drag the extracted folder into the extensions page and start your campaigns. The extension will appear in your Chrome toolbar once installed.",
			icon: Play,
			status: "required",
		},
	];

	const tips = [
		{
			id: "1",
			name: "Troubleshooting",
			description:
				"If the extension doesn't appear, try refreshing the extensions page or restarting Chrome.",
			icon: Wrench,
			status: "helpful",
		},
		{
			id: "2",
			name: "Browser Compatibility",
			description:
				"Works best with Chrome, but also compatible with Microsoft Edge and Brave browser.",
			icon: Chrome,
			status: "helpful",
		},
		{
			id: "3",
			name: "Account Sync",
			description:
				"Make sure you're logged into the same account on both the extension and web app.",
			icon: Smartphone,
			status: "helpful",
		},
		{
			id: "4",
			name: "Privacy & Security",
			description:
				"Your data is encrypted and secure. We never store your Instagram credentials.",
			icon: Lock,
			status: "helpful",
		},
	];

	const getStatusBadge = (status: string) => {
		switch (status) {
			case "required":
				return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
			case "recommended":
				return "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300";
			case "helpful":
				return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
			default:
				return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
		}
	};

	return (
		<div className="p-6 space-y-6">
			{/* Header Section */}
			<div className="mb-8">
				<h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
					The Buildfluence Extension
				</h1>
				<p className="text-gray-600 dark:text-gray-400 mb-6">
					Get started with The Buildfluence to send messages and scale your
					outreach campaigns
				</p>

				{/* Download CTA */}
				<div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white mb-6">
					<h2 className="text-xl font-semibold mb-2">
						Download to start sending messages
					</h2>
					<p className="text-blue-100 mb-4">
						Get the latest version of our Chrome extension and start your
						campaigns today
					</p>
					<a
						href="https://firebasestorage.googleapis.com/v0/b/colddmspro.firebasestorage.app/o/ChromeExtensionColdDMsPro.zip?alt=media"
						className="inline-flex items-center px-6 py-3 bg-white text-blue-600 rounded-lg font-semibold hover:bg-gray-100 transition-colors duration-200"
						download
					>
						<Download className="h-5 w-5 mr-2" />
						Download Extension
					</a>
				</div>
			</div>

			{/* Installation Guide */}
			<div className="mb-8">
				<h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
					Installation Guide
				</h2>
				<p className="text-gray-600 dark:text-gray-400 mb-6">
					Follow these simple steps to install and set up your Chrome extension
				</p>

				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					{installSteps.map((step) => {
						const IconComponent = step.icon;
						return (
							<div
								key={step.id}
								className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow duration-200"
							>
								<div className="flex items-start justify-between mb-4">
									<div className="flex items-center space-x-3">
										<div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
											<IconComponent className="h-6 w-6 text-blue-600 dark:text-blue-400" />
										</div>
										<div>
											<div className="flex items-center space-x-2">
												<h3 className="font-semibold text-gray-900 dark:text-white">
													{step.name}
												</h3>
											</div>
											<span className="text-sm text-blue-600 dark:text-blue-400 font-medium">
												{step.step}
											</span>
										</div>
									</div>
									<span
										className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(
											step.status
										)}`}
									>
										{step.status}
									</span>
								</div>

								<p className="text-gray-600 dark:text-gray-400 text-sm">
									{step.description}
								</p>
							</div>
						);
					})}
				</div>
			</div>

			{/* Tips for Success */}
			<div>
				<h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
					Tips for Success
				</h2>
				<p className="text-gray-600 dark:text-gray-400 mb-6">
					Essential tips to ensure smooth installation and optimal performance
				</p>

				<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
					{tips.map((tip) => {
						const IconComponent = tip.icon;
						return (
							<div
								key={tip.id}
								className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow duration-200"
							>
								<div className="flex items-start justify-between mb-4">
									<div className="flex items-center space-x-3">
										<div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
											<IconComponent className="h-6 w-6 text-green-600 dark:text-green-400" />
										</div>
										<div>
											<h3 className="font-semibold text-gray-900 dark:text-white">
												{tip.name}
											</h3>
											<span
												className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-1 ${getStatusBadge(
													tip.status
												)}`}
											>
												{tip.status}
											</span>
										</div>
									</div>
								</div>

								<p className="text-gray-600 dark:text-gray-400 text-sm">
									{tip.description}
								</p>
							</div>
						);
					})}
				</div>
			</div>
		</div>
	);
};

export default ExtensionDownload;
