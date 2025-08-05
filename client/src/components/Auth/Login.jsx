import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const Login = () => {
	const [formData, setFormData] = useState({
		email: "",
		password: "",
	});
	const [isLoading, setIsLoading] = useState(false);

	const { login, error, clearError, isAuthenticated } = useAuth();
	const navigate = useNavigate();

	useEffect(() => {
		if (isAuthenticated) {
			navigate("/dashboard");
		}
	}, [isAuthenticated, navigate]);

	useEffect(() => {
		clearError();
	});

	const handleChange = (e) => {
		const { name, value } = e.target;
		setFormData((prev) => ({
			...prev,
			[name]: value,
		}));
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		setIsLoading(true);

		const result = await login(formData.email, formData.password);

		if (result.success) {
			navigate("/dashboard");
		}

		setIsLoading(false);
	};

	return (
		<div className="auth-container">
			<div className="auth-card">
				<div className="auth-header">
					<h1>Welcome back</h1>
					<p>Sign in to your account</p>
				</div>

				<form onSubmit={handleSubmit} className="auth-form">
					<div className="form-group">
						<label htmlFor="email">Email</label>
						<input
							type="email"
							id="email"
							name="email"
							value={formData.email}
							onChange={handleChange}
							required
							className="form-input"
							placeholder="Enter your email"
						/>
					</div>

					<div className="form-group">
						<label htmlFor="password">Password</label>
						<input
							type="password"
							id="password"
							name="password"
							value={formData.password}
							onChange={handleChange}
							required
							className="form-input"
							placeholder="Enter your password"
						/>
					</div>

					{error && <div className="error-message">{error}</div>}

					<button type="submit" disabled={isLoading} className="auth-button">
						{isLoading ? "Signing in..." : "Sign in"}
					</button>
				</form>

				<div className="auth-footer">
					<p>
						Don't have an account?{" "}
						<Link to="/register" className="auth-link">
							Sign up
						</Link>
					</p>
				</div>
			</div>
		</div>
	);
};

export default Login;
