"use client";

/**
 * Deal Selector Component
 *
 * Dropdown to select a deal for linking across Numbers tools.
 * Shows recent deals and allows searching for any deal.
 * Connected to Convex for real-time deal data.
 */

import { useState, useEffect } from "react";
import { getDeals } from "@/actions";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
	Link2,
	Link2Off,
	Search,
	ChevronDown,
	Building2,
	Euro,
	Clock,
	ExternalLink,
	Loader2,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import {
	useDealContextOptional,
	type DealSummary,
} from "@/lib/numbers/deal-context";

const stageLabels: Record<string, { label: string; color: string }> = {
	sourcing: { label: "Sourcing", color: "bg-slate-500" },
	preliminary: { label: "Preliminaire", color: "bg-blue-500" },
	loi: { label: "LOI", color: "bg-indigo-500" },
	due_diligence: { label: "DD", color: "bg-amber-500" },
	negotiation: { label: "Nego", color: "bg-orange-500" },
	closing: { label: "Closing", color: "bg-emerald-500" },
};

function formatCurrency(value: number): string {
	if (value >= 1000000) {
		return `${(value / 1000000).toFixed(1)}M`;
	}
	if (value >= 1000) {
		return `${(value / 1000).toFixed(0)}K`;
	}
	return value.toString();
}

interface DealSelectorProps {
	toolId?: string;
	onDealSelect?: (deal: DealSummary | null) => void;
	showLinkedBadge?: boolean;
	compact?: boolean;
}

export function DealSelector({
	toolId,
	onDealSelect,
	showLinkedBadge = true,
	compact = false,
}: DealSelectorProps) {
	const dealContext = useDealContextOptional();
	const [open, setOpen] = useState(false);
	const [search, setSearch] = useState("");
	const [allDeals, setAllDeals] = useState<DealSummary[]>([]);
	const [isLoading, setIsLoading] = useState(true);

	// Fetch real deals from server actions
	useEffect(() => {
		getDeals()
			.then((data) => {
				const deals: DealSummary[] = ((data as any[]) ?? []).map((deal: {
					id: string;
					title: string;
					company?: string;
					stage?: string;
					amount?: number;
					currency?: string;
				}) => ({
					id: deal.id,
					title: deal.title,
					company: deal.company,
					stage: deal.stage,
					amount: deal.amount,
					currency: deal.currency,
				}));
				setAllDeals(deals);
				setIsLoading(false);
			})
			.catch((error) => {
				console.error("Failed to load deals:", error);
				setIsLoading(false);
			});
	}, []);

	// If no context, use local state
	const [localDeal, setLocalDeal] = useState<DealSummary | null>(null);

	const selectedDeal = dealContext?.selectedDeal ?? localDeal;
	const recentDeals = dealContext?.recentDeals ?? [];

	const handleSelect = (deal: DealSummary | null) => {
		if (dealContext) {
			dealContext.selectDeal(deal);
			if (toolId && deal) {
				dealContext.linkToolToDeal(toolId, deal.id);
			}
		} else {
			setLocalDeal(deal);
		}
		onDealSelect?.(deal);
		setOpen(false);
		setSearch("");
	};

	const filteredDeals = search
		? allDeals.filter(
				(d) =>
					d.title.toLowerCase().includes(search.toLowerCase()) ||
					d.company?.toLowerCase().includes(search.toLowerCase())
		  )
		: allDeals;

	if (compact) {
		return (
			<Popover open={open} onOpenChange={setOpen}>
				<PopoverTrigger asChild>
					<Button
						variant={selectedDeal ? "secondary" : "outline"}
						size="sm"
						className="gap-2"
					>
						{selectedDeal ? (
							<>
								<Link2 className="h-3.5 w-3.5 text-emerald-500" />
								<span className="max-w-[100px] truncate">
									{selectedDeal.title}
								</span>
							</>
						) : (
							<>
								<Link2Off className="h-3.5 w-3.5" />
								<span>Lier un deal</span>
							</>
						)}
						<ChevronDown className="h-3 w-3 opacity-50" />
					</Button>
				</PopoverTrigger>
				<PopoverContent className="w-[320px] p-0" align="end">
					<DealSelectorContent
						search={search}
						setSearch={setSearch}
						filteredDeals={filteredDeals}
						recentDeals={recentDeals}
						selectedDeal={selectedDeal}
						onSelect={handleSelect}
						isLoading={isLoading}
					/>
				</PopoverContent>
			</Popover>
		);
	}

	return (
		<div className="flex items-center gap-2">
			{showLinkedBadge && selectedDeal && (
				<Badge variant="secondary" className="gap-1.5 bg-emerald-500/10 text-emerald-600">
					<Link2 className="h-3 w-3" />
					Lie a {selectedDeal.title}
				</Badge>
			)}
			<Popover open={open} onOpenChange={setOpen}>
				<PopoverTrigger asChild>
					<Button variant="outline" size="sm" className="gap-2">
						{selectedDeal ? (
							<>
								<Link2 className="h-4 w-4 text-emerald-500" />
								<span>Changer le deal</span>
							</>
						) : (
							<>
								<Link2Off className="h-4 w-4" />
								<span>Lier un deal</span>
							</>
						)}
						<ChevronDown className="h-3 w-3 opacity-50" />
					</Button>
				</PopoverTrigger>
				<PopoverContent className="w-[380px] p-0" align="end">
					<DealSelectorContent
						search={search}
						setSearch={setSearch}
						filteredDeals={filteredDeals}
						recentDeals={recentDeals}
						selectedDeal={selectedDeal}
						onSelect={handleSelect}
						isLoading={isLoading}
					/>
				</PopoverContent>
			</Popover>
		</div>
	);
}

