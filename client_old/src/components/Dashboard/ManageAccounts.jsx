import { useEffect, useState, useMemo } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { Link } from "react-router-dom";
import TabSwitcher from "../utils/TabSwitcher";
import { campaignAPI, accountAPI } from "../../services/api";
import "../../styles/manageAccounts.css";

const ManageAccounts = () => {
	// existing state
	const [columns, setColumns] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [tab, setTab] = useState("instagram");
	const [updatingCampaignStatus, setUpdatingCampaignStatus] = useState(false);

	// multi-drag state
	const [selectedAccounts, setSelectedAccounts] = useState(new Set());
	const [draggedAccountId, setDraggedAccountId] = useState(null);

	// Get selected account objects for drag preview
	const selectedAccountObjects = useMemo(() => {
		const accounts = [];
		columns.forEach((col) => {
			col.accounts.forEach((acc) => {
				if (selectedAccounts.has(acc.widgetId)) {
					accounts.push(acc);
				}
			});
		});
		return accounts;
	}, [columns, selectedAccounts]);

	const selectAllInColumn = (columnId) => {
		const currentCols = tab === "instagram" ? instaCols : twitterCols;
		const column = currentCols.find((col) => col.id === columnId);
		if (!column) return;

		const columnAccountIds = column.accounts.map((acc) => acc.widgetId);
		const selectedInColumn = columnAccountIds.filter((id) =>
			selectedAccounts.has(id)
		);
		const allSelected =
			selectedInColumn.length === columnAccountIds.length &&
			columnAccountIds.length > 0;

		setSelectedAccounts((prev) => {
			const newSet = new Set(prev);

			if (allSelected) {
				// Unselect all in this column
				columnAccountIds.forEach((id) => newSet.delete(id));
			} else {
				// Select all in this column
				columnAccountIds.forEach((id) => newSet.add(id));
			}

			return newSet;
		});
	};

	// Helper function to get button text
	const getSelectButtonText = (col) => {
		const columnAccountIds = col.accounts.map((acc) => acc.widgetId);
		const selectedInColumn = columnAccountIds.filter((id) =>
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
		const instagram = [];
		const twitter = [];

		columns.forEach((col) => {
			const baseCol = { ...col };

			if (col.id === "_unassigned") {
				instagram.push({
					...baseCol,
					id: "_unassigned_instagram",
					name: "Unassigned (Instagram)",
					platform: "instagram",
					accounts: col.accounts.filter((a) => a.platform === "instagram"),
				});
				twitter.push({
					...baseCol,
					id: "_unassigned_twitter",
					name: "Unassigned (X)",
					platform: "twitter",
					accounts: col.accounts.filter((a) => a.platform === "twitter"),
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
	}, []);

	const fetchData = async () => {
		try {
			setLoading(true);
			const res = await accountAPI.getOverview();
			setColumns(res.data.campaigns || []);
		} catch (e) {
			console.error("Error loading data:", e);
			setError("Failed to load account data. Please try again.");
		} finally {
			setLoading(false);
		}
	};

	// Handle account selection
	const toggleAccountSelection = (accountId, event) => {
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
	const onDragEnd = async (result) => {
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

		const normalizeId = (id) =>
			id.startsWith("_unassigned") ? "_unassigned" : id;
		const findColIndex = (id) =>
			columns.findIndex((c) => c.id === normalizeId(id));

		const sourceIdx = findColIndex(source.droppableId);
		const destIdx = findColIndex(destination.droppableId);
		if (sourceIdx === -1 || destIdx === -1) return;

		const sourceCol = columns[sourceIdx];
		const destCol = columns[destIdx];
		if (!sourceCol || !destCol) return;

		// Get the accounts to move
		const accountObjectsToMove = [];
		columns.forEach((col) => {
			col.accounts.forEach((acc) => {
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
				(acc) => !accountsToMove.includes(acc.widgetId)
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

	const onDragStart = (result) => {
		setDraggedAccountId(result.draggableId);
	};

	// NEW: Custom drag preview component
	const MultiDragPreview = ({ accounts, isDragging }) => {
		if (!isDragging || accounts.length <= 1) return null;

		return (
			<div className="multi-drag-preview">
				{accounts.slice(0, 3).map((acc, index) => (
					<div
						key={acc.widgetId}
						className={`multi-drag-card ${acc.status}`}
						style={{
							transform: `translate(${index * 4}px, ${index * 4}px)`,
							zIndex: accounts.length - index,
						}}
					>
						<div className="account-card-header">
							<h4 className="account-name">{acc.displayName}</h4>
							<span className={`account-status ${acc.status}`}>
								{acc.status}
							</span>
						</div>
						<div className="account-details">
							<p className="account-id">ID: {acc.widgetId}</p>
						</div>
					</div>
				))}
				{accounts.length > 3 && (
					<div className="multi-drag-overflow">+{accounts.length - 3} more</div>
				)}
			</div>
		);
	};

	// existing functions (unchanged)
	const toggleCampaign = async (
		campaignId,
		accountId,
		displayName,
		isActive
	) => {
		const updatedCols = columns.map((col) => {
			if (col.id !== campaignId) return col;

			const updatedAccounts = col.accounts.map((acc) =>
				acc.widgetId === accountId
					? {
							...acc,
							status: isActive ? "paused" : "active",
							pendingLeadsCount: isActive ? 0 : acc.pendingLeadsCount,
					  }
					: acc
			);

			const hasActiveAccounts = updatedAccounts.some(
				(acc) => acc.status === "active"
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

				const restoredAccounts = col.accounts.map((acc) =>
					acc.widgetId === accountId
						? { ...acc, status: isActive ? "active" : "paused" }
						: acc
				);

				const hasActiveAccounts = restoredAccounts.some(
					(acc) => acc.status === "active"
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

	const toggleAllAccounts = async (campaignId, action) => {
		const isStarting = action === "start-all";
		const newStatus = isStarting ? "active" : "paused";
		const previousCols = [...columns];

		const updatedCols = columns.map((col) => {
			if (col.id !== campaignId) return col;

			const updatedAccounts = col.accounts.map((acc) => ({
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

	// UPDATED: render column with multi-drag preview
	const renderColumn = (col) => (
		<div key={col.id} className="campaign-column">
			<div className="campaign-column-header">
				<div className="campaign-column-title">
					<div className="campaign-column-name">
						<Link to={`/campaign/${col.id}`} style={{ textDecoration: "none" }}>
							<h2>{col.name}</h2>
						</Link>
						<span
							className={`campaign-status-badge ${
								col.id.startsWith("_unassigned") ? "unassigned" : col.status
							}`}
						>
							{col.id.startsWith("_unassigned")
								? `${col.accounts.length} accounts`
								: col.status}
						</span>
					</div>
					<span className="campaign-platform">
						{col.id.startsWith("_unassigned") ? "—" : col.platform}
					</span>
				</div>

				<div className="campaign-column-actions">
					{col.accounts.length > 0 && (
						<button
							className="select-all-column-btn"
							onClick={() => selectAllInColumn(col.id)}
						>
							{getSelectButtonText(col)}
						</button>
					)}
					{!col.id.startsWith("_unassigned") && (
						<>
							<button
								className="start-all-button"
								onClick={() => toggleAllAccounts(col.id, "start-all")}
							>
								Start All
							</button>
							{col.status !== "paused" && (
								<button
									className="pause-all-button"
									onClick={() => toggleAllAccounts(col.id, "pause-all")}
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
						className={`accounts-list ${
							snapshot.isDraggingOver ? "drop-zone-active" : ""
						}`}
					>
						{col.accounts.length === 0 ? (
							<div className="empty-column">
								<div className="empty-column-icon">📭</div>
								<p>No accounts here</p>
							</div>
						) : (
							col.accounts.map((acc, index) => {
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
												className={`account-card ${acc.status} ${
													s.isDragging ? "drag-preview" : ""
												} ${isSelected ? "selected" : ""} ${
													isGhosting ? "hidden-multi-drag" : ""
												}`}
												onClick={(e) => toggleAccountSelection(acc.widgetId, e)}
											>
												{/* Selection indicator */}
												<div className="account-selection-indicator">
													{isSelected && (
														<span className="selection-checkmark">✓</span>
													)}
												</div>

												{isDraggedItem && isDraggedSelected && s.isDragging ? (
													// Multi-drag content
													<div className="multi-drag-stack">
														{selectedAccountObjects
															.slice(0, 3)
															.map((acc, idx) => (
																<div
																	key={acc.widgetId}
																	className={`stacked-card ${acc.status}`}
																	style={{
																		transform: `translateY(${idx * -4}px)`,
																	}}
																>
																	<h4>{acc.displayName}</h4>
																	<span>{acc.status}</span>
																</div>
															))}
														{selectedAccountObjects.length > 3 && (
															<div className="stack-count">
																+{selectedAccountObjects.length - 3}
															</div>
														)}
													</div>
												) : (
													// Original single card content
													<>
														<div className="account-card-header">
															<h4 className="account-name">
																{acc.displayName}
															</h4>
															<span className={`account-status ${acc.status}`}>
																{acc.status}
															</span>
														</div>
														<div className="account-details">
															<p className="account-id">ID: {acc.widgetId}</p>
															<p className="account-pending">
																Pending: {acc.pendingLeadsCount || 0}
															</p>

															{!col.id.startsWith("_unassigned") && (
																<div className="account-actions">
																	<button
																		className={`account-action-btn ${
																			acc.status === "active"
																				? "pause"
																				: "start"
																		}`}
																		onClick={(e) => {
																			e.stopPropagation();
																			toggleCampaign(
																				col.id,
																				acc.widgetId,
																				acc.displayName,
																				acc.status === "active"
																			);
																		}}
																		disabled={updatingCampaignStatus}
																	>
																		{acc.status === "active"
																			? "Pause"
																			: "Start"}
																	</button>
																</div>
															)}
														</div>
													</>
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

	// Loading/error states (unchanged)
	if (loading)
		return (
			<div className="manage-accounts-page">
				<div className="loading-accounts">
					<div className="loading-spinner" />
					<p>Loading account data…</p>
				</div>
			</div>
		);

	if (error)
		return (
			<div className="manage-accounts-page">
				<div className="error-accounts">
					<h2>Error Loading Data</h2>
					<p>{error}</p>
					<button onClick={fetchData} className="header-action-btn">
						Try Again
					</button>
				</div>
			</div>
		);

	return (
		<>
			{updatingCampaignStatus && (
				<div className="transparent-center-loader">
					<div className="loading-spinner" />
					<p>Updating Campaign Status</p>
				</div>
			)}
			<div className="manage-accounts-page">
				<div className="manage-accounts-header">
					<div className="manage-accounts-header-content">
						<div className="manage-accounts-nav">
							<Link to="/dashboard" className="nav-back-btn">
								← Dashboard
							</Link>
							<div className="manage-accounts-title">
								<h1>Manage accounts</h1>
								<p>
									{selectedAccounts.size > 0
										? `${selectedAccounts.size} accounts selected - drag any selected account to move all`
										: "Click accounts to select multiple, then drag to move together"}
								</p>
							</div>
						</div>

						<div className="manage-accounts-actions">
							{selectedAccounts.size > 0 && (
								<button
									className="header-action-btn secondary"
									onClick={() => setSelectedAccounts(new Set())}
								>
									Clear Selection ({selectedAccounts.size})
								</button>
							)}
							<Link
								to="/dashboard/create-campaign"
								className="header-action-btn"
							>
								+ New Campaign
							</Link>
							<button onClick={fetchData} className="header-action-btn">
								Refresh
							</button>
						</div>
					</div>
				</div>

				<div className="manage-accounts-container">
					<div className="manage-accounts-info">
						<h3>💡 How it works</h3>
						<p>
							Click accounts to select multiple, then drag any selected account
							to move them all together. You'll see all selected accounts moving
							as a stack!
						</p>
					</div>

					<DragDropContext onDragEnd={onDragEnd} onDragStart={onDragStart}>
						<TabSwitcher
							tabs={[
								{ key: "instagram", label: "Instagram" },
								{ key: "twitter", label: "X (Twitter)" },
							]}
							value={tab}
							onChange={setTab}
						/>
						<div className="campaigns-grid">
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

export default ManageAccounts;
