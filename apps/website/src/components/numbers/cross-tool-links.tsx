"use client";

/**
 * Cross-Tool Links Component
 *
 * Shows quick navigation links to related Numbers tools
 * when a deal is selected. Enables seamless workflow across tools.
 */

import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import {
	Calculator,
	ClipboardCheck,
	TrendingUp,
	Table2,
	GanttChart,
	Users,
	CheckSquare,
	ChevronRight,
} from "lucide-react";
import { useDealContextOptional } from "@/lib/numbers/deal-context";

interface ToolLink {
	id: string;
	name: string;
	shortName: string;
	href: string;
	icon: typeof Calculator;
	description: string;
}

const tools: ToolLink[] = [
	{
		id: "fee-calculator",
		name: "Calculateur d'Honoraires",
		shortName: "Honoraires",
		href: "/admin/numbers/fee-calculator",
		icon: Calculator,
		description: "Calculer les honoraires pour ce deal",
	},
	{
		id: "valuation",
		name: "Multiples de Valorisation",
		shortName: "Valorisation",
		href: "/admin/numbers/valuation",
		icon: TrendingUp,
		description: "Analyser les multiples de valorisation",
	},
	{
		id: "comparables",
		name: "Comparables",
		shortName: "Comps",
		href: "/admin/numbers/comparables",
		icon: Table2,
		description: "Analyse des comparables boursiers",
	},
	{
		id: "financial-model",
		name: "Modele Financier",
		shortName: "3-Statement",
		href: "/admin/numbers/financial-model",
		icon: ClipboardCheck,
		description: "Projections financieres 3-statements",
	},
	{
		id: "dd-checklist",
		name: "Checklist Due Diligence",
		shortName: "DD",
		href: "/admin/numbers/dd-checklist",
		icon: CheckSquare,
		description: "Suivi de la due diligence",
	},
	{
		id: "timeline",
		name: "Timeline",
		shortName: "Gantt",
		href: "/admin/numbers/timeline",
		icon: GanttChart,
		description: "Planning et jalons du deal",
	},
	{
		id: "teaser-tracking",
		name: "Suivi Teaser/IM",
		shortName: "Teaser",
		href: "/admin/numbers/teaser-tracking",
		icon: Users,
		description: "Suivi des envois et retours",
	},
];

interface CrossToolLinksProps {
	currentTool: string;
	variant?: "horizontal" | "vertical" | "compact";
	maxItems?: number;
}

export function CrossToolLinks({
	currentTool,
	variant = "horizontal",
	maxItems = 5,
}: CrossToolLinksProps) {
	const dealContext = useDealContextOptional();
	const selectedDeal = dealContext?.selectedDeal;

	// Filter out current tool and limit items
	const visibleTools = tools
		.filter((t) => t.id !== currentTool)
		.slice(0, maxItems);

	if (variant === "compact") {
		return (
			<div className="flex items-center gap-1">
				{selectedDeal && (
					<Badge variant="outline" className="text-xs mr-2">
						{selectedDeal.title}
					</Badge>
				)}
				{visibleTools.map((tool) => (
					<Tooltip key={tool.id}>
						<TooltipTrigger asChild>
							<Button variant="ghost" size="icon" className="h-8 w-8" asChild>
								<Link href={tool.href}>
									<tool.icon className="h-4 w-4" />
								</Link>
							</Button>
						</TooltipTrigger>
						<TooltipContent>
							<p>{tool.name}</p>
							{selectedDeal && (
								<p className="text-xs text-muted-foreground">
									{tool.description}
								</p>
							)}
						</TooltipContent>
					</Tooltip>
				))}
			</div>
		);
	}

	if (variant === "vertical") {
		return (
			<div className="space-y-1">
				<p className="text-xs font-medium text-muted-foreground mb-2">
					Outils lies
				</p>
				{visibleTools.map((tool) => (
					<Button
						key={tool.id}
						variant="ghost"
						size="sm"
						className="w-full justify-start gap-2 h-9"
						asChild
					>
						<Link href={tool.href}>
							<tool.icon className="h-4 w-4" />
							<span className="flex-1 text-left">{tool.shortName}</span>
							<ChevronRight className="h-3 w-3 opacity-50" />
						</Link>
					</Button>
				))}
			</div>
		);
	}

	// Horizontal (default)
	return (
		<div className="flex items-center gap-2 flex-wrap">
			<span className="text-xs text-muted-foreground">Outils:</span>
			{visibleTools.map((tool) => (
				<Tooltip key={tool.id}>
					<TooltipTrigger asChild>
						<Button variant="outline" size="sm" className="gap-1.5 h-7" asChild>
							<Link href={tool.href}>
								<tool.icon className="h-3.5 w-3.5" />
								<span className="hidden sm:inline">{tool.shortName}</span>
							</Link>
						</Button>
					</TooltipTrigger>
					<TooltipContent>
						<p>{tool.name}</p>
					</TooltipContent>
				</Tooltip>
			))}
		</div>
	);
}

/**
 * Deal-aware tool header that shows the selected deal
 * and quick links to other tools
 */
interface ToolHeaderProps {
	currentTool: string;
	title: string;
	description?: string;
	icon: typeof Calculator;
}

export function ToolHeader({
	currentTool,
	title,
	description,
	icon: Icon,
}: ToolHeaderProps) {
	const dealContext = useDealContextOptional();
	const selectedDeal = dealContext?.selectedDeal;

	return (
		<div className="flex items-center justify-between flex-wrap gap-4">
			<div className="flex items-center gap-4">
				<div>
					<h1 className="text-2xl font-bold flex items-center gap-2">
						<Icon className="h-6 w-6" />
						{title}
					</h1>
					{description && (
						<p className="text-muted-foreground">{description}</p>
					)}
				</div>
			</div>

			{selectedDeal && (
				<div className="flex items-center gap-3">
					<CrossToolLinks currentTool={currentTool} variant="compact" />
				</div>
			)}
		</div>
	);
}
