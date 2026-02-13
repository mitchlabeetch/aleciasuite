"use client";

import {
	ArrowRight,
	Briefcase,
	Building,
	Calendar,
	DollarSign,
	Loader2,
	MoreVertical,
	Plus,
	TrendingUp,
} from "lucide-react";
import { useEffect, useState } from "react";
import { listDeals, createDeal as createDealAction, updateDealStage, type DealStage } from "@/actions/deals";
import { Badge } from "../tailwind/ui/badge";
import { Button } from "../tailwind/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../tailwind/ui/card";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "../tailwind/ui/dialog";
import { ScrollArea } from "../tailwind/ui/scroll-area";

import DealFlowCanvas from "../deal-flow/DealFlowCanvas";
import { CalendarView } from "./CalendarView";
import { TableView } from "./TableView";
// Multi-view components
import { ViewSwitcher, type ViewType } from "./ViewSwitcher";

import { fr } from "@/lib/i18n";

interface Deal {
	id: string;
	title: string; // Renamed from 'company' to match unified schema
	stage: DealStage;
	amount?: string | null; // DB returns string | null
	leadName?: string; // Renamed from lead
	createdAt: number;
	updatedAt: number;
	expectedCloseDate?: number; // Renamed from dueDate
	priority?: "high" | "medium" | "low";
	tags?: string[];
}

// Mock deals as fallback when Convex is not available
const mockDeals: Deal[] = [
	{
		id: "mock-1",
		title: "TechVenture Inc.",
		stage: "due_diligence",
		amount: "25000000",
		leadName: "John Doe",
		createdAt: Date.now(),
		updatedAt: Date.now(),
		priority: "high",
	},
	{
		id: "mock-2",
		title: "HealthCare Solutions",
		stage: "negotiation",
		amount: "50000000",
		leadName: "Jane Smith",
		createdAt: Date.now(),
		updatedAt: Date.now(),
		priority: "medium",
	},
	{
		id: "mock-3",
		title: "FinTech Innovations",
		stage: "sourcing",
		amount: "15000000",
		leadName: "Mike Johnson",
		createdAt: Date.now(),
		updatedAt: Date.now(),
		expectedCloseDate: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days from now
	},
];

const stageColors: Record<DealStage, string> = {
	sourcing: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100",
	qualification:
		"bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-100",
	initial_meeting:
		"bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-100",
	analysis:
		"bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-100",
	valuation:
		"bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-100",
	due_diligence:
		"bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100",
	negotiation:
		"bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100",
	closing:
		"bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100",
	closed_won:
		"bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
	closed_lost: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100",
};

const stageLabels: Record<DealStage, string> = {
	sourcing: fr.pipeline.stages.sourcing,
	qualification: "Qualification",
	initial_meeting: "Première rencontre",
	analysis: "Analyse",
	valuation: "Valorisation",
	due_diligence: fr.pipeline.stages.dueDiligence,
	negotiation: fr.pipeline.stages.negotiation,
	closing: fr.pipeline.stages.closing,
	closed_won: fr.pipeline.stages.closedWon,
	closed_lost: fr.pipeline.stages.closedLost,
};

// Pipeline stages for visualization (active deals only)
const pipelineStages: DealStage[] = [
	"sourcing",
	"qualification",
	"initial_meeting",
	"analysis",
	"valuation",
	"due_diligence",
	"negotiation",
	"closing",
];

