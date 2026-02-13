"use client";

/**
 * DealColumn - Droppable column for the Kanban board
 *
 * Features:
 * - @dnd-kit droppable zone
 * - Visual feedback when items are dragged over
 * - Sortable context for reordering within column
 * - Empty state styling
 */

import { useDroppable } from "@dnd-kit/core";
import {
	SortableContext,
	verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { DealCard, type Deal } from "./DealCard";
import { Plus } from "lucide-react";

interface StageConfig {
	id: string;
	label: string;
	color: string;
}

interface DealColumnProps {
	stage: StageConfig;
	deals: Deal[];
	onAddDeal?: (stageId: string) => void;
}

export function DealColumn({ stage, deals, onAddDeal }: DealColumnProps) {
	const { setNodeRef, isOver, active } = useDroppable({
		id: stage.id,
	});

	// Calculate total value for column
	const totalValue = deals.reduce((sum, deal) => sum + (deal.amount || 0), 0);

	return (
		<div
			ref={setNodeRef}
			className={`
        w-80 flex-shrink-0 rounded-2xl p-4 flex flex-col
        bg-gray-50 dark:bg-gray-900/50
        border-2 transition-all duration-200
        ${
					isOver && active
						? "border-[var(--alecia-mid-blue)] bg-[var(--alecia-mid-blue)]/5 ring-4 ring-[var(--alecia-mid-blue)]/20"
						: "border-transparent"
				}
      `}
		>
			{/* Column Header */}
			<div className="flex items-center justify-between mb-4">
				<div className="flex items-center gap-2">
					<div className={`w-3 h-3 rounded-full ${stage.color}`} />
					<h3 className="font-semibold text-[var(--alecia-midnight)] dark:text-white">
						{stage.label}
					</h3>
					<span className="text-xs font-medium text-gray-500 bg-white dark:bg-gray-800 px-2 py-0.5 rounded-full shadow-sm">
						{deals.length}
					</span>
				</div>
				{onAddDeal && (
					<button
						onClick={() => onAddDeal(stage.id)}
						className="p-1 rounded-lg text-gray-400 hover:text-alecia-mid-blue hover:bg-white dark:hover:bg-gray-800 transition-colors"
						title={`Ajouter un deal à ${stage.label}`}
					>
						<Plus className="w-4 h-4" />
					</button>
				)}
			</div>

			{/* Total Value Badge */}
			{totalValue > 0 && (
				<div className="mb-3 px-2 py-1.5 bg-white dark:bg-gray-800 rounded-lg text-xs font-medium text-gray-600 dark:text-gray-300 shadow-sm">
					Total:{" "}
					{new Intl.NumberFormat("fr-FR", {
						style: "currency",
						currency: "EUR",
						maximumFractionDigits: 0,
					}).format(totalValue)}
				</div>
			)}

			{/* Deal Cards */}
			<SortableContext
				items={deals.map((d) => d._id)}
				strategy={verticalListSortingStrategy}
			>
				<div className="flex-1 space-y-3 min-h-[200px]">
					{deals.map((deal) => (
						<DealCard key={deal._id} deal={deal} />
					))}
				</div>
			</SortableContext>

			{/* Empty State */}
			{deals.length === 0 && (
				<div className="flex-1 flex items-center justify-center min-h-[200px]">
					<div className="text-center p-4">
						<div
							className={`w-10 h-10 rounded-full ${stage.color}/10 mx-auto mb-2 flex items-center justify-center`}
						>
							<div
								className={`w-3 h-3 rounded-full ${stage.color} opacity-50`}
							/>
						</div>
						<p className="text-sm text-gray-400 dark:text-gray-500">
							Aucun deal
						</p>
						<p className="text-xs text-gray-300 dark:text-gray-600 mt-1">
							Glissez un deal ici
						</p>
					</div>
				</div>
			)}
		</div>
	);
}
