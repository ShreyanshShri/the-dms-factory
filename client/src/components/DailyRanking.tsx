import React from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

const DailyRanking: React.FC = () => {
	const rankings = [
		{
			rank: 1,
			account: "@techguru",
			dms: 247,
			change: "+12%",
			trend: "up",
			avatar: "TG",
		},
		{
			rank: 2,
			account: "@startupfounder",
			dms: 198,
			change: "+8%",
			trend: "up",
			avatar: "SF",
		},
		{
			rank: 3,
			account: "@productdev",
			dms: 156,
			change: "+5%",
			trend: "up",
			avatar: "PD",
		},
	];

	const getTrendIcon = (trend: string) => {
		switch (trend) {
			case "up":
				return (
					<TrendingUp className="h-3 w-3 text-green-500 dark:text-green-400" />
				);
			case "down":
				return (
					<TrendingDown className="h-3 w-3 text-red-500 dark:text-red-400" />
				);
			default:
				return <Minus className="h-3 w-3 text-gray-400" />;
		}
	};

	const getRankColor = (rank: number) => {
		switch (rank) {
			case 1:
				return "from-yellow-400 to-yellow-600";
			case 2:
				return "from-gray-300 to-gray-500";
			case 3:
				return "from-orange-400 to-orange-600";
			default:
				return "from-blue-400 to-blue-600";
		}
	};

	return (
		<div className="space-y-2 sm:space-y-3">
			{rankings.map((item) => (
				<div key={item.rank} className="group relative">
					<div className="glass-card glass-card-hover rounded-xl sm:rounded-2xl p-3 sm:p-4 transition-all duration-300 hover:scale-[1.02]">
						<div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-2 sm:space-y-0">
							<div className="flex items-center space-x-2 sm:space-x-3">
								<div
									className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br ${getRankColor(
										item.rank
									)} flex items-center justify-center text-white font-bold text-xs sm:text-sm shadow-lg`}
								>
									{item.rank}
								</div>
								<div className="flex items-center space-x-2 sm:space-x-3">
									<div className="avatar w-6 h-6 sm:w-8 sm:h-8">
										<span className="text-xs sm:text-sm">{item.avatar}</span>
									</div>
									<div>
										<p className="font-semibold text-gray-900 dark:text-white text-xs sm:text-sm">
											{item.account}
										</p>
										<div className="flex items-center space-x-1">
											{getTrendIcon(item.trend)}
											<span className="text-xs text-gray-500 dark:text-gray-400">
												{item.change}
											</span>
										</div>
									</div>
								</div>
							</div>
							<div className="text-right sm:text-left sm:ml-auto">
								<p className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
									{item.dms}
								</p>
								<p className="text-xs text-gray-500 dark:text-gray-400">
									DMs sent
								</p>
							</div>
						</div>
					</div>

					{/* Hover effect background */}
					<div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 dark:from-blue-500/5 dark:to-purple-500/5 rounded-xl sm:rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10" />
				</div>
			))}
		</div>
	);
};

export default DailyRanking;
