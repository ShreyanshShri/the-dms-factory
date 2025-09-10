import React, { useState, useEffect } from "react";
import { User, Shield, Bell, Palette, Save } from "lucide-react";
import { useTheme } from "../contexts/ThemeContext";
import { userAPI } from "../services/api";
import { Link } from "react-router-dom";

const SettingsPage: React.FC = () => {
	const { isDark, toggleTheme } = useTheme();

	const [displayName, setDisplayName] = useState("");
	const [email, setEmail] = useState("");
	const [timeZone, setTimeZone] = useState("UTC-5 (Eastern Time)");

	const [notifications, setNotifications] = useState({
		email: true,
		push: true,
		sms: false,
		errors: true,
		limits: true,
		completion: true,
	});

	const [privacy, setPrivacy] = useState({
		dataSharing: false,
		analytics: true,
		marketing: false,
	});

	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [_message, setMessage] = useState<{
		type: "success" | "error";
		text: string;
	} | null>(null);

	const handleNotificationChange = (key: keyof typeof notifications) => {
		setNotifications((prev) => ({
			...prev,
			[key]: !prev[key],
		}));
	};

	const handlePrivacyChange = (key: keyof typeof privacy) => {
		setPrivacy((prev) => ({
			...prev,
			[key]: !prev[key],
		}));
	};

	const navigateTo = (id: string) => {
		document.getElementById("content")?.scrollTo({
			top: document.getElementById(id)?.offsetTop || 0,
			behavior: "smooth",
		});
	};

	useEffect(() => {
		async function fetchSettings() {
			try {
				setLoading(true);
				const response = await userAPI.getSettings();
				console.log(response);
				if (response.success && response.data) {
					setNotifications(response.data.notifications || notifications);
					setPrivacy(response.data.privacy || privacy);
					setDisplayName(response.data.displayName || "");
					setEmail(response.data.email || "");
					setTimeZone(response.data.timeZone || "UTC-5 (Eastern Time)");
				}
			} catch (error) {
				console.error("Failed to fetch settings:", error);
				setMessage({ type: "error", text: "Failed to load settings" });
			} finally {
				setLoading(false);
			}
		}
		fetchSettings();
	}, []);

	const saveSettings = async () => {
		try {
			setSaving(true);
			const response = await userAPI.updateSettings({
				notifications,
				privacy,
				displayName,
				email,
				timeZone,
			});
			if (response.success) {
				setMessage({ type: "success", text: "Settings saved successfully" });
			} else {
				setMessage({ type: "error", text: "Failed to save settings" });
			}
		} catch (error) {
			console.error("Failed to save settings:", error);
			setMessage({ type: "error", text: "Failed to save settings" });
		} finally {
			setSaving(false);
		}
	};

	return (
		<div className="space-y-6">
			{/* Page Header */}
			<div className="flex items-center justify-between mb-6">
				<div>
					<h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
						Settings
					</h1>
					<p className="text-gray-600 dark:text-gray-400">
						Configure your Buildfluence account preferences and settings
					</p>
				</div>

				<button
					className="btn-primary flex items-center space-x-2"
					onClick={saveSettings}
					disabled={saving || loading}
				>
					<Save className="h-4 w-4" />
					<span>{saving ? "Saving..." : "Save Changes"}</span>
				</button>
			</div>

			{/* Settings Sections */}
			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				{/* Navigation */}
				<div className="lg:col-span-1">
					<div className="card p-4">
						<nav className="space-y-2">
							<button
								className="w-full text-left px-3 py-2 text-sm font-medium text-primary-700 dark:text-primary-300 bg-primary-50 dark:bg-primary-900/20 rounded-lg"
								onClick={() => navigateTo("general")}
							>
								General
							</button>
							<button
								className="w-full text-left px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
								onClick={() => navigateTo("notification")}
							>
								Notifications
							</button>
							<button
								className="w-full text-left px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
								onClick={() => navigateTo("privacy")}
							>
								Privacy & Security
							</button>
							<Link to="/billing">
								<button className="w-full text-left px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
									Billing
								</button>
							</Link>
						</nav>
					</div>
				</div>

				{/* Main Content */}
				<div className="lg:col-span-2 space-y-6">
					{/* General Settings */}
					<div className="card p-6">
						<div className="flex items-center space-x-3 mb-6">
							<div className="p-2 bg-primary-100 dark:bg-primary-900 rounded-lg">
								<User className="h-5 w-5 text-primary-600 dark:text-primary-400" />
							</div>
							<h2 className="text-lg font-semibold text-gray-900 dark:text-white">
								General Settings
							</h2>
						</div>

						<div className="space-y-4">
							<div>
								<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
									Display Name
								</label>
								<input
									type="text"
									value={displayName}
									onChange={(e) => setDisplayName(e.target.value)}
									className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
								/>
							</div>

							<div>
								<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
									Email Address
								</label>
								<input
									type="email"
									value={email}
									onChange={(e) => setEmail(e.target.value)}
									className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
								/>
							</div>

							<div>
								<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
									Time Zone
								</label>
								<select
									value={timeZone}
									onChange={(e) => setTimeZone(e.target.value)}
									className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
								>
									<option>UTC-5 (Eastern Time)</option>
									<option>UTC-8 (Pacific Time)</option>
									<option>UTC+0 (GMT)</option>
									<option>UTC+1 (Central European Time)</option>
								</select>
							</div>
						</div>
					</div>

					{/* Appearance Settings */}
					<div className="card p-6" id="appearance">
						<div className="flex items-center space-x-3 mb-6">
							<div className="p-2 bg-primary-100 dark:bg-primary-900 rounded-lg">
								<Palette className="h-5 w-5 text-primary-600 dark:text-primary-400" />
							</div>
							<h2 className="text-lg font-semibold text-gray-900 dark:text-white">
								Appearance
							</h2>
						</div>

						<div className="space-y-4">
							<div className="flex items-center justify-between">
								<div>
									<h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
										Dark Mode
									</h3>
									<p className="text-sm text-gray-500 dark:text-gray-400">
										Switch between light and dark themes
									</p>
								</div>
								<button
									onClick={toggleTheme}
									className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
										isDark ? "bg-primary-600" : "bg-gray-200"
									}`}
								>
									<span
										className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
											isDark ? "translate-x-6" : "translate-x-1"
										}`}
									/>
								</button>
							</div>
						</div>
					</div>

					{/* Notification Settings */}
					<div className="card p-6" id="notification">
						<div className="flex items-center space-x-3 mb-6">
							<div className="p-2 bg-primary-100 dark:bg-primary-900 rounded-lg">
								<Bell className="h-5 w-5 text-primary-600 dark:text-primary-400" />
							</div>
							<h2 className="text-lg font-semibold text-gray-900 dark:text-white">
								Notifications
							</h2>
						</div>

						<div className="space-y-4">
							<div className="flex items-center justify-between">
								<div>
									<h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
										Email Notifications
									</h3>
									<p className="text-sm text-gray-500 dark:text-gray-400">
										Receive notifications via email
									</p>
								</div>
								<button
									onClick={() => handleNotificationChange("email")}
									className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
										notifications.email ? "bg-primary-600" : "bg-gray-200"
									}`}
								>
									<span
										className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
											notifications.email ? "translate-x-6" : "translate-x-1"
										}`}
									/>
								</button>
							</div>

							<div className="flex items-center justify-between">
								<div>
									<h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
										Push Notifications
									</h3>
									<p className="text-sm text-gray-500 dark:text-gray-400">
										Receive push notifications in browser
									</p>
								</div>
								<button
									onClick={() => handleNotificationChange("push")}
									className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
										notifications.push ? "bg-primary-600" : "bg-gray-200"
									}`}
								>
									<span
										className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
											notifications.push ? "translate-x-6" : "translate-x-1"
										}`}
									/>
								</button>
							</div>

							<div className="flex items-center justify-between">
								<div>
									<h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
										Error Alerts
									</h3>
									<p className="text-sm text-gray-500 dark:text-gray-400">
										Get notified of account errors
									</p>
								</div>
								<button
									onClick={() => handleNotificationChange("errors")}
									className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
										notifications.errors ? "bg-primary-600" : "bg-gray-200"
									}`}
								>
									<span
										className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
											notifications.errors ? "translate-x-6" : "translate-x-1"
										}`}
									/>
								</button>
							</div>
						</div>
					</div>

					{/* Privacy & Security */}
					<div className="card p-6" id="privacy">
						<div className="flex items-center space-x-3 mb-6">
							<div className="p-2 bg-primary-100 dark:bg-primary-900 rounded-lg">
								<Shield className="h-5 w-5 text-primary-600 dark:text-primary-400" />
							</div>
							<h2 className="text-lg font-semibold text-gray-900 dark:text-white">
								Privacy & Security
							</h2>
						</div>

						<div className="space-y-4">
							<div className="flex items-center justify-between">
								<div>
									<h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
										Data Analytics
									</h3>
									<p className="text-sm text-gray-500 dark:text-gray-400">
										Allow anonymous usage analytics
									</p>
								</div>
								<button
									onClick={() => handlePrivacyChange("analytics")}
									className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
										privacy.analytics ? "bg-primary-600" : "bg-gray-200"
									}`}
								>
									<span
										className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
											privacy.analytics ? "translate-x-6" : "translate-x-1"
										}`}
									/>
								</button>
							</div>

							<div className="flex items-center justify-between">
								<div>
									<h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
										Marketing Communications
									</h3>
									<p className="text-sm text-gray-500 dark:text-gray-400">
										Receive marketing emails and updates
									</p>
								</div>
								<button
									onClick={() => handlePrivacyChange("marketing")}
									className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
										privacy.marketing ? "bg-primary-600" : "bg-gray-200"
									}`}
								>
									<span
										className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
											privacy.marketing ? "translate-x-6" : "translate-x-1"
										}`}
									/>
								</button>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default SettingsPage;
