// src/components/CRM.jsx
import { useState, useEffect } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import axiosInstance from "../../services/axiosInstance";
import "../../styles/crm.css";

const CRM = () => {
	const [pipeline, setPipeline] = useState(null);
	const [contacts, setContacts] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [showStageModal, setShowStageModal] = useState(false);
	const [editingStage, setEditingStage] = useState(null);
	const [selectedContact, setSelectedContact] = useState(null);

	useEffect(() => {
		loadCRMData();
	}, []);

	const formatTimestamp = (timestamp) => {
		if (!timestamp) return "N/A";

		if (timestamp._seconds) {
			return new Date(timestamp._seconds * 1000).toLocaleDateString();
		}

		if (timestamp.toDate) {
			return timestamp.toDate().toLocaleDateString();
		}

		return new Date(timestamp).toLocaleDateString();
	};

	const loadCRMData = async () => {
		try {
			setError(null);

			const [pipelineRes, contactsRes] = await Promise.all([
				axiosInstance.get("/crm/pipeline"),
				axiosInstance.get("/crm/contacts"),
			]);

			setPipeline(pipelineRes.pipeline);
			setContacts(contactsRes.contacts);
		} catch (error) {
			console.error("Error loading CRM data:", error);
			setError("Failed to load CRM data");
		} finally {
			setLoading(false);
		}
	};

	const handleDragEnd = async (result) => {
		if (!result.destination) return;

		const { draggableId, destination } = result;
		const newStageId = destination.droppableId;

		// Optimistic update
		setContacts((prev) =>
			prev.map((contact) =>
				contact.id === draggableId
					? { ...contact, crm: { ...contact.crm, stageId: newStageId } }
					: contact
			)
		);

		try {
			await axiosInstance.patch(`/crm/contacts/${draggableId}/stage`, {
				stageId: newStageId,
			});
		} catch (error) {
			console.error("Error updating contact stage:", error);
			// Revert optimistic update
			loadCRMData();
		}
	};

	const createStage = async (stageData) => {
		// Optimistic update
		const tempStage = {
			id: `temp_${Date.now()}`,
			...stageData,
			order: pipeline.stages.length,
		};

		setPipeline((prev) => ({
			...prev,
			stages: [...prev.stages, tempStage],
		}));

		try {
			const response = await axiosInstance.post("/crm/stages", stageData);

			// Replace temp stage with real stage
			setPipeline((prev) => ({
				...prev,
				stages: prev.stages.map((stage) =>
					stage.id === tempStage.id ? response.stage : stage
				),
			}));

			setShowStageModal(false);
		} catch (error) {
			console.error("Error creating stage:", error);
			// Revert optimistic update
			setPipeline((prev) => ({
				...prev,
				stages: prev.stages.filter((stage) => stage.id !== tempStage.id),
			}));
		}
	};

	const updateStage = async (stageId, stageData) => {
		// Optimistic update
		setPipeline((prev) => ({
			...prev,
			stages: prev.stages.map((stage) =>
				stage.id === stageId ? { ...stage, ...stageData } : stage
			),
		}));

		try {
			await axiosInstance.patch(`/crm/stages/${stageId}`, stageData);
			setEditingStage(null);
		} catch (error) {
			console.error("Error updating stage:", error);
			loadCRMData(); // Revert on error
		}
	};

	const deleteStage = async (stageId) => {
		if (pipeline.stages.length <= 1) {
			alert("You must have at least one stage");
			return;
		}

		// Optimistic update
		const deletedStage = pipeline.stages.find((s) => s.id === stageId);
		const remainingStages = pipeline.stages.filter((s) => s.id !== stageId);
		const firstStageId = remainingStages[0]?.id;

		setPipeline((prev) => ({
			...prev,
			stages: remainingStages,
		}));

		// Move contacts from deleted stage to first stage
		setContacts((prev) =>
			prev.map((contact) =>
				contact.crm.stageId === stageId
					? { ...contact, crm: { ...contact.crm, stageId: firstStageId } }
					: contact
			)
		);

		try {
			await axiosInstance.delete(`/crm/stages/${stageId}`);
		} catch (error) {
			console.error("Error deleting stage:", error);
			// Revert optimistic update
			setPipeline((prev) => ({
				...prev,
				stages: [...prev.stages, deletedStage].sort(
					(a, b) => a.order - b.order
				),
			}));
			loadCRMData();
		}
	};

	const updateContactNotes = async (contactId, notes) => {
		// Optimistic update
		setContacts((prev) =>
			prev.map((contact) =>
				contact.id === contactId
					? { ...contact, crm: { ...contact.crm, notes } }
					: contact
			)
		);

		try {
			await axiosInstance.patch(`/crm/contacts/${contactId}/notes`, { notes });
		} catch (error) {
			console.error("Error updating contact notes:", error);
			loadCRMData();
		}
	};

	const getContactsByStage = (stageId) => {
		return contacts.filter((contact) => contact.crm?.stageId === stageId);
	};

	if (loading) return <div className="crm-loading">Loading CRM...</div>;

	if (error) {
		return (
			<div className="crm-error">
				<h2>CRM Error</h2>
				<p>{error}</p>
				<button onClick={loadCRMData} className="retry-btn">
					Retry
				</button>
			</div>
		);
	}

	return (
		<div className="crm-container">
			<div className="crm-header">
				<h1>CRM Dashboard</h1>
				<button
					className="add-stage-btn"
					onClick={() => setShowStageModal(true)}
				>
					+ Add Stage
				</button>
			</div>

			<DragDropContext onDragEnd={handleDragEnd}>
				<div className="crm-pipeline">
					{pipeline?.stages
						?.sort((a, b) => a.order - b.order)
						.map((stage) => (
							<div key={stage.id} className="crm-stage">
								<div
									className="stage-header"
									style={{ backgroundColor: stage.color }}
								>
									<div className="stage-header-left">
										<h3>{stage.name}</h3>
										<span className="contact-count">
											{getContactsByStage(stage.id).length}
										</span>
									</div>
									<div className="stage-actions">
										<button
											className="stage-action-btn"
											onClick={() => setEditingStage(stage)}
											title="Edit stage"
										>
											✏️
										</button>
										<button
											className="stage-action-btn"
											onClick={() => deleteStage(stage.id)}
											title="Delete stage"
										>
											🗑️
										</button>
									</div>
								</div>

								<Droppable droppableId={stage.id}>
									{(provided, snapshot) => (
										<div
											ref={provided.innerRef}
											{...provided.droppableProps}
											className={`stage-contacts ${
												snapshot.isDraggingOver ? "dragging-over" : ""
											}`}
										>
											{getContactsByStage(stage.id).map((contact, index) => (
												<Draggable
													key={contact.id}
													draggableId={contact.id}
													index={index}
												>
													{(provided, snapshot) => (
														<div
															ref={provided.innerRef}
															{...provided.draggableProps}
															{...provided.dragHandleProps}
															className={`contact-card ${
																snapshot.isDragging ? "dragging" : ""
															}`}
															onClick={() => setSelectedContact(contact)}
														>
															<div className="contact-avatar">
																{contact.clientAccount?.username?.[0]?.toUpperCase() ||
																	"?"}
															</div>
															<div className="contact-info">
																<div className="contact-name">
																	{contact.clientAccount?.username || "Unknown"}
																</div>
																<div className="contact-last-message">
																	{contact.last_message || "No messages"}
																</div>
																<div className="contact-meta">
																	{contact.unread_count > 0 && (
																		<span className="unread-badge">
																			{contact.unread_count}
																		</span>
																	)}
																	<span className="contact-time">
																		{formatTimestamp(contact.last_time)}
																	</span>
																</div>
															</div>
														</div>
													)}
												</Draggable>
											))}
											{provided.placeholder}
										</div>
									)}
								</Droppable>
							</div>
						))}
				</div>
			</DragDropContext>

			{/* Stage Creation/Edit Modal */}
			{(showStageModal || editingStage) && (
				<StageModal
					stage={editingStage}
					onClose={() => {
						setShowStageModal(false);
						setEditingStage(null);
					}}
					onSubmit={(data) => {
						if (editingStage) {
							updateStage(editingStage.id, data);
						} else {
							createStage(data);
						}
					}}
				/>
			)}

			{/* Contact Detail Modal */}
			{selectedContact && (
				<ContactModal
					contact={selectedContact}
					onClose={() => setSelectedContact(null)}
					onUpdateNotes={updateContactNotes}
					formatTimestamp={formatTimestamp}
				/>
			)}
		</div>
	);
};

