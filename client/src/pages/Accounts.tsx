import React, { useState, useEffect } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { MoreVertical, Search } from "lucide-react";
import { useTheme } from "../contexts/ThemeContext";

interface Account {
	id: string;
	username: string;
	followers: number;
	following: number;
	posts: number;
	status: "active" | "inactive" | "suspended";
	lastActivity: string;
	profileImage: string;
}

const Accounts: React.FC = () => {
	const [accounts, setAccounts] = useState<Account[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [selectedAccounts, setSelectedAccounts] = useState<Set<string>>(
		new Set()
	);
	const [searchTerm, setSearchTerm] = useState("");
	const [filterStatus, setFilterStatus] = useState<string>("all");

	useEffect(() => {
		// Fetch accounts data
		const fetchAccounts = async () => {
			try {
				setLoading(true);
				// Simulate API call
				await new Promise((resolve) => setTimeout(resolve, 1000));
				setAccounts([]); // This would be populated from API
				setLoading(false);
			} catch (err) {
				setError("Failed to load accounts");
				setLoading(false);
			}
		};

		fetchAccounts();
	}, []);

	const handleAccountSelect = (accountId: string) => {
		setSelectedAccounts((prev) => {
			const newSet = new Set(prev);
			if (newSet.has(accountId)) {
				newSet.delete(accountId);
			} else {
				newSet.add(accountId);
			}
			return newSet;
		});
	};

	const onDragEnd = (result: any) => {
		if (!result.destination) return;

		const items = Array.from(accounts);
		const [reorderedItem] = items.splice(result.source.index, 1);
		items.splice(result.destination.index, 0, reorderedItem);

		setAccounts(items);
	};

	const filteredAccounts = accounts.filter((account) => {
		const matchesSearch = account.username
			.toLowerCase()
			.includes(searchTerm.toLowerCase());
		const matchesFilter =
			filterStatus === "all" || account.status === filterStatus;
		return matchesSearch && matchesFilter;
	});

	const { isDark } = useTheme();

	return (
		<main
			className={`${
				isDark ? "dark" : ""
			} flex flex-col gap-6 p-6 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100`}
		>
			{loading && (
				<div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
					Loading account data…
				</div>
			)}

			{error && (
				<p className="text-center text-red-600 dark:text-red-400">{error}</p>
			)}

			{!loading && !error && (
				<>
					<div className="flex flex-col gap-2">
						<h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
							Accounts
						</h1>
						<p className="text-gray-600 dark:text-gray-300">
							Manage your Buildfluence accounts and monitor their performance
						</p>
					</div>

					<div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
						<div className="flex flex-col sm:flex-row gap-2">
							<div className="relative">
								<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
								<input
									type="text"
									placeholder="Search accounts..."
									value={searchTerm}
									onChange={(e) => setSearchTerm(e.target.value)}
									className="pl-9 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
								/>
							</div>

							<select
								value={filterStatus}
								onChange={(e) => setFilterStatus(e.target.value)}
								className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
							>
								<option value="all">All Status</option>
								<option value="active">Active</option>
								<option value="inactive">Inactive</option>
								<option value="suspended">Suspended</option>
							</select>
						</div>

						{selectedAccounts.size > 0 && (
							<div className="text-sm text-gray-600 dark:text-gray-300">
								{selectedAccounts.size} accounts selected - drag any selected
								account to move all
							</div>
						)}
					</div>

					{filteredAccounts.length === 0 ? (
						<div className="flex flex-col items-center justify-center gap-4 py-20 text-gray-500 dark:text-gray-400">
							<p className="text-lg text-gray-500 dark:text-gray-400">
								No accounts here
							</p>
							<p className="text-sm text-center text-gray-500 dark:text-gray-400">
								Click accounts to select multiple, then drag any selected
								account to move them all together. You'll see all selected
								accounts moving as a stack!
							</p>
						</div>
					) : (
						<DragDropContext onDragEnd={onDragEnd}>
							<Droppable droppableId="accounts">
								{(provided) => (
									<div
										{...provided.droppableProps}
										ref={provided.innerRef}
										className="grid w-full gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
									>
										{filteredAccounts.map((account, index) => {
											const selected = selectedAccounts.has(account.id);
											return (
												<Draggable
													key={account.id}
													draggableId={account.id}
													index={index}
												>
													{(provided, snapshot) => (
														<div
															ref={provided.innerRef}
															{...provided.draggableProps}
															{...provided.dragHandleProps}
															className={`relative flex cursor-pointer select-none flex-col gap-3 rounded-lg border bg-white dark:bg-gray-800 p-4 transition-colors hover:border-gray-400 dark:hover:border-gray-500 ${
																selected
																	? "border-blue-600 dark:border-blue-500"
																	: "border-gray-200 dark:border-gray-700"
															} ${snapshot.isDragging ? "opacity-75" : ""}`}
															onClick={() => handleAccountSelect(account.id)}
														>
															<div className="flex items-center gap-3">
																<img
																	src={account.profileImage}
																	alt={account.username}
																	className="w-10 h-10 rounded-full"
																/>
																<h2 className="truncate text-lg font-semibold text-gray-900 dark:text-gray-100">
																	{account.username}
																</h2>
															</div>

															<div className="grid grid-cols-3 gap-2 text-sm text-gray-600 dark:text-gray-300">
																<div className="text-center">
																	<p className="font-medium text-gray-900 dark:text-gray-100">
																		{account.followers}
																	</p>
																	<p className="text-xs">Followers</p>
																</div>
																<div className="text-center">
																	<p className="font-medium text-gray-900 dark:text-gray-100">
																		{account.following}
																	</p>
																	<p className="text-xs">Following</p>
																</div>
																<div className="text-center">
																	<p className="font-medium text-gray-900 dark:text-gray-100">
																		{account.posts}
																	</p>
																	<p className="text-xs">Posts</p>
																</div>
															</div>

															<div className="flex justify-between items-center text-sm text-gray-600 dark:text-gray-300">
																<span
																	className={`px-2 py-1 rounded-full text-xs ${
																		account.status === "active"
																			? "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200"
																			: account.status === "inactive"
																			? "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300"
																			: "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200"
																	}`}
																>
																	{account.status}
																</span>
																<span className="text-xs">
																	{account.lastActivity}
																</span>
															</div>

															<button className="absolute top-2 right-2 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
																<MoreVertical className="h-4 w-4 text-gray-500 dark:text-gray-400" />
															</button>
														</div>
													)}
												</Draggable>
											);
										})}
										{provided.placeholder}
									</div>
								)}
							</Droppable>
						</DragDropContext>
					)}
				</>
			)}
		</main>
	);
};

export default Accounts;
