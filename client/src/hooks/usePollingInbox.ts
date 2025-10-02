import { useState, useEffect, useCallback } from "react";
import { chat } from "../services/chat";
import useInfiniteConversations from "./useInfiniteConversations";

export default function usePollingInbox() {
	const {
		conversations: allConversations,
		accounts,
		loading: conversationsLoading,
		loadingMore,
		hasMore,
		loadMore,
		refresh: refreshConversations,
		applyFilters,
		filters,
	} = useInfiniteConversations();

	// Existing state
	const [activeAccount, setActiveAccount] = useState<any>(null);
	const [activeConv, setActiveConv] = useState<any>(null);
	const [messages, setMessages] = useState<any[]>([]);

	const [selectedTags, setSelectedTags] = useState<any[]>([]);
	const [allTags, setAllTags] = useState<any[]>([]);

	// Search state
	const [searchTerm, setSearchTerm] = useState("");
	const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
	const [selectedAccounts, setSelectedAccounts] = useState<any[]>([]);

	const handleAccountSelect = useCallback((id: any) => {
		setSelectedAccounts((prev) =>
			prev.includes(id) ? prev.filter((acc) => acc !== id) : [...prev, id]
		);
	}, []);

	const handleTagSelect = useCallback((tag: any) => {
		setSelectedTags((prev) =>
			prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
		);
	}, []);

	// Debounce search term
	useEffect(() => {
		const timer = setTimeout(() => {
			setDebouncedSearchTerm(searchTerm);
		}, 500);

		return () => clearTimeout(timer);
	}, [searchTerm]);

	useEffect(() => {
		const newFilters = {
			instagram_id: filters.instagram_id,
			selectedTags: selectedTags.length > 0 ? selectedTags : undefined,
			search: filters.search,
			selectedAccounts:
				selectedAccounts.length > 0 ? selectedAccounts : undefined,
		};

		applyFilters(newFilters);
	}, [selectedAccounts]);

	useEffect(() => {
		const newFilters = {
			instagram_id: filters.instagram_id,
			search: filters.search,
			selectedAccounts:
				selectedAccounts.length > 0 ? selectedAccounts : undefined,
			selectedTags: selectedTags.length > 0 ? selectedTags : undefined,
		};
		applyFilters(newFilters);
	}, [selectedTags]);

	// Apply search when debounced term changes - FIXED: removed filters dependency
	useEffect(() => {
		if (
			debouncedSearchTerm === "" &&
			(!filters.search || filters.search === "")
		) {
			// Both are empty, don't trigger another call
			return;
		}

		const newFilters = {
			instagram_id: filters.instagram_id,
			selectedTags: selectedTags.length > 0 ? selectedTags : undefined,
			search: debouncedSearchTerm || undefined,
		};

		// Only apply if there's actually a change
		if (newFilters.search !== filters.search) {
			applyFilters(newFilters);
		}
	}, [debouncedSearchTerm]); // Only depend on debouncedSearchTerm

	// Search handler for input
	const handleSearch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
		setSearchTerm(e.target.value);
	}, []);

	// Clear search
	const clearSearch = useCallback(() => {
		setSearchTerm("");
		setDebouncedSearchTerm("");
	}, []);

	// Rest of your existing code remains the same...
	// Load all available tags
	useEffect(() => {
		chat
			.getTags()
			.then((response: any) => {
				setAllTags(response.tags);
			})
			.catch(console.error);
	}, []);

	// Update conversations when activeConv changes
	useEffect(() => {
		if (!activeConv) return;

		const load = () => {
			chat
				.messages(
					activeConv.businessAccount.id,
					activeConv.clientAccount.id,
					50
				)
				.then((r: any) => {
					setMessages(r.messages);
				})
				.catch(console.error);
		};

		load();
	}, [activeConv]);

	// Send message function
	const send = useCallback(
		async (text: any) => {
			if (!activeConv || !text.trim()) return;

			const optimisticMsg = {
				recipientid: activeConv.clientAccount.id,
				senderid: activeConv.businessAccount.id,
				text,
				timestamp: { seconds: Math.floor(Date.now() / 1000), nanoseconds: 0 },
				pending: true,
			};

			setMessages((prev) => [...prev, optimisticMsg]);

			try {
				await chat.send(
					activeConv.businessAccount.id,
					activeConv.clientAccount.id,
					text
				);

				setMessages((prev) =>
					prev.map((m) => (m === optimisticMsg ? { ...m, pending: false } : m))
				);

				const r: any = await chat.messages(
					activeConv.businessAccount.id,
					activeConv.clientAccount.id,
					50
				);
				setMessages(r.messages);
			} catch (err) {
				setMessages((prev) =>
					prev.map((m) =>
						m === optimisticMsg ? { ...m, pending: false, failed: true } : m
					)
				);
				console.error(err);
			}
		},
		[activeConv]
	);

	const updateConversationTags = useCallback(
		(conversationId: any, newTags: any) => {
			refreshConversations();
			if (activeConv && activeConv.id === conversationId) {
				setActiveConv((prev: any) => ({ ...prev, tags: newTags }));
			}
		},
		[activeConv, refreshConversations]
	);

	const clearAllFilters = useCallback(() => {
		setSearchTerm("");
		setDebouncedSearchTerm("");
		setSelectedAccounts([]);
		setSelectedTags([]);
		applyFilters({});
	}, [applyFilters]);

	return {
		// State
		accounts,
		conversations: allConversations,
		messages,
		activeAccount,
		activeConv,
		selectedTags,
		allTags,
		conversationsLoading,
		loadingMore,
		hasMore,

		// Search state
		searchTerm,
		debouncedSearchTerm,
		selectedAccounts,

		// Setters
		setActiveAccount,
		setActiveConv,
		setSelectedTags,
		updateConversationTags,
		setSearchTerm,

		// Search actions
		handleSearch,
		clearSearch,
		handleAccountSelect,
		handleTagSelect,

		// Actions
		send,
		loadMore,
		refreshConversations,
		applyFilters,
		clearAllFilters,
	};
}
