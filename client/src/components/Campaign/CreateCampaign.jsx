import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { campaignAPI } from "../../services/api";

const CreateCampaign = () => {
	const navigate = useNavigate();
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState("");
	const [formData, setFormData] = useState({
		name: "",
		description: "",
		platform: "instagram",
		tag: "",
		leads: "",
		variants: [{ message: "" }],
		workingHours: {
			start: 9,
			end: 17,
		},
		messageLimits: {
			min: 35,
			max: 41,
		},
		followUser: false,
		autoLikeStory: false,
		autoLikeNewestPost: false,
	});

	const handleChange = (e) => {
		const { name, value, type, checked } = e.target;

		if (name.includes(".")) {
			const [parent, child] = name.split(".");
			setFormData((prev) => ({
				...prev,
				[parent]: {
					...prev[parent],
					[child]: type === "number" ? parseInt(value) : value,
				},
			}));
		} else {
			setFormData((prev) => ({
				...prev,
				[name]: type === "checkbox" ? checked : value,
			}));
		}
	};

	const handleVariantChange = (index, value) => {
		const newVariants = [...formData.variants];
		newVariants[index] = { message: value };
		setFormData((prev) => ({
			...prev,
			variants: newVariants,
		}));
	};

	const addVariant = () => {
		setFormData((prev) => ({
			...prev,
			variants: [...prev.variants, { message: "" }],
		}));
	};

	const removeVariant = (index) => {
		if (formData.variants.length > 1) {
			const newVariants = formData.variants.filter((_, i) => i !== index);
			setFormData((prev) => ({
				...prev,
				variants: newVariants,
			}));
		}
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		setIsLoading(true);
		setError("");

		try {
			// Process leads - split by newlines and commas
			const leadsArray = formData.leads
				.split(/[\n,]/)
				.map((lead) => lead.trim())
				.filter((lead) => lead.length > 0);

			const campaignData = {
				...formData,
				leads: leadsArray,
				description: formData.description || formData.name,
			};

			const response = await campaignAPI.createCampaign(campaignData);

			if (response.success) {
				navigate("/dashboard");
			} else {
				setError(response.message || "Failed to create campaign");
			}
		} catch (error) {
			setError(error.response?.data?.message || "Failed to create campaign");
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="create-campaign-container">
			<div className="create-campaign-header">
				<button onClick={() => navigate("/dashboard")} className="back-button">
					← Back to Dashboard
				</button>
				<h1>Create New Campaign</h1>
				<p>Set up your outreach campaign</p>
			</div>

			<form onSubmit={handleSubmit} className="campaign-form">
				<div className="form-section">
					<h2>Basic Information</h2>

					<div className="form-row">
						<div className="form-group">
							<label htmlFor="name">Campaign Name *</label>
							<input
								type="text"
								id="name"
								name="name"
								value={formData.name}
								onChange={handleChange}
								required
								className="form-input"
								placeholder="Enter campaign name"
							/>
						</div>

						<div className="form-group">
							<label htmlFor="tag">Tag</label>
							<input
								type="text"
								id="tag"
								name="tag"
								value={formData.tag}
								onChange={handleChange}
								className="form-input"
								placeholder="Campaign tag"
							/>
						</div>
					</div>

					<div className="form-group">
						<label htmlFor="description">Description</label>
						<textarea
							id="description"
							name="description"
							value={formData.description}
							onChange={handleChange}
							className="form-textarea"
							placeholder="Campaign description (optional)"
							rows="3"
						/>
					</div>

					<div className="form-group">
						<label htmlFor="platform">Platform *</label>
						<select
							id="platform"
							name="platform"
							value={formData.platform}
							onChange={handleChange}
							required
							className="form-select"
						>
							<option value="instagram">Instagram</option>
							<option value="twitter">Twitter</option>
						</select>
					</div>
				</div>

				<div className="form-section">
					<h2>Target Leads</h2>
					<div className="form-group">
						<label htmlFor="leads">Leads *</label>
						<textarea
							id="leads"
							name="leads"
							value={formData.leads}
							onChange={handleChange}
							required
							className="form-textarea"
							placeholder="Enter usernames (one per line or comma-separated)&#10;@username1&#10;@username2&#10;username3"
							rows="8"
						/>
						<small className="form-help">
							Enter usernames one per line or separated by commas. @ symbols
							will be automatically removed.
						</small>
					</div>
				</div>

				<div className="form-section">
					<h2>Message Variants</h2>
					{formData.variants.map((variant, index) => (
						<div key={index} className="variant-group">
							<div className="variant-header">
								<label>Message Variant {index + 1} *</label>
								{formData.variants.length > 1 && (
									<button
										type="button"
										onClick={() => removeVariant(index)}
										className="remove-variant-btn"
									>
										Remove
									</button>
								)}
							</div>
							<textarea
								value={variant.message}
								onChange={(e) => handleVariantChange(index, e.target.value)}
								required
								className="form-textarea"
								placeholder="Enter your message..."
								rows="4"
							/>
						</div>
					))}
					<button
						type="button"
						onClick={addVariant}
						className="add-variant-btn"
					>
						+ Add Message Variant
					</button>
				</div>

				<div className="form-section">
					<h2>Campaign Settings</h2>

					<div className="form-row">
						<div className="form-group">
							<label htmlFor="workingHours.start">Working Hours Start</label>
							<input
								type="number"
								id="workingHours.start"
								name="workingHours.start"
								value={formData.workingHours.start}
								onChange={handleChange}
								min="0"
								max="23"
								className="form-input"
							/>
						</div>

						<div className="form-group">
							<label htmlFor="workingHours.end">Working Hours End</label>
							<input
								type="number"
								id="workingHours.end"
								name="workingHours.end"
								value={formData.workingHours.end}
								onChange={handleChange}
								min="0"
								max="23"
								className="form-input"
							/>
						</div>
					</div>

					<div className="form-row">
						<div className="form-group">
							<label htmlFor="messageLimits.min">Min Messages per Day</label>
							<input
								type="number"
								id="messageLimits.min"
								name="messageLimits.min"
								value={formData.messageLimits.min}
								onChange={handleChange}
								min="1"
								className="form-input"
							/>
						</div>

						<div className="form-group">
							<label htmlFor="messageLimits.max">Max Messages per Day</label>
							<input
								type="number"
								id="messageLimits.max"
								name="messageLimits.max"
								value={formData.messageLimits.max}
								onChange={handleChange}
								min="1"
								className="form-input"
							/>
						</div>
					</div>

					<div className="form-checkboxes">
						<div className="checkbox-group">
							<input
								type="checkbox"
								id="followUser"
								name="followUser"
								checked={formData.followUser}
								onChange={handleChange}
								className="form-checkbox"
							/>
							<label htmlFor="followUser">Auto Follow Users</label>
						</div>

						<div className="checkbox-group">
							<input
								type="checkbox"
								id="autoLikeStory"
								name="autoLikeStory"
								checked={formData.autoLikeStory}
								onChange={handleChange}
								className="form-checkbox"
							/>
							<label htmlFor="autoLikeStory">Auto Like Stories</label>
						</div>

						<div className="checkbox-group">
							<input
								type="checkbox"
								id="autoLikeNewestPost"
								name="autoLikeNewestPost"
								checked={formData.autoLikeNewestPost}
								onChange={handleChange}
								className="form-checkbox"
							/>
							<label htmlFor="autoLikeNewestPost">Auto Like Newest Post</label>
						</div>
					</div>
				</div>

				{error && <div className="error-message">{error}</div>}

				<div className="form-actions">
					<button
						type="button"
						onClick={() => navigate("/dashboard")}
						className="cancel-button"
					>
						Cancel
					</button>
					<button type="submit" disabled={isLoading} className="submit-button">
						{isLoading ? "Creating Campaign..." : "Create Campaign"}
					</button>
				</div>
			</form>
		</div>
	);
};

export default CreateCampaign;
