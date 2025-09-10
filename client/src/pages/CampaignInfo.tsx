import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { campaignAPI } from "../services/api";
import {
	Chart as ChartJS,
	CategoryScale,
	LinearScale,
	PointElement,
	LineElement,
	Title,
	Tooltip,
	Legend,
} from "chart.js";
// @ts-ignore
import { Line } from "react-chartjs-2";

ChartJS.register(
	CategoryScale,
	LinearScale,
	PointElement,
	LineElement,
	Title,
	Tooltip,
	Legend
);

const CampaignInfo = () => {
	const { campaignId } = useParams();
	const [campaign, setCampaign] = useState<any>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [dmTrend, setDmTrend] = useState(null);

	const fetchTrend = async () => {
		try {
			const res = await campaignAPI.getTrend({
				campaignID: campaignId || "",
				timeframe: "week",
			});
			setDmTrend(res);
		} catch (e) {
			console.error("trend error", e);
		}
	};

	useEffect(() => {
		if (campaignId && campaign) fetchTrend();
	}, [campaignId, campaign]);

	useEffect(() => {
		window.scrollTo({ top: 0 });
	});

	useEffect(() => {
		const fetchCampaignData = async () => {
			try {
				setLoading(true);
				const response = await campaignAPI.getCampaignById(campaignId || "");
				console.log(response.data);
				setCampaign(response.data);
			} catch (error: any) {
				console.error("Error fetching campaign:", error);
				setError(
					error.response?.data?.message || "Failed to fetch campaign data"
				);
			} finally {
				setLoading(false);
			}
		};

		if (campaignId) {
			fetchCampaignData();
		}
	}, [campaignId]);

	const formatDate = (timestamp: any) => {
		if (!timestamp) return "N/A";
		return new Date(timestamp).toLocaleDateString("en-US", {
			year: "numeric",
			month: "long",
			day: "numeric",
			hour: "2-digit",
			minute: "2-digit",
		});
	};

	const formatWorkingHours = (workingHours: any) => {
		if (!workingHours) return "Not set";
		return `${workingHours.start}:00 - ${workingHours.end}:00`;
	};

	const formatMessageLimits = (messageLimits: any) => {
		if (!messageLimits) return "Not set";
		return `${messageLimits.min} - ${messageLimits.max} per day`;
	};

	const deleteCampaign = async () => {
		try {
			const confirmed = window.confirm(
				"Are you sure you want to delete this campaign? This action cannot be undone."
			);
			if (!confirmed) return;

			setLoading(true);
			await campaignAPI.deleteCampaign(campaignId || "");
			setLoading(false);
			window.location.href = "/dashboard";
		} catch (error) {
			setLoading(false);
			alert("Failed to delete campaign. Please try again.");
			console.error("Error deleting campaign:", error);
		}
	};

	const [analyticsData, setAnalyticsData] = useState({
		today: null,
		week: null,
		month: null,
	});
	const [analyticsLoading, setAnalyticsLoading] = useState(false);

	const fetchAnalytics = async () => {
		try {
			setAnalyticsLoading(true);
			const timeframes = ["today", "week", "month"];
			const promises = timeframes.map((timeframe) =>
				campaignAPI.getAnalytics({ campaignID: campaignId || "", timeframe })
			);
			const responses = await Promise.all(promises);
			const analytics = {
				today: responses[0].success ? responses[0] : null,
				week: responses[1].success ? responses[1] : null,
				month: responses[2].success ? responses[2] : null,
			};
			setAnalyticsData(analytics);
		} catch (error) {
			console.error("Error fetching analytics:", error);
		} finally {
			setAnalyticsLoading(false);
		}
	};

	useEffect(() => {
		if (campaignId && campaign) {
			fetchAnalytics();
		}
	}, [campaignId, campaign]);

	if (loading) {
		return (
			<div className="min-h-screen bg-gray-900 flex items-center justify-center">
				<div className="text-white text-xl">Loading campaign data...</div>
			</div>
		);
	}

	if (error || !campaign) {
		return (
			<div className="min-h-screen bg-gray-900 flex items-center justify-center">
				<div className="text-center">
					<h1 className="text-2xl font-bold text-white mb-4">
						Error Loading Campaign
					</h1>
					<p className="text-gray-400 mb-6">{error || "Campaign not found"}</p>
					<Link
						to="/dashboard/campaigns"
						className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
					>
						Back to Campaigns
					</Link>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gray-900">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				{/* Header */}
				<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
					<div className="flex items-center gap-4">
						<Link
							to="/dashboard/campaigns"
							className="inline-flex items-center text-gray-400 hover:text-white transition-colors"
						>
							← Back to Campaigns
						</Link>
						<h1 className="text-3xl font-bold text-white">{campaign.name}</h1>
					</div>
					<div className="flex gap-3">
						<Link
							to={`/dashboard/campaign-edit/${campaignId}`}
							className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
						>
							Edit Campaign
						</Link>
						<button
							onClick={() => deleteCampaign()}
							disabled={loading}
							className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-lg transition-colors"
						>
							{loading ? "Deleting..." : "Delete Campaign"}
						</button>
					</div>
				</div>

				{/* Content */}
				<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
					{/* Main Content */}
					<div className="lg:col-span-2 space-y-6">
						{/* Campaign Overview */}
						<div className="bg-gray-800 rounded-xl p-6">
							<h2 className="text-xl font-semibold text-white mb-6">
								Campaign Overview
							</h2>
							<div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
								<div>
									<span className="block text-sm font-medium text-gray-400 mb-1">
										Status
									</span>
									<span
										className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
											campaign.status === "active"
												? "bg-green-900 text-green-300"
												: campaign.status === "paused"
												? "bg-yellow-900 text-yellow-300"
												: "bg-gray-700 text-gray-300"
										}`}
									>
										{campaign.status}
									</span>
								</div>
								<div>
									<span className="block text-sm font-medium text-gray-400 mb-1">
										Platform
									</span>
									<span className="text-white font-medium">
										{campaign.platform}
									</span>
								</div>
								<div>
									<span className="block text-sm font-medium text-gray-400 mb-1">
										Created
									</span>
									<span className="text-white">
										{formatDate(campaign.createdAt)}
									</span>
								</div>
								<div>
									<span className="block text-sm font-medium text-gray-400 mb-1">
										Last Updated
									</span>
									<span className="text-white">
										{formatDate(campaign.updatedAt)}
									</span>
								</div>
							</div>
							<div className="mb-4">
								<span className="block text-sm font-medium text-gray-400 mb-2">
									Description:
								</span>
								<p className="text-gray-300">{campaign.description}</p>
							</div>
							{campaign.tag && (
								<div>
									<span className="block text-sm font-medium text-gray-400 mb-1">
										Tag:
									</span>
									<span className="inline-flex px-3 py-1 bg-blue-900 text-blue-300 rounded-full text-sm">
										{campaign.tag}
									</span>
								</div>
							)}
						</div>

						{/* Message Variants */}
						<div className="bg-gray-800 rounded-xl p-6">
							<h2 className="text-xl font-semibold text-white mb-6">
								Message Variants ({campaign.variants?.length || 0})
							</h2>
							<div className="space-y-4">
								{campaign.variants?.map((variant: any, index: any) => (
									<div key={index} className="bg-gray-700 rounded-lg p-4">
										<h3 className="text-lg font-medium text-white mb-2">
											Variant {index + 1}
										</h3>
										<p className="text-gray-300">{variant.message}</p>
									</div>
								)) || (
									<p className="text-gray-400">No message variants available</p>
								)}
							</div>
						</div>
					</div>

					{/* Sidebar */}
					<div className="space-y-6">
						{/* Statistics */}
						<div className="bg-gray-800 rounded-xl p-6">
							<h2 className="text-xl font-semibold text-white mb-6">
								Statistics
							</h2>
							<div className="space-y-4">
								<div className="text-center">
									<div className="text-3xl font-bold text-blue-400">
										{campaign.stats?.totalLeads || 0}
									</div>
									<div className="text-sm text-gray-400">Total Leads</div>
								</div>
								<div className="text-center">
									<div className="text-3xl font-bold text-green-400">
										{campaign.stats?.sentLeads || 0}
									</div>
									<div className="text-sm text-gray-400">Messages Sent</div>
								</div>
								<div className="text-center">
									<div className="text-3xl font-bold text-yellow-400">
										{campaign.stats?.pendingLeads || 0}
									</div>
									<div className="text-sm text-gray-400">Pending Leads</div>
								</div>
								<div className="text-center">
									<div className="text-3xl font-bold text-purple-400">
										{campaign.stats?.totalAnalytics || 0}
									</div>
									<div className="text-sm text-gray-400">Total Events</div>
								</div>
							</div>
						</div>

						{/* Campaign Settings */}
						<div className="bg-gray-800 rounded-xl p-6">
							<h2 className="text-xl font-semibold text-white mb-6">
								Settings
							</h2>
							<div className="space-y-4">
								<div>
									<span className="block text-sm font-medium text-gray-400 mb-1">
										Working Hours
									</span>
									<span className="text-white">
										{formatWorkingHours(campaign.workingHours)}
									</span>
								</div>
								<div>
									<span className="block text-sm font-medium text-gray-400 mb-1">
										Message Limits
									</span>
									<span className="text-white">
										{formatMessageLimits(campaign.messageLimits)}
									</span>
								</div>
								<div>
									<span className="block text-sm font-medium text-gray-400 mb-1">
										Follow User
									</span>
									<span
										className={`inline-flex px-2 py-1 rounded text-xs ${
											campaign.followUser
												? "bg-green-900 text-green-300"
												: "bg-red-900 text-red-300"
										}`}
									>
										{campaign.followUser ? "Enabled" : "Disabled"}
									</span>
								</div>
								<div>
									<span className="block text-sm font-medium text-gray-400 mb-1">
										Auto Like Story
									</span>
									<span
										className={`inline-flex px-2 py-1 rounded text-xs ${
											campaign.autoLikeStory
												? "bg-green-900 text-green-300"
												: "bg-red-900 text-red-300"
										}`}
									>
										{campaign.autoLikeStory ? "Enabled" : "Disabled"}
									</span>
								</div>
								<div>
									<span className="block text-sm font-medium text-gray-400 mb-1">
										Auto Like Newest Post
									</span>
									<span
										className={`inline-flex px-2 py-1 rounded text-xs ${
											campaign.autoLikeNewestPost
												? "bg-green-900 text-green-300"
												: "bg-red-900 text-red-300"
										}`}
									>
										{campaign.autoLikeNewestPost ? "Enabled" : "Disabled"}
									</span>
								</div>
							</div>
						</div>
					</div>
				</div>

				{/* Chart Section */}
				<div className="mt-8">
					<div className="bg-gray-800 rounded-xl p-6">
						<h2 className="text-xl font-semibold text-white mb-6">
							📈 DMs Sent (Last 7 Days)
						</h2>
						{dmTrend ? (
							<Line data={dmTrend} />
						) : (
							<div className="text-center py-8 text-gray-400">
								Loading chart…
							</div>
						)}
					</div>
				</div>

				{/* Analytics Section */}
				<div className="mt-8">
					<AnalyticsSection
						analyticsData={analyticsData}
						analyticsLoading={analyticsLoading}
					/>
				</div>
			</div>
		</div>
	);
};

// Analytics Section Component
const AnalyticsSection = ({
	analyticsData,
	analyticsLoading,
}: {
	analyticsData: any;
	analyticsLoading: boolean;
}) => (
	<div className="bg-gray-800 rounded-xl p-6">
		<h2 className="text-xl font-semibold text-white mb-6">
			📊 Analytics Overview
		</h2>
		{analyticsLoading ? (
			<div className="text-center py-8 text-gray-400">Loading analytics...</div>
		) : (
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
				<div className="text-center bg-gray-700 rounded-lg p-4">
					<div className="text-2xl font-bold text-blue-400">
						{analyticsData.today?.totalMessagesSent || 0}
					</div>
					<div className="text-sm text-gray-400">Messages Today</div>
				</div>
				<div className="text-center bg-gray-700 rounded-lg p-4">
					<div className="text-2xl font-bold text-green-400">
						{analyticsData.week?.totalMessagesSent || 0}
					</div>
					<div className="text-sm text-gray-400">Messages This Week</div>
				</div>
				<div className="text-center bg-gray-700 rounded-lg p-4">
					<div className="text-2xl font-bold text-purple-400">
						{analyticsData.month?.totalMessagesSent || 0}
					</div>
					<div className="text-sm text-gray-400">Messages This Month</div>
				</div>
				<div className="text-center bg-gray-700 rounded-lg p-4">
					<div className="text-2xl font-bold text-yellow-400">
						{analyticsData.today?.leadConversionRate || 0}%
					</div>
					<div className="text-sm text-gray-400">Conversion Rate Today</div>
				</div>
				<div className="text-center bg-gray-700 rounded-lg p-4">
					<div className="text-2xl font-bold text-orange-400">
						{analyticsData.week?.leadConversionRate || 0}%
					</div>
					<div className="text-sm text-gray-400">Conversion Rate This Week</div>
				</div>
				<div className="text-center bg-gray-700 rounded-lg p-4">
					<div className="text-2xl font-bold text-pink-400">
						{analyticsData.month?.leadConversionRate || 0}%
					</div>
					<div className="text-sm text-gray-400">
						Conversion Rate This Month
					</div>
				</div>
				<div className="md:col-span-2 lg:col-span-3 bg-gray-700 rounded-lg p-4">
					<div className="text-center">
						<div className="text-sm text-gray-400 mb-2">
							This Month Summary:
						</div>
						<div className="text-white">
							<span className="font-bold text-green-400">
								{analyticsData.month?.convertedLeads || 0}
							</span>{" "}
							out of{" "}
							<span className="font-bold text-blue-400">
								{analyticsData.month?.totalLeads || 0}
							</span>{" "}
							leads successfully contacted
						</div>
					</div>
				</div>
			</div>
		)}
	</div>
);

export default CampaignInfo;
