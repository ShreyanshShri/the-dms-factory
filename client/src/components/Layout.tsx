import React, { useState } from "react";
import { useTheme } from "../contexts/ThemeContext";
import Sidebar from "./Sidebar";
import Header from "./Header";

interface LayoutProps {
	children: React.ReactNode;
	withPadding: boolean;
}

const Layout: React.FC<LayoutProps> = ({ children, withPadding = true }) => {
	const [sidebarOpen, setSidebarOpen] = useState(false);
	const { isDark } = useTheme();

	return (
		<div className={`min-h-screen ${isDark ? "dark" : ""}`}>
			<div className="flex h-screen bg-gray-50 dark:bg-gray-900">
				<Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

				<div className="flex-1 flex flex-col overflow-hidden">
					<Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />

					<main
						className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 dark:bg-gray-900"
						id="content"
					>
						<div
							className={`${withPadding ? "container mx-auto px-4 py-6" : ""}`}
						>
							{children}
						</div>
					</main>
				</div>
			</div>
		</div>
	);
};

export default Layout;
