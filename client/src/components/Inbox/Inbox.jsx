import { useState, useEffect } from "react";
import "../../styles/inbox.css";

const contacts = [
	{ id: 1, username: "john_doe", ig_scoped_id: "111111111111" },
	{ id: 2, username: "jane_smith", ig_scoped_id: "222222222222" },
];

export default function ChatApp() {
	const [active, setActive] = useState(null);
	const [msgs, setMsgs] = useState({});
	const [text, setText] = useState("");
	const [sending, setSending] = useState(false);

	const selectContact = (c) => setActive(c);

	const fetchConversations = async () => {
		if (!active) return;
		try {
			const res = await fetch(`/api/v1/chats/conversations`);
			const data = await res.json();
			// Map data to msgs[active.id] if needed
			console.log("Conversations:", data);
		} catch (err) {
			console.error(err);
		}
	};

	const send = async () => {
		if (!text.trim() || !active || sending) return;
		setSending(true);

		const pending = {
			from: "me",
			text,
			time: new Date().toLocaleTimeString(),
			pending: true,
		};
		setMsgs((m) => ({ ...m, [active.id]: [...(m[active.id] || []), pending] }));
		setText("");

		try {
			await fetch("/api/v1/chats/messages", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					recipient_id: active.ig_scoped_id,
					message: text.trim(),
				}),
			});
			setMsgs((m) => ({
				...m,
				[active.id]: m[active.id].map((v) =>
					v.pending ? { ...v, pending: false } : v
				),
			}));
		} catch {
			setMsgs((m) => ({
				...m,
				[active.id]: m[active.id].map((v) =>
					v.pending ? { ...v, failed: true } : v
				),
			}));
		} finally {
			setSending(false);
		}
	};

	useEffect(() => {
		fetchConversations();
	}, [active]);

	return (
		<div className="chat-app">
			<aside className="sidebar">
				{contacts.map((c) => (
					<div
						key={c.id}
						className={`contact ${active?.id === c.id ? "active" : ""}`}
						onClick={() => selectContact(c)}
					>
						<div className="avatar">{c.username[0].toUpperCase()}</div>
						<span className="name">@{c.username}</span>
					</div>
				))}
			</aside>

			<main className="chat-pane">
				{active ? (
					<>
						<header className="chat-header">@{active.username}</header>
						<section className="messages">
							{(msgs[active.id] || []).map((m, i) => (
								<div
									key={i}
									className={`bubble ${m.from} ${m.pending ? "pending" : ""} ${
										m.failed ? "failed" : ""
									}`}
								>
									{m.text}
									<span className="meta">
										{m.pending ? "sending..." : m.failed ? "failed" : m.time}
									</span>
								</div>
							))}
						</section>
						<footer className="input-bar">
							<input
								value={text}
								onChange={(e) => setText(e.target.value)}
								placeholder={`Message @${active.username}`}
								onKeyDown={(e) => e.key === "Enter" && send()}
							/>
							<button onClick={send} disabled={sending || !text.trim()}>
								➤
							</button>
						</footer>
					</>
				) : (
					<div className="placeholder">Select a contact to start chatting</div>
				)}
			</main>
		</div>
	);
}
