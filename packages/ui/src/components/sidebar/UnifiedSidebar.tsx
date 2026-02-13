"use client";

import * as React from "react";
import * as CollapsiblePrimitive from "@radix-ui/react-collapsible";
import {
	ChevronRight,
	ChevronDown,
	PanelLeft,
	ExternalLink,
} from "lucide-react";
import { cn } from "../../utils";
import { useSidebar } from "../../hooks/use-sidebar";
import type {
	SidebarCategory,
	SidebarItem,
	SidebarConfig,
	SidebarData,
	AppContext,
} from "./types";

// ============================================
// CONTEXT DETECTION
// ============================================

/**
 * Detect app context based on hostname
 * - colab.alecia.markets or localhost:3001 → "colab"
 * - Everything else → "panel"
 */
function detectAppContext(): AppContext {
	if (typeof window === "undefined") return "panel";
	const hostname = window.location.hostname;
	const port = window.location.port;

	// Colab subdomain
	if (hostname.includes("colab.alecia.markets")) {
		return "colab";
	}
	// Local development: port 3001 = colab
	if (hostname === "localhost" && port === "3001") {
		return "colab";
	}

	return "panel";
}

// ============================================
// SIDEBAR ROOT
// ============================================

interface UnifiedSidebarProps {
	config: SidebarConfig;
	data?: SidebarData;
	locale?: "fr" | "en";
	userRole?: "sudo" | "partner" | "advisor" | "user";
	currentPath?: string;
	onNavigate?: (href: string) => void;
	className?: string;
	/** Override automatic context detection */
	appContext?: AppContext;
}

/**
 * Unified Sidebar Component
 *
 * A flexible, collapsible sidebar with:
 * - Category-based organization
 * - Nested tree items
 * - Dynamic badge counts
 * - Role-based visibility
 * - Context-based visibility (Colab vs Panel)
 * - Embedded mode detection
 * - French/English labels
 */
export function UnifiedSidebar({
	config,
	data = {},
	locale = "fr",
	userRole = "user",
	currentPath = "",
	onNavigate,
	className,
	appContext: appContextOverride,
}: UnifiedSidebarProps) {
	const { isEmbedded, isCollapsed, setIsCollapsed } = useSidebar();

	// Detect or use provided app context
	const [detectedContext, setDetectedContext] =
		React.useState<AppContext>("panel");
	React.useEffect(() => {
		setDetectedContext(detectAppContext());
	}, []);
	const appContext = appContextOverride ?? detectedContext;

	// Hide sidebar in embedded mode
	if (isEmbedded) {
		return null;
	}

	const getLabel = (item: { label: string; labelFr?: string }) => {
		return locale === "fr" && item.labelFr ? item.labelFr : item.label;
	};

	const filterByRole = <T extends { roles?: string[] }>(items: T[]): T[] => {
		return items.filter((item) => !item.roles || item.roles.includes(userRole));
	};

	const filterByContext = (
		categories: SidebarCategory[],
	): SidebarCategory[] => {
		return categories.filter((category) => {
			// No context filter = show everywhere
			if (!category.context) return true;
			// Array of contexts
			if (Array.isArray(category.context)) {
				return category.context.includes(appContext);
			}
			// Single context
			return category.context === appContext;
		});
	};

	// Get brand name based on context
	const brandName =
		appContext === "colab" ? "Colab" : config.brand?.name || "Alecia";

	return (
		<aside
			className={cn(
				"flex flex-col h-screen bg-background border-r border-border transition-all duration-300 relative",
				isCollapsed ? "w-16" : "w-64",
				className,
			)}
		>
			{/* Brand Header */}
			{config.brand && (
				<div className="flex items-center h-14 px-4 border-b border-border shrink-0">
					{!isCollapsed && (
						<a
							href={config.brand.href || "/"}
							className="flex items-center gap-2"
						>
							{config.brand.logo ? (
								<img src={config.brand.logo} alt={brandName} className="h-8" />
							) : (
								<span className="text-xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
									{brandName}
								</span>
							)}
							{appContext === "panel" && (
								<span className="text-xs text-muted-foreground ml-1">
									admin
								</span>
							)}
						</a>
					)}
					<button
						onClick={() => setIsCollapsed(!isCollapsed)}
						className={cn(
							"p-2 rounded-lg hover:bg-muted transition-colors",
							isCollapsed ? "mx-auto" : "ml-auto",
						)}
						title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
					>
						<PanelLeft className={cn("h-4 w-4", isCollapsed && "rotate-180")} />
					</button>
				</div>
			)}

			{/* Categories */}
			<nav className="flex-1 overflow-y-auto py-4 px-2 space-y-2">
				{filterByContext(filterByRole(config.categories)).map((category) => (
					<SidebarCategoryComponent
						key={category.id}
						category={category}
						data={data}
						locale={locale}
						userRole={userRole}
						currentPath={currentPath}
						onNavigate={onNavigate}
						isCollapsed={isCollapsed}
						getLabel={getLabel}
						filterByRole={filterByRole}
					/>
				))}
			</nav>

			{/* Footer */}
			{config.footer && !isCollapsed && (
				<div className="border-t border-border p-2 space-y-1 shrink-0">
					{filterByRole(config.footer).map((item) => (
						<SidebarItemComponent
							key={item.id}
							item={item}
							data={data}
							currentPath={currentPath}
							onNavigate={onNavigate}
							getLabel={getLabel}
							isNested={false}
						/>
					))}
				</div>
			)}
		</aside>
	);
}

