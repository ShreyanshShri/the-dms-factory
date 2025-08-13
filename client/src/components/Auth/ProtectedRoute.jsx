// components/ProtectedRoute.js
import { useAuth } from "../../context/AuthContext";

const ProtectedRoute = ({ children, requireAdmin = false }) => {
	const { user, isAuthenticated, loading } = useAuth();

	if (loading) {
		return (
			<div className="loading-container">
				<div className="loading">Loading...</div>
			</div>
		);
	}

	if (!isAuthenticated) {
		window.location.href = "/login";
		return null;
	}

	if (requireAdmin && user?.role !== "admin") {
		return (
			<div className="container">
				<div className="access-denied">
					<h2>Access Denied</h2>
					<p>You don't have permission to access this page.</p>
				</div>
			</div>
		);
	}

	return children;
};

export default ProtectedRoute;
