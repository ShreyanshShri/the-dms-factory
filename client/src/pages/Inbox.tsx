import { useState, useRef, useEffect } from "react";
import InstagramLoginButton from "../components/InstagramLoginButton";
import TagsSettings from "../components/TagsSettings";
import { useScrollToBottom } from "../hooks/useScrollToBottom";
import usePollingInbox from "../hooks/usePollingInbox";
import { chat } from "../services/chat";
import { useAlert } from "../contexts/AlertContext";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function ChatApp() {
	const {
		accounts,
		conversations,
		messages,
		activeConv,
		selectedTags,
		allTags,
		conversationsLoading,
		loadingMore,
		hasMore,
		searchTerm,
		selectedAccounts,
		// setFilteredConversations,
		setActiveConv,
		updateConversationTags,
		send,
		loadMore,
		setSearchTerm,
		handleAccountSelect,
		handleTagSelect,
	} = usePollingInbox();
	const alert = useAlert();
	const { hasActiveSubscription, getSubscriptionTier, user } = useAuth();

	const [draft, setDraft] = useState("");
	// const [searchTerm, setSearchTerm] = useState("");
	const [accountsDropdownOpen, setAccountsDropdownOpen] = useState(false);
	const [settingsDropdownOpen, setSettingsDropdownOpen] = useState(false);
	const [tagsSettingsOpen, setTagsSettingsOpen] = useState(false);
	const [interested, setInterested] = useState(false);
	const [loading_interested, setLoading_interested] = useState(false);
	const [error, setError] = useState("");

	const messagesEndRef = useRef<any>(null);

	const conversationsScrollRef = useScrollToBottom({
		onScrollToBottom: loadMore,
		threshold: 200,
		enabled: hasMore && !loadingMore,
	});

	const [searchParams] = useSearchParams();
	const loggedIn = searchParams.get("loggedIn");
	const username = searchParams.get("username");
	useEffect(() => {
		console.log("loggedIn", loggedIn);
		if (loggedIn === "true") {
			alert.success(
				`Successfully connected account ${username} to Unified Inbox`
			);
		}
		if (loggedIn === "false") {
			alert.error(
				`You must have an active subscription to use the Unified Inbox.`
			);
		}

		checkSubscriptionStatus();
	}, [user]);

	const checkSubscriptionStatus = async () => {
		const subscriptionStatus = hasActiveSubscription();
		const subscriptionTier = getSubscriptionTier();
		if (
			!(
				subscriptionStatus &&
				(subscriptionTier === "Premium" || subscriptionTier === "Standard")
			)
		) {
			setError("Please purchase a subscription plan to use this feature.");
		} else setError("");
	};

	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [messages]);

	useEffect(() => {
		setInterested(activeConv?.interested);
	}, [activeConv]);

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

	const handleTagsUpdate = (newTags: any) => {
		if (activeConv) {
			updateConversationTags(activeConv.id, newTags);
		}
	};

	if (error) {
		return (
			<div className="accounts-page min-h-96 flex items-center justify-center bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
				<div className="error-container text-center space-y-3">
					<h2 className="text-2xl font-semibold text-red-600 dark:text-red-500">
						Error Loading Data
					</h2>
					<p className="text-base">{error}</p>
					<button
						onClick={checkSubscriptionStatus}
						className="btn-try-again bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
					>
						Try Again
					</button>
				</div>
			</div>
		);
	}

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
							className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
						/>
					</div>

					{/* Filters */}
					<div className="space-y-2">
						{/* Accounts Filter */}
						<div className="relative">
							<button
								onClick={() => setAccountsDropdownOpen(!accountsDropdownOpen)}
								className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-left text-white hover:bg-gray-600"
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
												checked={selectedAccounts.includes(acc._id)}
												onChange={() => handleAccountSelect(acc._id)}
												className="h-4 w-4 text-blue-600 border-gray-500 bg-gray-700 rounded"
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
								className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-left text-white hover:bg-gray-600"
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
												className="h-4 w-4 text-blue-600 border-gray-500 bg-gray-700 rounded"
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
				<div className="flex-1 overflow-y-auto" ref={conversationsScrollRef}>
					{conversationsLoading && conversations.length === 0 ? (
						<div className="flex items-center justify-center h-32">
							<div className="text-gray-400">Loading conversations...</div>
						</div>
					) : (
						<>
							{conversations.map((conv) => (
								<div
									key={conv.id}
									onClick={() => setActiveConv(conv)}
									className={`p-4 border-b border-gray-700 cursor-pointer hover:bg-gray-700 ${
										activeConv?.thread_id === conv.thread_id
											? "bg-gray-700"
											: ""
									} ${!conv.responded ? "unresponded" : ""}`}
								>
									<div className="flex items-center justify-between">
										<div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-lg shadow-sm mr-3">
											{conv.clientAccount?.username?.[0]?.toUpperCase() || "U"}
										</div>
										<div className="flex-1 min-w-0">
											<h3 className="font-semibold text-white truncate">
												{conv?.clientAccount?.username}
											</h3>
											<p className="text-sm text-gray-400 truncate">
												{conv.last_message || "No messages"}
											</p>
											{(conv.tags || []).length > 0 && (
												<div className="flex flex-wrap gap-1 mt-2">
													{conv.tags.slice(0, 2).map((tag: any) => (
														<span
															key={tag}
															className="px-2 py-1 bg-blue-900/30 text-blue-300 text-xs rounded-full"
														>
															{tag}
														</span>
													))}
													{conv.tags.length > 2 && (
														<span className="px-2 py-1 text-blue-300 text-xs rounded-full">
															+{conv.tags.length - 2}
														</span>
													)}
												</div>
											)}
										</div>
										<div className="thread-right-panel ml-3 flex items-center">
											{conv?.unread_count > 0 && (
												<div className="unread-count w-6 h-6 flex items-center justify-center bg-blue-500 text-white rounded-full text-xs font-semibold">
													{conv.unread_count}
												</div>
											)}
										</div>
									</div>
								</div>
							))}
							{/* Loading more indicator */}
							{loadingMore && (
								<div className="flex items-center justify-center p-4">
									<div className="text-gray-400 text-sm">
										Loading more conversations...
									</div>
								</div>
							)}

							{/* No more conversations indicator */}
							{!hasMore && conversations.length > 0 && (
								<div className="flex items-center justify-center p-4">
									<div className="text-gray-500 text-sm">
										No more conversations
									</div>
								</div>
							)}
						</>
					)}
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
										m.sender_id !== activeConv.clientAccount.id
											? "justify-end"
											: "justify-start"
									}`}
								>
									<div
										className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
											m.sender_id === activeConv.clientAccount.id
												? "bg-blue-600 text-white"
												: "bg-gray-700 text-white"
										}`}
									>
										<p>{m.text}</p>
										{m.timestamp && (
											<p className="text-xs opacity-75 mt-1">
												{new Date(m.timestamp).toLocaleTimeString()}
												{" - "}
												{new Date(m.timestamp).toLocaleDateString("en-US", {
													day: "numeric",
													month: "short",
												})}
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
									className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400"
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