interface DealSelectorContentProps {
	search: string;
	setSearch: (value: string) => void;
	filteredDeals: DealSummary[];
	recentDeals: DealSummary[];
	selectedDeal: DealSummary | null;
	onSelect: (deal: DealSummary | null) => void;
	isLoading?: boolean;
}

function DealSelectorContent({
	search,
	setSearch,
	filteredDeals,
	recentDeals,
	selectedDeal,
	onSelect,
	isLoading,
}: DealSelectorContentProps) {
	return (
		<div className="flex flex-col">
			{/* Search */}
			<div className="p-3 border-b">
				<div className="relative">
					<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
					<Input
						placeholder="Rechercher un deal..."
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						className="pl-9"
					/>
				</div>
			</div>

			{/* Loading state */}
			{isLoading && (
				<div className="flex items-center justify-center py-8">
					<Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
					<span className="ml-2 text-sm text-muted-foreground">Chargement des deals...</span>
				</div>
			)}

			{/* Selected deal actions */}
			{!isLoading && selectedDeal && (
				<div className="p-2 border-b bg-muted/30">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-2 text-sm">
							<Link2 className="h-4 w-4 text-emerald-500" />
							<span className="font-medium">{selectedDeal.title}</span>
						</div>
						<div className="flex items-center gap-1">
							<Button variant="ghost" size="sm" asChild>
								<Link href={`/admin/numbers/pipeline`}>
									<ExternalLink className="h-3.5 w-3.5" />
								</Link>
							</Button>
							<Button
								variant="ghost"
								size="sm"
								onClick={() => onSelect(null)}
								className="text-red-500 hover:text-red-600"
							>
								<Link2Off className="h-3.5 w-3.5" />
							</Button>
						</div>
					</div>
				</div>
			)}

			{/* Recent deals */}
			{!isLoading && !search && recentDeals.length > 0 && (
				<>
					<div className="px-3 py-2">
						<p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
							<Clock className="h-3 w-3" />
							Deals recents
						</p>
					</div>
					<div className="px-2 pb-2">
						{recentDeals.map((deal) => (
							<DealItem
								key={deal.id}
								deal={deal}
								isSelected={selectedDeal?.id === deal.id}
								onSelect={onSelect}
							/>
						))}
					</div>
					<Separator />
				</>
			)}

			{/* All deals */}
			{!isLoading && (
				<>
					<div className="px-3 py-2">
						<p className="text-xs font-medium text-muted-foreground">
							{search ? `Resultats (${filteredDeals.length})` : "Tous les deals"}
						</p>
					</div>
					<div className="px-2 pb-2 max-h-[250px] overflow-y-auto">
						{filteredDeals.length === 0 ? (
							<p className="text-sm text-muted-foreground text-center py-4">
								Aucun deal trouve
							</p>
						) : (
							filteredDeals.map((deal) => (
								<DealItem
									key={deal.id}
									deal={deal}
									isSelected={selectedDeal?.id === deal.id}
									onSelect={onSelect}
								/>
							))
						)}
					</div>
				</>
			)}
		</div>
	);
}

interface DealItemProps {
	deal: DealSummary;
	isSelected: boolean;
	onSelect: (deal: DealSummary) => void;
}

function DealItem({ deal, isSelected, onSelect }: DealItemProps) {
	const stageInfo = deal.stage ? stageLabels[deal.stage] : null;

	return (
		<button
			type="button"
			onClick={() => onSelect(deal)}
			className={`w-full text-left p-2 rounded-md transition-colors hover:bg-muted ${
				isSelected ? "bg-emerald-500/10 border border-emerald-500/30" : ""
			}`}
		>
			<div className="flex items-start justify-between gap-2">
				<div className="min-w-0 flex-1">
					<p className="font-medium text-sm truncate">{deal.title}</p>
					{deal.company && (
						<p className="text-xs text-muted-foreground flex items-center gap-1 truncate">
							<Building2 className="h-3 w-3 flex-shrink-0" />
							{deal.company}
						</p>
					)}
				</div>
				<div className="flex flex-col items-end gap-1">
					{stageInfo && (
						<Badge
							variant="secondary"
							className={`${stageInfo.color} text-white text-[10px] px-1.5 py-0`}
						>
							{stageInfo.label}
						</Badge>
					)}
					{deal.amount && (
						<span className="text-xs text-muted-foreground flex items-center gap-0.5">
							<Euro className="h-3 w-3" />
							{formatCurrency(deal.amount)}
						</span>
					)}
				</div>
			</div>
		</button>
	);
}
