import { useEffect, useState } from "react";
import { chatAPI } from "../services/api";
import { Instagram, Trash2, CheckCircle, Calendar } from "lucide-react"; // or your icon library
import { useAlert } from "../contexts/AlertContext";
import { useConfirm } from "../contexts/ConfirmContext";

const ManageInstagramAccounts = () => {
	const alert = useAlert();
	const { confirm } = useConfirm();
	const [accounts, setAccounts] = useState<any[]>([]);
	const [loading, setLoading] = useState(true);
	const [deleting, setDeleting] = useState<any>(null);

	useEffect(() => {
		const fetchAccounts = async () => {
			try {
				const response = await chatAPI.getInstagramAccounts(); // or whatever your API method is
				if (response.success) {
					setAccounts(response.accounts);
				}
			} catch (error) {
				console.error("Failed to fetch accounts:", error);
			} finally {
				setLoading(false);
			}
		};
		fetchAccounts();
	}, []);

	const handleDelete = async (accountId: any) => {
		const confirmed = await confirm({
			title: "Disconnect Account",
			message: "Are you sure you want to disconnect this instagram Account?",
			variant: "danger",
			confirmLabel: "Delete",
		});
		if (!confirmed) return;

		try {
			setDeleting(accountId);
			await chatAPI.deleteAccount(accountId);
			setAccounts(accounts.filter((acc) => acc._id !== accountId));
		} catch (error) {
			console.error("Failed to delete account:", error);
			alert.success("Failed to delete account. Please try again.");
		} finally {
			setDeleting(null);
		}
	};

	const formatDate = (dateString: any) => {
		return new Date(dateString).toLocaleDateString("en-US", {
			month: "short",
			day: "numeric",
			year: "numeric",
		});
	};

	if (loading) {
		return <div className="text-center py-8">Loading accounts...</div>;
	}

	return (
		<div id="ManageAccounts" className="p-6">
			<div className="mb-6">
				<h2 className="text-2xl font-bold text-gray-900 dark:text-white">
					Connected Accounts
				</h2>
				<p className="text-gray-600 dark:text-gray-400 mt-1">
					Manage your connected Instagram business accounts
				</p>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
				{accounts.map((account) => {
					const isDeleting = deleting === account._id;

					return (
						<div
							key={account._id}
							className="card p-6 hover:shadow-md transition-all duration-200 group"
						>
							{/* <div className="flex items-start justify-between mb-4">
								<div className="p-3 bg-primary-100 dark:bg-primary-900 rounded-lg group-hover:bg-primary-200 dark:group-hover:bg-primary-800 transition-colors">
									<Instagram className="h-6 w-6 text-primary-600 dark:text-primary-400" />
								</div>
								<span className="px-2 py-1 text-xs font-medium rounded-full bg-success-100 text-success-800 dark:bg-success-900 dark:text-success-300">
									{account.account_type}
								</span>
							</div> */}

							<h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
								@{account.username}
							</h3>

							<div className="space-y-2 mb-4">
								<div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
									<CheckCircle className="h-3.5 w-3.5 text-success-500" />
									<span>Token Active</span>
								</div>
								<div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
									<Calendar className="h-3.5 w-3.5" />
									<span>Connected: {formatDate(account.createdAt)}</span>
								</div>
								<div className="text-xs text-gray-500 dark:text-gray-500">
									Last updated: {formatDate(account.updatedAt)}
								</div>
							</div>

							<div className="flex items-center justify-between text-xs pt-3 border-t border-gray-200 dark:border-gray-700">
								<span className="text-gray-500 dark:text-gray-400 font-mono">
									ID: {account.user_id.slice(-8)}
								</span>
								<button
									onClick={() => handleDelete(account._id)}
									disabled={isDeleting}
									className="flex items-center gap-1 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
								>
									<Trash2 className="h-3.5 w-3.5" />
									{isDeleting ? "Disconnecting..." : "Disconnect"}
								</button>
							</div>
						</div>
					);
				})}
			</div>

			{accounts.length === 0 && (
				<div className="text-center py-12">
					<Instagram className="h-12 w-12 text-gray-400 mx-auto mb-3" />
					<p className="text-gray-500 dark:text-gray-400">
						No accounts connected yet.
					</p>
					<p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
						Connect your first Instagram business account to get started.
					</p>
				</div>
			)}
		</div>
	);
};

export default ManageInstagramAccounts;