// ============================================
// SIDEBAR CATEGORY
// ============================================

interface SidebarCategoryComponentProps {
	category: SidebarCategory;
	data: SidebarData;
	locale: "fr" | "en";
	userRole: string;
	currentPath: string;
	onNavigate?: (href: string) => void;
	isCollapsed: boolean;
	getLabel: (item: { label: string; labelFr?: string }) => string;
	filterByRole: <T extends { roles?: string[] }>(items: T[]) => T[];
}

function SidebarCategoryComponent({
	category,
	data,
	currentPath,
	onNavigate,
	isCollapsed,
	getLabel,
	filterByRole,
}: SidebarCategoryComponentProps) {
	const { isCategoryOpen, toggleCategory } = useSidebar();
	const isOpen = isCategoryOpen(category.id);
	const Icon = category.icon;

	if (isCollapsed) {
		// In collapsed mode, just show icon tooltip
		return (
			<div className="py-2">
				{filterByRole(category.items)
					.slice(0, 1)
					.map((item) => (
						<SidebarItemComponent
							key={item.id}
							item={{ ...item, icon: Icon ?? item.icon }}
							data={data}
							currentPath={currentPath}
							onNavigate={onNavigate}
							getLabel={getLabel}
							isNested={false}
							isCollapsed={true}
						/>
					))}
			</div>
		);
	}

	return (
		<CollapsiblePrimitive.Root
			open={isOpen}
			onOpenChange={() => toggleCategory(category.id)}
		>
			<CollapsiblePrimitive.Trigger className="flex items-center w-full px-2 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition-colors group">
				{Icon && <Icon className="h-4 w-4 mr-2" />}
				<span className="flex-1 text-left">{getLabel(category)}</span>
				{isOpen ? (
					<ChevronDown className="h-4 w-4 transition-transform" />
				) : (
					<ChevronRight className="h-4 w-4 transition-transform" />
				)}
			</CollapsiblePrimitive.Trigger>
			<CollapsiblePrimitive.Content className="pl-4 mt-1 space-y-1 animate-in slide-in-from-top-2 duration-200">
				{filterByRole(category.items).map((item) => (
					<SidebarItemComponent
						key={item.id}
						item={item}
						data={data}
						currentPath={currentPath}
						onNavigate={onNavigate}
						getLabel={getLabel}
						isNested={false}
					/>
				))}
			</CollapsiblePrimitive.Content>
		</CollapsiblePrimitive.Root>
	);
}

// ============================================
// SIDEBAR ITEM
// ============================================

