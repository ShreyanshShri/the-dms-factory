import { useEffect, useState } from "react";
import { campaignAPI } from "../services/api";
import { Edit2, Save, X, ArrowLeft } from "lucide-react"; // or your icon library
import { useAlert } from "../contexts/AlertContext";
import { Link } from "react-router-dom";

const ManageContexts = () => {
	const alert = useAlert();
	const [contexts, setContexts] = useState<any[]>([]);
	const [editingId, setEditingId] = useState<any>(null);
	const [editedContext, setEditedContext] = useState({ name: "", context: "" });
	const [loading, setLoading] = useState(true);
	const [updating, setUpdating] = useState(false);

	useEffect(() => {
		const fetchContexts = async () => {
			try {
				const response = await campaignAPI.listContexts();
				if (response.success) {
					setContexts(response.contexts);
				}
				// alert.success("Contexts fetched successfully!");
			} catch (error) {
				console.error("Failed to fetch contexts:", error);
				alert.error("Failed to fetch contexts. Please try again.");
			} finally {
				setLoading(false);
			}
		};
		fetchContexts();
	}, []);

	const handleEdit = (contextItem: any) => {
		setEditingId(contextItem._id);
		setEditedContext({ name: contextItem.name, context: contextItem.context });
	};

	const handleSave = async (id: any) => {
		try {
			setUpdating(true);
			await campaignAPI.updateContext(id, editedContext.context);
			setContexts(
				contexts.map((c: any) =>
					c._id === id ? { ...c, ...editedContext } : c
				)
			);
			setEditingId(null);
			alert.success("Context updated successfully!");
			setUpdating(false);
		} catch (error) {
			console.error("Failed to update context:", error);
			alert.error("Failed to update context. Please try again.");
			setUpdating(false);
		}
	};

	const handleCancel = () => {
		setEditingId(null);
		setEditedContext({ name: "", context: "" });
	};

	if (loading) {
		return <div className="text-center py-8">Loading contexts...</div>;
	}

	return (
		<div id="ManageContexts" className="p-6">
			<div className="mb-6">
				<div className="flex items-center gap-2 h-12">
					<Link to="/dashboard/inbox">
						<ArrowLeft className="h-6 w-6" />
					</Link>{" "}
					<h2 className="text-2xl font-bold text-gray-900 dark:text-white">
						Manage Contexts
					</h2>
				</div>
				<p className="text-gray-600 dark:text-gray-400 mt-1">
					Create and manage conversation contexts for your campaigns
				</p>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
				{contexts.map((contextItem) => {
					const isEditing = editingId === contextItem._id;

					return (
						<div
							key={contextItem._id}
							className="card p-6 hover:shadow-md transition-all duration-200 group"
						>
							<div className="flex items-start justify-between">
								{/* <div className="p-3 bg-primary-100 dark:bg-primary-900 rounded-lg group-hover:bg-primary-200 dark:group-hover:bg-primary-800 transition-colors">
									<FileText className="h-6 w-6 text-primary-600 dark:text-primary-400" />
								</div> */}
								{/* <span className="px-2 py-1 text-xs font-medium rounded-full bg-success-100 text-success-800 dark:bg-success-900 dark:text-success-300">
									Active
								</span> */}
							</div>

							{isEditing ? (
								<div className="space-y-3">
									{/* <input
										type="text"
										value={editedContext.name}
										onChange={(e) =>
											setEditedContext({
												...editedContext,
												name: e.target.value,
											})
										}
										className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
										placeholder="Context name"
									/> */}
									<h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
										{contextItem.name || "Untitled Context"}
									</h3>
									<textarea
										value={editedContext.context}
										onChange={(e) =>
											setEditedContext({
												...editedContext,
												context: e.target.value,
											})
										}
										className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none min-h-[100px] resize-none"
										placeholder="Context description"
									/>
									<div className="flex gap-2 justify-end">
										<button
											onClick={() => handleSave(contextItem._id)}
											className="flex items-center gap-1 px-3 py-1.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium transition-colors"
											disabled={updating}
										>
											<Save className="h-4 w-4" />
											{updating ? "Saving" : "Save"}
										</button>
										<button
											onClick={handleCancel}
											className="flex items-center gap-1 px-3 py-1.5 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium transition-colors"
											disabled={updating}
										>
											<X className="h-4 w-4" />
											{updating ? "Canceling" : "Cancel"}
										</button>
									</div>
								</div>
							) : (
								<>
									<h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
										{contextItem.name || "Untitled Context"}
									</h3>
									<p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-3">
										{contextItem.context || "No context provided"}
									</p>

									<div className="flex items-center justify-between text-xs">
										<span className="text-gray-500 dark:text-gray-400">
											ID: {contextItem._id.slice(-8)}
										</span>
										<button
											onClick={() => handleEdit(contextItem)}
											className="flex items-center gap-1 text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 font-medium transition-colors"
										>
											<Edit2 className="h-3.5 w-3.5" />
											Edit
										</button>
									</div>
								</>
							)}
						</div>
					);
				})}
			</div>

			{contexts.length === 0 && (
				<div className="text-center py-12 text-gray-500 dark:text-gray-400">
					No contexts found. Create your first context to get started.
				</div>
			)}
		</div>
	);
};

export default ManageContexts;
