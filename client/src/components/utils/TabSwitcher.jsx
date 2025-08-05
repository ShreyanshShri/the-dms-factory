// src/components/TabSwitcher.jsx
import { useLayoutEffect, useEffect, useRef, useState } from "react";
import "../../styles/utils.css"; // styles just below

/**
 * props
 * - tabs   : [{ key, label }]
 * - value  : currently-selected key
 * - onChange(newKey)
 */
const TabSwitcher = ({ tabs = [], value, onChange }) => {
	const barRef = useRef(null);
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
		<div className="tab-switcher">
			<div className="tab-bar" ref={barRef}>
				{tabs.map((t) => (
					<button
						key={t.key}
						className={`tab-btn ${t.key === value ? "active" : ""}`}
						onClick={() => onChange(t.key)}
					>
						{t.label}
					</button>
				))}

				{/* sliding underline */}
				<span
					className="tab-indicator"
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
