import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { campaignAPI } from "../../services/api";
import "../../styles/campaignInfo.css";

const CampaignInfo = () => {
	const { campaignId } = useParams();
	const navigate = useNavigate();
	const [campaign, setCampaign] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");

	useEffect(() => {
		if (campaignId) {
			fetchCampaignData();
		}
	}, [campaignId]);

	const fetchCampaignData = async () => {
		try {
			setLoading(true);
			const response = await campaignAPI.getCampaignById(campaignId);

			if (response.success) {
				setCampaign(response.data);
			} else {
				setError(response.message || "Failed to fetch campaign data");
			}
		} catch (error) {
			console.error("Error fetching campaign:", error);
			setError(
				error.response?.data?.message || "Failed to fetch campaign data"
			);
		} finally {
			setLoading(false);
		}
	};

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
					{campaign.status === "ready" && (
						<button className="campaign-action-btn start">
							Start Campaign
						</button>
					)}
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
		</div>
	);
};

export default CampaignInfo;
