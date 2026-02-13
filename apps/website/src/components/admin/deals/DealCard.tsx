"use client";

/**
 * DealCard - Draggable card for Kanban board
 *
 * Features:
 * - @dnd-kit sortable/draggable
 * - Visual feedback during drag
 * - Priority indicator
 * - Value display
 * - Assignee avatar
 * - Quick actions dropdown with Numbers integration
 * - Click to open detail modal (future)
 */

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	Briefcase,
	GripVertical,
	AlertCircle,
	TrendingUp,
	MoreHorizontal,
	Calculator,
	FileSpreadsheet,
	BarChart3,
	Calendar,
	FileText,
	CheckSquare,
} from "lucide-react";

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

interface DealCardProps {
	deal: Deal;
	isDragging?: boolean;
	onClick?: () => void;
}

// =============================================================================
// Priority Configuration
// =============================================================================

const PRIORITY_CONFIG = {
	high: {
		color: "text-red-500 bg-red-50 dark:bg-red-900/20",
		label: "Haute",
	},
	medium: {
		color: "text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20",
		label: "Moyenne",
	},
	low: {
		color: "text-green-500 bg-green-50 dark:bg-green-900/20",
		label: "Basse",
	},
};

// =============================================================================
// Component
// =============================================================================

export function DealCard({ deal, isDragging, onClick }: DealCardProps) {
	const router = useRouter();
	const {
		attributes,
		listeners,
		setNodeRef,
		transform,
		transition,
		isDragging: isSorting,
	} = useSortable({ id: deal._id });

	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
	};

	const isActive = isDragging || isSorting;

	// Numbers tool navigation helpers
	const navigateToNumbers = (tool: string) => {
		router.push(`/admin/numbers/${tool}?dealId=${deal._id}`);
	};

	return (
		<button
			type="button"
			disabled={!onClick}
			ref={setNodeRef}
			style={style}
			onClick={onClick}
			className={`
        group relative bg-white dark:bg-gray-800 rounded-xl p-4
        border border-gray-200 dark:border-gray-700
        shadow-sm hover:shadow-md
        transition-all duration-200 text-left w-full
        ${
					isActive
						? "opacity-90 shadow-xl ring-2 ring-[var(--alecia-mid-blue)] scale-[1.02] rotate-1"
						: "cursor-grab active:cursor-grabbing hover:border-alecia-mid-blue/50"
				}
      `}
		>
			{/* Drag Handle */}
			<div
				{...attributes}
				{...listeners}
				className="absolute left-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-50 transition-opacity cursor-grab"
			>
				<GripVertical className="w-4 h-4 text-gray-400" />
			</div>

			{/* Content */}
			<div className="pl-4">
				{/* Header */}
				<div className="flex items-start justify-between mb-2">
					<h4 className="font-semibold text-sm text-[var(--alecia-midnight)] dark:text-white line-clamp-2 pr-2">
						{deal.title}
					</h4>
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button
								variant="ghost"
								size="sm"
								className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
								onClick={(e) => e.stopPropagation()}
							>
								<MoreHorizontal className="w-4 h-4" />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end" className="w-48">
							<DropdownMenuItem onClick={() => navigateToNumbers("fee-calculator")} className="gap-2">
								<Calculator className="w-4 h-4" />
								Calculateur Fees
							</DropdownMenuItem>
							<DropdownMenuItem onClick={() => navigateToNumbers("financial-model")} className="gap-2">
								<FileSpreadsheet className="w-4 h-4" />
								Modele Financier
							</DropdownMenuItem>
							<DropdownMenuItem onClick={() => navigateToNumbers("comparables")} className="gap-2">
								<BarChart3 className="w-4 h-4" />
								Comparables
							</DropdownMenuItem>
							<DropdownMenuItem onClick={() => navigateToNumbers("timeline")} className="gap-2">
								<Calendar className="w-4 h-4" />
								Timeline
							</DropdownMenuItem>
							<DropdownMenuItem onClick={() => navigateToNumbers("teaser-tracking")} className="gap-2">
								<FileText className="w-4 h-4" />
								Teaser Tracking
							</DropdownMenuItem>
							<DropdownMenuItem onClick={() => navigateToNumbers("post-deal")} className="gap-2">
								<CheckSquare className="w-4 h-4" />
								Post-Deal
							</DropdownMenuItem>
							<div className="my-1 h-px bg-border" />
							<DropdownMenuItem onClick={() => router.push("/admin/numbers")} className="gap-2">
								<Briefcase className="w-4 h-4" />
								Voir tous les outils Numbers
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>

				{/* Company */}
				{deal.companyName && (
					<p className="text-xs text-gray-500 dark:text-gray-400 mb-3 truncate">
						{deal.companyName}
					</p>
				)}

				{/* Priority Badge */}
				{deal.priority && PRIORITY_CONFIG[deal.priority] && (
					<Badge
						variant="secondary"
						className={`text-xs mb-3 ${PRIORITY_CONFIG[deal.priority].color}`}
					>
						{deal.priority === "high" && (
							<AlertCircle className="w-3 h-3 mr-1" />
						)}
						{PRIORITY_CONFIG[deal.priority].label}
					</Badge>
				)}

				{/* Footer */}
				<div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700">
					{/* Value */}
					<div className="flex items-center gap-1">
						<TrendingUp className="w-3 h-3 text-alecia-mid-blue" />
						<span className="text-sm font-bold text-alecia-mid-blue">
							{deal.amount
								? new Intl.NumberFormat("fr-FR", {
										style: "currency",
										currency: "EUR",
										maximumFractionDigits: 0,
										notation: deal.amount >= 1000000 ? "compact" : "standard",
									}).format(deal.amount)
								: "—"}
						</span>
					</div>

					{/* Assignee */}
					{deal.ownerName && (
						<Avatar className="w-6 h-6 ring-2 ring-white dark:ring-gray-800">
							<AvatarFallback className="text-[10px] bg-[var(--alecia-light-blue)] text-white font-medium">
								{deal.ownerName
									.split(" ")
									.map((n) => n.charAt(0))
									.join("")
									.slice(0, 2)
									.toUpperCase()}
							</AvatarFallback>
						</Avatar>
					)}
				</div>
			</div>
		</button>
	);
}
