import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
	LayoutDashboard,
	Users,
	Megaphone,
	MessageSquare,
	Settings,
	Wrench,
	X,
	ChevronDown,
	ChevronUp,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

interface SidebarProps {
	isOpen: boolean;
	setIsOpen: (open: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, setIsOpen }) => {
	const location = useLocation();
	const navigate = useNavigate();
	const { user } = useAuth();

	const [isStatsExpanded, setIsStatsExpanded] = useState(true);

	const menuItems = [
		{ path: "/dashboard", icon: LayoutDashboard, label: "Overview" },
		{ path: "/dashboard/accounts", icon: Users, label: "Accounts" },
		{ path: "/dashboard/campaigns", icon: Megaphone, label: "Campaigns" },
		{ path: "/dashboard/crm", icon: Megaphone, label: "CRM" },
		{ path: "/dashboard/messages", icon: MessageSquare, label: "Messages" },
		{ path: "/dashboard/inbox", icon: MessageSquare, label: "Unified Inbox" },
		{ path: "/dashboard/tools", icon: Wrench, label: "Tools" },
		{ path: "/dashboard/extension", icon: Wrench, label: "Extension" },
		{ path: "/dashboard/settings", icon: Settings, label: "Settings" },
	];

	return (
		<>
			{/* Mobile backdrop */}
			{isOpen && (
				<div
					className="fixed inset-0 bg-black/20 dark:bg-black/50 backdrop-blur-sm z-40 lg:hidden"
					onClick={() => setIsOpen(false)}
				/>
			)}

			{/* Sidebar */}
			<div
				className={`
        fixed lg:static inset-y-0 left-0 z-50 w-48 sm:w-56 sidebar-bg
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}
			>
				{/* Brand */}
				<div className="flex items-center justify-between px-2 py-2 border-b border-gray-200/60 dark:border-white/10">
					<div className="flex items-center space-x-1.5">
						<div className="w-5 h-5 bg-gradient-to-br from-blue-500 to-purple-600 rounded-sm flex items-center justify-center shadow-sm">
							<MessageSquare className="w-3 h-3 text-white" />
						</div>
						<span className="text-xs font-bold text-gray-900 dark:text-white tracking-tight">
							Buildfluence
						</span>
					</div>
					<button
						onClick={() => setIsOpen(false)}
						className="lg:hidden p-0.5 rounded-sm hover:bg-gray-100 dark:hover:bg-white/10 transition-colors duration-200"
					>
						<X className="h-3 w-3 text-gray-700 dark:text-white" />
					</button>
				</div>

				{/* Navigation */}
				<nav className="px-1.5 py-2 space-y-0.5">
					{menuItems.map((item) => {
						const isActive = location.pathname === item.path;
						return (
							<button
								key={item.path}
								onClick={() => {
									navigate(item.path);
									setIsOpen(false);
								}}
								className={`w-full sidebar-item ${
									isActive ? "active" : "text-gray-600 dark:text-gray-400"
								}`}
							>
								<item.icon className="h-3 w-3" />
								<span className="font-medium text-xs">{item.label}</span>
							</button>
						);
					})}
				</nav>

				{/* Quick Stats - Collapsible on mobile */}
				<div className="px-1.5 py-2 border-t border-gray-200/60 dark:border-white/10">
					<button
						onClick={() => setIsStatsExpanded(!isStatsExpanded)}
						className="flex items-center justify-between w-full mb-1.5 px-1 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider lg:hidden"
					>
						Quick Stats
						{isStatsExpanded ? (
							<ChevronUp className="h-2 w-2" />
						) : (
							<ChevronDown className="h-2 w-2" />
						)}
					</button>

					<div
						className={`space-y-1 transition-all duration-300 ${
							isStatsExpanded ? "block" : "hidden lg:block"
						}`}
					>
						{/* {quickStats.map((stat, index) => (
							<div
								key={index}
								className="flex items-center justify-between p-1 rounded-sm bg-gray-50/80 dark:bg-white/5 hover:bg-gray-100/80 dark:hover:bg-white/10 transition-colors duration-200"
							>
								<span className="text-xs text-gray-600 dark:text-gray-400">
									{stat.label}
								</span>
								<span className={`text-xs font-semibold ${stat.color}`}>
									{stat.value}
								</span>
							</div>
						))} */}
					</div>
				</div>

				{/* User Profile */}
				<div className="absolute bottom-0 left-0 right-0 p-1.5 border-t border-gray-200/60 dark:border-white/10">
					<div className="flex items-center space-x-1.5 p-1 rounded-sm bg-gray-50/80 dark:bg-white/5 hover:bg-gray-100/80 dark:hover:bg-white/10 transition-colors duration-200 cursor-pointer">
						<div className="w-4 h-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
							<span className="text-white text-xs font-semibold">
								{user === null
									? "U"
									: user?.name?.split(" ")[0][0] +
									  (user?.name?.split(" ")[1] !== undefined
											? user?.name?.split(" ")[1][0]
											: "")}
							</span>
						</div>
						<div className="flex-1 min-w-0">
							<p className="text-xs font-medium text-gray-900 dark:text-white truncate">
								{user === null ? "Loading..." : user?.name}
							</p>
							<p className="text-xs text-gray-500 dark:text-gray-400 truncate hidden sm:block">
								{user === null ? "Loading..." : user?.email}
							</p>
						</div>
					</div>
				</div>
			</div>
		</>
	);
};

export default Sidebar;
