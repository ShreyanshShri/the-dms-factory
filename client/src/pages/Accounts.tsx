import { useEffect, useState, useMemo } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { Link } from "react-router-dom";
import TabSwitcher from "../components/TabSwitcher";
import { campaignAPI, accountAPI } from "../services/api";
import { useAuth } from "../contexts/AuthContext";

const Accounts = () => {
	const { hasActiveSubscription, user } = useAuth();
	// existing state
	const [columns, setColumns] = useState<any[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [tab, setTab] = useState("instagram");
	const [updatingCampaignStatus, setUpdatingCampaignStatus] = useState(false);

	// multi-drag state
	const [selectedAccounts, setSelectedAccounts] = useState(new Set());
	const [draggedAccountId, setDraggedAccountId] = useState<any>(null);

	// Get selected account objects for drag preview
	// const selectedAccountObjects = useMemo(() => {
	// 	const accounts: any[] = [];
	// 	columns.forEach((col) => {
	// 		col.accounts.forEach((acc: any) => {
	// 			if (selectedAccounts.has(acc.widgetId)) {
	// 				accounts.push(acc);
	// 			}
	// 		});
	// 	});
	// 	return accounts;
	// }, [columns, selectedAccounts]);

	const selectAllInColumn = (columnId: any) => {
		const currentCols = tab === "instagram" ? instaCols : twitterCols;
		const column = currentCols.find((col) => col.id === columnId);
		if (!column) return;

		const columnAccountIds = column.accounts.map((acc: any) => acc.widgetId);
		const selectedInColumn = columnAccountIds.filter((id: any) =>
			selectedAccounts.has(id)
		);
		const allSelected =
			selectedInColumn.length === columnAccountIds.length &&
			columnAccountIds.length > 0;

		setSelectedAccounts((prev) => {
			const newSet = new Set(prev);

			if (allSelected) {
				// Unselect all in this column
				columnAccountIds.forEach((id: any) => newSet.delete(id));
			} else {
				// Select all in this column
				columnAccountIds.forEach((id: any) => newSet.add(id));
			}

			return newSet;
		});
	};

	// Helper function to get button text
	const getSelectButtonText = (col: any) => {
		const columnAccountIds = col.accounts.map((acc: any) => acc.widgetId);
		const selectedInColumn = columnAccountIds.filter((id: any) =>
			selectedAccounts.has(id)
		);
		const allSelected =
			selectedInColumn.length === columnAccountIds.length &&
			columnAccountIds.length > 0;

		if (allSelected) {
			return `Unselect All (${col.accounts.length})`;
		} else if (selectedInColumn.length > 0) {
			return `Select All (${selectedInColumn.length}/${col.accounts.length})`;
		} else {
			return `Select All (${col.accounts.length})`;
		}
	};

	// existing derived structure (unchanged)
	const { instaCols, twitterCols } = useMemo(() => {
		const instagram: any[] = [];
		const twitter: any[] = [];

		columns.forEach((col) => {
			const baseCol = { ...col };

			if (col.id === "_unassigned") {
				instagram.push({
					...baseCol,
					id: "_unassigned_instagram",
					name: "Unassigned (Instagram)",
					platform: "instagram",
					accounts: col.accounts.filter((a: any) => a.platform === "instagram"),
				});
				twitter.push({
					...baseCol,
					id: "_unassigned_twitter",
					name: "Unassigned (X)",
					platform: "twitter",
					accounts: col.accounts.filter((a: any) => a.platform === "twitter"),
				});
			} else if (col.platform === "instagram") instagram.push(baseCol);
			else twitter.push(baseCol);
		});

		return { instaCols: instagram, twitterCols: twitter };
	}, [columns]);

	// Clear selections when switching tabs
	useEffect(() => {
		setSelectedAccounts(new Set());
	}, [tab]);

	useEffect(() => {
		fetchData();
	}, [user]);

	const fetchData = async () => {
		setLoading(false);
		if (!hasActiveSubscription()) {
			setError("Please purchase a subscription plan to use this feature.");
			return;
		}

		try {
			setLoading(true);
			const res = await accountAPI.getOverview();
			setColumns(res.data.campaigns || []);
		} catch (e) {
			console.error("Error loading data:", e);
			setError("Failed to load account data. Please try again.");
		} finally {
			console.log("Finished loading data");
			setLoading(false);
		}
	};

	// Handle account selection
	const toggleAccountSelection = (accountId: any, event: any) => {
		event.stopPropagation();
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

	// Enhanced drag handler for multi-drag
	const onDragEnd = async (result: any) => {
		const { destination, source, draggableId } = result;
		setDraggedAccountId(null);

		if (!destination) return;

		if (
			destination.droppableId === source.droppableId &&
			destination.index === source.index
		)
			return;

		// Get accounts to move
		const isDraggedItemSelected = selectedAccounts.has(draggableId);
		const accountsToMove = isDraggedItemSelected
			? Array.from(selectedAccounts)
			: [draggableId];

		const normalizeId = (id: any) =>
			id.startsWith("_unassigned") ? "_unassigned" : id;
		const findColIndex = (id: any) =>
			columns.findIndex((c) => c.id === normalizeId(id));

		const sourceIdx = findColIndex(source.droppableId);
		const destIdx = findColIndex(destination.droppableId);
		if (sourceIdx === -1 || destIdx === -1) return;

		const sourceCol = columns[sourceIdx];
		const destCol = columns[destIdx];
		if (!sourceCol || !destCol) return;

		// Get the accounts to move
		const accountObjectsToMove: any[] = [];
		columns.forEach((col) => {
			col.accounts.forEach((acc: any) => {
				if (accountsToMove.includes(acc.widgetId)) {
					accountObjectsToMove.push(acc);
				}
			});
		});

		// Update columns optimistically
		const newColumns = columns.map((col) => {
			const normalizedColId = col.id === "_unassigned" ? "_unassigned" : col.id;
			const normalizedDestId = normalizeId(destination.droppableId);

			// Remove selected accounts from all columns
			let newAccounts = col.accounts.filter(
				(acc: any) => !accountsToMove.includes(acc.widgetId)
			);

			// Add accounts to destination column
			if (normalizedColId === normalizedDestId) {
				newAccounts.splice(destination.index, 0, ...accountObjectsToMove);
			}

			return { ...col, accounts: newAccounts };
		});

		setColumns(newColumns);

		try {
			setUpdatingCampaignStatus(true);
			const newCampaignId = destCol.id.startsWith("_unassigned")
				? ""
				: destCol.id;

			if (accountsToMove.length > 1) {
				await accountAPI.bulkAssign(accountsToMove, newCampaignId);
			} else {
				await accountAPI.assign(accountsToMove[0], newCampaignId);
			}

			// Clear selections after successful move
			setSelectedAccounts(new Set());
			setUpdatingCampaignStatus(false);
		} catch (e) {
			console.error("Assignment failed:", e);
			alert(
				`Failed to move ${
					accountsToMove.length > 1 ? "accounts" : "account"
				}. Please try again.`
			);

			// Rollback changes
			setColumns(columns);
			setUpdatingCampaignStatus(false);
		}
	};

	const onDragStart = (result: any) => {
		setDraggedAccountId(result.draggableId);
	};

	// NEW: Custom drag preview component
	// const MultiDragPreview = ({
	// 	accounts,
	// 	isDragging,
	// }: {
	// 	accounts: any;
	// 	isDragging: any;
	// }) => {
	// 	if (!isDragging || accounts.length <= 1) return null;

	// 	return (
	// 		<div className="multi-drag-preview">
	// 			{accounts.slice(0, 3).map((acc: any, index: any) => (
	// 				<div
	// 					key={acc.widgetId}
	// 					className={`multi-drag-card ${acc.status}`}
	// 					style={{
	// 						transform: `translate(${index * 4}px, ${index * 4}px)`,
	// 						zIndex: accounts.length - index,
	// 					}}
	// 				>
	// 					<div className="account-card-header">
	// 						<h4 className="account-name">{acc.displayName}</h4>
	// 						<span className={`account-status ${acc.status}`}>
	// 							{acc.status}
	// 						</span>
	// 					</div>
	// 					<div className="account-details">
	// 						<p className="account-id">ID: {acc.widgetId}</p>
	// 					</div>
	// 				</div>
	// 			))}
	// 			{accounts.length > 3 && (
	// 				<div className="multi-drag-overflow">+{accounts.length - 3} more</div>
	// 			)}
	// 		</div>
	// 	);
	// };

	// existing functions (unchanged)
	const toggleCampaign = async (
		campaignId: any,
		accountId: any,
		displayName: any,
		isActive: any
	) => {
		const updatedCols = columns.map((col) => {
			if (col.id !== campaignId) return col;

			const updatedAccounts = col.accounts.map((acc: any) =>
				acc.widgetId === accountId
					? {
							...acc,
							status: isActive ? "paused" : "active",
							pendingLeadsCount: isActive ? 0 : acc.pendingLeadsCount,
					  }
					: acc
			);

			const hasActiveAccounts = updatedAccounts.some(
				(acc: any) => acc.status === "active"
			);

			return {
				...col,
				accounts: updatedAccounts,
				status: hasActiveAccounts ? "active" : "paused",
			};
		});

		setColumns(updatedCols);
		try {
			setUpdatingCampaignStatus(true);
			if (isActive) await campaignAPI.pauseCampaign(campaignId, accountId);
			else {
				await campaignAPI.startCampaign(
					campaignId,
					accountId,
					displayName || "Account"
				);
			}
			setUpdatingCampaignStatus(false);
		} catch (e) {
			const rolledBackCols = columns.map((col) => {
				if (col.id !== campaignId) return col;

				const restoredAccounts = col.accounts.map((acc: any) =>
					acc.widgetId === accountId
						? { ...acc, status: isActive ? "active" : "paused" }
						: acc
				);

				const hasActiveAccounts = restoredAccounts.some(
					(acc: any) => acc.status === "active"
				);

				return {
					...col,
					accounts: restoredAccounts,
					status: hasActiveAccounts ? "active" : "paused",
				};
			});

			setColumns(rolledBackCols);
			console.error("Campaign toggle failed:", e);
			alert("Failed to update campaign status. Please try again.");
			setUpdatingCampaignStatus(false);
		}
	};

	const toggleAllAccounts = async (campaignId: any, action: any) => {
		const isStarting = action === "start-all";
		const newStatus = isStarting ? "active" : "paused";
		const previousCols = [...columns];

		const updatedCols = columns.map((col) => {
			if (col.id !== campaignId) return col;

			const updatedAccounts = col.accounts.map((acc: any) => ({
				...acc,
				status: newStatus,
				pendingLeadsCount: action === "start-all" ? acc.pendingLeadsCount : 0,
			}));

			return {
				...col,
				accounts: updatedAccounts,
				status: newStatus,
			};
		});

		setColumns(updatedCols);
		setUpdatingCampaignStatus(true);

		try {
			if (isStarting) {
				await campaignAPI.startAllAccounts(campaignId);
			} else {
				await campaignAPI.pauseAllAccounts(campaignId);
			}
			setUpdatingCampaignStatus(false);
		} catch (err) {
			console.error("Failed to start/stop all accounts:", err);
			alert("Failed to start/stop all accounts. Please try again.");
			setColumns(previousCols);
			setUpdatingCampaignStatus(false);
		}
	};

	const renderColumn = (col: any) => (
		<div
			key={col.id}
			className="bg-white dark:bg-gray-800 rounded-md shadow p-4 flex flex-col"
		>
			<div className="flex justify-between items-center mb-4">
				<Link
					to={`/campaign/${col.id}`}
					className="text-xl font-semibold hover:underline dark:text-gray-300 text-gray-900"
				>
					{col.name}
				</Link>
				<span
					className={`px-2 py-1 rounded-full text-sm font-semibold 
          ${
						col.id.startsWith("_unassigned")
							? "bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
							: col.status === "active"
							? "bg-green-200 text-green-800 dark:bg-green-700 dark:text-green-300"
							: col.status === "paused"
							? "bg-yellow-200 text-yellow-800 dark:bg-yellow-700 dark:text-yellow-300"
							: "bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
					}`}
				>
					{col.id.startsWith("_unassigned")
						? `${col.accounts.length} accounts`
						: col.status}
				</span>
			</div>

			<div className="flex justify-between items-center mb-4">
				<span className="text-gray-500 italic dark:text-gray-400">
					{col.id.startsWith("_unassigned") ? "—" : col.platform}
				</span>
				<div className="space-x-2">
					{col.accounts.length > 0 && (
						<button
							onClick={() => selectAllInColumn(col.id)}
							className="text-sm px-3 py-1 border border-gray-300 rounded hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-700"
						>
							{getSelectButtonText(col)}
						</button>
					)}
					{!col.id.startsWith("_unassigned") && (
						<>
							<button
								onClick={() => toggleAllAccounts(col.id, "start-all")}
								className="text-sm px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700"
							>
								Start All
							</button>
							{col.status !== "paused" && (
								<button
									onClick={() => toggleAllAccounts(col.id, "pause-all")}
									className="text-sm px-3 py-1 bg-yellow-400 text-white rounded hover:bg-yellow-500 dark:bg-yellow-500 dark:hover:bg-yellow-600"
								>
									Pause All
								</button>
							)}
						</>
					)}
				</div>
			</div>

			<Droppable droppableId={col.id} type={col.platform}>
				{(provided, snapshot) => (
					<div
						ref={provided.innerRef}
						{...provided.droppableProps}
						className={`flex flex-col space-y-3 min-h-[100px] p-2 rounded border border-dashed 
            ${
							snapshot.isDraggingOver
								? "border-blue-400 bg-blue-50 dark:bg-blue-900"
								: "border-gray-300 bg-white dark:border-gray-700 dark:bg-gray-900"
						}`}
					>
						{col.accounts.length === 0 ? (
							<div className="flex flex-col items-center justify-center text-gray-400 dark:text-gray-500">
								<div className="text-3xl mb-2">📭</div>
								<p>No accounts here</p>
							</div>
						) : (
							col.accounts.map((acc: any, index: any) => {
								const isSelected = selectedAccounts.has(acc.widgetId);
								const isDraggedItem = draggedAccountId === acc.widgetId;
								const isDraggedSelected =
									selectedAccounts.has(draggedAccountId);
								const isGhosting =
									isDraggedSelected && isSelected && !isDraggedItem;

								return (
									<Draggable
										key={acc.id}
										draggableId={acc.widgetId}
										index={index}
										isDragDisabled={
											acc.status === "active" || updatingCampaignStatus
										}
									>
										{(p, s) => (
											<div
												ref={p.innerRef}
												{...p.draggableProps}
												{...p.dragHandleProps}
												onClick={(e) => toggleAccountSelection(acc.widgetId, e)}
												className={`
                        flex flex-col p-3 rounded-md border cursor-pointer select-none
                        ${
													acc.status === "active"
														? "border-green-500 dark:border-green-400"
														: "border-gray-300 dark:border-gray-600"
												}
                        ${s.isDragging ? "shadow-lg" : ""}
                        ${
													isSelected
														? "bg-blue-100 border-blue-400 dark:bg-blue-800 dark:border-blue-600"
														: "bg-white dark:bg-gray-800"
												}
                        ${isGhosting ? "opacity-50" : ""}
                      `}
											>
												<div className="flex justify-between items-center mb-2 text-gray-900 dark:text-gray-100">
													<div className="flex items-center space-x-2">
														{isSelected && (
															<span className="text-blue-600 font-bold">✓</span>
														)}
														<h4 className="font-semibold">{acc.displayName}</h4>
													</div>
													<span
														className={`text-sm font-semibold px-2 py-1 rounded-full 
                            ${
															acc.status === "active"
																? "bg-green-200 text-green-700 dark:bg-green-700 dark:text-green-300"
																: acc.status === "paused"
																? "bg-yellow-200 text-yellow-700 dark:bg-yellow-700 dark:text-yellow-300"
																: "bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
														}`}
													>
														{acc.status}
													</span>
												</div>
												<div className="text-sm text-gray-700 dark:text-gray-300 mb-2">
													<p>ID: {acc.widgetId}</p>
													<p>Pending: {acc.pendingLeadsCount || 0}</p>
												</div>

												{!col.id.startsWith("_unassigned") && (
													<div className="flex space-x-2">
														<button
															disabled={updatingCampaignStatus}
															onClick={(e) => {
																e.stopPropagation();
																toggleCampaign(
																	col.id,
																	acc.widgetId,
																	acc.displayName,
																	acc.status === "active"
																);
															}}
															className={`flex-1 py-1 rounded text-white text-sm ${
																acc.status === "active"
																	? "bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700"
																	: "bg-green-500 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700"
															}`}
														>
															{acc.status === "active" ? "Pause" : "Start"}
														</button>
													</div>
												)}
											</div>
										)}
									</Draggable>
								);
							})
						)}
						{provided.placeholder}
					</div>
				)}
			</Droppable>
		</div>
	);

	if (loading)
		return (
			<div className="accounts-page min-h-96 flex items-center justify-center bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
				<div className="loading-container flex flex-col items-center space-y-3">
					<div className="w-12 h-12 border-4 border-gray-300 dark:border-gray-700 border-t-blue-600 dark:border-t-blue-600 rounded-full animate-spin" />
					<p className="text-lg">Loading account data…</p>
				</div>
			</div>
		);

	if (error)
		return (
			<div className="accounts-page min-h-96 flex items-center justify-center bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
				<div className="error-container text-center space-y-3">
					<h2 className="text-2xl font-semibold text-red-600 dark:text-red-500">
						Error Loading Data
					</h2>
					<p className="text-base">{error}</p>
					<button
						onClick={fetchData}
						className="btn-try-again bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
					>
						Try Again
					</button>
				</div>
			</div>
		);

	return (
		<>
			{updatingCampaignStatus && (
				<div className="fixed inset-0 flex flex-col items-center justify-center bg-black bg-opacity-50 z-50">
					<div className="loader ease-linear rounded-full border-8 border-t-8 border-gray-200 h-16 w-16 mb-4"></div>
					<p className="text-white text-lg font-semibold">
						Updating Campaign Status
					</p>
				</div>
			)}
			<div className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
					<div className="flex items-center justify-between mb-8">
						<div className="flex items-center space-x-4">
							<div>
								<h1 className="text-3xl font-bold">Manage accounts</h1>
								<p className="text-sm text-gray-600 dark:text-gray-400">
									{selectedAccounts.size > 0
										? `${selectedAccounts.size} accounts selected - drag any selected account to move all`
										: "Click accounts to select multiple, then drag to move together"}
								</p>
							</div>
						</div>
						<div className="flex items-center space-x-4">
							{selectedAccounts.size > 0 && (
								<button
									className="btn btn-secondary"
									onClick={() => setSelectedAccounts(new Set())}
								>
									Clear Selection ({selectedAccounts.size})
								</button>
							)}
							<button onClick={fetchData} className="btn btn-primary">
								Refresh
							</button>
						</div>
					</div>

					{/* <div className="mb-6">
						<h3 className="text-lg font-semibold mb-2">💡 How it works</h3>
						<p className="text-gray-600 dark:text-gray-400">
							Click accounts to select multiple, then drag any selected account
							to move them all together. You'll see all selected accounts moving
							as a stack!
						</p>
					</div> */}

					<DragDropContext onDragEnd={onDragEnd} onDragStart={onDragStart}>
						<TabSwitcher
							tabs={[
								{ key: "instagram", label: "Instagram" },
								{ key: "twitter", label: "X (Twitter)" },
							]}
							value={tab}
							onChange={setTab}
						/>
						<div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
							{tab === "instagram"
								? instaCols.map(renderColumn)
								: twitterCols.map(renderColumn)}
						</div>
					</DragDropContext>
				</div>
			</div>
		</>
	);
};

export default Accounts;
