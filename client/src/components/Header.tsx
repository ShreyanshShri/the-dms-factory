import React, { useState } from "react";
import { Search, Menu, Sun, Moon, MessageSquare } from "lucide-react";
import { useTheme } from "../contexts/ThemeContext";
import { useAuth } from "../contexts/AuthContext";

interface HeaderProps {
	onMenuClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
	const { isDark, toggleTheme } = useTheme();
	const { user, logout } = useAuth();
	const [isSearchExpanded, setIsSearchExpanded] = useState(false);

	const handleLogout = async () => {
		try {
			const result: any = await logout();
			console.log(result);
			if (result?.success) {
				// Redirect to login page
				window.location.href = "/login";
			}
		} catch (err) {
			console.log(err);
		}
	};

	return (
		<header className="sticky top-0 z-30 header-bg">
			<div className="flex items-center justify-between px-2 py-1.5">
				{/* Left Section */}
				<div className="flex items-center space-x-1.5">
					<button
						onClick={onMenuClick}
						className="lg:hidden p-0.5 rounded-sm hover:bg-gray-100 dark:hover:bg-white/10 transition-colors duration-200"
					>
						<Menu className="h-3 w-3 text-gray-700 dark:text-white" />
					</button>

					{/* Logo */}
					<div className="flex items-center space-x-1.5">
						<div className="w-5 h-5 bg-gradient-to-br from-blue-500 to-purple-600 rounded-sm flex items-center justify-center shadow-sm">
							<MessageSquare className="w-3 h-3 text-white" />
						</div>
						<span className="text-sm tracking-wider font-bold text-gray-900 dark:text-white tracking-tight hidden sm:block">
							Buildfluence
						</span>
					</div>
				</div>

				{/* Center Section - Search */}
				{/* <div
					className={`flex-1 max-w-xs mx-2 transition-all duration-300 ${
						isSearchExpanded ? "block" : "hidden sm:block"
					}`}
				>
					<div className="relative">
						<Search className="absolute left-1.5 top-1/2 transform -translate-y-1/2 h-2.5 w-2.5 text-gray-400" />
						<input
							type="text"
							placeholder="Search accounts, campaigns, messages..."
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className="search-input"
						/>
						{isSearchExpanded && (
							<button
								onClick={() => setIsSearchExpanded(false)}
								className="absolute right-1 top-1/2 transform -translate-y-1/2 p-0.5 rounded hover:bg-gray-100 dark:hover:bg-white/10"
							>
								<X className="h-2.5 w-2.5 text-gray-500 dark:text-gray-400" />
							</button>
						)}
					</div>
				</div> */}

				{/* Right Section */}
				<div className="flex items-center space-x-1">
					{/* Mobile Search Toggle */}
					<button
						onClick={() => setIsSearchExpanded(!isSearchExpanded)}
						className="sm:hidden p-0.5 rounded-sm hover:bg-gray-100 dark:hover:bg-white/10 transition-colors duration-200"
					>
						<Search className="h-3 w-3 text-gray-700 dark:text-white" />
					</button>

					{/* Theme Toggle */}
					<button
						onClick={toggleTheme}
						className="p-0.5 rounded-sm hover:bg-gray-100 dark:hover:bg-white/10 transition-all duration-200 group"
					>
						{isDark ? (
							<Sun className="h-3 w-3 text-yellow-500 group-hover:rotate-12 transition-transform duration-200" />
						) : (
							<Moon className="h-3 w-3 text-blue-500 group-hover:-rotate-12 transition-transform duration-200" />
						)}
					</button>

					{/* User Menu */}
					<button className="flex items-center space-x-1 p-0.5 rounded-sm hover:bg-gray-100 dark:hover:bg-white/10 transition-all duration-200 group">
						<div className="w-5 h-5 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
							<span className="text-white text-xs font-semibold">
								{user === null
									? "U"
									: user?.name?.split(" ")[0][0] +
									  (user?.name?.split(" ")[1] !== undefined
											? user?.name?.split(" ")[1][0]
											: "")}
							</span>
						</div>
						<span className="hidden lg:block text-xs font-medium text-gray-700 dark:text-white group-hover:text-gray-900 dark:group-hover:text-blue-400 transition-colors duration-200">
							{user === null ? "Loading..." : user?.name}
						</span>
					</button>
					<button
						className="flex items-center space-x-1 p-0.5 px-1 rounded-sm dark:bg-white/20 bg-gray-100 hover:bg-gray-300 dark:hover:bg-white/10 transition-all duration-200 group"
						onClick={handleLogout}
					>
						Logout
					</button>
				</div>
			</div>
		</header>
	);
};

export default Header;
