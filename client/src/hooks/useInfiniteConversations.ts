import { useState, useEffect, useCallback } from "react";
import { chat } from "../services/chat";

interface PaginationInfo {
	totalItems: number;
	currentPage: number;
	totalPages: number;
	pageSize: number;
	hasNextPage: boolean;
	hasPrevPage: boolean;
}

interface ConversationsResponse {
	success: boolean;
	accounts: any[];
	conversations: any[];
	pagination: PaginationInfo;
}

export default function useInfiniteConversations() {
	const [conversations, setConversations] = useState<any[]>([]);
	const [accounts, setAccounts] = useState<any[]>([]);
	const [loading, setLoading] = useState(false);
	const [loadingMore, setLoadingMore] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [pagination, setPagination] = useState<PaginationInfo | null>(null);
	const [hasMore, setHasMore] = useState(true);

	// Initial load
	const loadConversations = useCallback(
		async (reset = false) => {
			if (loading || loadingMore) return;

			const currentPage = reset ? 1 : (pagination?.currentPage || 0) + 1;

			if (reset) {
				setLoading(true);
			} else {
				setLoadingMore(true);
			}

			setError(null);

			try {
				const response: ConversationsResponse = (await chat.getAllConversations(
					currentPage,
					20
				)) as any;

				if (reset) {
					setConversations(response.conversations);
					setAccounts(response.accounts);
				} else {
					setConversations((prev) => [...prev, ...response.conversations]);
				}

				setPagination(response.pagination);
				setHasMore(response.pagination.hasNextPage);
			} catch (err: any) {
				setError(err.message || "Failed to load conversations");
				console.error("Error loading conversations:", err);
			} finally {
				setLoading(false);
				setLoadingMore(false);
			}
		},
		[loading, loadingMore, pagination?.currentPage]
	);

	// Load more conversations
	const loadMore = useCallback(() => {
		if (!hasMore || loadingMore || loading) return;
		loadConversations(false);
	}, [hasMore, loadingMore, loading, loadConversations]);

	// Refresh conversations (reset to page 1)
	const refresh = useCallback(() => {
		loadConversations(true);
	}, [loadConversations]);

	// Initial load on mount
	useEffect(() => {
		loadConversations(true);
	}, []);

	return {
		conversations,
		accounts,
		loading,
		loadingMore,
		error,
		hasMore,
		pagination,
		loadMore,
		refresh,
	};
}
