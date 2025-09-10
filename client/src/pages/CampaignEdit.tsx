import { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { campaignAPI } from "../services/api";

const CampaignEdit = () => {
	const { campaignId } = useParams();
	console.log(campaignId);
	const [campaign, setCampaign] = useState<any>(null);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState("");
	const [userError, setUserError] = useState("");
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
			const response = await campaignAPI.getCampaignById(campaignId || "");
			console.log("response", response);
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
		} catch (error: any) {
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
		} else {
			setError("No campaign ID provided");
		}
	}, [campaignId, fetchCampaignData]);

	const handleInputChange = (field: any, value: any) => {
		setFormData((prev) => ({
			...prev,
			[field]: value,
		}));
	};

	const handleVariantChange = (index: any, value: any) => {
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

	const removeVariant = (index: any) => {
		if (formData.variants.length > 1) {
			setFormData((prev) => ({
				...prev,
				variants: prev.variants.filter((_, i) => i !== index),
			}));
		}
	};

	const handleWorkingHoursChange = (field: any, value: any) => {
		setFormData((prev) => ({
			...prev,
			workingHours: {
				...prev.workingHours,
				[field]: parseInt(value),
			},
		}));
	};

	const handleMessageLimitsChange = (field: any, value: any) => {
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

	const handleSubmit = async (e: any) => {
		e.preventDefault();
		const validationErrors = validateForm();
		if (validationErrors.length > 0) {
			setUserError(validationErrors.join(", "));
			document
				?.getElementById("content")
				?.scrollTo({ top: 0, behavior: "smooth" });
			return;
		}

		try {
			setSaving(true);
			setUserError("");
			// Process new leads if provided
			let newLeadsArray: any[] = [];
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

			const response = await campaignAPI.updateCampaign(
				campaignId || "",
				updateData
			);

			if (response.success) {
				setSuccessMessage("Campaign updated successfully!");
				// Clear new leads input
				setFormData((prev) => ({ ...prev, newLeads: "" }));
				// Refresh campaign data
				await fetchCampaignData();
				// Hide success message after 3 seconds
				setTimeout(() => setSuccessMessage(""), 3000);
				document?.getElementById("content")?.scrollTo({ top: 0 });
			} else {
				setError(response.message || "Failed to update campaign");
			}
		} catch (error: any) {
			console.error("Error updating campaign:", error);
			setError(error.response?.data?.message || "Failed to update campaign");
		} finally {
			setSaving(false);
		}
	};

	if (loading) {
		return (
			<div className="min-h-screen bg-gray-900 flex items-center justify-center">
				<div className="text-center">
					<div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto"></div>
					<p className="text-white mt-4">Loading campaign data...</p>
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="min-h-screen bg-gray-900 flex items-center justify-center">
				<div className="bg-gray-800 rounded-lg p-8 max-w-md w-full mx-4">
					<h2 className="text-xl font-semibold text-white mb-4">
						Error Loading Campaign
					</h2>
					<p className="text-red-400 mb-6">{error}</p>
					<Link
						to="/dashboard"
						className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
					>
						Back to Dashboard
					</Link>
				</div>
			</div>
		);
	}

	const isActiveCampaign = campaign?.status === "active";

	return (
		<div className="min-h-screen bg-gray-900 p-6">
			<div className="max-w-4xl mx-auto">
				{/* Header */}
				<div className="mb-8">
					<Link
						to={`/dashboard/campaign-info/${campaignId}`}
						className="text-blue-400 hover:text-blue-300 mb-4 inline-block"
					>
						← Back to Campaign
					</Link>
					<h1 className="text-3xl font-bold text-white mb-2">Edit Campaign</h1>
					<p className="text-gray-400">
						Update your campaign settings and add new leads
					</p>
				</div>

				{/* Active Campaign Warning */}
				{isActiveCampaign && (
					<div className="bg-yellow-900/20 border border-yellow-600 rounded-lg p-4 mb-6">
						<div className="flex items-start">
							<span className="text-yellow-400 mr-2">⚠️</span>
							<div>
								<h3 className="text-yellow-400 font-semibold mb-1">
									Campaign is Currently Active
								</h3>
								<p className="text-yellow-300 text-sm">
									Some settings cannot be modified while the campaign is
									running. You can still update basic information, working
									hours, and add new leads.
								</p>
							</div>
						</div>
					</div>
				)}

				{/* Success Message */}
				{successMessage && (
					<div className="bg-green-900/20 border border-green-600 rounded-lg p-4 mb-6">
						<div className="flex items-center">
							<span className="text-green-400 mr-2">✓</span>
							<p className="text-green-300">{successMessage}</p>
						</div>
					</div>
				)}

				{/* Error Message */}
				{userError && (
					<div className="bg-red-900/20 border border-red-600 rounded-lg p-4 mb-6">
						<p className="text-red-400">{userError}</p>
					</div>
				)}

				{/* Form */}
				<form onSubmit={handleSubmit} className="space-y-8">
					{/* Basic Information */}
					<div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
						<h2 className="text-lg font-semibold text-white mb-4">
							Basic Information
						</h2>

						<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
							<div>
								<label className="block text-sm font-medium text-gray-300 mb-2">
									Campaign Name
								</label>
								<input
									type="text"
									value={formData.name}
									onChange={(e) => handleInputChange("name", e.target.value)}
									placeholder="Enter campaign name"
									className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
									required
								/>
							</div>

							<div>
								<label className="block text-sm font-medium text-gray-300 mb-2">
									Tag
								</label>
								<input
									type="text"
									value={formData.tag}
									onChange={(e) => handleInputChange("tag", e.target.value)}
									placeholder="Campaign tag"
									className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
								/>
							</div>
						</div>

						<div className="mt-6">
							<label className="block text-sm font-medium text-gray-300 mb-2">
								Description
							</label>
							<textarea
								value={formData.description}
								onChange={(e) =>
									handleInputChange("description", e.target.value)
								}
								placeholder="Describe your campaign"
								rows={3}
								className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
							/>
						</div>

						<div className="mt-6">
							<label className="block text-sm font-medium text-gray-300 mb-2">
								Context
							</label>
							<textarea
								value={formData.context}
								onChange={(e) => handleInputChange("context", e.target.value)}
								placeholder="Provide Context for AI messaging"
								rows={3}
								className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
							/>
						</div>

						<div className="mt-6">
							<label className="block text-sm font-medium text-gray-300 mb-2">
								Platform
							</label>
							<select
								value={formData.platform}
								onChange={(e) => handleInputChange("platform", e.target.value)}
								disabled={isActiveCampaign}
								className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
							>
								<option value="instagram">Instagram</option>
								<option value="twitter">Twitter</option>
							</select>
							{isActiveCampaign && (
								<p className="text-gray-400 text-sm mt-1">
									Platform cannot be changed while campaign is active
								</p>
							)}
						</div>
					</div>

					{/* Leads Management */}
					<div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
						<h2 className="text-lg font-semibold text-white mb-4">
							Leads Management
						</h2>

						<div className="bg-blue-900/20 border border-blue-600 rounded-lg p-4 mb-6">
							<div className="flex items-start">
								<span className="text-blue-400 mr-2">📍</span>
								<div>
									<h3 className="text-blue-400 font-semibold mb-1">
										Lead Management Policy
									</h3>
									<p className="text-blue-300 text-sm">
										You can add new leads to expand your campaign reach, but
										existing leads cannot be removed to maintain campaign
										integrity and prevent data complications.
									</p>
								</div>
							</div>
						</div>

						{/* Existing Leads Display */}
						<div className="mb-6">
							<h3 className="text-sm font-medium text-gray-300 mb-2">
								Current Leads
							</h3>
							<div className="bg-gray-700 rounded-lg p-4">
								<p className="text-gray-400 text-sm mb-2">
									Total leads: {campaign?.totalLeads || 0}
								</p>
								<pre className="text-gray-300 text-sm whitespace-pre-wrap overflow-auto max-h-32">
									{campaign?.allLeads?.split("\n").slice(0, 10).join("\n") ||
										"No leads found"}
									{campaign?.allLeads?.split("\n").length > 10 &&
										"\n... and more"}
								</pre>
							</div>
						</div>

						{/* New Leads Input */}
						<div>
							<label className="block text-sm font-medium text-gray-300 mb-2">
								Add New Leads
							</label>
							<textarea
								value={formData.newLeads}
								onChange={(e) => handleInputChange("newLeads", e.target.value)}
								placeholder={`Enter new usernames (one per line)
@username1
@username2
username3`}
								rows={6}
								className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
							/>
							<p className="text-gray-400 text-sm mt-1">
								Enter usernames one per line. The @ symbol is optional and will
								be removed automatically. Only new leads will be added -
								duplicates will be filtered out.
							</p>
						</div>
					</div>

					{/* Message Variants */}
					<div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
						<div className="flex items-center justify-between mb-4">
							<h2 className="text-lg font-semibold text-white">
								Message Variants
							</h2>
							{!isActiveCampaign && (
								<button
									type="button"
									onClick={addVariant}
									className="px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
								>
									+ Add Another Variant
								</button>
							)}
						</div>

						{isActiveCampaign && (
							<p className="text-yellow-400 text-sm mb-4">
								Message variants cannot be modified while campaign is active
							</p>
						)}

						<div className="space-y-4">
							{formData.variants.map((variant, index) => (
								<div
									key={index}
									className="border border-gray-600 rounded-lg p-4"
								>
									<div className="flex items-center justify-between mb-2">
										<label className="text-sm font-medium text-gray-300">
											Variant {index + 1}
										</label>
										{formData.variants.length > 1 && !isActiveCampaign && (
											<button
												type="button"
												onClick={() => removeVariant(index)}
												className="text-red-400 hover:text-red-300 text-sm"
											>
												Remove
											</button>
										)}
									</div>
									<textarea
										value={variant.message}
										onChange={(e) => handleVariantChange(index, e.target.value)}
										placeholder="Enter your message variant"
										rows={4}
										disabled={isActiveCampaign}
										className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
										required
									/>
								</div>
							))}
						</div>
					</div>

					{/* Working Hours */}
					<div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
						<h2 className="text-lg font-semibold text-white mb-4">
							Working Hours
						</h2>

						<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
							<div>
								<label className="block text-sm font-medium text-gray-300 mb-2">
									Start Hour: {formData.workingHours.start}:00
								</label>
								<input
									type="range"
									min={0}
									max={23}
									value={formData.workingHours.start}
									onChange={(e) =>
										handleWorkingHoursChange("start", e.target.value)
									}
									className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer slider accent-blue-500"
								/>
							</div>

							<div>
								<label className="block text-sm font-medium text-gray-300 mb-2">
									End Hour: {formData.workingHours.end}:00
								</label>
								<input
									type="range"
									min={0}
									max={23}
									value={formData.workingHours.end}
									onChange={(e) =>
										handleWorkingHoursChange("end", e.target.value)
									}
									className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer slider accent-blue-500"
								/>
							</div>
						</div>

						<p className="text-gray-400 text-sm mt-4">
							Set the hours when the campaign should be active. Messages will
							only be sent during these hours.
						</p>
					</div>

					{/* Message Limits */}
					<div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
						<h2 className="text-lg font-semibold text-white mb-4">
							Daily Message Limits
						</h2>

						<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
							<div>
								<label className="block text-sm font-medium text-gray-300 mb-2">
									Minimum messages per day: {formData.messageLimits.min}
								</label>
								<input
									type="range"
									min={1}
									max={100}
									value={formData.messageLimits.min}
									onChange={(e) =>
										handleMessageLimitsChange("min", e.target.value)
									}
									className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer slider accent-blue-500"
								/>
							</div>

							<div>
								<label className="block text-sm font-medium text-gray-300 mb-2">
									Maximum messages per day: {formData.messageLimits.max}
								</label>
								<input
									type="range"
									min={1}
									max={100}
									value={formData.messageLimits.max}
									onChange={(e) =>
										handleMessageLimitsChange("max", e.target.value)
									}
									className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer slider accent-blue-500"
								/>
							</div>
						</div>

						<p className="text-gray-400 text-sm mt-4">
							Set daily limits for message sending to avoid being flagged as
							spam.
						</p>
					</div>

					{/* Additional Options */}
					<div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
						<h2 className="text-lg font-semibold text-white mb-4">
							Additional Options
						</h2>

						<div className="space-y-4">
							<label className="flex items-center">
								<input
									type="checkbox"
									checked={formData.followUser}
									onChange={(e) =>
										handleInputChange("followUser", e.target.checked)
									}
									className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-500 bg-gray-700 rounded"
								/>
								<span className="ml-3 text-sm text-gray-300">
									Follow users before messaging
								</span>
							</label>

							<label className="flex items-center">
								<input
									type="checkbox"
									checked={formData.autoLikeStory}
									onChange={(e) =>
										handleInputChange("autoLikeStory", e.target.checked)
									}
									className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-500 bg-gray-700 rounded"
								/>
								<span className="ml-3 text-sm text-gray-300">
									Auto-like user's story
								</span>
							</label>

							<label className="flex items-center">
								<input
									type="checkbox"
									checked={formData.autoLikeNewestPost}
									onChange={(e) =>
										handleInputChange("autoLikeNewestPost", e.target.checked)
									}
									className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-500 bg-gray-700 rounded"
								/>
								<span className="ml-3 text-sm text-gray-300">
									Auto-like user's newest post
								</span>
							</label>
						</div>
					</div>

					{/* Form Actions */}
					<div className="flex justify-end space-x-4">
						<Link
							to={`/campaign/${campaignId}`}
							className="px-6 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700"
						>
							Cancel
						</Link>
						<button
							type="submit"
							disabled={saving}
							className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
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
