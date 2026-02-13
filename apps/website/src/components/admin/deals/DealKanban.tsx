"use client";

/**
 * DealKanban - Unified Best-in-Class Kanban Component
 *
 * Combines the best of Website Admin (Convex data, server rendering) and
 * Colab (drag-and-drop, filtering) into a single, production-ready component.
 *
 * Features:
 * - Full @dnd-kit drag-and-drop
 * - Real-time Convex updates
 * - Advanced filtering
 * - Keyboard accessibility
 * - Responsive design
 *
 * @see Batch 6: Kanban Consolidation
 */

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getDeals, updateDealStage, type DealStage } from "@/actions";
import {
	DndContext,
	DragOverlay,
	closestCorners,
	KeyboardSensor,
	PointerSensor,
	useSensor,
	useSensors,
	type DragEndEvent,
	type DragStartEvent,
} from "@dnd-kit/core";
import { DealColumn } from "./DealColumn";
import { DealCard } from "./DealCard";
import { DealFilters, type FilterState } from "./DealFilters";
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";

// =============================================================================
// Stage Configuration
// =============================================================================

export const DEAL_STAGES = [
	{
		id: "qualification",
		label: "Qualification",
		color: "bg-slate-500",
		order: 0,
	},
	{
		id: "initial_meeting",
		label: "Premier RDV",
		color: "bg-sky-500",
		order: 1,
	},
	{ id: "analysis", label: "Analyse", color: "bg-blue-500", order: 2 },
	{ id: "valuation", label: "Valorisation", color: "bg-indigo-500", order: 3 },
	{
		id: "negotiation",
		label: "Négociation",
		color: "bg-emerald-500",
		order: 4,
	},
	{
		id: "due_diligence",
		label: "Due Diligence",
		color: "bg-purple-500",
		order: 5,
	},
	{ id: "closing", label: "Closing", color: "bg-green-500", order: 6 },
	{ id: "completed", label: "Terminé", color: "bg-emerald-600", order: 7 },
] as const;

export type StageId = (typeof DEAL_STAGES)[number]["id"];

// =============================================================================
// Types
// =============================================================================

export interface Deal {
	_id: string;
	title: string;
	companyName?: string;
	amount?: number;
	stage: string;
	ownerName?: string;
	priority?: "low" | "medium" | "high";
	createdAt?: number;
}

interface DealKanbanProps {
	className?: string;
}

// =============================================================================
// Component
// =============================================================================

export function DealKanban({ className }: DealKanbanProps) {
	const router = useRouter();
	const [activeDeal, setActiveDeal] = useState<Deal | null>(null);
	const [filters, setFilters] = useState<FilterState>({
		search: "",
		stage: "all",
		priority: "all",
	});
	const { toast } = useToast();

	// Server state
	const [deals, setDeals] = useState<Deal[] | undefined>(undefined);

	useEffect(() => {
		getDeals().then((data) => setDeals(data as unknown as Deal[]));
	}, []);

	// DnD sensors with activation constraints for better UX
	const sensors = useSensors(
		useSensor(PointerSensor, {
			activationConstraint: { distance: 8 },
		}),
		useSensor(KeyboardSensor),
	);

	// Filter and group deals by stage
	const filteredDeals = useMemo(() => {
		if (!deals) return [] as Deal[];

		return (deals as Deal[]).filter((deal: Deal) => {
			// Search filter
			if (filters.search) {
				const query = filters.search.toLowerCase();
				const matchesTitle = deal.title?.toLowerCase().includes(query);
				const matchesCompany = deal.companyName?.toLowerCase().includes(query);
				if (!matchesTitle && !matchesCompany) return false;
			}

			// Stage filter
			if (filters.stage !== "all" && deal.stage !== filters.stage) {
				return false;
			}

			// Priority filter
			if (filters.priority !== "all" && deal.priority !== filters.priority) {
				return false;
			}

			return true;
		});
	}, [deals, filters]);

	// Group deals by stage
	const dealsByStage = useMemo(() => {
		const grouped: Record<string, Deal[]> = {};

		// Initialize all stages with empty arrays
		DEAL_STAGES.forEach((stage) => {
			grouped[stage.id] = [];
		});

		// Populate with filtered deals
		filteredDeals.forEach((deal: Deal) => {
			const stage = deal.stage || "qualification";
			if (grouped[stage]) {
				grouped[stage].push(deal);
			} else {
				// Unknown stage goes to qualification
				grouped["qualification"].push(deal);
			}
		});

		return grouped;
	}, [filteredDeals]);

	// Drag handlers
	const handleDragStart = (event: DragStartEvent) => {
		if (!deals) return;
		const deal = (deals as Deal[]).find((d: Deal) => d._id === event.active.id);
		if (deal) {
			setActiveDeal(deal);
		}
	};

	const handleDragEnd = async (event: DragEndEvent) => {
		const { active, over } = event;
		setActiveDeal(null);

		if (!over) return;

		const dealId = active.id as string;
		const newStage = over.id as string;

		// Find the deal to get current stage
		const deal = (deals as Deal[] | undefined)?.find(
			(d: Deal) => d._id === dealId,
		);
		if (!deal || deal.stage === newStage) return;

		// Optimistic update is handled by Convex reactivity
		try {
			await updateDealStage(dealId, newStage as DealStage);

			toast({
				title: "Deal déplacé",
				description: `${deal.title} → ${DEAL_STAGES.find((s) => s.id === newStage)?.label || newStage}`,
			});

			// Refresh data
			const updated = await getDeals();
			setDeals(updated as unknown as Deal[]);
			router.refresh();
		} catch (_error) {
			toast({
				title: "Erreur",
				description: "Impossible de déplacer le deal.",
				variant: "destructive",
			});
		}
	};

	// Loading state
	if (deals === undefined) {
		return (
			<div className="flex items-center justify-center h-96">
				<Loader2 className="w-8 h-8 animate-spin text-alecia-mid-blue" />
			</div>
		);
	}

	return (
		<div className={`h-full flex flex-col ${className || ""}`}>
			{/* Filters Bar */}
			<DealFilters
				filters={filters}
				onChange={setFilters}
				totalDeals={deals.length}
				filteredCount={filteredDeals.length}
			/>

			{/* Kanban Board */}
			<DndContext
				sensors={sensors}
				collisionDetection={closestCorners}
				onDragStart={handleDragStart}
				onDragEnd={handleDragEnd}
			>
				<div className="flex-1 overflow-x-auto pb-4">
					<div className="flex gap-4 p-4 min-w-max h-full">
						{DEAL_STAGES.map((stage) => (
							<DealColumn
								key={stage.id}
								stage={stage}
								deals={dealsByStage[stage.id] || []}
							/>
						))}
					</div>
				</div>

				{/* Drag Overlay - renders dragged item above everything */}
				<DragOverlay dropAnimation={null}>
					{activeDeal ? <DealCard deal={activeDeal} isDragging /> : null}
				</DragOverlay>
			</DndContext>
		</div>
	);
}
