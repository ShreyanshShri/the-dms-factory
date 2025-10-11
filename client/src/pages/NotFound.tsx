import { TriangleAlert } from "lucide-react";
import { Link } from "react-router-dom";

export default function NotFound() {
	return (
		<div className="min-h-screen flex items-center justify-center p-6">
			<div className="max-w-md w-full">
				<div className="card p-8 text-center">
					<div className="flex justify-center mb-6">
						<div className="p-4 bg-warning-100 dark:bg-warning-900 rounded-full">
							<TriangleAlert className="h-12 w-12 text-warning-600 dark:text-warning-400" />
						</div>
					</div>

					<h1 className="text-6xl font-bold text-gray-900 dark:text-white mb-4">
						404
					</h1>
					<h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
						Page Not Found
					</h2>
					<p className="text-gray-600 dark:text-gray-400 text-sm mb-8">
						The page you're looking for doesn't exist or has been moved to
						another location.
					</p>

					{/* <div className="space-y-3">
						<button className="w-full flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
							<Home className="h-4 w-4" />
							Go to Dashboard
						</button>

						<button className="w-full flex items-center justify-center gap-2 text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 px-4 py-2 border border-primary-200 dark:border-primary-800 rounded-lg font-medium transition-colors">
							<Search className="h-4 w-4" />
							Search Tools
						</button>
					</div> */}

					<div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
						<p className="text-xs text-gray-500 dark:text-gray-400">
							Error code: 404 | Need help?{" "}
							<Link to="/contact" className="text-blue-600">
								Contact support
							</Link>
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}
