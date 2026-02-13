"use client";

/**
 * DealFilters - Advanced filtering for Kanban board
 *
 * Features:
 * - Real-time search
 * - Stage filter dropdown
 * - Priority filter
 * - Filter count display
 */

import { Search, Filter, X, SlidersHorizontal } from "lucide-react";
import { DEAL_STAGES } from "./DealKanban";
import { Badge } from "@/components/ui/badge";

// =============================================================================
// Types
// =============================================================================

export interface FilterState {
	search: string;
	stage: string;
	priority: string;
}

interface DealFiltersProps {
	filters: FilterState;
	onChange: (filters: FilterState) => void;
	totalDeals: number;
	filteredCount: number;
}

// =============================================================================
// Component
// =============================================================================

export function DealFilters({
	filters,
	onChange,
	totalDeals,
	filteredCount,
}: DealFiltersProps) {
	const hasActiveFilters =
		filters.search || filters.stage !== "all" || filters.priority !== "all";

	const activeFilterCount = [
		filters.search ? 1 : 0,
		filters.stage !== "all" ? 1 : 0,
		filters.priority !== "all" ? 1 : 0,
	].reduce((a, b) => a + b, 0);

	const clearFilters = () => {
		onChange({
			search: "",
			stage: "all",
			priority: "all",
		});
	};

	return (
		<div className="px-4 py-3 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
			<div className="flex flex-wrap gap-3 items-center">
				{/* Search Input */}
				<div className="relative flex-1 min-w-[200px] max-w-md">
					<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
					<input
						type="text"
						placeholder="Rechercher par nom ou société..."
						value={filters.search}
						onChange={(e) => onChange({ ...filters, search: e.target.value })}
						className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 focus:ring-2 focus:ring-[var(--alecia-mid-blue)] focus:border-transparent transition-all"
					/>
					{filters.search && (
						<button
							onClick={() => onChange({ ...filters, search: "" })}
							className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
						>
							<X className="w-4 h-4" />
						</button>
					)}
				</div>

				{/* Stage Filter */}
				<div className="relative">
					<select
						value={filters.stage}
						onChange={(e) => onChange({ ...filters, stage: e.target.value })}
						className={`appearance-none pl-3 pr-8 py-2 text-sm border rounded-lg cursor-pointer transition-all
              ${
								filters.stage !== "all"
									? "border-[var(--alecia-mid-blue)] bg-[var(--alecia-mid-blue)]/5 text-alecia-mid-blue"
									: "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
							}`}
					>
						<option value="all">Toutes les étapes</option>
						{DEAL_STAGES.map((stage) => (
							<option key={stage.id} value={stage.id}>
								{stage.label}
							</option>
						))}
					</select>
					<Filter className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
				</div>

				{/* Priority Filter */}
				<div className="relative">
					<select
						value={filters.priority}
						onChange={(e) => onChange({ ...filters, priority: e.target.value })}
						className={`appearance-none pl-3 pr-8 py-2 text-sm border rounded-lg cursor-pointer transition-all
              ${
								filters.priority !== "all"
									? "border-[var(--alecia-mid-blue)] bg-[var(--alecia-mid-blue)]/5 text-alecia-mid-blue"
									: "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
							}`}
					>
						<option value="all">Toutes priorités</option>
						<option value="high">🔴 Haute</option>
						<option value="medium">🟡 Moyenne</option>
						<option value="low">🟢 Basse</option>
					</select>
					<SlidersHorizontal className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
				</div>

				{/* Clear Filters */}
				{hasActiveFilters && (
					<button
						onClick={clearFilters}
						className="flex items-center gap-1 px-3 py-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
					>
						<X className="w-4 h-4" />
						Effacer
					</button>
				)}

				{/* Results Count */}
				<div className="ml-auto flex items-center gap-2">
					{hasActiveFilters && (
						<Badge variant="secondary" className="text-xs">
							{activeFilterCount} filtre{activeFilterCount > 1 ? "s" : ""}
						</Badge>
					)}
					<span className="text-sm text-gray-500 dark:text-gray-400">
						{filteredCount === totalDeals ? (
							<>
								{totalDeals} deal{totalDeals !== 1 ? "s" : ""}
							</>
						) : (
							<>
								{filteredCount} / {totalDeals} deal{totalDeals !== 1 ? "s" : ""}
							</>
						)}
					</span>
				</div>
			</div>
		</div>
	);
}
