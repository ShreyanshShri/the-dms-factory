import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { campaignAPI } from "../services/api";

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
		context: "",
	});

	const handleChange = (e: any) => {
		const { name, value, type, checked } = e.target;
		if (name.includes(".")) {
			const [parent, child] = name.split(".");
			setFormData((prev: any) => ({
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

	const handleVariantChange = (index: any, value: any) => {
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

	const removeVariant = (index: any) => {
		if (formData.variants.length > 1) {
			const newVariants = formData.variants.filter((_, i) => i !== index);
			setFormData((prev) => ({
				...prev,
				variants: newVariants,
			}));
		}
	};

	const handleSubmit = async (e: any) => {
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
		} catch (error: any) {
			setError(error.response?.data?.message || "Failed to create campaign");
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="min-h-screen bg-gray-900 p-6">
			<div className="max-w-4xl mx-auto">
				<div className="mb-8">
					<h1 className="text-3xl font-bold text-white mb-2">
						Set up your outreach campaign
					</h1>
					<p className="text-gray-400">
						Configure your campaign settings and message variants
					</p>
				</div>

				<form onSubmit={handleSubmit} className="space-y-8">
					<div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
						<h2 className="text-lg font-semibold text-white mb-4">
							Campaign Details
						</h2>

						<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
							<div>
								<label
									className="block text-sm font-medium text-gray-300 mb-2"
									htmlFor="name"
								>
									Campaign Name
								</label>
								<input
									id="name"
									name="name"
									value={formData.name}
									onChange={handleChange}
									type="text"
									className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
									required
								/>
							</div>

							<div>
								<label className="block text-sm font-medium text-gray-300 mb-2">
									Platform
								</label>
								<select
									name="platform"
									value={formData.platform}
									onChange={handleChange}
									className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
								>
									<option value="instagram">Instagram</option>
									<option value="twitter">Twitter</option>
									<option value="facebook">Facebook</option>
								</select>
							</div>
						</div>

						<div className="mt-6">
							<label
								className="block text-sm font-medium text-gray-300 mb-2"
								htmlFor="description"
							>
								Description
							</label>
							<textarea
								id="description"
								name="description"
								value={formData.description}
								onChange={handleChange}
								className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
								rows={3}
							/>
						</div>

						<div className="mt-6">
							<label
								className="block text-sm font-medium text-gray-300 mb-2"
								htmlFor="tag"
							>
								Tag
							</label>
							<input
								type="text"
								id="tag"
								name="tag"
								value={formData.tag}
								onChange={handleChange}
								className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
							/>
						</div>
					</div>

					<div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
						<h2 className="text-lg font-semibold text-white mb-4">
							Target Leads
						</h2>

						<div>
							<label
								className="block text-sm font-medium text-gray-300 mb-2"
								htmlFor="leads"
							>
								Leads (separated by commas or new lines)
							</label>
							<textarea
								id="leads"
								name="leads"
								value={formData.leads}
								onChange={handleChange}
								placeholder="Enter leads separated by commas or new lines"
								className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
								rows={4}
							/>
						</div>
					</div>

					<div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
						<h2 className="text-lg font-semibold text-white mb-4">
							Campaign Settings
						</h2>

						<div className="space-y-6">
							<div>
								<h3 className="text-sm font-medium text-gray-300 mb-4">
									Working Hours
								</h3>
								<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
									<div>
										<label
											htmlFor="start"
											className="block text-sm text-gray-400 mb-2"
										>
											Start Time: {formData.workingHours.start}:00
										</label>
										<input
											type="range"
											id="start"
											name="workingHours.start"
											min={0}
											max={24}
											value={formData.workingHours.start}
											onChange={handleChange}
											className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer slider accent-blue-500"
										/>
									</div>
									<div>
										<label
											htmlFor="end"
											className="block text-sm text-gray-400 mb-2"
										>
											End Time: {formData.workingHours.end}:00
										</label>
										<input
											type="range"
											id="end"
											name="workingHours.end"
											min={0}
											max={23}
											value={formData.workingHours.end}
											onChange={handleChange}
											className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer slider accent-blue-500"
										/>
									</div>
								</div>
							</div>

							<div>
								<h3 className="text-sm font-medium text-gray-300 mb-4">
									Message Limits
								</h3>
								<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
									<div>
										<label
											htmlFor="min"
											className="block text-sm text-gray-400 mb-2"
										>
											Minimum: {formData.messageLimits.min}
										</label>
										<input
											type="range"
											id="min"
											name="messageLimits.min"
											min={0}
											max={100}
											value={formData.messageLimits.min}
											onChange={handleChange}
											className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer slider accent-blue-500"
										/>
									</div>
									<div>
										<label
											htmlFor="max"
											className="block text-sm text-gray-400 mb-2"
										>
											Maximum: {formData.messageLimits.max}
										</label>
										<input
											type="range"
											id="max"
											name="messageLimits.max"
											min={0}
											max={100}
											value={formData.messageLimits.max}
											onChange={handleChange}
											className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer slider accent-blue-500"
										/>
									</div>
								</div>
							</div>

							<div>
								<h3 className="text-sm font-medium text-gray-300 mb-4">
									Automation Options
								</h3>
								<div className="flex flex-wrap gap-6">
									<label className="flex items-center">
										<input
											type="checkbox"
											name="followUser"
											checked={formData.followUser}
											onChange={handleChange}
											className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-500 bg-gray-700 rounded"
										/>
										<span className="ml-2 text-sm text-gray-300">
											Follow User
										</span>
									</label>
									<label className="flex items-center">
										<input
											type="checkbox"
											name="autoLikeStory"
											checked={formData.autoLikeStory}
											onChange={handleChange}
											className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-500 bg-gray-700 rounded"
										/>
										<span className="ml-2 text-sm text-gray-300">
											Auto Like Story
										</span>
									</label>
									<label className="flex items-center">
										<input
											type="checkbox"
											name="autoLikeNewestPost"
											checked={formData.autoLikeNewestPost}
											onChange={handleChange}
											className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-500 bg-gray-700 rounded"
										/>
										<span className="ml-2 text-sm text-gray-300">
											Auto Like Newest Post
										</span>
									</label>
								</div>
							</div>
						</div>
					</div>

					<div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
						<h2 className="text-lg font-semibold text-white mb-4">
							Message Content
						</h2>

						<div className="mb-6">
							<label
								className="block text-sm font-medium text-gray-300 mb-2"
								htmlFor="context"
							>
								Context
							</label>
							<textarea
								id="context"
								name="context"
								value={formData.context}
								onChange={handleChange}
								placeholder="Add context for your messages..."
								className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
								rows={3}
							/>
						</div>

						<div>
							<div className="flex items-center justify-between mb-4">
								<h3 className="text-sm font-medium text-gray-300">
									Message Variants
								</h3>
								<button
									type="button"
									onClick={addVariant}
									className="px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500"
								>
									Add Variant
								</button>
							</div>

							<div className="space-y-3">
								{formData.variants.map((variant, idx) => (
									<div key={idx} className="flex gap-3">
										<textarea
											value={variant.message}
											onChange={(e) => handleVariantChange(idx, e.target.value)}
											placeholder={`Message variant ${idx + 1}...`}
											className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
											rows={3}
										/>
										{formData.variants.length > 1 && (
											<button
												type="button"
												onClick={() => removeVariant(idx)}
												className="px-3 py-2 text-sm text-red-400 border border-red-600 rounded-lg hover:bg-red-900/20 focus:ring-2 focus:ring-red-500"
											>
												Remove
											</button>
										)}
									</div>
								))}
							</div>
						</div>
					</div>

					{error && (
						<div className="bg-red-900/20 border border-red-600 rounded-lg p-4">
							<p className="text-red-400 text-sm">{error}</p>
						</div>
					)}

					<div className="flex justify-end">
						<button
							type="submit"
							disabled={isLoading}
							className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
						>
							{isLoading ? "Creating Campaign..." : "Create Campaign"}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
};

export default CreateCampaign;
