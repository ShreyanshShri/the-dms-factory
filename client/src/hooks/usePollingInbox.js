import { useState, useEffect, useCallback } from "react";
import { chat } from "../services/chat"; // the wrapper that calls your /chats/* routes

/**
 * Polls the backend every `interval` ms.
 * Returns state + helpers for Accounts ▸ Conversations ▸ Messages.
 */
export default function usePollingInbox(interval = 60_000) {
	/* ─── state ─── */
	const [accounts, setAccounts] = useState([]);
	const [activeAccount, setActiveAccount] = useState(null);

	const [conversations, setConversations] = useState([]);
	const [activeConv, setActiveConv] = useState(null);

	const [messages, setMessages] = useState([]);

	/* ─── load IG accounts once ─── */
	useEffect(() => {
		chat
			.getAllConversations()
			.then((r) => {
				console.log("all conversations: ", r);
				setAccounts(r.accounts);
				setConversations(r.conversations);
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
				.then((r) => {
					console.log("messages: ", r);
					setMessages(r.messages);
				})
				.catch(console.error);

		load();
		const id = setInterval(load, interval);
		return () => clearInterval(id);
	}, [activeConv, interval]);

	/* ─── send a reply then refresh the thread immediately ─── */
	const send = useCallback(
		async (text) => {
			if (!activeConv || !text.trim()) return;

			// 1️⃣ Create a local optimistic message
			const optimisticMsg = {
				recipient_id: activeConv.clientAccount.id,
				sender_id: activeConv.businessAccount.id,
				text,
				timestamp: { _seconds: Date.now() / 1000, _nanoseconds: 0 },
				pending: true,
			};

			setMessages((prev) => [...prev, optimisticMsg]);

			try {
				// 2️⃣ Send to server
				await chat.send(
					activeConv.businessAccount.id,
					activeConv.clientAccount.id,
					text
				);

				// 3️⃣ Fetch updated messages (or just replace pending one with confirmed one)
				const r = await chat.messages(
					activeConv.businessAccount.id,
					activeConv.clientAccount.id,
					50
				);
				setMessages(r.messages);
			} catch (err) {
				// 4️⃣ Mark as failed if request fails
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

	return {
		/* state */
		accounts,
		conversations,
		messages,
		activeAccount,
		activeConv,

		/* setters / helpers */
		setActiveAccount,
		setActiveConv,
		send,
	};
}
