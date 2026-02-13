"use client";

import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { listChecklists, getDeals, listTemplates, createChecklist } from "@/actions";
import {
	CheckCircle2,
	Clock,
	ClipboardList,
	FileText,
	Loader2,
	Plus,
	Search,
	TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

type ChecklistStatus = "not_started" | "in_progress" | "review" | "complete";

interface Checklist {
	_id: string;
	dealId: string;
	templateId?: string;
	name: string;
	status: ChecklistStatus;
	progress: number;
	createdAt: number;
	updatedAt: number;
}

interface Deal {
	_id: string;
	title: string;
}

interface Template {
	_id: string;
	name: string;
	category: string;
}

const statusConfig: Record<
	ChecklistStatus,
	{ label: string; color: string; icon: React.ElementType }
> = {
	not_started: {
		label: "Not Started",
		color: "bg-gray-100 text-gray-800",
		icon: Clock,
	},
	in_progress: {
		label: "In Progress",
		color: "bg-blue-100 text-blue-800",
		icon: TrendingUp,
	},
	review: {
		label: "Under Review",
		color: "bg-yellow-100 text-yellow-800",
		icon: FileText,
	},
	complete: {
		label: "Complete",
		color: "bg-green-100 text-green-800",
		icon: CheckCircle2,
	},
};

export default function DDChecklistsPage() {
	const router = useRouter();
	const [checklists, setChecklists] = useState<Checklist[] | null>(null);
	const [deals, setDeals] = useState<Deal[] | null>(null);
	const [templates, setTemplates] = useState<Template[] | null>(null);

	const [isCreateOpen, setIsCreateOpen] = useState(false);
	const [creating, setCreating] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");
	const [statusFilter, setStatusFilter] = useState<string>("all");

	// Form state
	const [newName, setNewName] = useState("");
	const [selectedDeal, setSelectedDeal] = useState<string>("");
	const [selectedTemplate, setSelectedTemplate] = useState<string>("");

	// Load data on mount
	useEffect(() => {
		listChecklists().then(data => setChecklists((data ?? null) as any));
		getDeals().then(data => setDeals((data ?? null) as any));
		listTemplates().then(data => setTemplates((data ?? null) as any));
	}, []);

	const handleCreate = async () => {
		if (!newName.trim() || !selectedDeal) return;

		setCreating(true);
		try {
			await createChecklist({
				name: newName.trim(),
				dealId: selectedDeal,
				category: "other",
			});
			setIsCreateOpen(false);
			setNewName("");
			setSelectedDeal("");
			setSelectedTemplate("");
			// Refresh data
			listChecklists().then(data => setChecklists((data ?? null) as any));
			router.refresh();
		} catch (error) {
			console.error("Failed to create checklist:", error);
		} finally {
			setCreating(false);
		}
	};

	// Filter checklists
	const filteredChecklists = (checklists ?? []).filter((c: Checklist) => {
		const matchesSearch = c.name
			.toLowerCase()
			.includes(searchQuery.toLowerCase());
		const matchesStatus = statusFilter === "all" || c.status === statusFilter;
		return matchesSearch && matchesStatus;
	});

	// Get deal name helper
	const getDealName = (dealId: string) => {
		const deal = deals?.find((d: Deal) => d._id === dealId);
		return deal?.title ?? "Unknown Deal";
	};

	if (checklists === null) {
		return (
			<div className="flex items-center justify-center h-64">
				<Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
			</div>
		);
	}

	return (
		<div className="space-y-6 p-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold flex items-center gap-2">
						<ClipboardList className="w-6 h-6" />
						Due Diligence Checklists
					</h1>
					<p className="text-muted-foreground mt-1">
						Track and manage due diligence items for M&A transactions
					</p>
				</div>

				<Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
					<DialogTrigger asChild>
						<Button>
							<Plus className="w-4 h-4 mr-2" />
							New Checklist
						</Button>
					</DialogTrigger>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>Create DD Checklist</DialogTitle>
							<DialogDescription>
								Start a new due diligence checklist for a deal
							</DialogDescription>
						</DialogHeader>

						<div className="space-y-4 py-4">
							<div className="space-y-2">
								<Label htmlFor="name">Checklist Name</Label>
								<Input
									id="name"
									placeholder="e.g., Project Alpha - Sell-Side DD"
									value={newName}
									onChange={(e) => setNewName(e.target.value)}
								/>
							</div>

							<div className="space-y-2">
								<Label htmlFor="deal">Associated Deal</Label>
								<Select value={selectedDeal} onValueChange={setSelectedDeal}>
									<SelectTrigger>
										<SelectValue placeholder="Select a deal" />
									</SelectTrigger>
									<SelectContent>
										{deals?.map((deal: Deal) => (
											<SelectItem key={deal._id} value={deal._id}>
												{deal.title}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>

							<div className="space-y-2">
								<Label htmlFor="template">Template (Optional)</Label>
								<Select
									value={selectedTemplate}
									onValueChange={setSelectedTemplate}
								>
									<SelectTrigger>
										<SelectValue placeholder="Start from scratch or use template" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="">No template (blank)</SelectItem>
										{templates?.map((t: Template) => (
											<SelectItem key={t._id} value={t._id}>
												{t.name}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
								<p className="text-xs text-muted-foreground">
									Templates include pre-defined DD items based on industry
									standards
								</p>
							</div>
						</div>

						<DialogFooter>
							<Button variant="outline" onClick={() => setIsCreateOpen(false)}>
								Cancel
							</Button>
							<Button
								onClick={handleCreate}
								disabled={!newName.trim() || !selectedDeal || creating}
							>
								{creating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
								Create Checklist
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>
			</div>

			{/* Stats */}
			<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-sm font-medium text-muted-foreground">
							Total Checklists
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{checklists.length}</div>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-sm font-medium text-muted-foreground">
							In Progress
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold text-blue-600">
							{
								checklists.filter((c: Checklist) => c.status === "in_progress")
									.length
							}
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-sm font-medium text-muted-foreground">
							Under Review
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold text-yellow-600">
							{
								checklists.filter((c: Checklist) => c.status === "review")
									.length
							}
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-sm font-medium text-muted-foreground">
							Completed
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold text-green-600">
							{
								checklists.filter((c: Checklist) => c.status === "complete")
									.length
							}
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Filters */}
			<div className="flex items-center gap-4">
				<div className="relative flex-1 max-w-sm">
					<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
					<Input
						placeholder="Search checklists..."
						className="pl-9"
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
					/>
				</div>
				<Select value={statusFilter} onValueChange={setStatusFilter}>
					<SelectTrigger className="w-45">
						<SelectValue placeholder="Filter by status" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">All Statuses</SelectItem>
						<SelectItem value="not_started">Not Started</SelectItem>
						<SelectItem value="in_progress">In Progress</SelectItem>
						<SelectItem value="review">Under Review</SelectItem>
						<SelectItem value="complete">Complete</SelectItem>
					</SelectContent>
				</Select>
			</div>

			{/* Checklist Grid */}
			{filteredChecklists.length === 0 ? (
				<Card className="border-dashed">
					<CardContent className="flex flex-col items-center justify-center py-12">
						<ClipboardList className="w-12 h-12 text-muted-foreground mb-4" />
						<h3 className="text-lg font-medium mb-2">No checklists found</h3>
						<p className="text-muted-foreground text-center max-w-sm mb-4">
							{checklists.length === 0
								? "Create your first DD checklist to start tracking due diligence items."
								: "No checklists match your search criteria."}
						</p>
						{checklists.length === 0 && (
							<Button onClick={() => setIsCreateOpen(true)}>
								<Plus className="w-4 h-4 mr-2" />
								Create Checklist
							</Button>
						)}
					</CardContent>
				</Card>
			) : (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
					{filteredChecklists.map((checklist: Checklist) => {
						const StatusIcon = statusConfig[checklist.status].icon;
						return (
							<Link
								key={checklist._id}
								href={`/admin/dd-checklists/${checklist._id}`}
							>
								<Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
									<CardHeader className="pb-2">
										<div className="flex items-start justify-between">
											<div className="flex-1 min-w-0">
												<CardTitle className="text-base truncate">
													{checklist.name}
												</CardTitle>
												<CardDescription className="truncate">
													{getDealName(checklist.dealId)}
												</CardDescription>
											</div>
											<span
												className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusConfig[checklist.status].color}`}
											>
												<StatusIcon className="w-3 h-3" />
												{statusConfig[checklist.status].label}
											</span>
										</div>
									</CardHeader>
									<CardContent>
										{/* Progress bar */}
										<div className="space-y-2">
											<div className="flex items-center justify-between text-sm">
												<span className="text-muted-foreground">Progress</span>
												<span className="font-medium">
													{checklist.progress}%
												</span>
											</div>
											<div className="h-2 bg-muted rounded-full overflow-hidden">
												<div
													className={`h-full transition-all duration-300 ${
														checklist.progress === 100
															? "bg-green-500"
															: checklist.progress > 50
																? "bg-blue-500"
																: "bg-yellow-500"
													}`}
													style={{ width: `${checklist.progress}%` }}
												/>
											</div>
										</div>

										{/* Last updated */}
										<p className="text-xs text-muted-foreground mt-4">
											Updated{" "}
											{new Date(checklist.updatedAt).toLocaleDateString()}
										</p>
									</CardContent>
								</Card>
							</Link>
						);
					})}
				</div>
			)}
		</div>
	);
}
