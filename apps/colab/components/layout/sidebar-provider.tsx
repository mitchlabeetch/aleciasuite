"use client";

import useLocalStorage from "@/hooks/use-local-storage";
import {
	type ReactNode,
	createContext,
	useContext,
	useEffect,
	useState,
} from "react";

interface SidebarContextType {
	isMobileOpen: boolean;
	isCollapsed: boolean;
	isEmbedded: boolean;
	toggleMobile: () => void;
	toggleCollapse: () => void;
	setMobileOpen: (open: boolean) => void;
	setCollapsed: (collapsed: boolean) => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function SidebarProvider({ children }: { children: ReactNode }) {
	const [isMobileOpen, setMobileOpen] = useState(false);
	const [isCollapsed, setCollapsed] = useLocalStorage(
		"alecia-sidebar-collapsed",
		false,
	);

	// Detect embedded mode from URL params
	const [isEmbedded, setIsEmbedded] = useState(false);

	useEffect(() => {
		if (typeof window !== "undefined") {
			const urlParams = new URLSearchParams(window.location.search);
			setIsEmbedded(
				urlParams.get("embedded") === "true" ||
					urlParams.get("embed") === "true",
			);
		}
	}, []);

	const toggleMobile = () => setMobileOpen((prev) => !prev);
	const toggleCollapse = () => setCollapsed(!isCollapsed); // setCollapsed is from useLocalStorage which doesn't support functional updates apparently?
	// Let's check useLocalStorage implementation again.
	// It returns [storedValue, setValue]. setValue(value: T).
	// Yes, it does NOT support function updater.
	// However, I can just use !isCollapsed.
	// The issue was dependencies in useEffect.

	// Keyboard shortcut: Cmd+\ to toggle collapse
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if ((e.metaKey || e.ctrlKey) && e.key === "\\") {
				e.preventDefault();
				setCollapsed(!isCollapsed);
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [isCollapsed, setCollapsed]);

	return (
		<SidebarContext.Provider
			value={{
				isMobileOpen,
				isCollapsed,
				isEmbedded,
				toggleMobile,
				toggleCollapse,
				setMobileOpen,
				setCollapsed,
			}}
		>
			{children}
		</SidebarContext.Provider>
	);
}

export function useSidebar() {
	const context = useContext(SidebarContext);
	if (context === undefined) {
		throw new Error("useSidebar must be used within a SidebarProvider");
	}
	return context;
}
