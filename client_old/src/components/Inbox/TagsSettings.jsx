import { useState, useEffect } from "react";
import { chat } from "../../services/chat";

export default function TagsSettings({ activeConv, onClose, onTagsUpdate }) {
	const [allTags, setAllTags] = useState([]);
	const [conversationTags, setConversationTags] = useState([]);
	const [newTag, setNewTag] = useState("");
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		if (!activeConv) return;

		// Load all available tags
		chat
			.getTags()
			.then((response) => {
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

	const handleToggleTag = (tag) => {
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
		<div className="tags-settings-overlay">
			<div className="tags-settings-modal">
				<div className="tags-settings-header">
					<h3>Manage Tags</h3>
					<button onClick={onClose} className="close-btn">
						×
					</button>
				</div>

				<div className="tags-settings-content">
					<div className="add-tag-section">
						<h4>Create New Tag</h4>
						<div className="add-tag-input">
							<input
								type="text"
								value={newTag}
								onChange={(e) => setNewTag(e.target.value)}
								placeholder="Enter tag name..."
								onKeyPress={(e) => e.key === "Enter" && handleAddNewTag()}
							/>
							<button onClick={handleAddNewTag}>Add</button>
						</div>
					</div>

					<div className="available-tags-section">
						<h4>Available Tags</h4>
						<div className="tags-grid">
							{allTags.map((tag) => (
								<div
									key={tag}
									className={`tag-item ${
										conversationTags.includes(tag) ? "selected" : ""
									}`}
									onClick={() => handleToggleTag(tag)}
								>
									{tag}
								</div>
							))}
						</div>
					</div>

					<div className="selected-tags-section">
						<h4>Selected Tags ({conversationTags.length})</h4>
						<div className="selected-tags">
							{conversationTags.map((tag) => (
								<span key={tag} className="selected-tag">
									{tag}
									<button onClick={() => handleToggleTag(tag)}>×</button>
								</span>
							))}
						</div>
					</div>
				</div>

				<div className="tags-settings-footer">
					<button onClick={onClose}>Cancel</button>
					<button onClick={handleSave} disabled={loading}>
						{loading ? "Saving..." : "Save"}
					</button>
				</div>
			</div>
		</div>
	);
}
