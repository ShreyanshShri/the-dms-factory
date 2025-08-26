import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { campaignAPI } from "../../services/api";
import "../../styles/campaignInfo.css";
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
	const [campaign, setCampaign] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [dmTrend, setDmTrend] = useState(null);
	const fetchTrend = async () => {
		try {
			const res = await campaignAPI.getTrend({
				campaignID: campaignId,
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
				const response = await campaignAPI.getCampaignById(campaignId);
				console.log(response.data);
				setCampaign(response.data);
			} catch (error) {
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

	const formatDate = (timestamp) => {
		if (!timestamp) return "N/A";
		return new Date(timestamp).toLocaleDateString("en-US", {
			year: "numeric",
			month: "long",
			day: "numeric",
			hour: "2-digit",
			minute: "2-digit",
		});
	};

	const formatWorkingHours = (workingHours) => {
		if (!workingHours) return "Not set";
		return `${workingHours.start}:00 - ${workingHours.end}:00`;
	};

	const formatMessageLimits = (messageLimits) => {
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
			await campaignAPI.deleteCampaign(campaignId);
			setLoading(false);
			window.location.href = "/dashboard";
		} catch (error) {
			setLoading(false);
			alert("Failed to delete campaign. Please try again.");
			console.error("Error deleting campaign:", error);
		}
	};

	// Add this state and function before the return statement in CampaignInfo component
	const [analyticsData, setAnalyticsData] = useState({
		today: null,
		week: null,
		month: null,
	});
	const [analyticsLoading, setAnalyticsLoading] = useState(false);

	// Add this function to fetch analytics
	const fetchAnalytics = async () => {
		try {
			setAnalyticsLoading(true);

			const timeframes = ["today", "week", "month"];
			const promises = timeframes.map((timeframe) =>
				campaignAPI.getAnalytics({ campaignID: campaignId, timeframe })
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

	// Add this useEffect to fetch analytics when component loads
	useEffect(() => {
		if (campaignId && campaign) {
			fetchAnalytics();
		}
	}, [campaignId, campaign]);

	if (loading) {
		return (
			<div className="campaign-info-container">
				<div className="campaign-info-loading">
					<div className="loading-spinner"></div>
					<p>Loading campaign data...</p>
				</div>
			</div>
		);
	}

	if (error || !campaign) {
		return (
			<div className="campaign-info-container">
				<div className="campaign-info-error">
					<h2>Error Loading Campaign</h2>
					<p>{error || "Campaign not found"}</p>
					<Link to="/dashboard" className="campaign-action-btn edit">
						Back to Dashboard
					</Link>
				</div>
			</div>
		);
	}

	return (
		<div className="campaign-info-container">
			{/* Header */}
			<div className="campaign-info-header">
				<div className="campaign-info-back">
					<Link to="/dashboard" className="campaign-info-back-btn">
						← Back to Dashboard
					</Link>
					<div className="campaign-info-title">
						<h1>{campaign.name}</h1>
					</div>
				</div>

				<div className="campaign-info-actions">
					<Link
						to={`/campaign/edit/${campaignId}`}
						className="campaign-action-btn edit"
					>
						Edit Campaign
					</Link>
					<button
						className="campaign-action-btn delete"
						onClick={() => deleteCampaign(campaignId)}
					>
						{loading ? "Deleting..." : "Delete Campaign"}
					</button>

					{/* {campaign.status === "ready" || campaign.status === "paused" && (
						<button className="campaign-action-btn start" onClick={() => { startCampaign(campaignId) }}>
							Start Campaign
						</button>
					)}
					{campaign.status === "active" && (
						<button className="campaign-action-btn start" onClick={() => { pauseCampaign(campaignId) }}>
							Pause Campaign
						</button>
					)} */}
				</div>
			</div>

			{/* Content */}
			<div className="campaign-info-content">
				{/* Main Content */}
				<div className="campaign-info-main">
					{/* Campaign Overview */}
					<div className="campaign-info-card">
						<h2>Campaign Overview</h2>

						<div className="campaign-meta">
							<div className="campaign-meta-item">
								<span className="campaign-meta-label">Status</span>
								<span className={`campaign-status-badge ${campaign.status}`}>
									{campaign.status}
								</span>
							</div>

							<div className="campaign-meta-item">
								<span className="campaign-meta-label">Platform</span>
								<span
									className={`campaign-platform-badge ${campaign.platform}`}
								>
									{campaign.platform}
								</span>
							</div>

							<div className="campaign-meta-item">
								<span className="campaign-meta-label">Created</span>
								<span className="campaign-meta-value">
									{formatDate(campaign.createdAt)}
								</span>
							</div>

							<div className="campaign-meta-item">
								<span className="campaign-meta-label">Last Updated</span>
								<span className="campaign-meta-value">
									{formatDate(campaign.updatedAt)}
								</span>
							</div>
						</div>

						<div className="campaign-description">
							<strong>Description:</strong>
							<p>{campaign.description}</p>
						</div>

						{campaign.tag && (
							<div className="campaign-description">
								<strong>Tag:</strong>
								<span className="campaign-tag">{campaign.tag}</span>
							</div>
						)}
					</div>

					{/* Message Variants */}
					<div className="campaign-info-card">
						<h2>Message Variants ({campaign.variants?.length || 0})</h2>
						<div className="campaign-variants-list">
							{campaign.variants?.map((variant, index) => (
								<div key={index} className="campaign-variant-item">
									<div className="campaign-variant-label">
										Variant {index + 1}
									</div>
									<div className="campaign-variant-message">
										{variant.message}
									</div>
								</div>
							)) || <p>No message variants available</p>}
						</div>
					</div>
				</div>

				{/* Sidebar */}
				<div className="campaign-info-sidebar">
					{/* Statistics */}
					<div className="campaign-info-card">
						<h2>Statistics</h2>
						<div className="campaign-stats-grid">
							<div className="campaign-stat-item">
								<div className="campaign-stat-value">
									{campaign.stats?.totalLeads || 0}
								</div>
								<div className="campaign-stat-label">Total Leads</div>
							</div>

							<div className="campaign-stat-item">
								<div className="campaign-stat-value">
									{campaign.stats?.sentLeads || 0}
								</div>
								<div className="campaign-stat-label">Messages Sent</div>
							</div>

							<div className="campaign-stat-item">
								<div className="campaign-stat-value">
									{campaign.stats?.pendingLeads || 0}
								</div>
								<div className="campaign-stat-label">Pending Leads</div>
							</div>

							<div className="campaign-stat-item">
								<div className="campaign-stat-value">
									{campaign.stats?.totalAnalytics || 0}
								</div>
								<div className="campaign-stat-label">Total Events</div>
							</div>
						</div>
					</div>

					{/* Campaign Settings */}
					<div className="campaign-info-card">
						<h2>Settings</h2>
						<div className="campaign-settings-list">
							<div className="campaign-setting-item">
								<span className="campaign-setting-label">Working Hours</span>
								<span className="campaign-setting-value campaign-working-hours">
									{formatWorkingHours(campaign.workingHours)}
								</span>
							</div>

							<div className="campaign-setting-item">
								<span className="campaign-setting-label">Message Limits</span>
								<span className="campaign-setting-value campaign-message-limits">
									{formatMessageLimits(campaign.messageLimits)}
								</span>
							</div>

							<div className="campaign-setting-item">
								<span className="campaign-setting-label">Follow User</span>
								<span
									className={`campaign-setting-value ${
										campaign.followUser ? "enabled" : "disabled"
									}`}
								>
									{campaign.followUser ? "Enabled" : "Disabled"}
								</span>
							</div>

							<div className="campaign-setting-item">
								<span className="campaign-setting-label">Auto Like Story</span>
								<span
									className={`campaign-setting-value ${
										campaign.autoLikeStory ? "enabled" : "disabled"
									}`}
								>
									{campaign.autoLikeStory ? "Enabled" : "Disabled"}
								</span>
							</div>

							<div className="campaign-setting-item">
								<span className="campaign-setting-label">
									Auto Like Newest Post
								</span>
								<span
									className={`campaign-setting-value ${
										campaign.autoLikeNewestPost ? "enabled" : "disabled"
									}`}
								>
									{campaign.autoLikeNewestPost ? "Enabled" : "Disabled"}
								</span>
							</div>
						</div>
					</div>
				</div>
			</div>
			<AnalyticsSection
				analyticsData={analyticsData}
				setAnalyticsData={setAnalyticsData}
				analyticsLoading={analyticsLoading}
			/>
			<div className="campaign-info-card campaign-chart-container">
				<h2>📈 DMs Sent (Last 7 Days)</h2>

				{dmTrend ? (
					<Line
						data={{
							labels: dmTrend.labels,
							datasets: [
								{
									label: "DMs sent",
									data: dmTrend.counts,
									borderColor: "#e1306c",
									backgroundColor: "rgba(225,48,108,0.2)",
									tension: 0.3,
									fill: true,
									pointRadius: 4,
								},
							],
						}}
						options={{
							responsive: true,
							plugins: { legend: { display: false } },
							scales: {
								y: { beginAtZero: true, ticks: { precision: 0 } },
							},
						}}
					/>
				) : (
					<div style={{ textAlign: "center", padding: "20px" }}>
						Loading chart…
					</div>
				)}
			</div>
		</div>
	);
};

// Add this component for the analytics section (add before the final return)
const AnalyticsSection = ({
	analyticsData,
	setAnalyticsData,
	analyticsLoading,
}) => (
	<div className="campaign-info-card">
		<h2>📊 Analytics Overview</h2>

		{analyticsLoading ? (
			<div style={{ textAlign: "center", padding: "20px" }}>
				Loading analytics...
			</div>
		) : (
			<>
				<div
					className="campaign-stats-grid"
					style={{
						gridTemplateColumns: "repeat(3, 1fr)",
						marginBottom: "24px",
					}}
				>
					<div className="campaign-stat-item">
						<div className="campaign-stat-value">
							{analyticsData.today?.totalMessagesSent || 0}
						</div>
						<div className="campaign-stat-label">Messages Today</div>
					</div>
					<div className="campaign-stat-item">
						<div className="campaign-stat-value">
							{analyticsData.week?.totalMessagesSent || 0}
						</div>
						<div className="campaign-stat-label">Messages This Week</div>
					</div>
					<div className="campaign-stat-item">
						<div className="campaign-stat-value">
							{analyticsData.month?.totalMessagesSent || 0}
						</div>
						<div className="campaign-stat-label">Messages This Month</div>
					</div>
				</div>

				<div
					className="campaign-stats-grid"
					style={{ gridTemplateColumns: "repeat(3, 1fr)" }}
				>
					<div className="campaign-stat-item">
						<div
							className="campaign-stat-value"
							style={{ color: "var(--success-color)" }}
						>
							{analyticsData.today?.leadConversionRate || 0}%
						</div>
						<div className="campaign-stat-label">Conversion Rate Today</div>
					</div>
					<div className="campaign-stat-item">
						<div
							className="campaign-stat-value"
							style={{ color: "var(--success-color)" }}
						>
							{analyticsData.week?.leadConversionRate || 0}%
						</div>
						<div className="campaign-stat-label">Conversion Rate This Week</div>
					</div>
					<div className="campaign-stat-item">
						<div
							className="campaign-stat-value"
							style={{ color: "var(--success-color)" }}
						>
							{analyticsData.month?.leadConversionRate || 0}%
						</div>
						<div className="campaign-stat-label">
							Conversion Rate This Month
						</div>
					</div>
				</div>

				<div
					style={{
						marginTop: "20px",
						padding: "16px",
						background: "var(--bg-tertiary)",
						borderRadius: "var(--radius)",
					}}
				>
					<div
						style={{
							fontSize: "14px",
							color: "var(--text-secondary)",
							marginBottom: "8px",
						}}
					>
						<strong>This Month Summary:</strong>
					</div>
					<div style={{ fontSize: "13px", color: "var(--text-muted)" }}>
						{analyticsData.month?.convertedLeads || 0} out of{" "}
						{analyticsData.month?.totalLeads || 0} leads successfully contacted
					</div>
				</div>
			</>
		)}
	</div>
);

export default CampaignInfo;
