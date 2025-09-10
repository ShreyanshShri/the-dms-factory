import { useState, useEffect, useCallback } from "react";
import { chat } from "../services/chat";

export default function usePollingInbox(interval = 60_000) {
	/* ─── state ─── */
	const [accounts, setAccounts] = useState<any[]>([]);
	const [activeAccount, setActiveAccount] = useState<any>(null);
	const [conversations, setConversations] = useState<any[]>([]);
	const [filteredConversations, setFilteredConversations] = useState<any[]>([]);
	const [activeConv, setActiveConv] = useState<any>(null);
	const [messages, setMessages] = useState<any[]>([]);
	const [selectedTags, setSelectedTags] = useState<any[]>([]);
	const [allTags, setAllTags] = useState<any[]>([]);

	/* ─── load IG accounts once ─── */
	useEffect(() => {
		chat
			.getAllConversations()
			.then((r: any) => {
				console.log("all conversations: ", r);
				setAccounts(r.accounts);
				setConversations(r.conversations);
				setFilteredConversations(r.conversations);
			})
			.catch(console.error);

		// Load all available tags
		chat
			.getTags()
			.then((response: any) => {
				setAllTags(response.tags || []);
			})
			.catch(console.error);
	}, []);

	useEffect(() => {
		if (!activeConv) return;

		const load = () =>
			chat
				.messages(
					activeConv.businessAccount.id,
					activeConv.clientAccount.id,
					50
				)
				.then((r: any) => {
					console.log("messages: ", r);
					setMessages(r.messages);
				})
				.catch(console.error);

		load();
		const id = setInterval(load, interval);
		return () => clearInterval(id);
	}, [activeConv, interval]);

	/* ─── filter conversations by tags ─── */
	const applyTagFilter = useCallback(() => {
		let filtered = conversations;

		if (selectedTags.length > 0) {
			filtered = conversations.filter((conv) => {
				const convTags = conv.tags || [];
				return selectedTags.some((tag) => convTags.includes(tag));
			});
		}

		setFilteredConversations(filtered);
	}, [conversations, selectedTags]);

	useEffect(() => {
		applyTagFilter();
	}, [applyTagFilter]);

	/* ─── send a reply then refresh the thread immediately ─── */
	const send = useCallback(
		async (text: any) => {
			if (!activeConv || !text.trim()) return;

			const optimisticMsg = {
				recipient_id: activeConv.clientAccount.id,
				sender_id: activeConv.businessAccount.id,
				text,
				timestamp: { _seconds: Date.now() / 1000, _nanoseconds: 0 },
				pending: true,
			};

			setMessages((prev) => [...prev, optimisticMsg]);

			try {
				await chat.send(
					activeConv.businessAccount.id,
					activeConv.clientAccount.id,
					text
				);

				setMessages((prev) => [...prev, { ...optimisticMsg, pending: false }]);
				// const r: any = await chat.messages(
				// 	activeConv.businessAccount.id,
				// 	activeConv.clientAccount.id,
				// 	50
				// );
				// setMessages(r.messages);
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
			setConversations((prev) =>
				prev.map((conv) =>
					conv.id === conversationId ? { ...conv, tags: newTags } : conv
				)
			);

			if (activeConv && activeConv.id === conversationId) {
				setActiveConv((prev: any) => ({ ...prev, tags: newTags }));
			}
		},
		[activeConv]
	);

	return {
		/* state */
		accounts,
		conversations,
		filteredConversations,
		messages,
		activeAccount,
		activeConv,
		selectedTags,
		allTags,

		/* setters / helpers */
		setFilteredConversations,
		setActiveAccount,
		setActiveConv,
		setSelectedTags,
		updateConversationTags,
		send,
	};
}
