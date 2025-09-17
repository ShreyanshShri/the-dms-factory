import { useEffect, useRef, useCallback } from "react";

interface UseScrollToBottomProps {
	onScrollToBottom: () => void;
	threshold?: number;
	enabled?: boolean;
}

export function useScrollToBottom({
	onScrollToBottom,
	threshold = 100,
	enabled = true,
}: UseScrollToBottomProps) {
	const containerRef = useRef<HTMLDivElement>(null);
	const isNearBottomRef = useRef(false);

	const handleScroll = useCallback(() => {
		if (!containerRef.current || !enabled) return;

		const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
		const isNearBottom = scrollHeight - scrollTop - clientHeight < threshold;

		// Only trigger when we cross the threshold (prevents multiple calls)
		if (isNearBottom && !isNearBottomRef.current) {
			isNearBottomRef.current = true;
			onScrollToBottom();
		} else if (!isNearBottom) {
			isNearBottomRef.current = false;
		}
	}, [onScrollToBottom, threshold, enabled]);

	useEffect(() => {
		const container = containerRef.current;
		if (!container) return;

		container.addEventListener("scroll", handleScroll);
		return () => container.removeEventListener("scroll", handleScroll);
	}, [handleScroll]);

	return containerRef;
}
