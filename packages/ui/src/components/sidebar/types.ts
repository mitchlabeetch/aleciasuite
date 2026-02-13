import type { LucideIcon } from "lucide-react";

/**
 * App context for sidebar display
 * - "colab": Shown on colab.alecia.markets
 * - "panel": Shown on main alecia.markets admin
 * - undefined: Shown in all contexts
 */
export type AppContext = "colab" | "panel";

/**
 * Sidebar navigation item
 */
export interface SidebarItem {
	id: string;
	label: string;
	labelFr?: string; // French label for i18n
	href?: string;
	icon?: LucideIcon;
	badge?: string | number;
	badgeVariant?: "default" | "success" | "warning" | "destructive";
	disabled?: boolean;
	external?: boolean;
	children?: SidebarItem[];
	/** Dynamic data key for fetching count from Convex */
	dataKey?: string;
	/** Show only for certain roles */
	roles?: ("sudo" | "partner" | "advisor" | "user")[];
	/** Custom render function */
	render?: () => React.ReactNode;
}

/**
 * Sidebar category (collapsible group)
 */
export interface SidebarCategory {
	id: string;
	label: string;
	labelFr?: string;
	icon?: LucideIcon;
	items: SidebarItem[];
	defaultOpen?: boolean;
	/** Show only for certain roles */
	roles?: ("sudo" | "partner" | "advisor" | "user")[];
	/** Show only in specific app context */
	context?: AppContext | AppContext[];
}

/**
 * Complete sidebar configuration
 */
export interface SidebarConfig {
	categories: SidebarCategory[];
	footer?: SidebarItem[];
	/** Brand/logo section */
	brand?: {
		name: string;
		logo?: string;
		href?: string;
	};
}

/**
 * Dynamic data for sidebar items (counts, etc.)
 */
export interface SidebarData {
	[key: string]: number | string | undefined;
}
