/**
 * Shared Types for Colab App
 *
 * These types represent the data structures returned by server actions (PostgreSQL).
 * They help ensure type safety across the application.
 */

export interface ColabDocument {
	id: string;
	title?: string;
	content?: any;
	userId?: string;
	workspaceId?: string;
	dealId?: string | null;
	isArchived?: boolean | null;
	createdAt?: Date | null;
	updatedAt?: Date | null;
	ownerId?: string;
	parentId?: string | null;
	icon?: string | null;
	coverImageUrl?: string | null;
	isTemplate?: boolean | null;
}

/**
 * Deal stages matching unified PostgreSQL schema
 */
export type DealStage =
	| "sourcing"
	| "qualification"
	| "initial_meeting"
	| "analysis"
	| "valuation"
	| "due_diligence"
	| "negotiation"
	| "closing"
	| "closed_won"
	| "closed_lost"
	// Legacy stages for backward compatibility
	| "Lead"
	| "NDA Signed"
	| "Offer Received"
	| "Due Diligence"
	| "Closing"
	| "completed";

export interface ColabDeal {
	id: string;
	title: string;
	description?: string | null;
	stage: DealStage;
	amount?: string | null;
	currency?: string | null;
	probability?: number | null;
	ownerId?: string | null;
	leadName?: string;
	companyId?: string | null;
	priority?: "low" | "medium" | "high" | "critical" | null;
	tags?: string[] | null;
	expectedCloseDate?: Date | null;
	isArchived?: boolean | null;
	createdAt?: Date | null;
	updatedAt?: Date | null;
	notes?: string;
	nodePosition?: { x: number; y: number };
	source?: string | null;
}

export interface ColabBoard {
	id: string;
	name: string;
	visibility: "private" | "workspace" | "public";
	backgroundUrl?: string;
	workspaceId?: string;
	createdBy: string;
	createdAt: number;
}

export interface ColabPresentation {
	id: string;
	title: string;
	outline?: string;
	slides?: string;
	status: "draft" | "generating" | "complete" | "error";
	userId: string;
	workspaceId?: string;
	createdAt: number;
	updatedAt: number;
}

export interface ColabList {
	id: string;
	name: string;
	boardId: string;
	index: number;
	createdAt: number;
}

export interface ColabCard {
	id: string;
	title: string;
	description?: string;
	listId: string;
	index: number;
	dueDate?: number;
	startDate?: number;
	endDate?: number;
	labelIds?: string[];
	dependsOn?: string[];
	createdBy: string;
	createdAt: number;
	updatedAt: number;
}

export interface ColabLabel {
	id: string;
	name: string;
	colorCode: string;
	boardId: string;
}