interface SidebarItemComponentProps {
	item: SidebarItem;
	data: SidebarData;
	currentPath: string;
	onNavigate?: (href: string) => void;
	getLabel: (item: { label: string; labelFr?: string }) => string;
	isNested: boolean;
	isCollapsed?: boolean;
	depth?: number;
}

function SidebarItemComponent({
	item,
	data,
	currentPath,
	onNavigate,
	getLabel,
	isNested,
	isCollapsed = false,
	depth = 0,
}: SidebarItemComponentProps) {
	const [isOpen, setIsOpen] = React.useState(false);
	const hasChildren = item.children && item.children.length > 0;
	const isActive = item.href
		? currentPath === item.href || currentPath.startsWith(`${item.href}/`)
		: false;
	const Icon = item.icon;

	// Get badge from dynamic data
	const badge = item.dataKey ? data[item.dataKey] : item.badge;

	const handleClick = (e: React.MouseEvent) => {
		if (hasChildren) {
			e.preventDefault();
			setIsOpen(!isOpen);
		} else if (item.href && onNavigate) {
			e.preventDefault();
			onNavigate(item.href);
		}
	};

	const content = (
		<>
			{Icon && (
				<Icon className={cn("h-4 w-4 shrink-0", !isCollapsed && "mr-2")} />
			)}
			{!isCollapsed && (
				<>
					<span className="flex-1 truncate">{getLabel(item)}</span>
					{badge !== undefined && (
						<span
							className={cn(
								"ml-auto text-xs px-1.5 py-0.5 rounded-full font-medium",
								item.badgeVariant === "success" &&
									"bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
								item.badgeVariant === "warning" &&
									"bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
								item.badgeVariant === "destructive" &&
									"bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
								!item.badgeVariant && "bg-muted text-muted-foreground",
							)}
						>
							{badge}
						</span>
					)}
					{item.external && (
						<ExternalLink className="h-3 w-3 ml-1 opacity-50" />
					)}
					{hasChildren &&
						(isOpen ? (
							<ChevronDown className="h-4 w-4 ml-1 opacity-50" />
						) : (
							<ChevronRight className="h-4 w-4 ml-1 opacity-50" />
						))}
				</>
			)}
		</>
	);

	const className = cn(
		"flex items-center w-full px-2 py-1.5 text-sm rounded-lg transition-colors",
		isActive
			? "bg-primary/10 text-primary font-medium"
			: "text-muted-foreground hover:text-foreground hover:bg-muted/50",
		item.disabled && "opacity-50 cursor-not-allowed",
		isCollapsed && "justify-center px-0",
	);

	if (hasChildren && !isCollapsed) {
		return (
			<div>
				<button
					onClick={handleClick}
					disabled={item.disabled}
					className={className}
				>
					{content}
				</button>
				{isOpen && (
					<div className="pl-4 mt-1 space-y-1 border-l border-border ml-3">
						{item.children!.map((child) => (
							<SidebarItemComponent
								key={child.id}
								item={child}
								data={data}
								currentPath={currentPath}
								onNavigate={onNavigate}
								getLabel={getLabel}
								isNested={true}
								depth={depth + 1}
							/>
						))}
					</div>
				)}
			</div>
		);
	}

	if (item.href) {
		return (
			<a
				href={item.href}
				onClick={handleClick}
				target={item.external ? "_blank" : undefined}
				rel={item.external ? "noopener noreferrer" : undefined}
				className={className}
				title={isCollapsed ? getLabel(item) : undefined}
			>
				{content}
			</a>
		);
	}

	return (
		<button
			onClick={handleClick}
			disabled={item.disabled}
			className={className}
		>
			{content}
		</button>
	);
}

// ============================================
// RE-EXPORTS
// ============================================

export {
	SidebarProvider,
	useSidebar,
	useSidebarVisibility,
} from "../../hooks/use-sidebar";
export type {
	SidebarCategory,
	SidebarItem,
	SidebarConfig,
	SidebarData,
	AppContext,
} from "./types";
export { defaultSidebarConfig } from "./config";
export { detectAppContext };
