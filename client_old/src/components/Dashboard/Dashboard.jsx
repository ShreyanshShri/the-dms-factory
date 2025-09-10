import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
// import { campaignAPI } from "../../services/api";
import { Line, Bar } from "react-chartjs-2";
import {
	Chart as ChartJS,
	CategoryScale,
	LinearScale,
	PointElement,
	LineElement,
	BarElement,
	Title,
	Tooltip,
	Legend,
} from "chart.js";

// Register Chart.js components
ChartJS.register(
	CategoryScale,
	LinearScale,
	PointElement,
	LineElement,
	BarElement,
	Title,
	Tooltip,
	Legend
);

const Dashboard = () => {
	const { user, logout } = useAuth();
	const navigate = useNavigate();
	// const [campaigns, setCampaigns] = useState([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");

	// useEffect(() => {
	// 	// Add a small delay to let auth settle
	// 	const timer = setTimeout(() => {
	// 		fetchCampaigns();
	// 	}, 500);

	// 	return () => clearTimeout(timer);
	// }, []);

	// const fetchCampaigns = async () => {
	// 	try {
	// 		setLoading(true);
	// 		const response = await campaignAPI.getCampaigns();
	// 		setCampaigns(response.campaigns || []);
	// 	} catch (error) {
	// 		console.error("Error fetching campaigns:", error);
	// 		setError("Failed to fetch campaigns");
	// 	} finally {
	// 		setLoading(false);
	// 	}
	// };

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
				<p>Loading...</p>
			</div>
		);
	}

	if (!user.isSubscribed) {
		return (
			<div className="admin-dashboard">
				<div className="access-denied">
					<h2>Access Denied</h2>
					<p>You donot have DMs factory subscription.</p>
					<Link to="/payment">
						<button className="logout-button">Buy Subscription</button>
					</Link>
					<br />
					<p>If you already have a subscription, Please contact the owner.</p>
					<br />
					<button onClick={handleLogout} className="logout-button">
						Logout
					</button>
				</div>
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
				<div>
					{/* <Link to="/manage-accounts">
						<button className="create-campaign-btn">Manage Accounts</button>
					</Link> */}
					<Link to="/inbox">
						<button className="create-campaign-btn">Inbox</button>
					</Link>
					<Link to="/crm">
						<button
							className="create-campaign-btn"
							style={{ marginLeft: "10px" }}
						>
							CRM
						</button>
					</Link>
					<button onClick={handleLogout} className="logout-button">
						Logout
					</button>
				</div>
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

				{/* <div className="campaigns-section">
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
									</div>
								</div>
							))}
						</div>
					)}
				</div> */}
			</div>
			<StatsSection />
		</div>
	);
};

const StatsSection = () => {
	// Mock data - replace with your API call
	const mockData = [
		{ date: "2025-08-29", messages: 5, leads: 2 },
		{ date: "2025-08-28", messages: 6, leads: 3 },
		{ date: "2025-08-27", messages: 7, leads: 4 },
		{ date: "2025-08-26", messages: 8, leads: 5 },
		{ date: "2025-08-25", messages: 9, leads: 6 },
		{ date: "2025-08-24", messages: 10, leads: 2 },
		{ date: "2025-08-23", messages: 11, leads: 3 },
		{ date: "2025-08-22", messages: 12, leads: 4 },
		{ date: "2025-08-21", messages: 13, leads: 5 },
		{ date: "2025-08-20", messages: 14, leads: 6 },
		{ date: "2025-08-19", messages: 15, leads: 2 },
		{ date: "2025-08-18", messages: 5, leads: 3 },
	];

	// Calculate stats
	const today = mockData[0];
	const thisWeek = mockData.slice(0, 7).reduce(
		(acc, day) => ({
			messages: acc.messages + day.messages,
			leads: acc.leads + day.leads,
		}),
		{ messages: 0, leads: 0 }
	);

	const thisMonth = mockData.reduce(
		(acc, day) => ({
			messages: acc.messages + day.messages,
			leads: acc.leads + day.leads,
		}),
		{ messages: 0, leads: 0 }
	);

	// Last 7 days for charts
	const last7Days = mockData.slice(0, 7).reverse();

	// Chart configurations
	const chartOptions = {
		responsive: true,
		maintainAspectRatio: false,
		plugins: {
			legend: {
				labels: {
					color: "#ffffff",
				},
			},
		},
		scales: {
			x: {
				ticks: { color: "#a0a0a0" },
				grid: { color: "#333333" },
			},
			y: {
				ticks: { color: "#a0a0a0" },
				grid: { color: "#333333" },
			},
		},
	};

	const lineChartData = {
		labels: last7Days.map((d) =>
			new Date(d.date).toLocaleDateString("en-US", {
				month: "short",
				day: "numeric",
			})
		),
		datasets: [
			{
				label: "Messages",
				data: last7Days.map((d) => d.messages),
				borderColor: "#007bff",
				backgroundColor: "rgba(0, 123, 255, 0.1)",
				tension: 0.4,
			},
			{
				label: "Leads",
				data: last7Days.map((d) => d.leads),
				borderColor: "#28a745",
				backgroundColor: "rgba(40, 167, 69, 0.1)",
				tension: 0.4,
			},
		],
	};

	const barChartData = {
		labels: ["Today", "This Week", "This Month"],
		datasets: [
			{
				label: "Messages",
				data: [today.messages, thisWeek.messages, thisMonth.messages],
				backgroundColor: "rgba(0, 123, 255, 0.8)",
				borderColor: "#007bff",
				borderWidth: 1,
			},
			{
				label: "Leads",
				data: [today.leads, thisWeek.leads, thisMonth.leads],
				backgroundColor: "rgba(40, 167, 69, 0.8)",
				borderColor: "#28a745",
				borderWidth: 1,
			},
		],
	};

	return (
		<div className="stats-section">
			{/* Stats Cards */}
			<div className="stats-cards">
				<div className="stat-card">
					<div className="stat-icon">📊</div>
					<div className="stat-content">
						<h3>{today.messages}</h3>
						<p>Messages Today</p>
						<span className="trend up">
							+
							{(
								(today.messages / (mockData[1]?.messages || 1) - 1) *
								100
							).toFixed(1)}
							%
						</span>
					</div>
				</div>

				<div className="stat-card">
					<div className="stat-icon">👥</div>
					<div className="stat-content">
						<h3>{today.leads}</h3>
						<p>Leads Today</p>
						<span className="trend up">
							+
							{((today.leads / (mockData[1]?.leads || 1) - 1) * 100).toFixed(1)}
							%
						</span>
					</div>
				</div>

				<div className="stat-card">
					<div className="stat-icon">📈</div>
					<div className="stat-content">
						<h3>{thisWeek.messages}</h3>
						<p>Messages This Week</p>
						<span className="trend up">+12.5%</span>
					</div>
				</div>

				<div className="stat-card">
					<div className="stat-icon">🎯</div>
					<div className="stat-content">
						<h3>{thisMonth.leads}</h3>
						<p>Total Leads This Month</p>
						<span className="trend up">+8.3%</span>
					</div>
				</div>
			</div>

			{/* Charts */}
			<div className="charts-container">
				<div className="chart-card">
					<h3>7-Day Trend</h3>
					<div className="chart-wrapper">
						<Line data={lineChartData} options={chartOptions} />
					</div>
				</div>

				<div className="chart-card">
					<h3>Period Overview</h3>
					<div className="chart-wrapper">
						<Bar data={barChartData} options={chartOptions} />
					</div>
				</div>
			</div>
		</div>
	);
};

export default Dashboard;