export default function DealPipeline() {
	// View state with URL persistence
	const [currentView, setCurrentView] = useState<ViewType>("kanban");
	const [isCreateOpen, setIsCreateOpen] = useState(false);
	const [newDealCompany, setNewDealCompany] = useState("");
	const [newDealValuation, setNewDealValuation] = useState("");
	const [newDealLead, setNewDealLead] = useState("");
	const [selectedStage, setSelectedStage] = useState<DealStage | null>(null);
	const [deals, setDeals] = useState<Deal[]>(mockDeals);
	const [isLoading, setIsLoading] = useState(false);

	// Read view from URL on mount
	useEffect(() => {
		if (typeof window !== "undefined") {
			const params = new URLSearchParams(window.location.search);
			const view = params.get("view") as ViewType;
			if (view && ["kanban", "table", "calendar", "flow"].includes(view)) {
				setCurrentView(view);
			}
		}
	}, []);

	// Load deals on mount
	useEffect(() => {
		async function loadDeals() {
			setIsLoading(true);
			try {
				const result = await listDeals({});
				// Transform the result to match the Deal interface (removes nested relations)
				setDeals(result as any);
			} catch (error) {
				console.error("Failed to load deals:", error);
				setDeals(mockDeals);
			} finally {
				setIsLoading(false);
			}
		}
		loadDeals();
	}, []);

	// Update URL when view changes
	const handleViewChange = (view: ViewType) => {
		setCurrentView(view);
		if (typeof window !== "undefined") {
			const url = new URL(window.location.href);
			url.searchParams.set("view", view);
			window.history.replaceState({}, "", url.toString());
		}
	};

	const isConvexConfigured = !!process.env.NEXT_PUBLIC_CONVEX_URL;

	const filteredDeals = selectedStage
		? deals.filter((deal) => deal.stage === selectedStage)
		: deals.filter(
				(deal) =>
					!["closed_won", "closed_lost", "completed"].includes(deal.stage),
			);

	const dealsByStage = pipelineStages.reduce(
		(acc, stage) => {
			acc[stage] = deals.filter((d) => d.stage === stage).length;
			return acc;
		},
		{} as Record<DealStage, number>,
	);

	const handleCreateDeal = async () => {
		if (!newDealCompany.trim()) return;
		try {
			const newDeal = await createDealAction({
				title: newDealCompany, // 'company' renamed to 'title' in unified schema
				stage: "sourcing",
				amount: newDealValuation ? parseValuation(newDealValuation)?.toString() : undefined,
			});
			setDeals((prev) => [...prev, newDeal as any]);
			setNewDealCompany("");
			setNewDealValuation("");
			setNewDealLead("");
			setIsCreateOpen(false);
		} catch (error) {
			console.error("Failed to create deal:", error);
		}
	};

	// Helper to parse valuation string
	const parseValuation = (val: string): number | undefined => {
		if (!val) return undefined;
		const cleaned = val.replace(/[€$,\s]/g, "");
		const match = cleaned.match(/(\d+(?:\.\d+)?)\s*(m|k)?/i);
		if (match) {
			const num = parseFloat(match[1]);
			const unit = match[2]?.toLowerCase();
			if (unit === "m") return num * 1000000;
			if (unit === "k") return num * 1000;
			return num;
		}
		return undefined;
	};

	const handleMoveToNextStage = async (deal: Deal) => {
		const currentIndex = pipelineStages.indexOf(deal.stage);
		if (currentIndex === -1 || currentIndex >= pipelineStages.length - 1)
			return;
		const nextStage = pipelineStages[currentIndex + 1];
		try {
			await updateDealStage(deal.id, nextStage);
			setDeals((prev) =>
				prev.map((d) => (d.id === deal.id ? { ...d, stage: nextStage } : d))
			);
		} catch (error) {
			console.error("Failed to move deal:", error);
		}
	};

	const formatDate = (timestamp: number) =>
		new Date(timestamp).toLocaleDateString();

	const formatAmount = (amount: string | null | undefined) => {
		if (!amount) return "N/A";
		const num = parseFloat(amount);
		if (isNaN(num)) return "N/A";
		if (num >= 1000000) {
			return `${(num / 1000000).toFixed(1)}M€`;
		}
		if (num >= 1000) {
			return `${(num / 1000).toFixed(0)}K€`;
		}
		return `${num}€`;
	};

	if (isLoading) {
		return (
			<div className="flex items-center justify-center h-[400px]">
				<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
			</div>
		);
	}

	return (
		<div className="space-y-4">
			{/* Header */}
			<div className="flex items-center justify-between flex-wrap gap-4">
				<div className="flex items-center gap-4">
					<h2 className="text-2xl font-bold flex items-center gap-2">
						<Briefcase className="h-6 w-6" />
						{fr.pipeline.title}
					</h2>
					{!isConvexConfigured && (
						<Badge variant="outline" className="text-xs">
							{fr.pipeline.demoMode}
						</Badge>
					)}
				</div>

				<div className="flex items-center gap-3">
					<ViewSwitcher
						currentView={currentView}
						onViewChange={handleViewChange}
						showFlowView={true}
					/>

					<Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
						<DialogTrigger asChild>
							<Button disabled={!isConvexConfigured}>
								<Plus className="h-4 w-4 mr-2" />
								{fr.actions.newDeal}
							</Button>
						</DialogTrigger>
						<DialogContent>
							<DialogHeader>
								<DialogTitle>{fr.pipeline.createDeal}</DialogTitle>
							</DialogHeader>
							<div className="space-y-4 pt-4">
								<div>
									<label htmlFor="company-name" className="text-sm font-medium">
										{fr.pipeline.fields.companyName} *
									</label>
									<input
										id="company-name"
										type="text"
										value={newDealCompany}
										onChange={(e) => setNewDealCompany(e.target.value)}
										className="w-full mt-1 px-3 py-2 border rounded-md"
										placeholder={fr.form.enterValue}
									/>
								</div>
								<div>
									<label htmlFor="valuation" className="text-sm font-medium">
										{fr.pipeline.fields.valuation}
									</label>
									<input
										id="valuation"
										type="text"
										value={newDealValuation}
										onChange={(e) => setNewDealValuation(e.target.value)}
										className="w-full mt-1 px-3 py-2 border rounded-md"
										placeholder="ex: 10 m€"
									/>
								</div>
								<div>
									<label htmlFor="deal-lead" className="text-sm font-medium">
										{fr.pipeline.fields.dealLead}
									</label>
									<input
										id="deal-lead"
										type="text"
										value={newDealLead}
										onChange={(e) => setNewDealLead(e.target.value)}
										className="w-full mt-1 px-3 py-2 border rounded-md"
										placeholder={fr.form.enterValue}
									/>
								</div>
								<Button onClick={handleCreateDeal} className="w-full">
									{fr.pipeline.createDeal}
								</Button>
							</div>
						</DialogContent>
					</Dialog>
				</div>
			</div>

			{/* Stage Summary (only for Kanban) */}
			{currentView === "kanban" && (
				<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
					{pipelineStages.map((stage) => (
						<Card
							key={stage}
							className={`cursor-pointer transition-all hover:shadow-md ${
								selectedStage === stage ? "ring-2 ring-primary" : ""
							}`}
							onClick={() =>
								setSelectedStage(selectedStage === stage ? null : stage)
							}
						>
							<CardHeader className="pb-2">
								<CardTitle className="text-sm font-medium">
									{stageLabels[stage]}
								</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="text-2xl font-bold">
									{dealsByStage[stage] || 0}
								</div>
							</CardContent>
						</Card>
					))}
				</div>
			)}

			{/* View Content */}
			{currentView === "kanban" && (
				<ScrollArea className="h-[500px]">
					<div className="space-y-3">
						{filteredDeals.length === 0 ? (
							<div className="text-center py-8 text-muted-foreground">
								{fr.pipeline.noDealsFound}
							</div>
						) : (
							filteredDeals.map((deal) => (
								<Card key={deal.id} className="hover:shadow-md transition-all">
									<CardContent className="p-4">
										<div className="flex items-start justify-between">
											<div className="space-y-2 flex-1">
												<div className="flex items-center gap-2">
													<Building className="h-4 w-4 text-muted-foreground" />
													<h3 className="font-semibold">{deal.title}</h3>
												</div>
												<div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
													{deal.amount && (
														<div className="flex items-center gap-1">
															<DollarSign className="h-3 w-3" />
															<span>{formatAmount(deal.amount)}</span>
														</div>
													)}
													{deal.leadName && (
														<div className="flex items-center gap-1">
															<TrendingUp className="h-3 w-3" />
															<span>{deal.leadName}</span>
														</div>
													)}
													<div className="flex items-center gap-1">
														<Calendar className="h-3 w-3" />
														<span>{formatDate(deal.createdAt)}</span>
													</div>
												</div>
												<div className="flex gap-2 flex-wrap">
													<Badge className={stageColors[deal.stage]}>
														{stageLabels[deal.stage]}
													</Badge>
													{deal.priority && (
														<Badge variant="outline" className="capitalize">
															{deal.priority}
														</Badge>
													)}
												</div>
											</div>
											<div className="flex gap-2">
												{isConvexConfigured &&
													pipelineStages.indexOf(deal.stage) <
														pipelineStages.length - 1 && (
														<Button
															variant="ghost"
															size="icon"
															onClick={() => handleMoveToNextStage(deal)}
															title="Move to next stage"
														>
															<ArrowRight className="h-4 w-4" />
														</Button>
													)}
												<Button variant="ghost" size="icon">
													<MoreVertical className="h-4 w-4" />
												</Button>
											</div>
										</div>
									</CardContent>
								</Card>
							))
						)}
					</div>
				</ScrollArea>
			)}

			{currentView === "table" && <TableView deals={deals} />}

			{currentView === "calendar" && <CalendarView deals={deals} />}

			{currentView === "flow" && <DealFlowCanvas />}
		</div>
	);
}
