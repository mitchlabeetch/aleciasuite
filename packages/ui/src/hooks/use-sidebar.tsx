"use client";

import {
	createContext,
	useContext,
	useState,
	useEffect,
	type ReactNode,
} from "react";

interface SidebarContextType {
	isOpen: boolean;
	isCollapsed: boolean;
	isEmbedded: boolean;
	setIsOpen: (open: boolean) => void;
	setIsCollapsed: (collapsed: boolean) => void;
	toggle: () => void;
	openCategories: Set<string>;
	toggleCategory: (categoryId: string) => void;
	isCategoryOpen: (categoryId: string) => boolean;
}

const SidebarContext = createContext<SidebarContextType | null>(null);

interface SidebarProviderProps {
	children: ReactNode;
	defaultOpen?: boolean;
	defaultCollapsed?: boolean;
	defaultOpenCategories?: string[];
}

/**
 * Sidebar Provider
 *
 * Manages sidebar state including:
 * - Open/closed state (mobile)
 * - Collapsed/expanded state (desktop)
 * - Embedded mode detection
 * - Category expansion states
 */
export function SidebarProvider({
	children,
	defaultOpen = true,
	defaultCollapsed = false,
	defaultOpenCategories = ["site", "colab"],
}: SidebarProviderProps) {
	const [isOpen, setIsOpen] = useState(defaultOpen);
	const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
	const [isEmbedded, setIsEmbedded] = useState(false);
	const [openCategories, setOpenCategories] = useState<Set<string>>(
		new Set(defaultOpenCategories),
	);

	// Detect embedded mode on mount
	useEffect(() => {
		if (typeof window === "undefined") return;

		const checkEmbedded = () => {
			const params = new URLSearchParams(window.location.search);
			const embedParam =
				params.get("embed") === "true" || params.get("embedded") === "true";

			let inIframe = false;
			try {
				inIframe = window.self !== window.top;
			} catch {
				inIframe = true;
			}

			setIsEmbedded(embedParam || inIframe);
		};

		checkEmbedded();

		// Re-check on navigation
		window.addEventListener("popstate", checkEmbedded);
		return () => window.removeEventListener("popstate", checkEmbedded);
	}, []);

	// Persist collapsed state to localStorage
	useEffect(() => {
		if (typeof window === "undefined") return;
		const stored = localStorage.getItem("sidebar-collapsed");
		if (stored !== null) {
			setIsCollapsed(stored === "true");
		}
	}, []);

	useEffect(() => {
		if (typeof window !== "undefined") {
			localStorage.setItem("sidebar-collapsed", String(isCollapsed));
		}
	}, [isCollapsed]);

	const toggle = () => setIsOpen(!isOpen);

	const toggleCategory = (categoryId: string) => {
		setOpenCategories((prev) => {
			const next = new Set(prev);
			if (next.has(categoryId)) {
				next.delete(categoryId);
			} else {
				next.add(categoryId);
			}
			return next;
		});
	};

	const isCategoryOpen = (categoryId: string) => openCategories.has(categoryId);

	return (
		<SidebarContext.Provider
			value={{
				isOpen,
				isCollapsed,
				isEmbedded,
				setIsOpen,
				setIsCollapsed,
				toggle,
				openCategories,
				toggleCategory,
				isCategoryOpen,
			}}
		>
			{children}
		</SidebarContext.Provider>
	);
}

/**
 * Hook to access sidebar context
 */
export function useSidebar() {
	const context = useContext(SidebarContext);
	if (!context) {
		throw new Error("useSidebar must be used within a SidebarProvider");
	}
	return context;
}

/**
 * Hook to check if sidebar should be hidden (embedded mode)
 */
export function useSidebarVisibility() {
	const { isEmbedded } = useSidebar();
	return !isEmbedded;
}
