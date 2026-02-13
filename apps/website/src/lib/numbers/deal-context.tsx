"use client";

/**
 * Deal Context for Numbers Tools
 *
 * Provides shared deal selection across all Numbers tools.
 * When a deal is selected, all tools can access and link to it.
 */

import {
	createContext,
	useContext,
	useState,
	useCallback,
	type ReactNode,
} from "react";

// Minimal deal type for context (avoid full schema dependency)
export interface DealSummary {
	id: string;
	title: string;
	company?: string;
	stage?: string;
	amount?: number;
	currency?: string;
}

interface DealContextType {
	// Selected deal
	selectedDeal: DealSummary | null;
	selectDeal: (deal: DealSummary | null) => void;

	// Recently used deals (for quick access)
	recentDeals: DealSummary[];
	addRecentDeal: (deal: DealSummary) => void;

	// Cross-tool linking
	linkedTools: Map<string, string>; // toolId -> dealId
	linkToolToDeal: (toolId: string, dealId: string) => void;
	getLinkedDeal: (toolId: string) => string | undefined;
}

const DealContext = createContext<DealContextType | undefined>(undefined);

const MAX_RECENT_DEALS = 5;
const STORAGE_KEY = "numbers_recent_deals";

export function DealProvider({ children }: { children: ReactNode }) {
	const [selectedDeal, setSelectedDeal] = useState<DealSummary | null>(null);
	const [recentDeals, setRecentDeals] = useState<DealSummary[]>(() => {
		// Load from localStorage on init
		if (typeof window !== "undefined") {
			try {
				const stored = localStorage.getItem(STORAGE_KEY);
				if (stored) {
					return JSON.parse(stored);
				}
			} catch {
				// Ignore parse errors
			}
		}
		return [];
	});
	const [linkedTools, setLinkedTools] = useState<Map<string, string>>(
		new Map()
	);

	const selectDeal = useCallback((deal: DealSummary | null) => {
		setSelectedDeal(deal);
		if (deal) {
			// Also add to recent deals
			setRecentDeals((prev) => {
				const filtered = prev.filter((d) => d.id !== deal.id);
				const updated = [deal, ...filtered].slice(0, MAX_RECENT_DEALS);
				// Persist to localStorage
				if (typeof window !== "undefined") {
					localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
				}
				return updated;
			});
		}
	}, []);

	const addRecentDeal = useCallback((deal: DealSummary) => {
		setRecentDeals((prev) => {
			const filtered = prev.filter((d) => d.id !== deal.id);
			const updated = [deal, ...filtered].slice(0, MAX_RECENT_DEALS);
			if (typeof window !== "undefined") {
				localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
			}
			return updated;
		});
	}, []);

	const linkToolToDeal = useCallback((toolId: string, dealId: string) => {
		setLinkedTools((prev) => {
			const next = new Map(prev);
			next.set(toolId, dealId);
			return next;
		});
	}, []);

	const getLinkedDeal = useCallback(
		(toolId: string) => {
			return linkedTools.get(toolId);
		},
		[linkedTools]
	);

	return (
		<DealContext.Provider
			value={{
				selectedDeal,
				selectDeal,
				recentDeals,
				addRecentDeal,
				linkedTools,
				linkToolToDeal,
				getLinkedDeal,
			}}
		>
			{children}
		</DealContext.Provider>
	);
}

export function useDealContext() {
	const context = useContext(DealContext);
	if (!context) {
		throw new Error("useDealContext must be used within a DealProvider");
	}
	return context;
}

// Optional hook that doesn't throw if provider is missing
export function useDealContextOptional() {
	return useContext(DealContext);
}
