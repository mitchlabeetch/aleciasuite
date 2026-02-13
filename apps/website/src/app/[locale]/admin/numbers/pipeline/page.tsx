"use client";

/**
 * Deal Pipeline Dashboard
 *
 * Kanban-style deal tracker with:
 * - Drag & drop between stages
 * - Deal cards with key metrics
 * - Pipeline value summaries
 * - Filters by sector, size, advisor
 */

import { useState, useMemo } from "react";
import {
	Card,
	CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
	Kanban,
	ArrowLeft,
	Plus,
	Search,
	Filter,
	Euro,
	Building2,
	User,
	MoreVertical,
	TrendingUp,
	AlertCircle,
	CheckCircle2,
	Clock,
	Target,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import { DealSelector } from "@/components/numbers/deal-selector";
import { CrossToolLinks } from "@/components/numbers/cross-tool-links";

type DealStage =
	| "sourcing"
	| "preliminary"
	| "loi"
	| "due_diligence"
	| "negotiation"
	| "closing"
	| "closed";

type DealType = "sell-side" | "buy-side";

interface Deal {
	id: string;
	name: string;
	company: string;
	stage: DealStage;
	type: DealType;
	sector: string;
	value: number;
	probability: number;
	advisor: string;
	dueDate: string;
	lastActivity: string;
	notes: string;
	priority: "high" | "medium" | "low";
}

const stageConfig: Record<
	DealStage,
	{ label: string; color: string; icon: typeof Target }
> = {
	sourcing: { label: "Sourcing", color: "bg-slate-500", icon: Target },
	preliminary: { label: "Contacts Preliminaires", color: "bg-blue-500", icon: Clock },
	loi: { label: "LOI / Offre", color: "bg-indigo-500", icon: TrendingUp },
	due_diligence: { label: "Due Diligence", color: "bg-amber-500", icon: AlertCircle },
	negotiation: { label: "Negociation", color: "bg-orange-500", icon: MoreVertical },
	closing: { label: "Closing", color: "bg-emerald-500", icon: CheckCircle2 },
	closed: { label: "Termine", color: "bg-gray-400", icon: CheckCircle2 },
};

const stages: DealStage[] = [
	"sourcing",
	"preliminary",
	"loi",
	"due_diligence",
	"negotiation",
	"closing",
];

const sectors = [
	"Technologie",
	"Sante",
	"Industrie",
	"Services",
	"Distribution",
	"Agroalimentaire",
	"Energie",
	"Immobilier",
];

const defaultDeals: Deal[] = [
	{
		id: "d1",
		name: "Projet Alpha",
		company: "TechCorp SAS",
		stage: "sourcing",
		type: "sell-side",
		sector: "Technologie",
		value: 15000000,
		probability: 20,
		advisor: "Jean Dupont",
		dueDate: "2026-06-30",
		lastActivity: "2026-02-01",
		notes: "Premier contact etabli avec le dirigeant",
		priority: "medium",
	},
	{
		id: "d2",
		name: "Projet Beta",
		company: "MediHealth SA",
		stage: "preliminary",
		type: "sell-side",
		sector: "Sante",
		value: 25000000,
		probability: 35,
		advisor: "Marie Martin",
		dueDate: "2026-05-15",
		lastActivity: "2026-02-03",
		notes: "NDA signe, teaser envoye",
		priority: "high",
	},
	{
		id: "d3",
		name: "Projet Gamma",
		company: "IndustrieMax",
		stage: "loi",
		type: "buy-side",
		sector: "Industrie",
		value: 8000000,
		probability: 50,
		advisor: "Pierre Durand",
		dueDate: "2026-04-20",
		lastActivity: "2026-02-02",
		notes: "LOI en cours de negociation",
		priority: "high",
	},
	{
		id: "d4",
		name: "Projet Delta",
		company: "ServicesPro SARL",
		stage: "due_diligence",
		type: "sell-side",
		sector: "Services",
		value: 12000000,
		probability: 65,
		advisor: "Jean Dupont",
		dueDate: "2026-03-31",
		lastActivity: "2026-02-04",
		notes: "VDD financiere en cours",
		priority: "high",
	},
	{
		id: "d5",
		name: "Projet Epsilon",
		company: "DistribCo",
		stage: "negotiation",
		type: "sell-side",
		sector: "Distribution",
		value: 18000000,
		probability: 75,
		advisor: "Marie Martin",
		dueDate: "2026-03-15",
		lastActivity: "2026-02-03",
		notes: "Negociation du SPA",
		priority: "medium",
	},
	{
		id: "d6",
		name: "Projet Zeta",
		company: "AgriFood SA",
		stage: "closing",
		type: "sell-side",
		sector: "Agroalimentaire",
		value: 22000000,
		probability: 90,
		advisor: "Pierre Durand",
		dueDate: "2026-02-28",
		lastActivity: "2026-02-04",
		notes: "Signing prevu le 15 fevrier",
		priority: "high",
	},
];

function formatCurrency(value: number): string {
	if (value >= 1000000) {
		return `${(value / 1000000).toFixed(1)}M`;
	}
	if (value >= 1000) {
		return `${(value / 1000).toFixed(0)}K`;
	}
	return value.toString();
}

export default function PipelinePage() {
	const [deals, setDeals] = useState<Deal[]>(defaultDeals);
	const [searchQuery, setSearchQuery] = useState("");
	const [sectorFilter, setSectorFilter] = useState<string>("all");
	const [typeFilter, setTypeFilter] = useState<string>("all");
	const [draggedDeal, setDraggedDeal] = useState<Deal | null>(null);
	const [isNewDealOpen, setIsNewDealOpen] = useState(false);
	const [newDeal, setNewDeal] = useState<Partial<Deal>>({
		stage: "sourcing",
		type: "sell-side",
		priority: "medium",
		probability: 20,
	});

	const filteredDeals = useMemo(() => {
		return deals.filter((deal) => {
			const matchesSearch =
				deal.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
				deal.company.toLowerCase().includes(searchQuery.toLowerCase());
			const matchesSector =
				sectorFilter === "all" || deal.sector === sectorFilter;
			const matchesType = typeFilter === "all" || deal.type === typeFilter;
			return matchesSearch && matchesSector && matchesType && deal.stage !== "closed";
		});
	}, [deals, searchQuery, sectorFilter, typeFilter]);

	const pipelineStats = useMemo(() => {
		const activeDeals = deals.filter((d) => d.stage !== "closed");
		const totalValue = activeDeals.reduce((sum, d) => sum + d.value, 0);
		const weightedValue = activeDeals.reduce(
			(sum, d) => sum + d.value * (d.probability / 100),
			0
		);
		const avgProbability =
			activeDeals.length > 0
				? activeDeals.reduce((sum, d) => sum + d.probability, 0) / activeDeals.length
				: 0;

		return {
			count: activeDeals.length,
			totalValue,
			weightedValue,
			avgProbability,
		};
	}, [deals]);

	const stageStats = useMemo(() => {
		return stages.reduce(
			(acc, stage) => {
				const stageDeals = filteredDeals.filter((d) => d.stage === stage);
				acc[stage] = {
					count: stageDeals.length,
					value: stageDeals.reduce((sum, d) => sum + d.value, 0),
				};
				return acc;
			},
			{} as Record<DealStage, { count: number; value: number }>
		);
	}, [filteredDeals, stages]);

	const handleDragStart = (deal: Deal) => {
		setDraggedDeal(deal);
	};

	const handleDragOver = (e: React.DragEvent) => {
		e.preventDefault();
	};

	const handleDrop = (stage: DealStage) => {
		if (draggedDeal && draggedDeal.stage !== stage) {
			setDeals((prev) =>
				prev.map((d) =>
					d.id === draggedDeal.id
						? {
								...d,
								stage,
								lastActivity: new Date().toISOString().split("T")[0],
						  }
						: d
				)
			);
		}
		setDraggedDeal(null);
	};

	const handleAddDeal = () => {
		if (!newDeal.name || !newDeal.company || !newDeal.value) return;

		const deal: Deal = {
			id: `d${Date.now()}`,
			name: newDeal.name,
			company: newDeal.company,
			stage: newDeal.stage as DealStage,
			type: newDeal.type as DealType,
			sector: newDeal.sector || "Services",
			value: newDeal.value,
			probability: newDeal.probability || 20,
			advisor: newDeal.advisor || "",
			dueDate: newDeal.dueDate || "",
			lastActivity: new Date().toISOString().split("T")[0],
			notes: newDeal.notes || "",
			priority: newDeal.priority as "high" | "medium" | "low",
		};

		setDeals((prev) => [...prev, deal]);
		setNewDeal({
			stage: "sourcing",
			type: "sell-side",
			priority: "medium",
			probability: 20,
		});
		setIsNewDealOpen(false);
	};

	return (
		<div className="space-y-6 p-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-4">
					<Button variant="ghost" size="icon" asChild>
						<Link href="/admin/numbers">
							<ArrowLeft className="h-5 w-5" />
						</Link>
					</Button>
					<div>
						<h1 className="text-2xl font-bold flex items-center gap-2">
							<Kanban className="h-6 w-6" />
							Pipeline M&A
						</h1>
						<p className="text-muted-foreground">
							{pipelineStats.count} deals actifs pour{" "}
							{formatCurrency(pipelineStats.totalValue)} EUR
						</p>
					</div>
				</div>
				<div className="flex items-center gap-3">
					<DealSelector toolId="pipeline" compact />
					<CrossToolLinks currentTool="pipeline" variant="compact" />
					<Dialog open={isNewDealOpen} onOpenChange={setIsNewDealOpen}>
					<DialogTrigger asChild>
						<Button>
							<Plus className="h-4 w-4 mr-2" />
							Nouveau Deal
						</Button>
					</DialogTrigger>
					<DialogContent className="max-w-md">
						<DialogHeader>
							<DialogTitle>Nouveau Deal</DialogTitle>
							<DialogDescription>
								Ajoutez un nouveau deal au pipeline
							</DialogDescription>
						</DialogHeader>
						<div className="space-y-4">
							<div className="grid grid-cols-2 gap-4">
								<div className="space-y-2">
									<Label>Nom du projet</Label>
									<Input
										placeholder="Projet X"
										value={newDeal.name || ""}
										onChange={(e) =>
											setNewDeal((prev) => ({ ...prev, name: e.target.value }))
										}
									/>
								</div>
								<div className="space-y-2">
									<Label>Societe</Label>
									<Input
										placeholder="Company SAS"
										value={newDeal.company || ""}
										onChange={(e) =>
											setNewDeal((prev) => ({
												...prev,
												company: e.target.value,
											}))
										}
									/>
								</div>
							</div>
							<div className="grid grid-cols-2 gap-4">
								<div className="space-y-2">
									<Label>Type</Label>
									<Select
										value={newDeal.type}
										onValueChange={(v) =>
											setNewDeal((prev) => ({ ...prev, type: v as DealType }))
										}
									>
										<SelectTrigger>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="sell-side">Sell-side</SelectItem>
											<SelectItem value="buy-side">Buy-side</SelectItem>
										</SelectContent>
									</Select>
								</div>
								<div className="space-y-2">
									<Label>Secteur</Label>
									<Select
										value={newDeal.sector || "Services"}
										onValueChange={(v) =>
											setNewDeal((prev) => ({ ...prev, sector: v }))
										}
									>
										<SelectTrigger>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											{sectors.map((s) => (
												<SelectItem key={s} value={s}>
													{s}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>
							</div>
							<div className="grid grid-cols-2 gap-4">
								<div className="space-y-2">
									<Label>Valeur (EUR)</Label>
									<Input
										type="number"
										placeholder="10000000"
										value={newDeal.value || ""}
										onChange={(e) =>
											setNewDeal((prev) => ({
												...prev,
												value: parseFloat(e.target.value) || 0,
											}))
										}
									/>
								</div>
								<div className="space-y-2">
									<Label>Probabilite (%)</Label>
									<Input
										type="number"
										placeholder="20"
										value={newDeal.probability || ""}
										onChange={(e) =>
											setNewDeal((prev) => ({
												...prev,
												probability: parseInt(e.target.value) || 0,
											}))
										}
									/>
								</div>
							</div>
							<div className="space-y-2">
								<Label>Conseiller</Label>
								<Input
									placeholder="Nom du conseiller"
									value={newDeal.advisor || ""}
									onChange={(e) =>
										setNewDeal((prev) => ({ ...prev, advisor: e.target.value }))
									}
								/>
							</div>
							<Button onClick={handleAddDeal} className="w-full">
								Ajouter le deal
							</Button>
						</div>
					</DialogContent>
				</Dialog>
				</div>
			</div>

			{/* Stats Summary */}
			<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
				<Card>
					<CardContent className="pt-6">
						<div className="flex items-center gap-3">
							<div className="p-2 rounded-lg bg-blue-500/10">
								<Kanban className="h-5 w-5 text-blue-500" />
							</div>
							<div>
								<p className="text-2xl font-bold">{pipelineStats.count}</p>
								<p className="text-sm text-muted-foreground">Deals actifs</p>
							</div>
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="pt-6">
						<div className="flex items-center gap-3">
							<div className="p-2 rounded-lg bg-emerald-500/10">
								<Euro className="h-5 w-5 text-emerald-500" />
							</div>
							<div>
								<p className="text-2xl font-bold">
									{formatCurrency(pipelineStats.totalValue)}
								</p>
								<p className="text-sm text-muted-foreground">Valeur totale</p>
							</div>
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="pt-6">
						<div className="flex items-center gap-3">
							<div className="p-2 rounded-lg bg-amber-500/10">
								<TrendingUp className="h-5 w-5 text-amber-500" />
							</div>
							<div>
								<p className="text-2xl font-bold">
									{formatCurrency(pipelineStats.weightedValue)}
								</p>
								<p className="text-sm text-muted-foreground">Valeur ponderee</p>
							</div>
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="pt-6">
						<div className="flex items-center gap-3">
							<div className="p-2 rounded-lg bg-purple-500/10">
								<Target className="h-5 w-5 text-purple-500" />
							</div>
							<div>
								<p className="text-2xl font-bold">
									{pipelineStats.avgProbability.toFixed(0)}%
								</p>
								<p className="text-sm text-muted-foreground">Proba. moyenne</p>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Filters */}
			<Card>
				<CardContent className="pt-6">
					<div className="flex flex-col md:flex-row gap-4">
						<div className="relative flex-1">
							<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
							<Input
								placeholder="Rechercher un deal..."
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								className="pl-9"
							/>
						</div>
						<Select value={sectorFilter} onValueChange={setSectorFilter}>
							<SelectTrigger className="w-[180px]">
								<Building2 className="h-4 w-4 mr-2" />
								<SelectValue placeholder="Secteur" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">Tous les secteurs</SelectItem>
								{sectors.map((s) => (
									<SelectItem key={s} value={s}>
										{s}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						<Select value={typeFilter} onValueChange={setTypeFilter}>
							<SelectTrigger className="w-[150px]">
								<Filter className="h-4 w-4 mr-2" />
								<SelectValue placeholder="Type" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">Tous les types</SelectItem>
								<SelectItem value="sell-side">Sell-side</SelectItem>
								<SelectItem value="buy-side">Buy-side</SelectItem>
							</SelectContent>
						</Select>
					</div>
				</CardContent>
			</Card>

			{/* Kanban Board */}
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
				{stages.map((stage) => {
					const config = stageConfig[stage];
					const stats = stageStats[stage];
					const stageDeals = filteredDeals.filter((d) => d.stage === stage);

					return (
						<div
							key={stage}
							className="flex flex-col"
							onDragOver={handleDragOver}
							onDrop={() => handleDrop(stage)}
						>
							{/* Stage Header */}
							<div
								className={`p-3 rounded-t-lg ${config.color} text-white`}
							>
								<div className="flex items-center justify-between">
									<span className="font-medium text-sm">{config.label}</span>
									<Badge variant="secondary" className="bg-white/20 text-white">
										{stats?.count || 0}
									</Badge>
								</div>
								<p className="text-xs opacity-80 mt-1">
									{formatCurrency(stats?.value || 0)} EUR
								</p>
							</div>

							{/* Stage Content */}
							<div className="flex-1 min-h-[300px] bg-muted/30 rounded-b-lg p-2 space-y-2 border border-t-0">
								{stageDeals.map((deal) => (
									<Card
										key={deal.id}
										draggable
										onDragStart={() => handleDragStart(deal)}
										className={`cursor-grab hover:shadow-md transition-shadow ${
											draggedDeal?.id === deal.id ? "opacity-50" : ""
										} ${
											deal.priority === "high"
												? "border-l-4 border-l-red-500"
												: deal.priority === "medium"
												? "border-l-4 border-l-amber-500"
												: ""
										}`}
									>
										<CardContent className="p-3">
											<div className="space-y-2">
												<div className="flex items-start justify-between">
													<div>
														<p className="font-medium text-sm">{deal.name}</p>
														<p className="text-xs text-muted-foreground">
															{deal.company}
														</p>
													</div>
													<Badge
														variant="outline"
														className={
															deal.type === "sell-side"
																? "bg-emerald-500/10 text-emerald-600"
																: "bg-blue-500/10 text-blue-600"
														}
													>
														{deal.type === "sell-side" ? "Sell" : "Buy"}
													</Badge>
												</div>

												<div className="flex items-center gap-2 text-xs text-muted-foreground">
													<Euro className="h-3 w-3" />
													<span>{formatCurrency(deal.value)}</span>
													<span className="mx-1">|</span>
													<span>{deal.probability}%</span>
												</div>

												<div className="flex items-center gap-2 text-xs text-muted-foreground">
													<Building2 className="h-3 w-3" />
													<span>{deal.sector}</span>
												</div>

												{deal.advisor && (
													<div className="flex items-center gap-2 text-xs text-muted-foreground">
														<User className="h-3 w-3" />
														<span>{deal.advisor}</span>
													</div>
												)}
											</div>
										</CardContent>
									</Card>
								))}

								{stageDeals.length === 0 && (
									<div className="flex items-center justify-center h-20 text-muted-foreground text-sm">
										Aucun deal
									</div>
								)}
							</div>
						</div>
					);
				})}
			</div>
		</div>
	);
}
