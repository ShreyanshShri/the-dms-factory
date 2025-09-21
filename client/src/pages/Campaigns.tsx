import React, { useState, useEffect } from "react";
import {
	Plus,
	Play,
	Pause,
	Users,
	Target,
	MessageSquare,
	TrendingUp,
	Trash2,
	Edit,
	Instagram,
	Twitter,
	MoreHorizontal,
} from "lucide-react";
import { campaignAPI } from "../services/api";
import type {
	CampaignData,
	CampaignMetrics,
	CampaignAnalytics,
} from "../types/dashboard";
import { Link } from "react-router-dom";

interface CampaignsState {
	campaigns: CampaignData[];
	metrics: CampaignMetrics;
	campaignAnalytics: Record<string, CampaignAnalytics>;
	loading: boolean;
	error: string | null;
}

const Campaigns: React.FC = () => {
	const [state, setState] = useState<CampaignsState>({
		campaigns: [],
		metrics: {
			totalCampaigns: 0,
			activeCampaigns: 0,
			pausedCampaigns: 0,
			completedCampaigns: 0,
		},
		campaignAnalytics: {},
		loading: true,
		error: null,
	});

	useEffect(() => {
		console.log("state", state);
	}, [state]);

	// const [selectedCampaigns, setSelectedCampaigns] = useState<Set<string>>(
	// 	new Set()
	// );
	const [updatingCampaignStatus, setUpdatingCampaignStatus] = useState(false);

	useEffect(() => {
		fetchCampaignsData();

		// Set up polling for real-time updates every 30 seconds
		const interval = setInterval(fetchCampaignsData, 30000);
		return () => clearInterval(interval);
	}, []);

	const fetchCampaignsData = async (): Promise<void> => {
		try {
			setState((prev) => ({ ...prev, error: null }));

			// Fetch campaigns data
			const campaignsRes = await campaignAPI.getCampaigns();
			if (campaignsRes?.campaigns) {
				const campaigns = campaignsRes?.campaigns;

				// Calculate metrics
				const metrics: CampaignMetrics = {
					totalCampaigns: campaigns.length,
					activeCampaigns: campaigns.filter((c: any) => c.status === "active")
						.length,
					pausedCampaigns: campaigns.filter((c: any) => c.status === "paused")
						.length,
					completedCampaigns: campaigns.filter(
						(c: any) => c.status === "completed"
					).length,
				};

				// Fetch analytics for each campaign
				const analyticsPromises = campaigns.map(async (campaign: any) => {
					try {
						const analyticsRes = await campaignAPI.getAnalytics({
							campaignID: campaign.id,
							timeframe: "week",
						});

						if (analyticsRes) {
							return {
								campaignId: campaign.id,
								dmsSent: analyticsRes.totalMessagesSent || 0,
								replies: analyticsRes.messagesByStatus?.replyreceived || 0,
								engagement: analyticsRes.leadConversionRate || 0,
								accounts: 1, // You might need to adjust this based on your data structure
							};
						}
					} catch (error) {
						console.error(
							`Error fetching analytics for campaign ${campaign.id}:`,
							error
						);
					}

					return {
						campaignId: campaign.id,
						dmsSent: 0,
						replies: 0,
						engagement: 0,
						accounts: 0,
					};
				});

				const analyticsResults = await Promise.all(analyticsPromises);
				const campaignAnalytics: Record<string, CampaignAnalytics> = {};
				analyticsResults.forEach((result) => {
					if (result) {
						campaignAnalytics[result.campaignId] = result;
					}
				});

				setState((prev) => ({
					...prev,
					campaigns,
					metrics,
					campaignAnalytics,
					loading: false,
				}));
			}
		} catch (error: any) {
			if (
				error.response.data.message === "Not subscribed or subscription expired"
			) {
				console.log("Not subscribed or subscription expired");
				setState((prev) => ({
					...prev,
					error:
						"You are not subscribed to any plan. Please subscribe to a plan to access this feature.",
					loading: false,
				}));
				return;
			}
			console.error("Error fetching campaigns data:", error);
			setState((prev) => ({
				...prev,
				error: "Failed to load campaigns data",
				loading: false,
			}));
		}
	};

	const handleCampaignAction = async (
		campaignId: string,
		action: "start" | "pause" | "complete" | "delete"
	) => {
		try {
			// Set loading state to true
			setUpdatingCampaignStatus(true);

			// Handle delete confirmation
			if (action === "delete") {
				const confirmed = window.confirm(
					"Are you sure you want to delete this campaign? This action cannot be undone."
				);
				if (!confirmed) return;
			}

			// Choose API call based on action
			switch (action) {
				case "start":
					await campaignAPI.startAllAccounts(campaignId);
					break;
				case "pause":
					await campaignAPI.pauseAllAccounts(campaignId);
					break;
				case "complete":
					// await campaignAPI.completeCampaign(campaignId);
					break;
				case "delete":
					await campaignAPI.deleteCampaign(campaignId);
					break;
				default:
					throw new Error(`Invalid action: ${action}`);
			}

			// Update the state here after successful API call
			setState((prev) => {
				let updatedCampaigns = [...prev.campaigns];

				if (action === "delete") {
					// Remove campaign from array
					updatedCampaigns = updatedCampaigns.filter(
						(c) => c.id !== campaignId
					);
				} else {
					// Update campaign status
					updatedCampaigns = updatedCampaigns.map((c) => {
						if (c.id === campaignId) {
							let newStatus: "ready" | "active" | "paused" | "completed" =
								c.status;

							if (action === "start") newStatus = "active";
							else if (action === "pause") newStatus = "paused";
							else if (action === "complete") newStatus = "completed";

							return { ...c, status: newStatus };
						}
						return c;
					});
				}

				// Recalculate metrics
				const newMetrics = {
					totalCampaigns: updatedCampaigns.length,
					activeCampaigns: updatedCampaigns.filter((c) => c.status === "active")
						.length,
					pausedCampaigns: updatedCampaigns.filter((c) => c.status === "paused")
						.length,
					completedCampaigns: updatedCampaigns.filter(
						(c) => c.status === "completed"
					).length,
				};

				return {
					...prev,
					campaigns: updatedCampaigns,
					metrics: newMetrics,
				};
			});
		} catch (error) {
			console.error(`Failed to ${action} campaign:`, error);
			alert(`Failed to ${action} campaign. Please try again.`);
		} finally {
			// Always reset loading state
			setUpdatingCampaignStatus(false);
		}
	};

	// const handleSelectCampaign = (campaignId: string): void => {
	// 	const newSelected = new Set(selectedCampaigns);
	// 	if (newSelected.has(campaignId)) {
	// 		newSelected.delete(campaignId);
	// 	} else {
	// 		newSelected.add(campaignId);
	// 	}
	// 	setSelectedCampaigns(newSelected);
	// };

	const getPlatformIcon = (platform: "instagram" | "twitter") => {
		return platform === "instagram" ? Instagram : Twitter;
	};

	const getStatusColor = (status: string) => {
		switch (status) {
			case "active":
				return "text-green-600 bg-green-100";
			case "paused":
				return "text-yellow-600 bg-yellow-100";
			case "completed":
				return "text-blue-600 bg-blue-100";
			default:
				return "text-gray-600 bg-gray-100";
		}
	};

	if (state.loading) {
		return (
			<div className="flex justify-center items-center h-64">
				<div className="text-center">
					<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
					<p className="text-gray-600 dark:text-gray-400">
						Loading campaigns...
					</p>
				</div>
			</div>
		);
	}

	if (state.error) {
		return (
			<div className="flex justify-center items-center h-64">
				<div className="text-center">
					<p className="text-red-600 dark:text-red-400 mb-4">{state.error}</p>
					<button
						onClick={fetchCampaignsData}
						className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
					>
						Retry
					</button>
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{/* Loading overlay */}
			{updatingCampaignStatus && (
				<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
					<div className="bg-white p-6 rounded-lg shadow-lg">
						<div className="flex items-center gap-3">
							<div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
							<span className="text-gray-700">Updating Campaign Status...</span>
						</div>
					</div>
				</div>
			)}

			{/* Header */}
			<div className="flex justify-between items-center">
				<div>
					<h1 className="text-2xl font-bold text-gray-900 dark:text-white">
						Campaigns
					</h1>
					<p className="text-gray-600 dark:text-gray-400">
						Create and manage your Buildfluence outreach campaigns
					</p>
				</div>
				<Link to="/dashboard/create-campaign">
					<button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
						<Plus className="w-4 h-4 mr-2" />
						New Campaign
					</button>
				</Link>
			</div>

			{/* Metrics Cards */}
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
				<div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
					<div className="flex items-center justify-between">
						<div>
							<p className="text-sm font-medium text-gray-600 dark:text-gray-400">
								Total Campaigns
							</p>
							<p className="text-2xl font-bold text-gray-900 dark:text-white">
								{state.metrics.totalCampaigns}
							</p>
						</div>
						<div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
							<Target className="w-6 h-6 text-blue-600 dark:text-blue-400" />
						</div>
					</div>
				</div>

				<div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
					<div className="flex items-center justify-between">
						<div>
							<p className="text-sm font-medium text-gray-600 dark:text-gray-400">
								Active Campaigns
							</p>
							<p className="text-2xl font-bold text-green-600">
								{state.metrics.activeCampaigns}
							</p>
						</div>
						<div className="p-3 bg-green-100 dark:bg-green-900 rounded-full">
							<Play className="w-6 h-6 text-green-600 dark:text-green-400" />
						</div>
					</div>
				</div>

				<div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
					<div className="flex items-center justify-between">
						<div>
							<p className="text-sm font-medium text-gray-600 dark:text-gray-400">
								Paused Campaigns
							</p>
							<p className="text-2xl font-bold text-yellow-600">
								{state.metrics.pausedCampaigns}
							</p>
						</div>
						<div className="p-3 bg-yellow-100 dark:bg-yellow-900 rounded-full">
							<Pause className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
						</div>
					</div>
				</div>

				<div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
					<div className="flex items-center justify-between">
						<div>
							<p className="text-sm font-medium text-gray-600 dark:text-gray-400">
								Completed
							</p>
							<p className="text-2xl font-bold text-blue-600">
								{state.metrics.completedCampaigns}
							</p>
						</div>
						<div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
							<TrendingUp className="w-6 h-6 text-blue-600 dark:text-blue-400" />
						</div>
					</div>
				</div>
			</div>

			{/* Campaigns List */}
			<div className="bg-white dark:bg-gray-800 rounded-lg shadow">
				<div className="p-6 border-b border-gray-200 dark:border-gray-700">
					<h2 className="text-lg font-semibold text-gray-900 dark:text-white">
						Your Campaigns
					</h2>
				</div>

				{state.campaigns.length === 0 ? (
					<div className="p-12 text-center">
						<Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
						<h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
							No campaigns yet
						</h3>
						<p className="text-gray-500 dark:text-gray-400 mb-4">
							Get started by creating your first outreach campaign
						</p>
						<Link to="/dashboard/create-campaign">
							<button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
								Create Campaign
							</button>
						</Link>
					</div>
				) : (
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
						{state.campaigns.map((campaign) => {
							const PlatformIcon = getPlatformIcon(campaign.platform);

							return (
								<div
									key={campaign.id}
									className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:shadow-lg transition-shadow"
								>
									{/* Campaign Header */}
									<div className="flex items-start justify-between mb-4">
										<div className="flex items-center space-x-3">
											<div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
												<PlatformIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
											</div>
											<div>
												<h3 className="font-semibold text-gray-900 dark:text-white">
													{campaign.name}
												</h3>
												<span
													className={`inline-block px-2 py-1 text-xs rounded-full capitalize ${getStatusColor(
														campaign.status
													)}`}
												>
													{campaign.status}
												</span>
											</div>
										</div>
										<div className="relative">
											<Link to={`/dashboard/campaign-info/${campaign.id}`}>
												<button className="p-1 text-gray-400 hover:text-gray-600">
													<MoreHorizontal className="w-4 h-4" />
												</button>
											</Link>
										</div>
									</div>

									{/* Campaign Description */}
									<p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
										{campaign.description || "No description provided"}
									</p>

									{/* Campaign Stats */}
									<div className="grid grid-cols-2 gap-4 mb-4">
										<div className="text-center">
											<div className="flex items-center justify-center mb-1">
												<Users className="w-4 h-4 text-gray-500 mr-1" />
												<span className="text-sm text-gray-500">Accounts</span>
											</div>
											<p className="font-semibold text-gray-900 dark:text-white">
												{campaign?.stats?.accounts || 0}
											</p>
										</div>

										<div className="text-center">
											<div className="flex items-center justify-center mb-1">
												<Target className="w-4 h-4 text-gray-500 mr-1" />
												<span className="text-sm text-gray-500">
													Target Audience
												</span>
											</div>
											<p className="font-semibold text-gray-900 dark:text-white">
												{campaign.totalLeads?.toLocaleString() || 0}
											</p>
										</div>

										<div className="text-center">
											<div className="flex items-center justify-center mb-1">
												<MessageSquare className="w-4 h-4 text-gray-500 mr-1" />
												<span className="text-sm text-gray-500">DMs Sent</span>
											</div>
											<p className="font-semibold text-gray-900 dark:text-white">
												{campaign?.stats?.dmsSent || 0}
											</p>
										</div>

										<div className="text-center">
											<div className="flex items-center justify-center mb-1">
												<TrendingUp className="w-4 h-4 text-gray-500 mr-1" />
												<span className="text-sm text-gray-500">Replies</span>
											</div>
											<p className="font-semibold text-gray-900 dark:text-white">
												{campaign?.stats?.replies || 0}
											</p>
										</div>
									</div>

									{/* Engagement Rate */}
									<div className="mb-4">
										<div className="flex justify-between items-center mb-1">
											<span className="text-sm text-gray-500">Engagement</span>
											<span className="text-sm font-medium text-gray-900 dark:text-white">
												{Math.floor(
													((campaign?.stats?.replies || 0) /
														(campaign?.stats?.dmsSent || 1)) *
														10000
												) / 100}
												%
											</span>
										</div>
										<div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
											<div
												className="bg-green-600 h-2 rounded-full transition-all duration-300"
												style={{
													width: `${Math.min(
														Math.round(
															((campaign?.stats?.replies || 0) /
																(campaign?.stats?.dmsSent || 1)) *
																100
														),
														100
													)}%`,
												}}
											></div>
										</div>
									</div>

									{/* Action Buttons */}
									<div className="flex space-x-2">
										{campaign.status === "active" ? (
											<button
												onClick={() =>
													handleCampaignAction(campaign.id, "pause")
												}
												disabled={updatingCampaignStatus}
												className="flex-1 flex items-center justify-center px-3 py-2 text-sm bg-yellow-900 text-yellow-300 rounded-lg hover:bg-yellow-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
											>
												<Pause className="w-4 h-4 mr-1" />
												{updatingCampaignStatus ? "Pausing..." : "Pause"}
											</button>
										) : (
											<button
												onClick={() =>
													handleCampaignAction(campaign.id, "start")
												}
												disabled={updatingCampaignStatus}
												className="flex-1 flex items-center justify-center px-3 py-2 text-sm bg-green-900 text-green-300 rounded-lg hover:bg-green-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
											>
												<Play className="w-4 h-4 mr-1" />
												{updatingCampaignStatus ? "Starting..." : "Start"}
											</button>
										)}
										<Link
											to={`/dashboard/campaign-edit/${campaign.id}`}
											className="px-3 py-2 text-sm bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors"
										>
											<Edit className="w-4 h-4" />
										</Link>
										<button
											onClick={() =>
												handleCampaignAction(campaign.id, "delete")
											}
											disabled={updatingCampaignStatus}
											className="px-3 py-2 text-sm bg-red-900 text-red-300 rounded-lg hover:bg-red-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
										>
											<Trash2 className="w-4 h-4" />
										</button>
									</div>
								</div>
							);
						})}
					</div>
				)}
			</div>
		</div>
	);
};

export default Campaigns;
