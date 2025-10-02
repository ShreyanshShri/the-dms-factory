import { useState, useEffect } from "react";
import {
	DragDropContext,
	Droppable,
	Draggable,
	DropResult,
} from "@hello-pangea/dnd";
import {
	Plus,
	Edit3,
	Trash2,
	User,
	Calendar,
	Mail,
	Filter,
	Search,
} from "lucide-react";
import axiosInstance from "../services/axiosInstance";
import { useAuth } from "../contexts/AuthContext";
// import {getS} from "../contexts/AuthContext";

const CRM = () => {
	const [pipeline, setPipeline] = useState<any>(null);
	const [contacts, setContacts] = useState<any[]>([]);
	const [loading, setLoading] = useState<boolean>(true);
	const [error, setError] = useState<string | null>(null);
	const [showStageModal, setShowStageModal] = useState<boolean>(false);
	const [editingStage, setEditingStage] = useState<any>(null);
	const [selectedContact, setSelectedContact] = useState<any>(null);

	const { hasActiveSubscription, user } = useAuth();
	useEffect(() => {
		if (!hasActiveSubscription()) {
			setError("Please purchase a subscription plan to use this feature.");
			setLoading(false);
			return;
		}
		loadCRMData();
	}, [user]);

	// const formatTimestamp = (timestamp: any): string => {
	// 	if (!timestamp) return "N/A";
	// 	if (timestamp._seconds) {
	// 		return new Date(timestamp._seconds * 1000).toLocaleDateString();
	// 	}
	// 	if (timestamp.toDate) {
	// 		return timestamp.toDate().toLocaleDateString();
	// 	}
	// 	return new Date(timestamp).toLocaleDateString();
	// };

	const loadCRMData = async (): Promise<void> => {
		try {
			setError(null);
			const [pipelineRes, contactsRes] = await Promise.all([
				axiosInstance.get("/crm/pipeline") as any,
				axiosInstance.get("/crm/contacts") as any,
			]);
			console.log("pipelineRes", pipelineRes.pipeline);
			console.log("contactsRes", contactsRes.contacts);
			setPipeline(pipelineRes.pipeline);
			setContacts(contactsRes.contacts);
		} catch (error: any) {
			console.error("Error loading CRM data:", error);
			setError("Failed to load CRM data");
		} finally {
			setLoading(false);
		}
	};

	const handleDragEnd = async (result: DropResult): Promise<void> => {
		if (!result.destination) return;

		const { draggableId, destination } = result;
		const newStageId = destination.droppableId;

		// Optimistic update with reordering
		setContacts((prev: any[]) => {
			// Find the moved contact
			const movedContact = prev.find((contact) => contact._id === draggableId);
			if (!movedContact) return prev;

			// Update the moved contact's stage
			const updatedContact = {
				...movedContact,
				crm: { ...movedContact.crm, stageId: newStageId },
			};

			// Remove the contact from its original position and add to top of new stage
			const otherContacts = prev.filter(
				(contact) => contact._id !== draggableId
			);
			const newStageContacts = otherContacts.filter(
				(contact) => contact.crm?.stageId === newStageId
			);
			const otherStageContacts = otherContacts.filter(
				(contact) => contact.crm?.stageId !== newStageId
			);

			// Return: [updatedContact at top of new stage, other new stage contacts, all other contacts]
			return [updatedContact, ...newStageContacts, ...otherStageContacts];
		});

		try {
			await axiosInstance.patch(`/crm/contacts/${draggableId}/stage`, {
				stageId: newStageId,
			});
		} catch (error: any) {
			console.error("Error updating contact stage:", error);
			loadCRMData();
		}
	};

	const createStage = async (stageData: any): Promise<void> => {
		// Optimistic update
		const tempStage: any = {
			id: `temp_${Date.now()}`,
			...stageData,
			order: pipeline.stages.length,
		};

		setPipeline((prev: any) => ({
			...prev,
			stages: [...prev.stages, tempStage],
		}));

		try {
			const response = (await axiosInstance.post(
				"/crm/stages",
				stageData
			)) as any;
			// Replace temp stage with real stage
			setPipeline((prev: any) => ({
				...prev,
				stages: prev.stages.map((stage: any) =>
					stage.id === tempStage.id ? response.stage : stage
				),
			}));
			setShowStageModal(false);
		} catch (error: any) {
			console.error("Error creating stage:", error);
			// Revert optimistic update
			setPipeline((prev: any) => ({
				...prev,
				stages: prev.stages.filter((stage: any) => stage.id !== tempStage.id),
			}));
		}
	};

	const updateStage = async (
		stageId: string,
		stageData: any
	): Promise<void> => {
		// Optimistic update
		setPipeline((prev: any) => ({
			...prev,
			stages: prev.stages.map((stage: any) =>
				stage.id === stageId ? { ...stage, ...stageData } : stage
			),
		}));

		try {
			await axiosInstance.patch(`/crm/stages/${stageId}`, stageData);
			setEditingStage(null);
		} catch (error: any) {
			console.error("Error updating stage:", error);
			loadCRMData(); // Revert on error
		}
	};

	const deleteStage = async (stageId: string): Promise<void> => {
		if (pipeline.stages.length <= 1) {
			alert("You must have at least one stage");
			return;
		}

		// Optimistic update
		const deletedStage: any = pipeline.stages.find(
			(s: any) => s.id === stageId
		);
		const remainingStages: any[] = pipeline.stages.filter(
			(s: any) => s.id !== stageId
		);
		const firstStageId: string = remainingStages[0]?.id;

		setPipeline((prev: any) => ({
			...prev,
			stages: remainingStages,
		}));

		// Move contacts from deleted stage to first stage
		setContacts((prev: any[]) =>
			prev.map((contact: any) =>
				contact.crm.stageId === stageId
					? { ...contact, crm: { ...contact.crm, stageId: firstStageId } }
					: contact
			)
		);

		try {
			await axiosInstance.delete(`/crm/stages/${stageId}`);
		} catch (error: any) {
			console.error("Error deleting stage:", error);
			// Revert optimistic update
			setPipeline((prev: any) => ({
				...prev,
				stages: [...prev.stages, deletedStage].sort(
					(a: any, b: any) => a.order - b.order
				),
			}));
			loadCRMData();
		}
	};

	const updateContactNotes = async (
		contactId: string,
		notes: string
	): Promise<void> => {
		// Optimistic update
		setContacts((prev: any[]) =>
			prev.map((contact: any) =>
				contact._id === contactId
					? { ...contact, crm: { ...contact.crm, notes } }
					: contact
			)
		);

		try {
			await axiosInstance.patch(`/crm/contacts/${contactId}/notes`, { notes });
		} catch (error: any) {
			console.error("Error updating contact notes:", error);
			loadCRMData();
		}
	};

	const getContactsByStage = (stageId: string): any[] => {
		return contacts.filter((contact: any) => contact.crm?.stageId === stageId);
	};

	const handleRetry = () => {
		setLoading(true);
		loadCRMData();
	};

	if (loading) {
		return (
			<div className="space-y-6">
				<div className="flex items-center justify-center min-h-screen">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="space-y-6">
				{/* <div className="mb-6">
					<h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
						CRM Pipeline
					</h1>
					<p className="text-gray-600 dark:text-gray-400">
						Manage your sales pipeline and customer relationships
					</p>
				</div> */}
				<div className="accounts-page min-h-96 flex items-center justify-center bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
					<div className="error-container text-center space-y-3">
						<h2 className="text-2xl font-semibold text-red-600 dark:text-red-500">
							Error Loading Data
						</h2>
						<p className="text-base">{error}</p>
						<button
							onClick={handleRetry}
							className="btn-try-again bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
						>
							Try Again
						</button>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{/* Page Header */}
			<div className="mb-6">
				<h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
					CRM Pipeline
				</h1>
				<p className="text-gray-600 dark:text-gray-400">
					Manage your sales pipeline and customer relationships
				</p>
			</div>

			{/* Pipeline Controls */}
			<div className="card p-6">
				<div className="flex items-center justify-between mb-4">
					<h2 className="text-lg font-semibold text-gray-900 dark:text-white">
						Pipeline Overview
					</h2>
					<div className="flex items-center space-x-2">
						<button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
							<Search className="h-4 w-4" />
						</button>
						<button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
							<Filter className="h-4 w-4" />
						</button>
						<button
							onClick={() => setShowStageModal(true)}
							className="flex items-center space-x-2 bg-primary-600 hover:bg-primary-700 text-white px-3 py-2 rounded-lg transition-colors"
						>
							<Plus className="h-4 w-4" />
							<span>Add Stage</span>
						</button>
					</div>
				</div>

				{/* Pipeline Stats */}
				<div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
					<div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
						<div className="text-2xl font-bold text-gray-900 dark:text-white">
							{contacts.length}
						</div>
						<div className="text-sm text-gray-600 dark:text-gray-400">
							Total Contacts
						</div>
					</div>
					<div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
						<div className="text-2xl font-bold text-gray-900 dark:text-white">
							{pipeline?.stages?.length || 0}
						</div>
						<div className="text-sm text-gray-600 dark:text-gray-400">
							Pipeline Stages
						</div>
					</div>
					<div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
						<div className="text-2xl font-bold text-success-600 dark:text-success-400">
							{getContactsByStage(pipeline?.stages?.[1]?.id)?.length || 0}
						</div>
						<div className="text-sm text-gray-600 dark:text-gray-400">
							Interested
						</div>
					</div>
					<div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
						<div className="text-2xl font-bold text-primary-600 dark:text-primary-400">
							{Math.floor(
								((getContactsByStage(pipeline?.stages?.[3]?.id)?.length || 0) /
									(getContactsByStage(pipeline?.stages?.[0]?.id)?.length ||
										1)) *
									100000
							) / 1000}
							{"%"}
						</div>
						<div className="text-sm text-gray-600 dark:text-gray-400">
							Conversion Rate
						</div>
					</div>
				</div>
			</div>

			{/* Pipeline Stages */}
			<div>
				<DragDropContext onDragEnd={handleDragEnd}>
					<div className="flex space-x-4 overflow-x-auto pb-4">
						{pipeline?.stages?.map((stage: any) => {
							const stageContacts = getContactsByStage(stage.id);

							return (
								<div key={stage.id} className="flex-shrink-0 w-80">
									<div className="card p-4">
										<div className="flex items-center justify-between mb-4">
											<div className="flex items-center space-x-2">
												<h3 className="font-semibold text-gray-900 dark:text-white">
													{stage.name}
												</h3>
												<span className="bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300 px-2 py-1 rounded-full text-xs">
													{stageContacts.length}
												</span>
											</div>
											<div className="flex items-center space-x-1">
												<button
													onClick={() => setEditingStage(stage)}
													className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
												>
													<Edit3 className="h-4 w-4" />
												</button>
												<button
													onClick={() => deleteStage(stage.id)}
													className="p-1 text-gray-400 hover:text-red-500"
												>
													<Trash2 className="h-4 w-4" />
												</button>
											</div>
										</div>

										<Droppable
											droppableId={stage.id}
											renderClone={(provided, snapshot, rubric) => {
												const contact = stageContacts[rubric.source.index];
												return (
													<div
														ref={provided.innerRef}
														{...provided.draggableProps}
														{...provided.dragHandleProps}
														style={{
															...provided.draggableProps.style,
															transform: snapshot.isDragging
																? provided.draggableProps.style?.transform
																: "none",
														}}
														className={`bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-600 cursor-move hover:shadow-md transition-all ${
															snapshot.isDragging ? "shadow-lg" : ""
														}`}
													>
														<div className="flex items-start space-x-3">
															<div className="w-8 h-8 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
																<User className="w-4 h-4 text-primary-600 dark:text-primary-400" />
															</div>
															<div className="flex-1 min-w-0">
																<div className="font-medium text-gray-900 dark:text-white truncate">
																	{contact?.name || contact?.username}
																</div>
																<div className="text-sm text-gray-500 dark:text-gray-400 truncate">
																	@{contact?.clientAccount?.username}
																</div>
																{contact?.crm?.value && (
																	<div className="text-sm font-medium text-success-600 dark:text-success-400">
																		${contact.crm.value.toLocaleString()}
																	</div>
																)}
																<div className="flex items-center space-x-2 mt-2 text-xs text-gray-400">
																	<Calendar className="w-3 h-3" />
																	<span>{contact?.last_message}</span>
																</div>
															</div>
														</div>
														{contact?.crm?.notes && (
															<div className="mt-2 text-xs text-gray-600 dark:text-gray-400 truncate">
																{contact.crm.notes}
															</div>
														)}
													</div>
												);
											}}
										>
											{(provided: any, snapshot: any) => (
												<div
													ref={provided.innerRef}
													{...provided.droppableProps}
													className={`min-h-96 space-y-2 ${
														snapshot.isDraggingOver
															? "bg-primary-50 dark:bg-primary-900/20 rounded-lg"
															: ""
													}`}
												>
													{stageContacts.map((contact: any, index: number) => (
														<Draggable
															key={contact._id}
															draggableId={String(contact._id)}
															index={index}
														>
															{(provided: any, snapshot: any) => (
																<div
																	ref={provided.innerRef}
																	{...provided.draggableProps}
																	{...provided.dragHandleProps}
																	className={`bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-600 cursor-move hover:shadow-md transition-all ${
																		snapshot.isDragging ? "shadow-lg" : ""
																	}`}
																	onClick={() => setSelectedContact(contact)}
																>
																	<div className="flex items-start space-x-3">
																		<div className="w-8 h-8 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
																			<User className="w-4 h-4 text-primary-600 dark:text-primary-400" />
																		</div>
																		<div className="flex-1 min-w-0">
																			<div className="font-medium text-gray-900 dark:text-white truncate">
																				{contact.name || contact.username}
																			</div>
																			<div className="text-sm text-gray-500 dark:text-gray-400 truncate">
																				@{contact?.clientAccount?.username}
																			</div>
																			{contact.crm?.value && (
																				<div className="text-sm font-medium text-success-600 dark:text-success-400">
																					${contact.crm.value.toLocaleString()}
																				</div>
																			)}
																			<div className="flex items-center space-x-2 mt-2 text-xs text-gray-400">
																				<Calendar className="w-3 h-3" />
																				<span>{contact?.last_message}</span>
																			</div>
																		</div>
																	</div>
																	{contact.crm?.notes && (
																		<div className="mt-2 text-xs text-gray-600 dark:text-gray-400 truncate">
																			{contact.crm.notes}
																		</div>
																	)}
																</div>
															)}
														</Draggable>
													))}
													{provided.placeholder}
												</div>
											)}
										</Droppable>
									</div>
								</div>
							);
						})}
					</div>
				</DragDropContext>
			</div>

			{/* Stage Modal */}
			{(showStageModal || editingStage) && (
				<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
					<div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-full max-w-md mx-4">
						<h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
							{editingStage ? "Edit Stage" : "Create New Stage"}
						</h3>
						<form
							onSubmit={(e: any) => {
								e.preventDefault();
								const formData = new FormData(e.target);
								const stageData: any = {
									name: formData.get("name"),
									color: formData.get("color") || "#3B82F6",
								};

								if (editingStage) {
									updateStage(editingStage.id, stageData);
								} else {
									console.log("creating stage", stageData);
									createStage(stageData);
								}
							}}
						>
							<div className="space-y-4">
								<div>
									<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
										Stage Name
									</label>
									<input
										type="text"
										name="name"
										defaultValue={editingStage?.name || ""}
										className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
										required
									/>
								</div>
								<div>
									<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
										Color
									</label>
									<input
										type="color"
										name="color"
										defaultValue={editingStage?.color || "#3B82F6"}
										className="w-full h-10 border border-gray-300 dark:border-gray-600 rounded-lg"
									/>
								</div>
							</div>
							<div className="flex space-x-3 mt-6">
								<button
									type="button"
									onClick={() => {
										setShowStageModal(false);
										setEditingStage(null);
									}}
									className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
								>
									Cancel
								</button>
								<button
									type="submit"
									className="flex-1 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
								>
									{editingStage ? "Update" : "Create"}
								</button>
							</div>
						</form>
					</div>
				</div>
			)}

			{/* Contact Detail Modal */}
			{selectedContact && (
				<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
					<div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-full max-w-lg mx-4 max-h-96 overflow-y-auto relative">
						<div className="flex items-start justify-between mb-4">
							<div>
								<h3 className="text-lg font-semibold text-gray-900 dark:text-white">
									{selectedContact.name || selectedContact.username}
								</h3>
								<p className="text-gray-600 dark:text-gray-400">
									@{selectedContact.username}
								</p>
							</div>
							<button
								onClick={() => setSelectedContact(null)}
								className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
							>
								×
							</button>
						</div>

						<div className="space-y-4">
							<div className="flex items-center space-x-3">
								<Mail className="w-4 h-4 text-gray-400" />
								<span className="text-gray-600 dark:text-gray-400">
									{selectedContact.email || "No email"}
								</span>
							</div>

							<div>
								<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
									Notes
								</label>
								<textarea
									className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
									rows={4}
									value={selectedContact.crm?.notes || ""}
									onChange={(e: any) =>
										updateContactNotes(selectedContact._id, e.target.value)
									}
									placeholder="Add notes about this contact..."
								/>
							</div>
						</div>

						<div className="flex space-x-3 mt-6">
							<button
								onClick={() => setSelectedContact(null)}
								className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
							>
								Close
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

export default CRM;