// Stage Creation/Edit Modal
const StageModal = ({ stage, onClose, onSubmit }) => {
	const [name, setName] = useState(stage?.name || "");
	const [color, setColor] = useState(stage?.color || "#f0f0f0");

	const handleSubmit = (e) => {
		e.preventDefault();
		if (!name.trim()) return;

		onSubmit({ name: name.trim(), color });
	};

	return (
		<div className="modal-overlay" onClick={onClose}>
			<div className="stage-modal" onClick={(e) => e.stopPropagation()}>
				<div className="modal-header">
					<h2>{stage ? "Edit Stage" : "Create New Stage"}</h2>
					<button className="close-btn" onClick={onClose}>
						×
					</button>
				</div>

				<form onSubmit={handleSubmit} className="modal-content">
					<div className="field-row">
						<label>Stage Name:</label>
						<input
							type="text"
							value={name}
							onChange={(e) => setName(e.target.value)}
							placeholder="e.g., Follow Up"
							required
						/>
					</div>

					<div className="field-row">
						<label>Color:</label>
						<div className="color-input-group">
							<input
								type="color"
								value={color}
								onChange={(e) => setColor(e.target.value)}
							/>
							<input
								type="text"
								value={color}
								onChange={(e) => setColor(e.target.value)}
								placeholder="#ffffff"
							/>
						</div>
					</div>

					<div className="modal-actions">
						<button type="button" onClick={onClose} className="cancel-btn">
							Cancel
						</button>
						<button type="submit" className="submit-btn">
							{stage ? "Update Stage" : "Create Stage"}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
};

// Contact Detail Modal
const ContactModal = ({ contact, onClose, onUpdateNotes, formatTimestamp }) => {
	const [notes, setNotes] = useState(contact.crm?.notes || "");

	const handleSaveNotes = () => {
		onUpdateNotes(contact.id, notes);
	};

	return (
		<div className="modal-overlay" onClick={onClose}>
			<div className="contact-modal" onClick={(e) => e.stopPropagation()}>
				<div className="modal-header">
					<h2>{contact.clientAccount?.username || "Unknown Contact"}</h2>
					<button className="close-btn" onClick={onClose}>
						×
					</button>
				</div>

				<div className="modal-content">
					<div className="contact-details">
						<h3>Contact Information</h3>
						<div className="detail-row">
							<span>Username:</span>
							<span>{contact.clientAccount?.username || "N/A"}</span>
						</div>
						<div className="detail-row">
							<span>Last Message:</span>
							<span>{contact.last_message || "No messages"}</span>
						</div>
						<div className="detail-row">
							<span>Last Activity:</span>
							<span>{formatTimestamp(contact.last_time)}</span>
						</div>
						<div className="detail-row">
							<span>Unread Count:</span>
							<span>{contact.unread_count || 0}</span>
						</div>
					</div>

					<div className="contact-notes">
						<h3>Notes</h3>
						<textarea
							value={notes}
							onChange={(e) => setNotes(e.target.value)}
							placeholder="Add notes about this contact..."
							className="notes-textarea"
						/>
						<button onClick={handleSaveNotes} className="save-notes-btn">
							Save Notes
						</button>
					</div>
				</div>
			</div>
		</div>
	);
};

export default CRM;
