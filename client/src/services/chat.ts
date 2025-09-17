// src/services/chat.js
import axiosInstance from "./axiosInstance"; // your existing wrapper

export const chat = {
	/* IG OAuth */
	login: () => axiosInstance.get("/chats/login"),

	getAllConversations: (page = 1, limit = 20) =>
		axiosInstance.get(`/chats/all-conversations?page=${page}&limit=${limit}`),

	/* List IG accounts that belong to the logged-in user */
	accounts: () => axiosInstance.get("/chats/accounts"),

	/* List last 25 conversations for one IG account */
	conversations: (igAccountId: any) =>
		axiosInstance.get("/chats/conversations", {
			params: { account: igAccountId },
		}),

	/* Pull last N messages for a thread */
	messages: (sender_id: any, recipient_id: any, limit = 50) =>
		axiosInstance.get("/chats/messages", {
			params: { sender_id, recipient_id, limit },
		}),

	/* Send a DM reply */
	send: (sender_id: any, recipient_id: any, message: any) =>
		axiosInstance.post("/chats/send", { sender_id, recipient_id, message }),

	/* Mark a thread as read */
	setInterested: (sender_id: any, recipient_id: any, state: any) =>
		axiosInstance.post("/chats/set-interested", {
			sender_id,
			recipient_id,
			state,
		}),

	/* Get all tags for the user */
	getTags: () => axiosInstance.get("/chats/tags"),

	/* Update tags for a conversation */
	updateTags: (sender_id: any, recipient_id: any, tags: any) =>
		axiosInstance.post("/chats/tags", { sender_id, recipient_id, tags }),
};
