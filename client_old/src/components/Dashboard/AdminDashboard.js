import { useEffect, useState } from "react";
import { useAdmin } from "../../context/AdminContext";
import { useAuth } from "../../context/AuthContext";
import "../../styles/adminDashboard.css";

const AdminDashboard = () => {
	const { user, logout } = useAuth();
	const {
		pendingUsers,
		allUsers,
		loading,
		error,
		isAdmin,
		fetchPendingUsers,
		fetchAllUsers,
		approveUser,
		clearError,
	} = useAdmin();

	const [activeTab, setActiveTab] = useState("pending");
	const [statusFilter, setStatusFilter] = useState("all");

	useEffect(() => {
		if (isAdmin) {
			fetchPendingUsers();
			fetchAllUsers(1, statusFilter === "all" ? null : statusFilter);
		}
	}, [isAdmin, fetchPendingUsers, fetchAllUsers, statusFilter]);

	const handleApproveUser = async (uid, userName) => {
		if (window.confirm(`Are you sure you want to approve ${userName}?`)) {
			const result = await approveUser(uid);
			if (result.success) {
				alert("User approved successfully!");
				// Refresh the lists
				fetchPendingUsers();
				fetchAllUsers(1, statusFilter === "all" ? null : statusFilter);
			} else {
				alert(`Failed to approve user: ${result.error}`);
			}
		}
	};

	const handleLogout = async () => {
		try {
			const result = await logout();
			if (result.success) {
				// Redirect to login page
				window.location.href = "/login";
			}
		} catch (err) {
			console.log(err);
		}
	};

	if (!isAdmin) {
		return (
			<div className="admin-dashboard">
				<div className="access-denied">
					<h2>Access Denied</h2>
					<p>You don't have permission to access this page.</p>
				</div>
			</div>
		);
	}

	return (
		<div className="admin-dashboard">
			<div className="container">
				<div className="admin-header">
					<div className="admin-header-content">
						<div className="admin-title">
							<h1>Admin Dashboard</h1>
							<p>Welcome back, {user?.name}</p>
						</div>
						<button onClick={handleLogout} className="logout-btn">
							Logout
						</button>
					</div>
				</div>

				{error && (
					<div className="error-banner">
						<span>{error}</span>
						<button onClick={clearError} className="close-btn">
							×
						</button>
					</div>
				)}

				<div className="admin-tabs">
					<button
						className={`tab-btn ${activeTab === "pending" ? "active" : ""}`}
						onClick={() => setActiveTab("pending")}
					>
						Pending Approvals ({pendingUsers.length})
					</button>
					<button
						className={`tab-btn ${activeTab === "all" ? "active" : ""}`}
						onClick={() => setActiveTab("all")}
					>
						All Users
					</button>
				</div>

				{activeTab === "pending" && (
					<div className="tab-content">
						<h2>Pending User Approvals</h2>
						{loading ? (
							<div className="loading">Loading pending users...</div>
						) : pendingUsers.length === 0 ? (
							<div className="empty-state">
								<p>No pending approvals at the moment.</p>
							</div>
						) : (
							<div className="users-grid">
								{pendingUsers.map((user) => (
									<UserCard
										key={user.uid}
										user={user}
										onApprove={() => handleApproveUser(user.uid, user.name)}
										showApproveButton={true}
									/>
								))}
							</div>
						)}
					</div>
				)}

				{activeTab === "all" && (
					<div className="tab-content">
						<div className="all-users-header">
							<h2>All Users</h2>
							<select
								value={statusFilter}
								onChange={(e) => setStatusFilter(e.target.value)}
								className="status-filter"
							>
								<option value="all">All Status</option>
								<option value="pending">Pending</option>
								<option value="approved">Approved</option>
							</select>
						</div>

						{loading ? (
							<div className="loading">Loading users...</div>
						) : (
							<div className="users-grid">
								{allUsers.map((user) => (
									<UserCard
										key={user.uid}
										user={user}
										onApprove={() => handleApproveUser(user.uid, user.name)}
										showApproveButton={user.subscriptionStatus === "pending"}
									/>
								))}
							</div>
						)}
					</div>
				)}
			</div>
		</div>
	);
};

const UserCard = ({ user, onApprove, showApproveButton }) => {
	const formatDate = (timestamp) => {
		return new Date(timestamp).toLocaleDateString("en-US", {
			year: "numeric",
			month: "short",
			day: "numeric",
			hour: "2-digit",
			minute: "2-digit",
		});
	};

	const getStatusColor = (status) => {
		switch (status) {
			case "approved":
				return "#28a745";
			case "pending":
				return "#ffc107";
			default:
				return "#6c757d";
		}
	};

	return (
		<div className="user-card">
			<div className="user-info">
				<h3>{user.name}</h3>
				<p className="user-email">{user.email}</p>
				<div className="user-meta">
					<span className="user-date">
						Joined: {formatDate(user.createdAt)}
					</span>
					<span
						className="user-status"
						style={{ backgroundColor: getStatusColor(user.subscriptionStatus) }}
					>
						{user.subscriptionStatus}
					</span>
				</div>
			</div>

			{showApproveButton && (
				<div className="user-actions">
					<button onClick={onApprove} className="approve-btn">
						Approve User
					</button>
				</div>
			)}
		</div>
	);
};

export default AdminDashboard;
