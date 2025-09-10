import { useState, useRef, useEffect } from "react";
import InstagramLoginButton from "./InstagramLoginButton";
import TagsSettings from "./TagsSettings";
import usePollingInbox from "../../hooks/usePollingInbox";
import { chat } from "../../services/chat";
import "../../styles/inbox.css";

export default function ChatApp() {
	const {
		accounts,
		conversations,
		filteredConversations,
		messages,
		activeConv,
		selectedTags,
		allTags,
		setFilteredConversations,
		setActiveConv,
		setSelectedTags,
		updateConversationTags,
		send,
	} = usePollingInbox(); // ← defaults to 60 000 ms

	const [draft, setDraft] = useState("");
	const [searchTerm, setSearchTerm] = useState("");
	const [selectedAccounts, setSelectedAccounts] = useState([]);
	const [accountsDropdownOpen, setAccountsDropdownOpen] = useState(false);
	const [settingsDropdownOpen, setSettingsDropdownOpen] = useState(false);
	const [tagsSettingsOpen, setTagsSettingsOpen] = useState(false);
	const [interested, setInterested] = useState(false);
	const [loading_interested, setLoading_interested] = useState(false);
	const messagesEndRef = useRef(null);

	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [messages]);

	useEffect(() => {
		setInterested(activeConv?.interested);
	}, [activeConv]);

	useEffect(() => {
		let filtered =
			selectedAccounts.length > 0
				? conversations.filter((c) =>
						selectedAccounts.includes(c.businessAccount.id)
				  )
				: conversations;

		// Apply tag filter
		if (selectedTags.length > 0) {
			filtered = filtered.filter((conv) => {
				const convTags = conv.tags || [];
				return selectedTags.some((tag) => convTags.includes(tag));
			});
		}

		// Apply search filter
		if (searchTerm) {
			filtered = filtered.filter((c) =>
				c?.clientAccount?.username
					?.toLowerCase()
					.includes(searchTerm.toLowerCase())
			);
		}

		setFilteredConversations(filtered);
	}, [selectedAccounts, conversations, selectedTags, searchTerm]);

	const sendMsg = () => {
		send(draft);
		setDraft("");
	};

	const handleSearch = (e) => {
		setSearchTerm(e.target.value);
	};

	const handleInterestedToggle = async () => {
		setLoading_interested(true);
		try {
			await chat.setInterested(
				activeConv.businessAccount.id,
				activeConv.clientAccount.id,
				!interested
			);
			setInterested(!interested);
		} catch (err) {
			console.error(err);
		}
		setLoading_interested(false);
	};

	const handleSelect = (id) => {
		setSelectedAccounts((prev) =>
			prev.includes(id) ? prev.filter((acc) => acc !== id) : [...prev, id]
		);
	};

	const handleTagSelect = (tag) => {
		setSelectedTags((prev) =>
			prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
		);
	};

	const handleTagsUpdate = (newTags) => {
		if (activeConv) {
			updateConversationTags(activeConv.id, newTags);
		}
	};

	return (
		<div className="chat-app">
			<aside className="sidebar">
				<h2 className="title">Unified Inbox</h2>
				<div className="sidebar-section">
					<h3>Accounts</h3>
					<InstagramLoginButton />
					<br />
					<br />
					<div className="dropdown">
						<button
							className="dropdown-btn"
							onClick={() => setAccountsDropdownOpen((prev) => !prev)}
						>
							Filter Accounts ⬇
						</button>
						{accountsDropdownOpen && (
							<div className="dropdown-menu">
								{accounts.map((acc) => (
									<label key={acc.user_id} className="dropdown-item">
										<input
											type="checkbox"
											checked={selectedAccounts.includes(acc.user_id)}
											onChange={() => handleSelect(acc.user_id)}
										/>
										{acc.username}
									</label>
								))}
							</div>
						)}
					</div>
				</div>

				<div className="sidebar-section">
					<h3>Tags Filter</h3>
					<div className="tags-list">
						{allTags.map((tag) => (
							<button
								key={tag}
								className={`tag-filter ${
									selectedTags.includes(tag) ? "active" : ""
								}`}
								onClick={() => handleTagSelect(tag)}
							>
								{tag}
							</button>
						))}
					</div>
					{selectedTags.length > 0 && (
						<button className="clear-tags" onClick={() => setSelectedTags([])}>
							Clear Tags
						</button>
					)}
				</div>

				<div className="sidebar-section">
					<h3>Inbox</h3>
					<input
						type="text"
						placeholder="Search Leads"
						className="search-input"
						value={searchTerm}
						onChange={handleSearch}
					/>
					{filteredConversations.map((c) => (
						<div
							key={c.id}
							className={`thread ${
								activeConv?.thread_id === c.thread_id ? "active" : ""
							} ${!c.responded && "unresponded"}`}
							onClick={() => setActiveConv(c)}
						>
							<div className="avatar">
								{c.clientAccount?.username?.[0]?.toUpperCase()}
							</div>
							<div className="thread-middle-panel">
								<div className="name">{c?.clientAccount?.username}</div>
								<div className="thread-last-message">{c.last_message}</div>
								{(c.tags || []).length > 0 && (
									<div className="conversation-tags">
										{c.tags.slice(0, 2).map((tag) => (
											<span key={tag} className="conversation-tag">
												{tag}
											</span>
										))}
										{c.tags.length > 2 && (
											<span className="more-tags">+{c.tags.length - 2}</span>
										)}
									</div>
								)}
							</div>
							<div className="thread-right-panel">
								{c?.unread_count > 0 && (
									<div className="unread-count">{c.unread_count}</div>
								)}
							</div>
						</div>
					))}
				</div>
			</aside>

			<main className="chat-pane">
				{activeConv ? (
					<>
						<header className="chat-header">
							<div className="chat-header-left">
								@{activeConv.clientAccount.username}
								<span className="text-muted">
									from @{activeConv.businessAccount.username}
								</span>
							</div>
							<div className="chat-header-right">
								<button
									onClick={() => setSettingsDropdownOpen((prev) => !prev)}
								>
									settings
								</button>
								{settingsDropdownOpen && (
									<div className="settings">
										<div
											className={`switch ${interested ? "on" : "off"} ${
												loading_interested ? "switch-loading" : ""
											}`}
											onClick={handleInterestedToggle}
										>
											<div className="slider" />
										</div>
										<button onClick={() => setTagsSettingsOpen(true)}>
											Manage Tags
										</button>
									</div>
								)}
							</div>
						</header>
						<section className="messages">
							{messages?.map((m, i) => (
								<div
									key={i}
									className={`bubble ${
										m.sender_id === activeConv.clientAccount.id ? "other" : "me"
									} ${m.pending ? "pending" : ""} ${m.failed ? "failed" : ""}`}
								>
									{m.text}
								</div>
							))}
							<div ref={messagesEndRef} />
						</section>
						<footer className="input-bar">
							<input
								value={draft}
								onChange={(e) => setDraft(e.target.value)}
								placeholder={`Message @${activeConv.clientAccount.username}…`}
								onKeyDown={(e) => e.key === "Enter" && sendMsg()}
							/>
							<button onClick={sendMsg} disabled={draft === ""}>
								➤
							</button>
						</footer>
					</>
				) : (
					<div className="placeholder">Select a contact to start chatting</div>
				)}
			</main>

			{/* Tags Settings Modal */}
			{tagsSettingsOpen && (
				<TagsSettings
					activeConv={activeConv}
					onClose={() => setTagsSettingsOpen(false)}
					onTagsUpdate={handleTagsUpdate}
				/>
			)}
		</div>
	);
}
