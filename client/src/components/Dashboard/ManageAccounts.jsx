import { useEffect, useState, useMemo } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { Link } from "react-router-dom";
import TabSwitcher from "../utils/TabSwitcher";
import { campaignAPI, accountAPI } from "../../services/api";
import "../../styles/manageAccounts.css";

const ManageAccounts = () => {
	//   state
	const [columns, setColumns] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [tab, setTab] = useState("instagram");
	const [updatingCampaignStatus, setUpdatingCampaignStatus] = useState(false);

	//   derived structure
	const { instaCols, twitterCols } = useMemo(() => {
		const instagram = [];
		const twitter = [];
		// const sortAccounts = (list = []) =>
		// 	[...list].sort(
		// 		(a, b) =>
		// 			toMillis(b.lastUpdated || b.createdAt) -
		// 			toMillis(a.lastUpdated || a.createdAt)
		// 	);

		columns.forEach((col) => {
			// const sortedAccounts = sortAccounts(col.accounts);
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

	//   initial fetch
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

	//	drag handler
	const onDragEnd = async (result) => {
		const { destination, source } = result;
		if (!destination) return;

		if (
			destination.droppableId === source.droppableId &&
			destination.index === source.index
		)
			return;

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

		if (sourceCol.id === destCol.id) {
			// Same column: just reorder accounts
			const reorderedAccounts = [...sourceCol.accounts];
			const [movedAcc] = reorderedAccounts.splice(source.index, 1);
			reorderedAccounts.splice(destination.index, 0, movedAcc);

			setColumns((prevCols) =>
				prevCols.map((col) =>
					col.id === sourceCol.id
						? { ...col, accounts: reorderedAccounts }
						: col
				)
			);
			return;
		}

		// 🔁 Cross-column move
		const sourceAccounts = [...sourceCol.accounts];
		const destAccounts = [...destCol.accounts];

		const [movedAcc] = sourceAccounts.splice(source.index, 1);
		destAccounts.splice(destination.index, 0, movedAcc);

		// Optimistically update core columns
		setColumns((prevCols) =>
			prevCols.map((col) => {
				if (col.id === sourceCol.id)
					return { ...col, accounts: sourceAccounts };
				if (col.id === destCol.id) return { ...col, accounts: destAccounts };
				return col;
			})
		);

		// 🔁 API update
		try {
			const newCampaignId = destCol.id.startsWith("_unassigned")
				? ""
				: destCol.id;
			setUpdatingCampaignStatus(true);
			await accountAPI.assign(movedAcc.id, newCampaignId);
			setUpdatingCampaignStatus(false);
		} catch (e) {
			console.error("Assignment failed:", e);
			alert("Failed to re-assign account. Please try again.");

			// 🧼 Rollback: put it back in source column
			sourceAccounts.splice(source.index, 0, movedAcc);
			destAccounts.splice(destination.index, 1);

			setColumns((prevCols) =>
				prevCols.map((col) => {
					if (col.id === sourceCol.id)
						return { ...col, accounts: sourceAccounts };
					if (col.id === destCol.id) return { ...col, accounts: destAccounts };
					return col;
				})
			);
		}
	};

	//   campaign start/stop
	const toggleCampaign = async (
		campaignId,
		accountId,
		displayName,
		isActive
	) => {
		const updatedCols = columns.map((col) => {
			if (col.id !== campaignId) return col;

			const updatedAccounts = col.accounts.map((acc) =>
				acc.id === accountId
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
			// 🧼 Rollback
			const rolledBackCols = columns.map((col) => {
				if (col.id !== campaignId) return col;

				const restoredAccounts = col.accounts.map((acc) =>
					acc.id === accountId
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

	// start All accounts
	const toggleAllAccounts = async (campaignId, action) => {
		const isStarting = action === "start-all";
		const newStatus = isStarting ? "active" : "paused";

		// Backup current state for rollback
		const previousCols = [...columns];

		// Optimistically update both campaign and all accounts
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

			// Rollback
			setColumns(previousCols);
			setUpdatingCampaignStatus(false);
		}
	};

	//  renderers
	const renderColumn = (col) => (
		<div key={col.id} className="campaign-column">
			{/* header */}
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
					{!col.id.startsWith("_unassigned") && (
						<>
							{/* {col.status !== "all-active" && ( */}
							<button
								className="start-all-button"
								onClick={() => toggleAllAccounts(col.id, "start-all")}
							>
								Start All
							</button>
							{/* )} */}
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

			{/* droppable area */}
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
							col.accounts.map((acc, index) => (
								<Draggable
									key={acc.id}
									draggableId={acc.id}
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
											}`}
										>
											<div className="account-card-header">
												<h4 className="account-name">{acc.displayName}</h4>
												<span className={`account-status ${acc.status}`}>
													{acc.status}
												</span>
											</div>

											<div className="account-details">
												<p className="account-id">ID: {acc.id}</p>
												<p className="account-pending">
													Pending: {acc.pendingLeadsCount || 0}
												</p>
											</div>

											{!col.id.startsWith("_unassigned") && (
												<div className="account-actions">
													<button
														className={`account-action-btn ${
															acc.status === "active" ? "pause" : "start"
														}`}
														onClick={(e) => {
															e.stopPropagation();
															toggleCampaign(
																col.id,
																acc.id,
																acc.displayName,
																acc.status === "active"
															);
														}}
														disabled={updatingCampaignStatus}
													>
														{acc.status === "active" ? "Pause" : "Start"}
													</button>
												</div>
											)}
										</div>
									)}
								</Draggable>
							))
						)}
						{provided.placeholder}
					</div>
				)}
			</Droppable>
		</div>
	);

	// ui states
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

	// main view
	return (
		<>
			{updatingCampaignStatus && (
				<div className="transparent-center-loader">
					<div className="loading-spinner" />
					<p>Updating Campaign Status</p>
				</div>
			)}
			<div className="manage-accounts-page">
				{/* header */}
				<div className="manage-accounts-header">
					<div className="manage-accounts-header-content">
						<div className="manage-accounts-nav">
							<Link to="/dashboard" className="nav-back-btn">
								← Dashboard
							</Link>
							<div className="manage-accounts-title">
								<h1>Manage Accounts</h1>
								<p>Drag between campaigns to re-assign</p>
							</div>
						</div>

						<div className="manage-accounts-actions">
							<Link to="/campaigns/create" className="header-action-btn">
								+ New Campaign
							</Link>
							<button onClick={fetchData} className="header-action-btn">
								Refresh
							</button>
						</div>
					</div>
				</div>

				{/* content */}
				<div className="manage-accounts-container">
					<div className="manage-accounts-info">
						<h3>💡 How it works</h3>
						<p>
							Each section lists campaigns for one platform. Drag accounts to
							move them; start or pause campaigns per account.
						</p>
					</div>

					<DragDropContext onDragEnd={onDragEnd}>
						{/* Instagram section */}
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
