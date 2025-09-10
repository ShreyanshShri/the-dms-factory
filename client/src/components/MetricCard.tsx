import React from "react";

interface MetricCardProps {
	title: string;
	value: string;
	icon: any;
	color: "primary" | "success" | "warning" | "danger";
	subtitle?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({
	title,
	value,
	icon: Icon,
	color,
	subtitle,
}) => {
	const colorClasses = {
		primary: "from-blue-500/20 to-blue-600/20 border-blue-500/30 text-blue-400",
		success:
			"from-green-500/20 to-green-600/20 border-green-500/30 text-green-400",
		warning:
			"from-yellow-500/20 to-yellow-600/20 border-yellow-500/30 text-yellow-400",
		danger: "from-red-500/20 to-red-600/20 border-red-500/30 text-red-400",
	};

	const iconBgClasses = {
		primary: "from-blue-500 to-blue-600",
		success: "from-green-500 to-green-600",
		warning: "from-yellow-500 to-yellow-600",
		danger: "from-red-500 to-red-600",
	};

	return (
		<div className="stat-card group">
			<div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-3 sm:space-y-0">
				<div className="space-y-1 sm:space-y-2">
					<p className="metric-title text-xs sm:text-sm">{title}</p>
					<p className="metric-value text-2xl sm:text-3xl lg:text-4xl">
						{value}
					</p>
					{subtitle && (
						<p className="metric-subtitle text-xs sm:text-sm">{subtitle}</p>
					)}
				</div>
				<div
					className={`p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-gradient-to-br ${iconBgClasses[color]} shadow-lg group-hover:shadow-xl transition-all duration-300 transform group-hover:scale-110 self-start sm:self-auto`}
				>
					<Icon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
				</div>
			</div>

			{/* Animated background gradient */}
			<div
				className={`absolute inset-0 bg-gradient-to-br ${colorClasses[color]} opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl`}
			/>
		</div>
	);
};

export default MetricCard;
