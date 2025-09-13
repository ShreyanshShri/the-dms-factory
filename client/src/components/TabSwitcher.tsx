// src/components/TabSwitcher.jsx
import { useLayoutEffect, useEffect, useRef, useState } from "react";

/**
 * props
 * - tabs   : [{ key, label }]
 * - value  : currently-selected key
 * - onChange(newKey)
 */
const TabSwitcher = ({
	tabs = [],
	value,
	onChange,
}: {
	tabs: any[];
	value: any;
	onChange: any;
}) => {
	const barRef = useRef<any>(null);
	const [indicator, setIndicator] = useState({ left: 0, width: 0 });

	// measure the active button and move the indicator
	const moveIndicator = () => {
		const idx = tabs.findIndex((t) => t.key === value);
		if (idx === -1) return;
		const btn = barRef.current?.children[idx];
		if (!btn) return;
		setIndicator({ left: btn.offsetLeft, width: btn.offsetWidth });
	};

	useLayoutEffect(moveIndicator, [value, tabs]);
	useEffect(() => {
		window.addEventListener("resize", moveIndicator);
		return () => window.removeEventListener("resize", moveIndicator);
	});

	return (
		<div className="flex border-b border-gray-300 dark:border-gray-700 relative">
			<div className="flex w-full" ref={barRef}>
				{tabs.map((t) => (
					<button
						key={t.key}
						className={`px-4 py-2 text-sm font-medium focus:outline-none ${
							t.key === value
								? "text-blue-600 border-b-2 border-blue-600 dark:text-blue-400"
								: "text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-300"
						}`}
						onClick={() => onChange(t.key)}
					>
						{t.label}
					</button>
				))}
				{/* sliding underline */}
				<span
					className="absolute bottom-0 h-0.5 bg-blue-600 transition-all duration-300 dark:bg-blue-400"
					style={{
						width: indicator.width,
						transform: `translateX(${indicator.left}px)`,
					}}
				/>
			</div>
		</div>
	);
};

export default TabSwitcher;
