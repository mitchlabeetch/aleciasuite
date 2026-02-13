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
import { useState, useEffect } from "react";
import { listDeals, createDeal as createDealAction, updateDealStage, type DealStage } from "@/actions/deals";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "./ui/dialog";
import { ScrollArea } from "./ui/scroll-area";

interface Deal {
	id: string; // Now uses unified deals table
	title: string; // Renamed from 'company' to match unified schema
	stage: DealStage;
	amount?: string | null; // DB returns string | null
	leadName?: string; // Lead contact name
	createdAt: number;
	updatedAt: number;
}

// Format amount for display
const formatAmount = (amount?: string | null): string | undefined => {
	if (!amount) return undefined;
	const num = parseFloat(amount);
	if (isNaN(num)) return undefined;
	if (num >= 1000000) {
		return `${(num / 1000000).toFixed(1)}M €`;
	}
	if (num >= 1000) {
		return `${(num / 1000).toFixed(0)}K €`;
	}
	return `${num} €`;
};

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
	},
	{
		id: "mock-2",
		title: "HealthCare Solutions",
		stage: "negotiation",
		amount: "50000000",
		leadName: "Jane Smith",
		createdAt: Date.now(),
		updatedAt: Date.now(),
	},
	{
		id: "mock-3",
		title: "FinTech Innovations",
		stage: "sourcing",
		amount: "15000000",
		leadName: "Mike Johnson",
		createdAt: Date.now(),
		updatedAt: Date.now(),
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
	sourcing: "Sourcing",
	qualification: "Qualification",
	initial_meeting: "Initial Meeting",
	analysis: "Analysis",
	valuation: "Valuation",
	due_diligence: "Due Diligence",
	negotiation: "Negotiation",
	closing: "Closing",
	closed_won: "Won",
	closed_lost: "Lost",
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
	const [selectedStage, setSelectedStage] = useState<DealStage | null>(null);
	const [isCreateOpen, setIsCreateOpen] = useState(false);
	const [newDealCompany, setNewDealCompany] = useState("");
	const [newDealValuation, setNewDealValuation] = useState("");
	const [newDealLead, setNewDealLead] = useState("");
	const [deals, setDeals] = useState<Deal[]>(mockDeals);
	const [isLoading, setIsLoading] = useState(false);

	// Try to use Convex, fallback to mock data
	const isConvexConfigured = !!process.env.NEXT_PUBLIC_CONVEX_URL;

	// Load deals on mount
	useEffect(() => {
		if (!isConvexConfigured) return;
		async function loadDeals() {
			setIsLoading(true);
			try {
				const result = await listDeals({});
				// Cast to any - DB returns Date but component expects number
				setDeals(result as any);
			} catch (error) {
				console.error("Failed to load deals:", error);
				setDeals(mockDeals);
			} finally {
				setIsLoading(false);
			}
		}
		loadDeals();
	}, [isConvexConfigured]);

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

		try {
			const newDeal = await createDealAction({
				title: newDealCompany, // 'company' renamed to 'title' in unified schema
				stage: "sourcing",
				amount: parseValuation(newDealValuation)?.toString(),
			});
			setDeals((prev) => [...prev, newDeal as any]);
			setNewDealCompany("");
			setNewDealValuation("");
			setNewDealLead("");
			setIsCreateOpen(false);
		} catch (error) {
			if (process.env.NODE_ENV === "development") {
				console.error("Failed to create deal:", error);
			}
		}
	};

	const handleMoveToNextStage = async (deal: Deal) => {
		const currentIndex = pipelineStages.indexOf(deal.stage);
		if (currentIndex === -1 || currentIndex >= pipelineStages.length - 1)
			return;

		const nextStage = pipelineStages[currentIndex + 1];

		try {
			// This will trigger a re-render with the new stage
			await updateDealStage(deal.id, nextStage);
			setDeals((prev) =>
				prev.map((d) => (d.id === deal.id ? { ...d, stage: nextStage } : d))
			);
		} catch (error) {
			if (process.env.NODE_ENV === "development") {
				console.error("Failed to move deal:", error);
			}
			// Convex will automatically revert on error through its reactivity
		}
	};

	const formatDate = (timestamp: number) => {
		return new Date(timestamp).toLocaleDateString();
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
			<div className="flex items-center justify-between">
				<h2 className="text-2xl font-bold flex items-center gap-2">
					<Briefcase className="h-6 w-6" />
					Deal Pipeline
					{!isConvexConfigured && (
						<Badge variant="outline" className="ml-2 text-xs">
							Demo Mode
						</Badge>
					)}
				</h2>
				<Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
					<DialogTrigger asChild>
						<Button disabled={!isConvexConfigured}>
							<Plus className="h-4 w-4 mr-2" />
							New Deal
						</Button>
					</DialogTrigger>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>Create New Deal</DialogTitle>
						</DialogHeader>
						<div className="space-y-4 pt-4">
							<div>
								<label htmlFor="deal-company" className="text-sm font-medium">
									Company Name *
								</label>
								<input
									id="deal-company"
									type="text"
									value={newDealCompany}
									onChange={(e) => setNewDealCompany(e.target.value)}
									className="w-full mt-1 px-3 py-2 border rounded-md"
									placeholder="Enter company name"
								/>
							</div>
							<div>
								<label htmlFor="deal-valuation" className="text-sm font-medium">
									Valuation
								</label>
								<input
									id="deal-valuation"
									type="text"
									value={newDealValuation}
									onChange={(e) => setNewDealValuation(e.target.value)}
									className="w-full mt-1 px-3 py-2 border rounded-md"
									placeholder="e.g., $10M"
								/>
							</div>
							<div>
								<label htmlFor="deal-lead" className="text-sm font-medium">
									Deal Lead
								</label>
								<input
									id="deal-lead"
									type="text"
									value={newDealLead}
									onChange={(e) => setNewDealLead(e.target.value)}
									className="w-full mt-1 px-3 py-2 border rounded-md"
									placeholder="Lead person name"
								/>
							</div>
							<Button onClick={handleCreateDeal} className="w-full">
								Create Deal
							</Button>
						</div>
					</DialogContent>
				</Dialog>
			</div>

			{/* Stage Summary */}
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

			{/* Deal Cards */}
			<ScrollArea className="h-[500px]">
				<div className="space-y-3">
					{filteredDeals.length === 0 ? (
						<div className="text-center py-8 text-muted-foreground">
							No deals found.{" "}
							{isConvexConfigured
								? "Create a new deal to get started."
								: "Configure Convex to enable persistence."}
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

											<Badge className={stageColors[deal.stage]}>
												{stageLabels[deal.stage]}
											</Badge>
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
		</div>
	);
}
