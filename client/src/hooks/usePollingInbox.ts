import { useState, useEffect, useCallback } from "react";
import { chat } from "../services/chat";
import useInfiniteConversations from "./useInfiniteConversations";

export default function usePollingInbox(interval = 60000) {
	// Use the new infinite conversations hook
	const {
		conversations: allConversations,
		accounts,
		loading: conversationsLoading,
		loadingMore,
		hasMore,
		loadMore,
		refresh: refreshConversations,
	} = useInfiniteConversations();

	// Existing state
	const [activeAccount, setActiveAccount] = useState<any>(null);
	const [filteredConversations, setFilteredConversations] = useState<any[]>([]);
	const [activeConv, setActiveConv] = useState<any>(null);
	const [messages, setMessages] = useState<any[]>([]);
	const [selectedTags, setSelectedTags] = useState<any[]>([]);
	const [allTags, setAllTags] = useState<any[]>([]);

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

		// Note: We can't directly modify the conversations from infinite hook
		// The unread count reset would need to be handled differently
		// For now, we'll just load messages without modifying conversations state

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
		const id = setInterval(load, interval);
		return () => clearInterval(id);
	}, [activeConv, interval]);

	// Filter conversations by tags
	const applyTagFilter = useCallback(() => {
		let filtered = allConversations;

		if (selectedTags.length > 0) {
			filtered = allConversations.filter((conv) => {
				const convTags = conv.tags || [];
				return selectedTags.some((tag) => convTags.includes(tag));
			});
		}

		setFilteredConversations(filtered);
	}, [allConversations, selectedTags]);

	useEffect(() => {
		applyTagFilter();
	}, [applyTagFilter]);

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
			// Since we can't directly modify the conversations from infinite hook,
			// we'll refresh the conversations to get the updated tags
			refreshConversations();

			if (activeConv && activeConv.id === conversationId) {
				setActiveConv((prev: any) => ({ ...prev, tags: newTags }));
			}
		},
		[activeConv, refreshConversations]
	);

	return {
		// State
		accounts,
		conversations: allConversations,
		filteredConversations,
		messages,
		activeAccount,
		activeConv,
		selectedTags,
		allTags,
		conversationsLoading,
		loadingMore,
		hasMore,

		// Setters & helpers
		setFilteredConversations,
		setActiveAccount,
		setActiveConv,
		setSelectedTags,
		updateConversationTags,

		// Actions
		send,
		loadMore,
		refreshConversations,
	};
}
