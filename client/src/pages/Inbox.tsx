import { useState, useRef, useEffect } from "react";
import InstagramLoginButton from "../components/InstagramLoginButton";
import TagsSettings from "../components/TagsSettings";
import usePollingInbox from "../hooks/usePollingInbox.ts";
import { chat } from "../services/chat";

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
	const [selectedAccounts, setSelectedAccounts] = useState<any[]>([]);
	const [accountsDropdownOpen, setAccountsDropdownOpen] = useState(false);
	const [settingsDropdownOpen, setSettingsDropdownOpen] = useState(false);
	const [tagsSettingsOpen, setTagsSettingsOpen] = useState(false);
	const [interested, setInterested] = useState(false);
	const [loading_interested, setLoading_interested] = useState(false);

	const messagesEndRef = useRef<any>(null);

	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [messages]);

	useEffect(() => {
		setInterested(activeConv?.interested);
	}, [activeConv]);

	useEffect(() => {
		let filtered =
			selectedAccounts.length > 0
				? conversations.filter((c: any) =>
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

	const handleSearch = (e: any) => {
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

	const handleSelect = (id: any) => {
		setSelectedAccounts((prev) =>
			prev.includes(id) ? prev.filter((acc) => acc !== id) : [...prev, id]
		);
	};

	const handleTagSelect = (tag: any) => {
		setSelectedTags((prev) =>
			prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
		);
	};

	const handleTagsUpdate = (newTags: any) => {
		if (activeConv) {
			updateConversationTags(activeConv.id, newTags);
		}
	};

	return (
		<div className="h-full bg-gray-900 flex">
			{/* Sidebar */}
			<div className="w-80 bg-gray-800 border-r border-gray-700 flex flex-col h-full overflow-auto">
				{/* Header */}
				<div className="p-4 border-b border-gray-700">
					<h2 className="text-xl font-bold text-white mb-4">Inbox</h2>

					{/* Search */}
					<div className="mb-4">
						<input
							type="text"
							placeholder="Search conversations..."
							value={searchTerm}
							onChange={handleSearch}
							className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
						/>
					</div>

					{/* Filters */}
					<div className="space-y-2">
						{/* Accounts Filter */}
						<div className="relative">
							<button
								onClick={() => setAccountsDropdownOpen(!accountsDropdownOpen)}
								className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-left text-white hover:bg-gray-600 focus:ring-2 focus:ring-blue-500"
							>
								Accounts ({selectedAccounts.length})
							</button>
							{accountsDropdownOpen && (
								<div className="absolute top-full left-0 right-0 mt-1 bg-gray-700 border border-gray-600 rounded-lg shadow-lg z-10 max-h-40 overflow-y-auto">
									{accounts.map((acc) => (
										<label
											key={acc.id}
											className="flex items-center px-3 py-2 hover:bg-gray-600 cursor-pointer"
										>
											<input
												type="checkbox"
												checked={selectedAccounts.includes(acc.id)}
												onChange={() => handleSelect(acc.id)}
												className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-500 bg-gray-700 rounded"
											/>
											<span className="ml-2 text-sm text-gray-300">
												{acc.username}
											</span>
										</label>
									))}
								</div>
							)}
						</div>

						{/* Tags Filter */}
						<div className="relative">
							<button
								onClick={() => setSettingsDropdownOpen(!settingsDropdownOpen)}
								className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-left text-white hover:bg-gray-600 focus:ring-2 focus:ring-blue-500"
							>
								Tags ({selectedTags.length})
							</button>
							{settingsDropdownOpen && (
								<div className="absolute top-full left-0 right-0 mt-1 bg-gray-700 border border-gray-600 rounded-lg shadow-lg z-10 max-h-40 overflow-y-auto">
									{allTags.map((tag) => (
										<label
											key={tag}
											className="flex items-center px-3 py-2 hover:bg-gray-600 cursor-pointer"
										>
											<input
												type="checkbox"
												checked={selectedTags.includes(tag)}
												onChange={() => handleTagSelect(tag)}
												className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-500 bg-gray-700 rounded"
											/>
											<span className="ml-2 text-sm text-gray-300">{tag}</span>
										</label>
									))}
								</div>
							)}
						</div>
					</div>

					<div className="mt-4">
						<InstagramLoginButton />
					</div>
				</div>

				{/* Conversations List */}
				<div className="flex-1 overflow-y-auto">
					{filteredConversations.map((conv) => (
						<div
							key={conv.id}
							onClick={() => setActiveConv(conv)}
							className={`p-4 border-b border-gray-700 cursor-pointer hover:bg-gray-700 ${
								activeConv?.id === conv.id ? "bg-gray-700" : ""
							}`}
						>
							<div className="flex items-center justify-between">
								<h3 className="font-semibold text-white">
									{conv?.clientAccount?.username}
								</h3>
								{conv.unread && (
									<div className="w-2 h-2 bg-blue-500 rounded-full"></div>
								)}
							</div>
							<p className="text-sm text-gray-400 truncate">
								{conv.lastMessage?.text || "No messages"}
							</p>
							<div className="flex flex-wrap gap-1 mt-2">
								{(conv.tags || []).map((tag: any) => (
									<span
										key={tag}
										className="px-2 py-1 bg-blue-900/30 text-blue-300 text-xs rounded-full"
									>
										{tag}
									</span>
								))}
							</div>
						</div>
					))}
				</div>
			</div>

			{/* Chat Area */}
			<div className="flex-1 flex flex-col">
				{activeConv ? (
					<>
						{/* Chat Header */}
						<div className="p-4 bg-gray-800 border-b border-gray-700 flex items-center justify-between">
							<div>
								<h3 className="font-semibold text-white">
									{activeConv?.clientAccount?.username}
								</h3>
								<p className="text-sm text-gray-400">
									@{activeConv?.clientAccount?.username}
								</p>
							</div>
							<div className="flex items-center space-x-3">
								<button
									onClick={handleInterestedToggle}
									disabled={loading_interested}
									className={`px-3 py-1 rounded-lg text-sm font-medium ${
										interested
											? "bg-green-600 text-white hover:bg-green-700"
											: "bg-gray-600 text-gray-300 hover:bg-gray-500"
									} disabled:opacity-50 disabled:cursor-not-allowed`}
								>
									{loading_interested
										? "Loading..."
										: interested
										? "Interested"
										: "Not Interested"}
								</button>
								<button
									onClick={() => setTagsSettingsOpen(true)}
									className="px-3 py-1 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
								>
									Manage Tags
								</button>
							</div>
						</div>

						{/* Messages */}
						<div className="flex-1 overflow-y-auto p-4 space-y-4">
							{messages?.map((m, i) => (
								<div
									key={i}
									className={`flex ${
										m.from === "business" ? "justify-end" : "justify-start"
									}`}
								>
									<div
										className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
											m.from === "business"
												? "bg-blue-600 text-white"
												: "bg-gray-700 text-white"
										}`}
									>
										<p>{m.text}</p>
										{m.timestamp && (
											<p className="text-xs opacity-75 mt-1">
												{new Date(m.timestamp).toLocaleTimeString()}
											</p>
										)}
									</div>
								</div>
							))}
							<div ref={messagesEndRef} />
						</div>

						{/* Message Input */}
						<div className="p-4 bg-gray-800 border-t border-gray-700">
							<div className="flex space-x-2">
								<input
									type="text"
									value={draft}
									onChange={(e) => setDraft(e.target.value)}
									onKeyPress={(e) => e.key === "Enter" && sendMsg()}
									placeholder="Type a message..."
									className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
								/>
								<button
									onClick={sendMsg}
									disabled={!draft.trim()}
									className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
								>
									Send
								</button>
							</div>
						</div>
					</>
				) : (
					<div className="flex-1 flex items-center justify-center">
						<div className="text-center">
							<p className="text-gray-400 text-lg">
								Select a contact to start chatting
							</p>
						</div>
					</div>
				)}
			</div>

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
