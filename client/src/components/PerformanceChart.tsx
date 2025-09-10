import React from "react";
import {
	Chart as ChartJS,
	CategoryScale,
	LinearScale,
	PointElement,
	LineElement,
	Title,
	Tooltip,
	Legend,
	Filler,
} from "chart.js";
// @ts-ignore
import { Line } from "react-chartjs-2";

ChartJS.register(
	CategoryScale,
	LinearScale,
	PointElement,
	LineElement,
	Title,
	Tooltip,
	Legend,
	Filler
);

interface PerformanceChartProps {
	data: {
		labels: string[];
		datasets: {
			label: string;
			data: number[];
			borderColor: string;
			backgroundColor: string;
			fill?: boolean;
		}[];
	};
	title?: string;
}

const PerformanceChart: React.FC<PerformanceChartProps> = ({ data, title }) => {
	const options = {
		responsive: true,
		maintainAspectRatio: false,
		plugins: {
			legend: {
				display: false,
			},
			tooltip: {
				enabled: true,
				backgroundColor: "rgba(0, 0, 0, 0.95)",
				titleColor: "white",
				bodyColor: "white",
				borderColor: "rgba(59, 130, 246, 0.5)",
				borderWidth: 1,
				cornerRadius: 4,
				displayColors: true,
				titleFont: {
					size: 10,
					weight: "600" as any,
				},
				bodyFont: {
					size: 9,
				},
				callbacks: {
					label: function (context: any) {
						let label = context.dataset.label || "";
						if (label) {
							label += ": ";
						}
						if (context.parsed.y !== null) {
							label += context.parsed.y.toLocaleString();
						}
						return label;
					},
				},
			},
		},
		scales: {
			x: {
				display: true,
				grid: {
					display: false,
				},
				ticks: {
					color: "#9CA3AF",
					font: {
						size: 8,
						weight: "500" as any,
					},
					maxRotation: 45,
					minRotation: 0,
				},
			},
			y: {
				display: true,
				grid: {
					color: "rgba(156, 163, 175, 0.1)",
					drawBorder: false,
				},
				ticks: {
					color: "#9CA3AF",
					font: {
						size: 8,
						weight: "500" as any,
					},
					padding: 2,
				},
			},
		},
		elements: {
			point: {
				radius: 0,
				hoverRadius: 2,
				backgroundColor: "white",
				borderWidth: 1,
				borderColor: "#3B82F6",
			},
			line: {
				tension: 0.4,
				borderWidth: 1,
				shadowColor: "rgba(59, 130, 246, 0.1)",
				shadowBlur: 1,
				shadowOffsetX: 0,
				shadowOffsetY: 1,
			},
		},
		interaction: {
			intersect: false,
			mode: "index" as const,
		},
	};

	return (
		<div className="chart-container">
			{title && (
				<h3 className="text-xs font-bold text-gray-900 dark:text-white mb-2 tracking-tight">
					{title}
				</h3>
			)}
			<div className="h-32 sm:h-36 lg:h-40 relative">
				<Line data={data} options={options} />

				{/* Chart overlay gradient */}
				<div className="absolute inset-0 bg-gradient-to-t from-gray-900/20 to-transparent pointer-events-none rounded-md" />
			</div>
		</div>
	);
};

export default PerformanceChart;
