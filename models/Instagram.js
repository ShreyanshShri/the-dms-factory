const mongoose = require("mongoose");

// Timestamp schema to mimic Firestore Timestamp structure
const FirestoreTimestampSchema = new mongoose.Schema(
	{
		_seconds: { type: Number, required: true },
		_nanoseconds: { type: Number, required: true },
	},
	{ _id: false }
);

// Instagram Account Schema
const InstagramAccountSchema = new mongoose.Schema(
	{
		_id: String, // Instagram user ID as document ID
		user: { type: String, required: true }, // App user UID owning this IG account
		username: { type: String },
		access_token: { type: String },
		token_created: { type: Date },
		account_type: { type: String },
		user_id: { type: String, required: true },
	},
	{ timestamps: true }
);

// Instagram Message Subdocument Schema (embedded in Conversation)
const MessageSchema = new mongoose.Schema(
	{
		sender_id: { type: String },
		recipient_id: { type: String },
		text: { type: String },
		timestamp: { type: Date },
	},
	{ _id: true }
);

// Instagram Conversation Schema
const InstagramConversationSchema = new mongoose.Schema({
	_id: String, // Conversation ID: sorted concatenation of participants (e.g. "123_456")
	businessAccount: {
		id: { type: String },
		username: { type: String },
	},
	clientAccount: {
		id: { type: String },
		username: { type: String },
	},
	webhook_owner_id: { type: String }, // IG account ID owning webhook subscription
	last_message: { type: String },
	last_time: { type: Date },
	unread_count: { type: Number, default: 0 },
	responded: { type: Boolean, default: false },
	interested: { type: Boolean, default: false },
	tags: { type: [String], default: [] },
	campaignId: { type: String },
	context: { type: String },
	messages: [MessageSchema], // embedded message documents
	createdAt: { type: Date, default: Date.now },
	updatedAt: { type: Date, default: Date.now },
});

// Export models
module.exports = {
	InstagramAccount: mongoose.model(
		"InstagramAccount",
		InstagramAccountSchema,
		"instagram_accounts"
	),
	InstagramConversation: mongoose.model(
		"InstagramConversation",
		InstagramConversationSchema,
		"instagram_conversations"
	),
};
