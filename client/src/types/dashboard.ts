// types/dashboard.ts
export interface DashboardStats {
	totalCampaigns: number;
	activeCampaigns: number;
	pausedCampaigns: number;
	totalAccounts: number;
	activeAccounts: number;
	pausedAccounts: number;
	dmsSentToday: number;
	repliesToday: number;
	replyRate: string;
}

export interface PerformanceDataset {
	label: string;
	data: number[];
	borderColor: string;
	backgroundColor: string;
	fill: boolean;
}

export interface PerformanceData {
	labels: string[];
	datasets: PerformanceDataset[];
}

export interface CampaignRanking {
	id: string;
	name: string;
	platform: "instagram" | "twitter";
	dms: number;
	replies: number;
}

export interface RecentActivity {
	action: string;
	time: string;
	platform: "instagram" | "twitter";
}

export interface ApiResponse<T> {
	success: boolean;
	data: T;
	message?: string;
}

export interface MetricCardProps {
	title: string;
	value: string;
	icon: React.ComponentType<any>;
	color: "primary" | "success" | "warning" | "danger";
	subtitle: string;
}

export interface Campaign {
	id: string;
	userId: string;
	name: string;
	tag: string;
	description: string;
	platform: "instagram" | "twitter";
	status: "ready" | "active" | "paused";
	totalLeads: number;
	createdAt: number;
	updatedAt: number;
}

export interface AnalyticsEntry {
	campaignID: string;
	accountID: string;
	leadID: string;
	username: string;
	message: string;
	status: "initialdmsent" | "followup" | "replyreceived" | "unknown";
	platform: "instagram" | "twitter";
	createdAt: number;
}

export interface Account {
	id: string;
	widgetId: string;
	userId: string;
	displayName: string;
	platform: "instagram" | "twitter";
	currentCampaignId?: string;
	status: "ready" | "active" | "paused";
	createdAt: number;
	lastUpdated?: number;
	pendingLeadsCount: number;
}

// Add these interfaces to your existing types/dashboard.ts file

export interface CampaignData {
	id: string;
	userId: string;
	name: string;
	tag: string;
	description: string;
	platform: "instagram" | "twitter";
	status: "ready" | "active" | "paused" | "completed";
	totalLeads: number;
	allLeads: string;
	variants: MessageVariant[];
	context: string;
	workingHours: WorkingHours;
	messageLimits: MessageLimits;
	followUser: boolean;
	autoLikeStory: boolean;
	autoLikeNewestPost: boolean;
	withinWorkingHours: boolean;
	createdAt: number;
	updatedAt: number;
	stats?: CampaignStats;
}

export interface MessageVariant {
	message: string;
}

export interface WorkingHours {
	start: number;
	end: number;
}

export interface MessageLimits {
	min: number;
	max: number;
}

export interface CampaignStats {
	totalLeads: number;
	sentLeads: number;
	pendingLeads: number;
	totalAnalytics: number;
	dmsSent?: number;
	replies?: number;
	engagement?: number;
	accounts?: number;
}

export interface CampaignMetrics {
	totalCampaigns: number;
	activeCampaigns: number;
	pausedCampaigns: number;
	completedCampaigns: number;
}

export interface CampaignAnalytics {
	campaignId: string;
	dmsSent: number;
	replies: number;
	engagement: number;
	accounts: number;
}
