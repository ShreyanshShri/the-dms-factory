import { useState, useEffect } from "react";
import { chat } from "../services/chat";

export default function TagsSettings({
	activeConv,
	onClose,
	onTagsUpdate,
}: {
	activeConv: any;
	onClose: any;
	onTagsUpdate: any;
}) {
	const [allTags, setAllTags] = useState<any[]>([]);
	const [conversationTags, setConversationTags] = useState<any[]>([]);
	const [newTag, setNewTag] = useState("");
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		if (!activeConv) return;

		// Load all available tags
		chat
			.getTags()
			.then((response: any) => {
				setAllTags(response.tags || []);
			})
			.catch(console.error);

		// Set current conversation tags
		setConversationTags(activeConv.tags || []);
	}, [activeConv]);

	const handleAddNewTag = () => {
		if (!newTag.trim() || allTags.includes(newTag.trim())) return;

		const tag = newTag.trim();
		setAllTags((prev) => [...prev, tag]);
		setConversationTags((prev) => [...prev, tag]);
		setNewTag("");
	};

	const handleToggleTag = (tag: any) => {
		setConversationTags((prev) =>
			prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
		);
	};

	const handleSave = async () => {
		if (!activeConv) return;

		setLoading(true);
		try {
			await chat.updateTags(
				activeConv.businessAccount.id,
				activeConv.clientAccount.id,
				conversationTags
			);
			onTagsUpdate(conversationTags);
			onClose();
		} catch (err) {
			console.error("Failed to save tags:", err);
		}
		setLoading(false);
	};

	return (
		<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
			<div className="bg-gray-800 rounded-lg border border-gray-700 w-full max-w-md mx-4 max-h-[80vh] flex flex-col">
				{/* Header */}
				<div className="p-6 border-b border-gray-700">
					<h3 className="text-lg font-semibold text-white">Manage Tags</h3>
				</div>

				{/* Content */}
				<div className="flex-1 p-6 overflow-y-auto">
					{/* Create New Tag */}
					<div className="mb-6">
						<label className="block text-sm font-medium text-gray-300 mb-2">
							Create New Tag
						</label>
						<div className="flex space-x-2">
							<input
								type="text"
								value={newTag}
								onChange={(e) => setNewTag(e.target.value)}
								placeholder="Enter tag name..."
								onKeyPress={(e) => e.key === "Enter" && handleAddNewTag()}
								className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
							/>
							<button
								onClick={handleAddNewTag}
								disabled={!newTag.trim() || allTags.includes(newTag.trim())}
								className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
							>
								Add
							</button>
						</div>
					</div>

					{/* Available Tags */}
					<div className="mb-6">
						<h4 className="text-sm font-medium text-gray-300 mb-3">
							Available Tags
						</h4>
						<div className="space-y-2 max-h-40 overflow-y-auto">
							{allTags.map((tag) => (
								<label
									key={tag}
									className="flex items-center p-2 rounded-lg hover:bg-gray-700 cursor-pointer"
								>
									<input
										type="checkbox"
										checked={conversationTags.includes(tag)}
										onChange={() => handleToggleTag(tag)}
										className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-500 bg-gray-700 rounded"
									/>
									<span className="ml-3 text-sm text-gray-300">{tag}</span>
								</label>
							))}
						</div>
					</div>

					{/* Selected Tags */}
					<div>
						<h4 className="text-sm font-medium text-gray-300 mb-3">
							Selected Tags ({conversationTags.length})
						</h4>
						<div className="flex flex-wrap gap-2">
							{conversationTags.map((tag) => (
								<span
									key={tag}
									className="inline-flex items-center px-3 py-1 bg-blue-900/30 text-blue-300 text-sm rounded-full"
								>
									{tag}
									<button
										onClick={() => handleToggleTag(tag)}
										className="ml-2 text-blue-400 hover:text-blue-300"
									>
										×
									</button>
								</span>
							))}
						</div>
					</div>
				</div>

				{/* Footer */}
				<div className="p-6 border-t border-gray-700 flex justify-end space-x-3">
					<button
						onClick={onClose}
						className="px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700"
					>
						Cancel
					</button>
					<button
						onClick={handleSave}
						disabled={loading}
						className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
					>
						{loading ? "Saving..." : "Save"}
					</button>
				</div>
			</div>
		</div>
	);
}
