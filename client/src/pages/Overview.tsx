import React, { useState, useEffect } from "react";
import { TrendingUp, Users, Megaphone, MessageSquare } from "lucide-react";
import MetricCard from "../components/MetricCard";
import PerformanceChart from "../components/PerformanceChart";
import { dashboardAPI } from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import type {
	DashboardStats,
	PerformanceData,
	CampaignRanking,
	RecentActivity,
	MetricCardProps,
} from "../types/dashboard";

interface OverviewState {
	stats: DashboardStats;
	performanceData: PerformanceData;
	campaignRankings: CampaignRanking[];
	recentActivity: RecentActivity[];
	loading: boolean;
	error: string | null;
}

const Overview: React.FC = () => {
	const [state, setState] = useState<OverviewState>({
		stats: {
			totalAccounts: 0,
			activeAccounts: 0,
			pausedAccounts: 0,
			totalCampaigns: 0,
			activeCampaigns: 0,
			pausedCampaigns: 0,
			dmsSentToday: 0,
			repliesToday: 0,
			replyRate: "0%",
		},
		performanceData: {
			labels: [],
			datasets: [],
		},
		campaignRankings: [],
		recentActivity: [],
		loading: true,
		error: null,
	});

	const { hasActiveSubscription, user } = useAuth();

	useEffect(() => {
		if (!hasActiveSubscription()) {
			console.log("fuck");
			setState((prev) => ({
				...prev,
				error: "Please purchase a subscription plan to use this feature.",
				loading: false,
			}));
			return;
		}
		fetchDashboardData();

		// Set up polling for real-time updates every 30 seconds
		// const interval = setInterval(fetchDashboardData, 30000);
		// return () => clearInterval(interval);
	}, [user]);

	const fetchDashboardData = async (): Promise<void> => {
		try {
			setState((prev) => ({ ...prev, error: null }));
			console.log("Fetching dashboard data...");
			const [statsRes, performanceRes, rankingsRes, activityRes] =
				await Promise.all([
					dashboardAPI.getStats(),
					dashboardAPI.getPerformance(),
					dashboardAPI.getCampaignRankings(),
					dashboardAPI.getRecentActivity(),
				]);
			console.log("statsRes", statsRes);
			console.log("performanceRes", performanceRes);
			console.log("rankingsRes", rankingsRes);
			console.log("activityRes", activityRes);
			setState((prev) => ({
				...prev,
				stats: statsRes.success ? statsRes.data : prev.stats,
				performanceData: performanceRes.success
					? performanceRes.data.daily
					: prev.performanceData,
				campaignRankings: rankingsRes.success
					? rankingsRes.data
					: prev.campaignRankings,
				recentActivity: activityRes.success
					? activityRes.data
					: prev.recentActivity,
				loading: false,
			}));
		} catch (error: any) {
			if (
				error.response.data.message === "Not subscribed or subscription expired"
			) {
				console.log("Not subscribed or subscription expired");
				return;
			}
			console.error("Error fetching dashboard data:", error);
			setState((prev) => ({
				...prev,
				error: "Failed to load dashboard data",
				loading: false,
			}));
		}
	};

	const handleRetry = (): void => {
		setState((prev) => ({ ...prev, loading: true }));
		fetchDashboardData();
	};

	if (state.loading) {
		return (
			<div className="flex justify-center items-center h-64">
				<div className="text-center">
					<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
					<p className="text-gray-600 dark:text-gray-400">
						Loading dashboard...
					</p>
				</div>
			</div>
		);
	}

	if (state.error) {
		return (
			<div className="accounts-page min-h-96 flex items-center justify-center bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
				<div className="error-container text-center space-y-3">
					<h2 className="text-2xl font-semibold text-red-600 dark:text-red-500">
						Error Loading Data
					</h2>
					<p className="text-base">{state.error}</p>
					<button
						onClick={handleRetry}
						className="btn-try-again bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
					>
						Try Again
					</button>
				</div>
			</div>
		);
	}

	const metrics: MetricCardProps[] = [
		{
			title: "Total Accounts",
			value: state.stats.totalAccounts.toString(),
			icon: Users,
			color: "primary",
			subtitle: `${state.stats.activeAccounts} Active, ${state.stats.pausedAccounts} Paused`,
		},
		{
			title: "Total Campaigns",
			value: state.stats.totalCampaigns.toString(),
			icon: Megaphone,
			color: "success",
			subtitle: `${state.stats.activeCampaigns} Active, ${state.stats.pausedCampaigns} Paused`,
		},
		{
			title: "DMs Sent Today",
			value: state.stats.dmsSentToday.toLocaleString(),
			icon: MessageSquare,
			color: "warning",
			subtitle: "Goal: 1,500 DMs",
		},
		{
			title: "Reply Rate",
			value: state.stats.replyRate,
			icon: TrendingUp,
			color: "success",
			subtitle: "Industry avg: 6.2%",
		},
	];

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-bold text-gray-900 dark:text-white">
					Dashboard Overview
				</h1>
				<p className="text-gray-600 dark:text-gray-400">
					Monitor your Buildfluence outreach performance and campaign metrics
				</p>
			</div>

			{/* Metrics Grid */}
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
				{metrics.map((metric, index) => (
					<MetricCard key={index} {...metric} />
				))}
			</div>

			{/* Charts and Rankings */}
			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				{/* Performance Chart */}
				<div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
					<div className="flex items-center justify-between mb-4">
						<h3 className="text-lg font-semibold text-gray-900 dark:text-white">
							Performance Overview
						</h3>
						<div className="flex items-center space-x-4 text-sm">
							<div className="flex items-center">
								<div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
								<span className="text-gray-600 dark:text-gray-400">
									DMs Sent
								</span>
							</div>
							<div className="flex items-center">
								<div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
								<span className="text-gray-600 dark:text-gray-400">
									Replies
								</span>
							</div>
						</div>
					</div>

					{state.performanceData.labels &&
					state.performanceData.labels.length > 0 ? (
						<PerformanceChart data={state.performanceData} title="" />
					) : (
						<div className="h-32 sm:h-36 lg:h-40 flex items-center justify-center bg-gray-50 dark:bg-gray-700 rounded-lg">
							<p className="text-gray-500 dark:text-gray-400 text-sm">
								No performance data available
							</p>
						</div>
					)}
				</div>

				{/* Campaign Rankings */}
				<div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
					<h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
						Top Campaigns
					</h3>
					<div className="space-y-3">
						{state.campaignRankings.length > 0 ? (
							state.campaignRankings.map((campaign, index) => (
								<div
									key={campaign.id}
									className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
								>
									<div className="flex items-center space-x-3">
										<div className="flex-shrink-0">
											<span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-sm font-medium">
												{index + 1}
											</span>
										</div>
										<div>
											<p className="text-sm font-medium text-gray-900 dark:text-white">
												{campaign.name}
											</p>
											<p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
												{campaign.platform}
											</p>
										</div>
									</div>
									<div className="text-right">
										<p className="text-sm font-medium text-gray-900 dark:text-white">
											{campaign.dms} DMs
										</p>
										<p className="text-xs text-gray-500 dark:text-gray-400">
											{campaign.replies} replies
										</p>
									</div>
								</div>
							))
						) : (
							<p className="text-gray-500 dark:text-gray-400 text-sm text-center py-4">
								No campaign data available
							</p>
						)}
					</div>
				</div>
			</div>

			{/* Recent Activity */}
			<div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
				<h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
					Recent Activity
				</h3>
				<div className="space-y-3">
					{state.recentActivity.length > 0 ? (
						state.recentActivity.map((activity, index) => (
							<div
								key={index}
								className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-700 last:border-0"
							>
								<div className="flex items-center space-x-3">
									<div className="flex-shrink-0">
										<div className="w-2 h-2 bg-green-500 rounded-full"></div>
									</div>
									<span className="text-sm text-gray-600 dark:text-gray-400">
										{activity.action}
									</span>
								</div>
								<span className="text-xs text-gray-500">{activity.time}</span>
							</div>
						))
					) : (
						<p className="text-gray-500 dark:text-gray-400 text-sm text-center py-4">
							No recent activity
						</p>
					)}
				</div>
			</div>
		</div>
	);
};

export default Overview;
