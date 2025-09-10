import { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { campaignAPI } from "../../services/api";
import "../../styles/campaignEdit.css";

const CampaignEdit = () => {
	const { campaignId } = useParams();

	const [campaign, setCampaign] = useState(null);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState("");
	const [successMessage, setSuccessMessage] = useState("");

	// Form state
	const [formData, setFormData] = useState({
		name: "",
		description: "",
		platform: "instagram",
		tag: "",
		newLeads: "", // Only for new leads to add
		variants: [{ message: "" }],
		workingHours: { start: 9, end: 17 },
		messageLimits: { min: 35, max: 41 },
		followUser: false,
		autoLikeStory: false,
		autoLikeNewestPost: false,
		context: "",
	});

	const fetchCampaignData = useCallback(async () => {
		try {
			setLoading(true);
			const response = await campaignAPI.getCampaignById(campaignId);

			if (response.success) {
				const campaignData = response.data;
				setCampaign(campaignData);

				setFormData({
					name: campaignData.name || "",
					description: campaignData.description || "",
					platform: campaignData.platform || "instagram",
					tag: campaignData.tag || "",
					newLeads: "",
					variants: campaignData.variants?.length
						? campaignData.variants
						: [{ message: "" }],
					workingHours: campaignData.workingHours || { start: 9, end: 17 },
					messageLimits: campaignData.messageLimits || { min: 35, max: 41 },
					followUser: campaignData.followUser || false,
					autoLikeStory: campaignData.autoLikeStory || false,
					autoLikeNewestPost: campaignData.autoLikeNewestPost || false,
					context: campaignData.context || "",
				});
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
	}, [campaignId]);

	useEffect(() => {
		if (campaignId) {
			fetchCampaignData();
		}
	}, [campaignId, fetchCampaignData]);

	const handleInputChange = (field, value) => {
		setFormData((prev) => ({
			...prev,
			[field]: value,
		}));
	};

	const handleVariantChange = (index, value) => {
		setFormData((prev) => ({
			...prev,
			variants: prev.variants.map((variant, i) =>
				i === index ? { message: value } : variant
			),
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
			setFormData((prev) => ({
				...prev,
				variants: prev.variants.filter((_, i) => i !== index),
			}));
		}
	};

	const handleWorkingHoursChange = (field, value) => {
		setFormData((prev) => ({
			...prev,
			workingHours: {
				...prev.workingHours,
				[field]: parseInt(value),
			},
		}));
	};

	const handleMessageLimitsChange = (field, value) => {
		setFormData((prev) => ({
			...prev,
			messageLimits: {
				...prev.messageLimits,
				[field]: parseInt(value),
			},
		}));
	};

	const validateForm = () => {
		const errors = [];

		if (!formData.name.trim()) {
			errors.push("Campaign name is required");
		}

		if (!formData.platform) {
			errors.push("Platform selection is required");
		}

		const validVariants = formData.variants.filter((v) => v.message.trim());
		if (validVariants.length === 0) {
			errors.push("At least one message variant is required");
		}

		if (formData.workingHours.start >= formData.workingHours.end) {
			errors.push("Working hours end time must be after start time");
		}

		if (formData.messageLimits.min >= formData.messageLimits.max) {
			errors.push("Message limit maximum must be greater than minimum");
		}

		return errors;
	};

	const handleSubmit = async (e) => {
		e.preventDefault();

		const validationErrors = validateForm();
		if (validationErrors.length > 0) {
			setError(validationErrors.join("<br />"));
			window.scrollTo({ top: "0", behavior: "smooth" });
			return;
		}

		try {
			setSaving(true);
			setError("");

			// Process new leads if provided
			let newLeadsArray = [];
			if (formData.newLeads.trim()) {
				newLeadsArray = formData.newLeads
					.split("\n")
					.map((lead) => lead.trim())
					.filter((lead) => lead.length > 0);
			}

			const updateData = {
				name: formData.name.trim(),
				description: formData.description.trim(),
				platform: formData.platform,
				tag: formData.tag.trim(),
				newLeads: newLeadsArray, // Only new leads to add
				variants: formData.variants.filter((v) => v.message.trim()),
				workingHours: formData.workingHours,
				messageLimits: formData.messageLimits,
				followUser: formData.followUser,
				autoLikeStory: formData.autoLikeStory,
				autoLikeNewestPost: formData.autoLikeNewestPost,
				context: formData.context.trim(),
			};

			const response = await campaignAPI.updateCampaign(campaignId, updateData);

			if (response.success) {
				setSuccessMessage("Campaign updated successfully!");

				// Clear new leads input
				setFormData((prev) => ({ ...prev, newLeads: "" }));

				// Refresh campaign data
				await fetchCampaignData();

				// Hide success message after 3 seconds
				setTimeout(() => setSuccessMessage(""), 3000);
			} else {
				setError(response.message || "Failed to update campaign");
			}
		} catch (error) {
			console.error("Error updating campaign:", error);
			setError(error.response?.data?.message || "Failed to update campaign");
		} finally {
			setSaving(false);
		}
	};

	if (loading) {
		return (
			<div className="campaign-edit-container">
				<div className="campaign-edit-loading">
					<div className="loading-spinner"></div>
					<p>Loading campaign data...</p>
				</div>
			</div>
		);
	}

	if (error && !campaign) {
		return (
			<div className="campaign-edit-container">
				<div className="campaign-edit-error">
					<h2>Error Loading Campaign</h2>
					<p>{error}</p>
					<Link to="/dashboard" className="campaign-cancel-button">
						Back to Dashboard
					</Link>
				</div>
			</div>
		);
	}

	const isActiveCampaign = campaign?.status === "active";

	return (
		<div className="campaign-edit-container">
			{/* Header */}
			<div className="campaign-edit-header">
				<Link to={`/campaign/${campaignId}`} className="campaign-edit-back-btn">
					← Back to Campaign
				</Link>
				<div className="campaign-edit-title">
					<h1>Edit Campaign</h1>
					<p>Update your campaign settings and add new leads</p>
				</div>
			</div>

			<div className="campaign-edit-container">
				{/* Active Campaign Warning */}
				{isActiveCampaign && (
					<div className="campaign-status-warning">
						<h3>⚠️ Campaign is Currently Active</h3>
						<p>
							Some settings cannot be modified while the campaign is running.
							You can still update basic information, working hours, and add new
							leads.
						</p>
					</div>
				)}

				{/* Success Message */}
				{successMessage && (
					<div
						className={`campaign-success-message ${
							successMessage ? "show" : ""
						}`}
					>
						✓ {successMessage}
					</div>
				)}

				{/* Error Message */}
				{error !== "" && (
					<div className="error-message" style={{ marginBottom: "10px" }}>
						{error}
					</div>
				)}

				{/* Form */}
				<form className="campaign-edit-form" onSubmit={handleSubmit}>
					{/* Basic Information */}
					<div className="campaign-edit-section">
						<h2>Basic Information</h2>

						<div className="campaign-form-row">
							<div className="campaign-form-group">
								<label htmlFor="name">Campaign Name</label>
								<input
									type="text"
									id="name"
									className="campaign-form-input"
									value={formData.name}
									onChange={(e) => handleInputChange("name", e.target.value)}
									placeholder="Enter campaign name"
									required
								/>
							</div>

							<div className="campaign-form-group">
								<label htmlFor="tag">Tag</label>
								<input
									type="text"
									id="tag"
									className="campaign-form-input"
									value={formData.tag}
									onChange={(e) => handleInputChange("tag", e.target.value)}
									placeholder="Campaign tag"
								/>
							</div>
						</div>

						<div className="campaign-form-group">
							<label htmlFor="description">Description</label>
							<textarea
								id="description"
								className="campaign-form-textarea"
								value={formData.description}
								onChange={(e) =>
									handleInputChange("description", e.target.value)
								}
								placeholder="Describe your campaign"
								rows={3}
							/>
						</div>

						<div className="campaign-form-group">
							<label htmlFor="context">Description</label>
							<textarea
								id="context"
								className="campaign-form-textarea"
								value={formData.context}
								onChange={(e) => handleInputChange("context", e.target.value)}
								placeholder="Provide Context for AI messaging"
								rows={3}
							/>
						</div>

						<div className="campaign-form-row">
							<div className="campaign-form-group">
								<label htmlFor="platform">Platform</label>
								<select
									id="platform"
									className="campaign-form-select"
									value={formData.platform}
									onChange={(e) =>
										handleInputChange("platform", e.target.value)
									}
									disabled={isActiveCampaign}
								>
									<option value="instagram">Instagram</option>
									<option value="twitter">Twitter</option>
								</select>
								{isActiveCampaign && (
									<div className="campaign-form-help">
										Platform cannot be changed while campaign is active
									</div>
								)}
							</div>
						</div>
					</div>

					{/* Leads Management */}
					<div
						className={`campaign-edit-section ${isActiveCampaign ? "" : ""}`}
					>
						<h2>Leads Management</h2>

						<div className="campaign-leads-info">
							<h4>📍 Lead Management Policy</h4>
							<p>
								You can add new leads to expand your campaign reach, but
								existing leads cannot be removed to maintain campaign integrity
								and prevent data complications.
							</p>
						</div>

						{/* Existing Leads Display */}
						<div className="existing-leads-display">
							<h4>Current Leads</h4>
							<div className="existing-leads-count">
								Total leads: {campaign?.totalLeads || 0}
							</div>
							<div className="existing-leads-preview">
								{campaign?.allLeads?.split("\n").slice(0, 10).join("\n") ||
									"No leads found"}
								{campaign?.allLeads?.split("\n").length > 10 &&
									"\n... and more"}
							</div>
						</div>

						{/* New Leads Input */}
						<div className="campaign-form-group">
							<label htmlFor="newLeads">Add New Leads</label>
							<textarea
								id="newLeads"
								className="campaign-form-textarea"
								value={formData.newLeads}
								onChange={(e) => handleInputChange("newLeads", e.target.value)}
								placeholder="Enter new usernames (one per line)&#10;@username1&#10;@username2&#10;username3"
								rows={6}
							/>
							<div className="campaign-form-help">
								Enter usernames one per line. The @ symbol is optional and will
								be removed automatically. Only new leads will be added -
								duplicates will be filtered out.
							</div>
						</div>
					</div>

					{/* Message Variants */}
					<div
						className={`campaign-edit-section ${
							isActiveCampaign ? "disabled" : ""
						}`}
					>
						<h2>Message Variants</h2>

						{isActiveCampaign && (
							<div className="campaign-disabled-notice">
								Message variants cannot be modified while campaign is active
							</div>
						)}

						<div className="campaign-variants-container">
							{formData.variants.map((variant, index) => (
								<div key={index} className="campaign-variant-group">
									<div className="campaign-variant-header">
										<span className="campaign-variant-label">
											Variant {index + 1}
										</span>
										{formData.variants.length > 1 && !isActiveCampaign && (
											<button
												type="button"
												className="campaign-remove-variant-btn"
												onClick={() => removeVariant(index)}
											>
												Remove
											</button>
										)}
									</div>
									<textarea
										className="campaign-form-textarea"
										value={variant.message}
										onChange={(e) => handleVariantChange(index, e.target.value)}
										placeholder="Enter your message variant"
										rows={4}
										disabled={isActiveCampaign}
										required
									/>
								</div>
							))}

							{!isActiveCampaign && (
								<button
									type="button"
									className="campaign-add-variant-btn"
									onClick={addVariant}
								>
									+ Add Another Variant
								</button>
							)}
						</div>
					</div>

					{/* Working Hours */}
					<div className="campaign-edit-section">
						<h2>Working Hours</h2>

						<div className="campaign-working-hours">
							<div className="campaign-form-group">
								<label htmlFor="startHour">Start Hour (24h format)</label>
								<select
									id="startHour"
									className="campaign-form-select"
									value={formData.workingHours.start}
									onChange={(e) =>
										handleWorkingHoursChange("start", e.target.value)
									}
								>
									{Array.from({ length: 24 }, (_, i) => (
										<option key={i} value={i}>
											{i.toString().padStart(2, "0")}:00
										</option>
									))}
								</select>
							</div>

							<div className="campaign-form-group">
								<label htmlFor="endHour">End Hour (24h format)</label>
								<select
									id="endHour"
									className="campaign-form-select"
									value={formData.workingHours.end}
									onChange={(e) =>
										handleWorkingHoursChange("end", e.target.value)
									}
								>
									{Array.from({ length: 24 }, (_, i) => (
										<option key={i + 1} value={i + 1}>
											{(i + 1).toString().padStart(2, "0")}:00
										</option>
									))}
								</select>
							</div>
						</div>

						<div className="campaign-form-help">
							Set the hours when the campaign should be active. Messages will
							only be sent during these hours.
						</div>
					</div>

					{/* Message Limits */}
					<div className="campaign-edit-section">
						<h2>Daily Message Limits</h2>

						<div className="campaign-message-limits">
							<div className="campaign-form-group">
								<label htmlFor="minMessages">Minimum messages per day</label>
								<input
									type="number"
									id="minMessages"
									className="campaign-form-input"
									value={formData.messageLimits.min}
									onChange={(e) =>
										handleMessageLimitsChange("min", e.target.value)
									}
									min="1"
									max="100"
									required
								/>
							</div>

							<div className="campaign-form-group">
								<label htmlFor="maxMessages">Maximum messages per day</label>
								<input
									type="number"
									id="maxMessages"
									className="campaign-form-input"
									value={formData.messageLimits.max}
									onChange={(e) =>
										handleMessageLimitsChange("max", e.target.value)
									}
									min="1"
									max="100"
									required
								/>
							</div>
						</div>

						<div className="campaign-form-help">
							Set daily limits for message sending to avoid being flagged as
							spam.
						</div>
					</div>

					{/* Additional Options */}
					<div className="campaign-edit-section">
						<h2>Additional Options</h2>

						<div className="campaign-form-checkboxes">
							<div className="campaign-checkbox-group">
								<input
									type="checkbox"
									id="followUser"
									className="campaign-form-checkbox"
									checked={formData.followUser}
									onChange={(e) =>
										handleInputChange("followUser", e.target.checked)
									}
								/>
								<label htmlFor="followUser">
									Follow users before messaging
								</label>
							</div>

							<div className="campaign-checkbox-group">
								<input
									type="checkbox"
									id="autoLikeStory"
									className="campaign-form-checkbox"
									checked={formData.autoLikeStory}
									onChange={(e) =>
										handleInputChange("autoLikeStory", e.target.checked)
									}
								/>
								<label htmlFor="autoLikeStory">Auto-like user's story</label>
							</div>

							<div className="campaign-checkbox-group">
								<input
									type="checkbox"
									id="autoLikeNewestPost"
									className="campaign-form-checkbox"
									checked={formData.autoLikeNewestPost}
									onChange={(e) =>
										handleInputChange("autoLikeNewestPost", e.target.checked)
									}
								/>
								<label htmlFor="autoLikeNewestPost">
									Auto-like user's newest post
								</label>
							</div>
						</div>
					</div>

					{/* Form Actions */}
					<div className="campaign-form-actions">
						<Link
							to={`/campaign/${campaignId}`}
							className="campaign-cancel-button"
						>
							Cancel
						</Link>

						<button
							type="submit"
							className="campaign-submit-button"
							disabled={saving}
						>
							{saving ? "Updating..." : "Update Campaign"}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
};

export default CampaignEdit;
