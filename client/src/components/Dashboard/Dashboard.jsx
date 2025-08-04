import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { campaignAPI } from "../../services/api";

const Dashboard = () => {
	const { user, logout } = useAuth();
	const navigate = useNavigate();
	const [campaigns, setCampaigns] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");

	useEffect(() => {
		// Add a small delay to let auth settle
		const timer = setTimeout(() => {
			fetchCampaigns();
		}, 500);

		return () => clearTimeout(timer);
	}, []);

	const fetchCampaigns = async () => {
		try {
			setLoading(true);
			const response = await campaignAPI.getCampaigns();
			setCampaigns(response.campaigns || []);
		} catch (error) {
			console.error("Error fetching campaigns:", error);
			setError("Failed to fetch campaigns");
		} finally {
			setLoading(false);
		}
	};

	const handleLogout = async () => {
		await logout();
	};

	const getStatusColor = (status) => {
		switch (status) {
			case "ready":
				return "status-ready";
			case "running":
				return "status-running";
			case "paused":
				return "status-paused";
			case "completed":
				return "status-completed";
			default:
				return "status-default";
		}
	};

	const formatDate = (timestamp) => {
		if (!timestamp) return "N/A";
		return new Date(timestamp).toLocaleDateString("en-US", {
			year: "numeric",
			month: "short",
			day: "numeric",
		});
	};

	if (loading) {
		return (
			<div className="loading-container">
				<div className="loading-spinner"></div>
				<p>Loading campaigns...</p>
			</div>
		);
	}

	return (
		<div className="dashboard-container">
			<div className="dashboard-header">
				<div className="dashboard-title">
					<h1>Dashboard</h1>
					<p>Welcome back, {user?.name}!</p>
				</div>
				<button onClick={handleLogout} className="logout-button">
					Logout
				</button>
			</div>

			<div className="dashboard-content">
				<div className="dashboard-card">
					<h2>Profile Information</h2>
					<div className="profile-info">
						<div className="info-item">
							<span className="info-label">Name:</span>
							<span className="info-value">{user?.name}</span>
						</div>
						<div className="info-item">
							<span className="info-label">Email:</span>
							<span className="info-value">{user?.email}</span>
						</div>
						<div className="info-item">
							<span className="info-label">Subscription:</span>
							<span
								className={`info-value ${
									user?.isSubscribed ? "subscribed" : "unsubscribed"
								}`}
							>
								{user?.isSubscribed ? "Active" : "Inactive"}
							</span>
						</div>
					</div>
				</div>

				<div className="campaigns-section">
					<div className="campaigns-header">
						<h2>Your Campaigns ({campaigns.length})</h2>
						<button
							onClick={() => navigate("/create-campaign")}
							className="create-campaign-btn"
						>
							+ Create Campaign
						</button>
					</div>

					{error && <div className="error-message">{error}</div>}

					{campaigns.length === 0 ? (
						<div className="empty-state">
							<h3>No campaigns yet</h3>
							<p>Create your first campaign to start reaching out to leads</p>
							<button
								onClick={() => navigate("/create-campaign")}
								className="create-campaign-btn"
							>
								Create Your First Campaign
							</button>
						</div>
					) : (
						<div className="campaigns-grid">
							{campaigns.map((campaign) => (
								<div key={campaign.id} className="campaign-card">
									<div className="campaign-header">
										<div className="campaign-title">
											<h3>{campaign.name}</h3>
											{campaign.tag && (
												<span className="campaign-tag">{campaign.tag}</span>
											)}
										</div>
										<span
											className={`campaign-status ${getStatusColor(
												campaign.status
											)}`}
										>
											{campaign.status}
										</span>
									</div>

									<div className="campaign-info">
										<div className="campaign-platform">
											<span className="platform-badge platform-{campaign.platform}">
												{campaign.platform}
											</span>
										</div>

										<div className="campaign-stats">
											<div className="stat-item">
												<span className="stat-label">Total Leads:</span>
												<span className="stat-value">
													{campaign.totalLeads}
												</span>
											</div>
											<div className="stat-item">
												<span className="stat-label">Variants:</span>
												<span className="stat-value">
													{campaign.variants?.length || 0}
												</span>
											</div>
											<div className="stat-item">
												<span className="stat-label">Created:</span>
												<span className="stat-value">
													{formatDate(campaign.createdAt)}
												</span>
											</div>
										</div>

										{campaign.description && (
											<p className="campaign-description">
												{campaign.description}
											</p>
										)}
									</div>

									<div className="campaign-actions">
										<Link to={`/campaign/${campaign.id}`}>
											<button className="action-btn view-btn">
												View Details
											</button>
										</Link>
										<Link to={`/campaign/edit/${campaign.id}`}>
											<button className="action-btn edit-btn">Edit</button>
										</Link>
										{campaign.status === "ready" && (
											<button className="action-btn start-btn">Start</button>
										)}
									</div>
								</div>
							))}
						</div>
					)}
				</div>
			</div>
		</div>
	);
};

export default Dashboard;
