import { useState, useEffect, useCallback, useRef } from "react";
import { chat } from "../services/chat";

interface PaginationInfo {
	totalItems: number;
	currentPage: number;
	totalPages: number;
	pageSize: number;
	hasNextPage: boolean;
	hasPrevPage: boolean;
}

// interface ConversationsResponse {
// 	success: boolean;
// 	accounts: any[];
// 	conversations: any[];
// 	pagination: PaginationInfo;
// }

interface SearchFilters {
	instagram_id?: string;
	tags?: string;
	search?: string;
}

export default function useInfiniteConversations() {
	const [conversations, setConversations] = useState<any[]>([]);
	const [accounts, setAccounts] = useState<any[]>([]);
	const [loading, setLoading] = useState(false);
	const [loadingMore, setLoadingMore] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [pagination, setPagination] = useState<PaginationInfo | null>(null);
	const [hasMore, setHasMore] = useState(true);
	const [filters, setFilters] = useState<SearchFilters>({});

	// Use ref to store current filters to avoid dependency issues
	const filtersRef = useRef<SearchFilters>({});
	filtersRef.current = filters;

	// Load conversations with filters - removed filters from dependencies
	const loadConversations = useCallback(
		async (reset = false, newFilters?: SearchFilters) => {
			if (loading || loadingMore) return;

			const currentPage = reset ? 1 : (pagination?.currentPage || 0) + 1;
			const activeFilters = newFilters || filtersRef.current;

			if (reset) {
				setLoading(true);
			} else {
				setLoadingMore(true);
			}

			setError(null);

			try {
				const response = (await chat.getAllConversations(
					currentPage,
					20,
					activeFilters
				)) as any;

				const data = response;

				if (reset) {
					console.log("conversations", data);
					setConversations(data.conversations);
					setAccounts(data.accounts);
				} else {
					setConversations((prev) => [...prev, ...data.conversations]);
				}

				setPagination(data.pagination);
				setHasMore(data.pagination.hasNextPage);
			} catch (err: any) {
				setError(
					err.response?.data?.error ||
						err.message ||
						"Failed to load conversations"
				);
				console.error("Error loading conversations:", err);
			} finally {
				setLoading(false);
				setLoadingMore(false);
			}
		},
		[loading, loadingMore, pagination?.currentPage] // Removed filters dependency
	);

	// Load more conversations
	const loadMore = useCallback(() => {
		if (!hasMore || loadingMore || loading) return;
		loadConversations(false);
	}, [hasMore, loadingMore, loading, loadConversations]);

	// Refresh conversations (reset to page 1)
	const refresh = useCallback(
		(newFilters?: SearchFilters) => {
			if (newFilters) {
				setFilters(newFilters);
			}
			loadConversations(true, newFilters);
		},
		[loadConversations]
	);

	// Apply search filters - this is the main function to call
	const applyFilters = useCallback(
		(newFilters: SearchFilters) => {
			setFilters(newFilters);
			loadConversations(true, newFilters);
		},
		[loadConversations]
	);

	// Initial load on mount - only run once
	useEffect(() => {
		loadConversations(true);
	}, []); // Empty dependency array

	return {
		conversations,
		accounts,
		loading,
		loadingMore,
		error,
		hasMore,
		pagination,
		filters,
		loadMore,
		refresh,
		applyFilters,
	};
}
