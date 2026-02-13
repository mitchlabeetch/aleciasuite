/**
 * Shared Type Definitions for Alecia Admin Panel
 *
 * This file contains common types used across the admin interface.
 */

// ============================================================================
// LOCALE & I18N
// ============================================================================

export type Locale = "fr" | "en";

// ============================================================================
// NAVIGATION
// ============================================================================

export interface NavItem {
	label: string;
	href: string;
	icon?: React.ComponentType<{ className?: string }>;
	exact?: boolean;
	badge?: string;
}

export interface NavDivider {
	type: "divider";
	label: string;
}

export type SidebarItem = NavItem | NavDivider;

// ============================================================================
// DASHBOARD
// ============================================================================

export interface DashboardStats {
	activeDeals: number;
	pipelineValue: number;
	teamSize: number;
	companiesCount: number;
	recentDeals: RecentDeal[];
	dealsByStage: Record<string, number>;
}

export interface RecentDeal {
	id: string;
	title: string;
	stage: string;
	amount?: number;
}

// ============================================================================
// DEALS / PIPELINE
// ============================================================================

export type DealType = "Cession" | "Acquisition" | "Levée";

export type DealStage =
	| "Lead"
	| "New"
	| "NDA Signed"
	| "Offer Received"
	| "LOI"
	| "Due Diligence"
	| "Closing"
	| "Closed Won"
	| "Closed Lost";

export interface Deal {
	_id: string;
	_creationTime: number;
	title: string;
	stage: DealStage;
	amount?: number;
	companyId?: string;
	companyName?: string;
	ownerId?: string;
	ownerName?: string;
	ownerAvatar?: string;
	pipedriveId?: number;
}

export interface PipelineColumn {
	id: string;
	name: string;
	color: string;
	order: number;
}

// ============================================================================
// CRM - COMPANIES
// ============================================================================

export interface Company {
	_id: string;
	_creationTime: number;
	name: string;
	siren?: string;
	nafCode?: string;
	vatNumber?: string;
	address?: Address;
	financials?: CompanyFinancials;
	pappersId?: string;
	logoUrl?: string;
	website?: string;
}

export interface Address {
	street?: string;
	city?: string;
	postalCode?: string;
	country?: string;
}

export interface CompanyFinancials {
	revenue?: number;
	ebitda?: number;
	netIncome?: number;
	fiscalYear?: number;
	employees?: number;
}

// ============================================================================
// CRM - CONTACTS
// ============================================================================

export interface Contact {
	_id: string;
	_creationTime: number;
	fullName: string;
	firstName?: string;
	lastName?: string;
	email?: string;
	phone?: string;
	role?: string;
	companyId?: string;
	companyName?: string;
	avatarUrl?: string;
	linkedinUrl?: string;
	notes?: string;
}

// ============================================================================
// USERS / TEAM
// ============================================================================

export type UserRole = "sudo" | "partner" | "advisor";

export interface User {
	_id: string;
	_creationTime: number;
	tokenIdentifier: string;
	name: string;
	email: string;
	role: UserRole;
	avatarUrl?: string;
}

// ============================================================================
// DOCUMENTS
// ============================================================================

export interface Document {
	_id: string;
	_creationTime: number;
	name: string;
	type: "file" | "folder";
	mimeType?: string;
	size?: number;
	parentId?: string;
	dealId?: string;
	companyId?: string;
	storageId?: string;
	url?: string;
}

// ============================================================================
// ACTIVITY / EVENTS
// ============================================================================

export interface Activity {
	id: string;
	type:
		| "deal_update"
		| "contact_added"
		| "document_signed"
		| "task_completed"
		| "note_added";
	title: string;
	description?: string;
	timestamp: number;
	userId?: string;
	entityId?: string;
	entityType?: "deal" | "company" | "contact" | "document";
}

export interface Event {
	id: string;
	title: string;
	date: string;
	time?: string;
	location?: string;
	dealId?: string;
	attendees?: string[];
}

// ============================================================================
// UI COMPONENTS
// ============================================================================

export interface StatCardProps {
	title: string;
	value: string | number;
	icon: React.ComponentType<{ className?: string }>;
	subtitle?: string;
	trend?: string;
	trendPositive?: boolean;
	href?: string;
	color?: "blue" | "purple" | "green" | "amber" | "red";
}

export interface SkeletonProps {
	className?: string;
}

// ============================================================================
// API RESPONSES
// ============================================================================

export interface ApiError {
	code: string;
	message: string;
	details?: Record<string, unknown>;
}

export interface PaginatedResponse<T> {
	items: T[];
	total: number;
	page: number;
	pageSize: number;
	hasMore: boolean;
}
