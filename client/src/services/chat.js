// src/services/chat.js
import axiosInstance from "./axiosInstance"; // your existing wrapper

export const chat = {
	/* IG OAuth */
	login: () => axiosInstance.get("/chats/login"),

	getAllConversations: () => axiosInstance.get("/chats/all-conversations"),

	/* List IG accounts that belong to the logged-in user */
	accounts: () => axiosInstance.get("/chats/accounts"),

	/* List last 25 conversations for one IG account */
	conversations: (igAccountId) =>
		axiosInstance.get("/chats/conversations", {
			params: { account: igAccountId },
		}),

	/* Pull last N messages for a thread */
	messages: (sender_id, recipient_id, limit = 50) =>
		axiosInstance.get("/chats/messages", {
			params: { sender_id, recipient_id, limit },
		}),

	/* Send a DM reply */
	send: (sender_id, recipient_id, message) =>
		axiosInstance.post("/chats/send", { sender_id, recipient_id, message }),
};
