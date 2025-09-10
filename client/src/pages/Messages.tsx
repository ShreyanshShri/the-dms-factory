import React, { useState, useEffect } from "react";
import { Search, Filter, Reply, Archive, Trash2 } from "lucide-react";
import { dashboardAPI } from "../services/api";

const Messages: React.FC = () => {
	const [searchTerm, setSearchTerm] = useState("");
	const [filterType, setFilterType] = useState<
		"all" | "replies" | "sent" | "archived"
	>("all");
	const [messages, setMessages] = useState([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		fetchMessages();
	}, []);

	const fetchMessages = async () => {
		try {
			setLoading(true);
			const response = await dashboardAPI.getRecentMessages(50);
			setMessages(response.messages || []);
		} catch (err) {
			console.error("Error fetching messages:", err);
			setMessages([]);
		} finally {
			setLoading(false);
		}
	};

	const filteredMessages = messages.filter((message: any) => {
		const matchesSearch =
			message.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
			message.recipient.toLowerCase().includes(searchTerm.toLowerCase());
		const matchesFilter = filterType === "all" || message.type === filterType;
		return matchesSearch && matchesFilter;
	});

	return (
		<div className="space-y-6">
			{/* Page Header */}
			<div className="mb-6">
				<h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
					Message Center
				</h1>
				<p className="text-gray-600 dark:text-gray-400">
					Monitor and manage your Buildfluence outreach conversations
				</p>
			</div>

			{/* Search and Filters */}
			<div className="card p-4">
				<div className="flex flex-col md:flex-row gap-4">
					<div className="relative flex-1">
						<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
						<input
							type="text"
							placeholder="Search messages..."
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
							className="pl-10 pr-4 py-2 w-full border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
						/>
					</div>

					<div className="flex items-center space-x-2">
						<Filter className="h-4 w-4 text-gray-400" />
						<select
							value={filterType}
							onChange={(e) =>
								setFilterType(
									e.target.value as "all" | "replies" | "sent" | "archived"
								)
							}
							className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
						>
							<option value="all">All Messages</option>
							<option value="replies">Replies Only</option>
							<option value="sent">Sent Only</option>
							<option value="archived">Archived</option>
						</select>
					</div>
				</div>
			</div>

			{/* Messages List */}
			<div className="card">
				<div className="p-6 border-b border-gray-200 dark:border-gray-700">
					<h2 className="text-lg font-semibold text-gray-900 dark:text-white">
						Recent Messages
					</h2>
				</div>

				<div className="divide-y divide-gray-200 dark:divide-gray-700">
					{loading ? (
						<div className="p-6 text-center text-gray-500 dark:text-gray-400">
							Loading messages...
						</div>
					) : filteredMessages.length === 0 ? (
						<div className="p-6 text-center text-gray-500 dark:text-gray-400">
							No messages found
						</div>
					) : (
						filteredMessages.map((message: any) => (
							<div
								key={message.id}
								className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
							>
								<div className="flex items-start justify-between">
									<div className="flex-1">
										<div className="flex items-center space-x-3 mb-2">
											<span
												className={`px-2 py-1 text-xs font-medium rounded-full ${
													message.type === "reply"
														? "bg-success-100 text-success-800 dark:bg-success-900 dark:text-success-300"
														: "bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-300"
												}`}
											>
												{message.type === "reply" ? "Reply" : "Sent"}
											</span>
											<span className="text-sm text-gray-500 dark:text-gray-400">
												@{message.recipient}
											</span>
											<span className="text-sm text-gray-500 dark:text-gray-400">
												via @{message.account}
											</span>
										</div>

										<p className="text-gray-900 dark:text-white mb-2">
											{message.content}
										</p>

										<div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
											<span>{message.timestamp}</span>
											<span>Campaign: {message.campaign}</span>
										</div>
									</div>

									<div className="flex items-center space-x-2 ml-4">
										<button
											className="p-2 text-primary-600 hover:bg-primary-100 dark:hover:bg-primary-900 rounded-lg transition-colors"
											title="Reply"
										>
											<Reply className="h-4 w-4" />
										</button>
										<button
											className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
											title="Archive"
										>
											<Archive className="h-4 w-4" />
										</button>
										<button
											className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-100 dark:hover:bg-red-900 rounded-lg transition-colors"
											title="Delete"
										>
											<Trash2 className="h-4 w-4" />
										</button>
									</div>
								</div>
							</div>
						))
					)}
				</div>
			</div>
		</div>
	);
};

export default Messages;
