import { useState, useRef, useEffect } from "react";
import InstagramLoginButton from "./InstagramLoginButton";
import usePollingInbox from "../../hooks/usePollingInbox";
import "../../styles/inbox.css";

export default function ChatApp() {
	const { accounts, conversations, messages, activeConv, setActiveConv, send } =
		usePollingInbox(); // ← defaults to 60 000 ms

	const [draft, setDraft] = useState("");
	const messagesEndRef = useRef(null);

	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [messages]);

	const sendMsg = () => {
		send(draft);
		setDraft("");
	};

	return (
		<div className="chat-app">
			<aside className="sidebar">
				<h2 className="title">Unified Inbox</h2>
				<div className="sidebar-section">
					<h3>Accounts</h3>
					<InstagramLoginButton />
					<br />
					<br />
					{accounts?.map((a) => (
						<div key={a.user_id} className="thread">
							<div className="avatar">{a.username?.[0]?.toUpperCase()}</div>
							<div className="name">{a.username}</div>
						</div>
					))}
				</div>

				<div className="sidebar-section">
					<h3>Inbox</h3>
					{conversations.map((c) => (
						<div
							key={c.id}
							className={`thread ${
								activeConv?.thread_id === c.thread_id ? "active" : ""
							} ${!c.responded && "unresponded"}`}
							onClick={() => setActiveConv(c)}
						>
							<div className="avatar">
								{c.clientAccount?.username?.[0].toUpperCase()}
							</div>
							<div className="name">{c?.clientAccount?.username}</div>
							{/* <div className="thread-last">{c.last_message}</div> */}
						</div>
					))}
				</div>
			</aside>

			<main className="chat-pane">
				{activeConv ? (
					<>
						<header className="chat-header">
							@{activeConv.clientAccount.username}
							<span className="text-muted">
								from @{activeConv.businessAccount.username}
							</span>
						</header>
						<section className="messages">
							{messages?.map((m, i) => (
								<div
									key={i}
									className={`bubble ${
										m.sender_id === activeConv.clientAccount.id ? "other" : "me"
									} ${m.pending ? "pending" : ""} ${m.failed ? "failed" : ""}`}
								>
									{m.text}
								</div>
							))}
							<div ref={messagesEndRef} />
						</section>
						<footer className="input-bar">
							<input
								value={draft}
								onChange={(e) => setDraft(e.target.value)}
								placeholder={`Message @${activeConv.clientAccount.username}…`}
								onKeyDown={(e) => e.key === "Enter" && sendMsg()}
							/>
							<button onClick={sendMsg} disabled={draft === ""}>
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
