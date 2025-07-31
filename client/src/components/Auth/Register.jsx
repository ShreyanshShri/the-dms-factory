import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const Register = () => {
	const [formData, setFormData] = useState({
		name: "",
		email: "",
		password: "",
	});
	const [isLoading, setIsLoading] = useState(false);

	const { register, error, clearError, isAuthenticated } = useAuth();
	const navigate = useNavigate();

	useEffect(() => {
		if (isAuthenticated) {
			navigate("/dashboard");
		}
	}, [isAuthenticated, navigate]);

	useEffect(() => {
		clearError();
	}, []);

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

		const result = await register(
			formData.name,
			formData.email,
			formData.password
		);

		if (result.success) {
			navigate("/dashboard");
		}

		setIsLoading(false);
	};

	return (
		<div className="auth-container">
			<div className="auth-card">
				<div className="auth-header">
					<h1>Create account</h1>
					<p>Sign up to get started</p>
				</div>

				<form onSubmit={handleSubmit} className="auth-form">
					<div className="form-group">
						<label htmlFor="name">Full Name</label>
						<input
							type="text"
							id="name"
							name="name"
							value={formData.name}
							onChange={handleChange}
							required
							className="form-input"
							placeholder="Enter your full name"
						/>
					</div>

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
							minLength="6"
							className="form-input"
							placeholder="Enter your password (min. 6 characters)"
						/>
					</div>

					{error && <div className="error-message">{error}</div>}

					<button type="submit" disabled={isLoading} className="auth-button">
						{isLoading ? "Creating account..." : "Create account"}
					</button>
				</form>

				<div className="auth-footer">
					<p>
						Already have an account?{" "}
						<Link to="/login" className="auth-link">
							Sign in
						</Link>
					</p>
				</div>
			</div>
		</div>
	);
};

export default Register;
