"use client";

/**
 * Due Diligence Checklist
 *
 * Interactive checklist with:
 * - 49 DD items organized by category
 * - Status tracking (A faire, En cours, Termine, Bloque)
 * - Priority levels
 * - Progress statistics
 * - Red flag identification
 */

import { useState, useMemo, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	ClipboardCheck,
	ArrowLeft,
	Download,
	Save,
	Plus,
	Search,
	Filter,
	AlertTriangle,
	CheckCircle2,
	Clock,
	XCircle,
	Circle,
	ChevronDown,
	ChevronRight,
	Loader2,
	FolderOpen,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import { DealSelector } from "@/components/numbers/deal-selector";
import { listChecklists } from "@/actions/dd-checklists";
import { numbersTools } from "@/actions";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";

type DDStatus = "todo" | "in_progress" | "completed" | "blocked";
type DDPriority = "high" | "medium" | "low";

interface DDItem {
	id: string;
	category: string;
	item: string;
	status: DDStatus;
	priority: DDPriority;
	responsible: string;
	dueDate: string;
	completedDate: string;
	documents: string;
	comments: string;
	redFlag: boolean;
}

interface DDCategory {
	id: string;
	name: string;
	icon: string;
	items: DDItem[];
}

const statusConfig = {
	todo: { label: "A faire", color: "bg-gray-500", icon: Circle },
	in_progress: { label: "En cours", color: "bg-blue-500", icon: Clock },
	completed: { label: "Termine", color: "bg-emerald-500", icon: CheckCircle2 },
	blocked: { label: "Bloque", color: "bg-red-500", icon: XCircle },
};

const priorityConfig = {
	high: { label: "Haute", color: "text-red-500 bg-red-500/10" },
	medium: { label: "Moyenne", color: "text-amber-500 bg-amber-500/10" },
	low: { label: "Basse", color: "text-gray-500 bg-gray-500/10" },
};

const defaultCategories: DDCategory[] = [
	{
		id: "juridique",
		name: "Juridique & Corporate",
		icon: "⚖️",
		items: [
			{ id: "j1", category: "juridique", item: "Statuts et modifications", status: "todo", priority: "high", responsible: "", dueDate: "", completedDate: "", documents: "", comments: "", redFlag: false },
			{ id: "j2", category: "juridique", item: "PV d'AG et CA (3 ans)", status: "todo", priority: "high", responsible: "", dueDate: "", completedDate: "", documents: "", comments: "", redFlag: false },
			{ id: "j3", category: "juridique", item: "Kbis et extrait RCS", status: "todo", priority: "high", responsible: "", dueDate: "", completedDate: "", documents: "", comments: "", redFlag: false },
			{ id: "j4", category: "juridique", item: "Pacte d'actionnaires", status: "todo", priority: "high", responsible: "", dueDate: "", completedDate: "", documents: "", comments: "", redFlag: false },
			{ id: "j5", category: "juridique", item: "Contrats significatifs", status: "todo", priority: "high", responsible: "", dueDate: "", completedDate: "", documents: "", comments: "", redFlag: false },
			{ id: "j6", category: "juridique", item: "Litiges en cours", status: "todo", priority: "high", responsible: "", dueDate: "", completedDate: "", documents: "", comments: "", redFlag: false },
			{ id: "j7", category: "juridique", item: "Propriete intellectuelle", status: "todo", priority: "medium", responsible: "", dueDate: "", completedDate: "", documents: "", comments: "", redFlag: false },
		],
	},
	{
		id: "financier",
		name: "Financier & Comptable",
		icon: "💰",
		items: [
			{ id: "f1", category: "financier", item: "Bilans et comptes de resultat (3 ans)", status: "todo", priority: "high", responsible: "", dueDate: "", completedDate: "", documents: "", comments: "", redFlag: false },
			{ id: "f2", category: "financier", item: "Rapports CAC", status: "todo", priority: "high", responsible: "", dueDate: "", completedDate: "", documents: "", comments: "", redFlag: false },
			{ id: "f3", category: "financier", item: "Situation intermediaire", status: "todo", priority: "high", responsible: "", dueDate: "", completedDate: "", documents: "", comments: "", redFlag: false },
			{ id: "f4", category: "financier", item: "Detail BFR", status: "todo", priority: "high", responsible: "", dueDate: "", completedDate: "", documents: "", comments: "", redFlag: false },
			{ id: "f5", category: "financier", item: "Tableau de flux de tresorerie", status: "todo", priority: "medium", responsible: "", dueDate: "", completedDate: "", documents: "", comments: "", redFlag: false },
			{ id: "f6", category: "financier", item: "Budget et previsionnel", status: "todo", priority: "medium", responsible: "", dueDate: "", completedDate: "", documents: "", comments: "", redFlag: false },
			{ id: "f7", category: "financier", item: "Detail des dettes financieres", status: "todo", priority: "high", responsible: "", dueDate: "", completedDate: "", documents: "", comments: "", redFlag: false },
			{ id: "f8", category: "financier", item: "Engagements hors bilan", status: "todo", priority: "high", responsible: "", dueDate: "", completedDate: "", documents: "", comments: "", redFlag: false },
		],
	},
	{
		id: "fiscal",
		name: "Fiscal",
		icon: "🏛️",
		items: [
			{ id: "t1", category: "fiscal", item: "Declarations fiscales (3 ans)", status: "todo", priority: "high", responsible: "", dueDate: "", completedDate: "", documents: "", comments: "", redFlag: false },
			{ id: "t2", category: "fiscal", item: "Avis d'imposition", status: "todo", priority: "high", responsible: "", dueDate: "", completedDate: "", documents: "", comments: "", redFlag: false },
			{ id: "t3", category: "fiscal", item: "Controles fiscaux passes", status: "todo", priority: "high", responsible: "", dueDate: "", completedDate: "", documents: "", comments: "", redFlag: false },
			{ id: "t4", category: "fiscal", item: "Integration fiscale", status: "todo", priority: "medium", responsible: "", dueDate: "", completedDate: "", documents: "", comments: "", redFlag: false },
			{ id: "t5", category: "fiscal", item: "Deficits reportables", status: "todo", priority: "medium", responsible: "", dueDate: "", completedDate: "", documents: "", comments: "", redFlag: false },
			{ id: "t6", category: "fiscal", item: "Credit d'impot (CIR, etc.)", status: "todo", priority: "medium", responsible: "", dueDate: "", completedDate: "", documents: "", comments: "", redFlag: false },
		],
	},
	{
		id: "social",
		name: "Social & RH",
		icon: "👥",
		items: [
			{ id: "s1", category: "social", item: "Registre du personnel", status: "todo", priority: "high", responsible: "", dueDate: "", completedDate: "", documents: "", comments: "", redFlag: false },
			{ id: "s2", category: "social", item: "Contrats de travail (dirigeants)", status: "todo", priority: "high", responsible: "", dueDate: "", completedDate: "", documents: "", comments: "", redFlag: false },
			{ id: "s3", category: "social", item: "Convention collective applicable", status: "todo", priority: "medium", responsible: "", dueDate: "", completedDate: "", documents: "", comments: "", redFlag: false },
			{ id: "s4", category: "social", item: "Accords d'entreprise", status: "todo", priority: "medium", responsible: "", dueDate: "", completedDate: "", documents: "", comments: "", redFlag: false },
			{ id: "s5", category: "social", item: "Contentieux prud'homaux", status: "todo", priority: "high", responsible: "", dueDate: "", completedDate: "", documents: "", comments: "", redFlag: false },
			{ id: "s6", category: "social", item: "Interessement/Participation", status: "todo", priority: "medium", responsible: "", dueDate: "", completedDate: "", documents: "", comments: "", redFlag: false },
			{ id: "s7", category: "social", item: "Plan de formation", status: "todo", priority: "low", responsible: "", dueDate: "", completedDate: "", documents: "", comments: "", redFlag: false },
		],
	},
	{
		id: "commercial",
		name: "Commercial & Marche",
		icon: "📈",
		items: [
			{ id: "c1", category: "commercial", item: "Top 10 clients (CA et anciennete)", status: "todo", priority: "high", responsible: "", dueDate: "", completedDate: "", documents: "", comments: "", redFlag: false },
			{ id: "c2", category: "commercial", item: "Top 10 fournisseurs", status: "todo", priority: "high", responsible: "", dueDate: "", completedDate: "", documents: "", comments: "", redFlag: false },
			{ id: "c3", category: "commercial", item: "Contrats commerciaux majeurs", status: "todo", priority: "high", responsible: "", dueDate: "", completedDate: "", documents: "", comments: "", redFlag: false },
			{ id: "c4", category: "commercial", item: "Carnet de commandes", status: "todo", priority: "medium", responsible: "", dueDate: "", completedDate: "", documents: "", comments: "", redFlag: false },
			{ id: "c5", category: "commercial", item: "Etude de marche", status: "todo", priority: "medium", responsible: "", dueDate: "", completedDate: "", documents: "", comments: "", redFlag: false },
			{ id: "c6", category: "commercial", item: "Analyse concurrentielle", status: "todo", priority: "medium", responsible: "", dueDate: "", completedDate: "", documents: "", comments: "", redFlag: false },
		],
	},
	{
		id: "operationnel",
		name: "Operationnel & IT",
		icon: "⚙️",
		items: [
			{ id: "o1", category: "operationnel", item: "Description des processus cles", status: "todo", priority: "medium", responsible: "", dueDate: "", completedDate: "", documents: "", comments: "", redFlag: false },
			{ id: "o2", category: "operationnel", item: "Systeme d'information", status: "todo", priority: "medium", responsible: "", dueDate: "", completedDate: "", documents: "", comments: "", redFlag: false },
			{ id: "o3", category: "operationnel", item: "Contrats IT et licences", status: "todo", priority: "medium", responsible: "", dueDate: "", completedDate: "", documents: "", comments: "", redFlag: false },
			{ id: "o4", category: "operationnel", item: "Plan de continuite d'activite", status: "todo", priority: "low", responsible: "", dueDate: "", completedDate: "", documents: "", comments: "", redFlag: false },
			{ id: "o5", category: "operationnel", item: "Certifications (ISO, etc.)", status: "todo", priority: "low", responsible: "", dueDate: "", completedDate: "", documents: "", comments: "", redFlag: false },
		],
	},
	{
		id: "immobilier",
		name: "Immobilier & Environnement",
		icon: "🏢",
		items: [
			{ id: "i1", category: "immobilier", item: "Baux commerciaux", status: "todo", priority: "high", responsible: "", dueDate: "", completedDate: "", documents: "", comments: "", redFlag: false },
			{ id: "i2", category: "immobilier", item: "Titres de propriete", status: "todo", priority: "high", responsible: "", dueDate: "", completedDate: "", documents: "", comments: "", redFlag: false },
			{ id: "i3", category: "immobilier", item: "Diagnostics techniques", status: "todo", priority: "medium", responsible: "", dueDate: "", completedDate: "", documents: "", comments: "", redFlag: false },
			{ id: "i4", category: "immobilier", item: "Autorisations ICPE", status: "todo", priority: "high", responsible: "", dueDate: "", completedDate: "", documents: "", comments: "", redFlag: false },
			{ id: "i5", category: "immobilier", item: "Audit environnemental", status: "todo", priority: "medium", responsible: "", dueDate: "", completedDate: "", documents: "", comments: "", redFlag: false },
		],
	},
	{
		id: "assurances",
		name: "Assurances",
		icon: "🛡️",
		items: [
			{ id: "a1", category: "assurances", item: "Polices d'assurance en vigueur", status: "todo", priority: "medium", responsible: "", dueDate: "", completedDate: "", documents: "", comments: "", redFlag: false },
			{ id: "a2", category: "assurances", item: "Historique des sinistres", status: "todo", priority: "medium", responsible: "", dueDate: "", completedDate: "", documents: "", comments: "", redFlag: false },
			{ id: "a3", category: "assurances", item: "RC Dirigeants", status: "todo", priority: "medium", responsible: "", dueDate: "", completedDate: "", documents: "", comments: "", redFlag: false },
		],
	},
];

export default function DDChecklistPage() {
	const router = useRouter();
	const [categories, setCategories] = useState<DDCategory[]>(defaultCategories);
	const [searchQuery, setSearchQuery] = useState("");
	const [statusFilter, setStatusFilter] = useState<DDStatus | "all">("all");
	const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
		new Set(defaultCategories.map((c) => c.id))
	);
	const [selectedDealId, setSelectedDealId] = useState<string | null>(null);
	const [currentChecklistId, setCurrentChecklistId] = useState<string | null>(null);
	const [checklistName, setChecklistName] = useState("");
	const [isSaving, setIsSaving] = useState(false);
	const [showLoadDialog, setShowLoadDialog] = useState(false);
	const [savedChecklists, setSavedChecklists] = useState<any[]>([]);

	// Load saved checklists
	useEffect(() => {
		listChecklists().then((data) => setSavedChecklists(data || [])).catch(console.error);
	}, []);

	const handleSave = useCallback(async () => {
		const name = checklistName.trim() || `DD Checklist - ${new Date().toLocaleDateString("fr-FR")}`;

		setIsSaving(true);
		try {
			// Save as spreadsheet data (JSON-based storage)
			await numbersTools.saveSpreadsheet({
				id: currentChecklistId || undefined,
				dealId: selectedDealId || undefined,
				title: name,
				sheetData: {
					type: "dd-checklist",
					categories,
				},
			});
			router.refresh();
			toast.success("Checklist sauvegardée");
		} catch (error) {
			console.error("Failed to save checklist:", error);
			toast.error("Erreur lors de la sauvegarde");
		} finally {
			setIsSaving(false);
		}
	}, [router, currentChecklistId, selectedDealId, checklistName, categories]);

	const handleLoad = useCallback((checklist: any) => {
		setCategories(checklist.categories as DDCategory[]);
		setCurrentChecklistId(checklist._id);
		setChecklistName(checklist.name);
		setSelectedDealId(checklist.dealId ?? null);
		setExpandedCategories(new Set(checklist.categories.map((c: { id: string }) => c.id)));
		setShowLoadDialog(false);
		toast.success(`Checklist "${checklist.name}" chargée`);
	}, []);

	const allItems = useMemo(() => {
		return categories.flatMap((c) => c.items);
	}, [categories]);

	const stats = useMemo(() => {
		const total = allItems.length;
		const completed = allItems.filter((i) => i.status === "completed").length;
		const inProgress = allItems.filter((i) => i.status === "in_progress").length;
		const blocked = allItems.filter((i) => i.status === "blocked").length;
		const redFlags = allItems.filter((i) => i.redFlag).length;
		const progress = total > 0 ? (completed / total) * 100 : 0;

		return { total, completed, inProgress, blocked, redFlags, progress };
	}, [allItems]);

	const updateItemStatus = (itemId: string, status: DDStatus) => {
		setCategories((prev) =>
			prev.map((cat) => ({
				...cat,
				items: cat.items.map((item) =>
					item.id === itemId
						? {
								...item,
								status,
								completedDate: status === "completed" ? new Date().toISOString().split("T")[0] : item.completedDate,
						  }
						: item
				),
			}))
		);
	};

	const toggleRedFlag = (itemId: string) => {
		setCategories((prev) =>
			prev.map((cat) => ({
				...cat,
				items: cat.items.map((item) =>
					item.id === itemId ? { ...item, redFlag: !item.redFlag } : item
				),
			}))
		);
	};

	const toggleCategory = (categoryId: string) => {
		setExpandedCategories((prev) => {
			const next = new Set(prev);
			if (next.has(categoryId)) {
				next.delete(categoryId);
			} else {
				next.add(categoryId);
			}
			return next;
		});
	};

	const filteredCategories = useMemo(() => {
		return categories
			.map((cat) => ({
				...cat,
				items: cat.items.filter((item) => {
					const matchesSearch = item.item
						.toLowerCase()
						.includes(searchQuery.toLowerCase());
					const matchesStatus =
						statusFilter === "all" || item.status === statusFilter;
					return matchesSearch && matchesStatus;
				}),
			}))
			.filter((cat) => cat.items.length > 0);
	}, [categories, searchQuery, statusFilter]);

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
							<ClipboardCheck className="h-6 w-6" />
							Checklist Due Diligence
							{currentChecklistId && (
								<Badge variant="secondary" className="ml-2">
									{checklistName || "Sauvegardé"}
								</Badge>
							)}
						</h1>
						<p className="text-muted-foreground">
							{stats.total} points de controle repartis en {categories.length} categories
						</p>
					</div>
				</div>
				<div className="flex items-center gap-2">
					<DealSelector
						toolId="dd-checklist"
						onDealSelect={(deal) => setSelectedDealId(deal?.id as string | null ?? null)}
					/>
					<Dialog open={showLoadDialog} onOpenChange={setShowLoadDialog}>
						<DialogTrigger asChild>
							<Button variant="outline" type="button">
								<FolderOpen className="h-4 w-4 mr-2" />
								Charger
							</Button>
						</DialogTrigger>
						<DialogContent>
							<DialogHeader>
								<DialogTitle>Charger une checklist</DialogTitle>
								<DialogDescription>
									Sélectionnez une checklist sauvegardée
								</DialogDescription>
							</DialogHeader>
							<div className="max-h-[400px] overflow-y-auto space-y-2">
								{savedChecklists?.length === 0 && (
									<p className="text-muted-foreground text-center py-4">
										Aucune checklist sauvegardée
									</p>
								)}
								{savedChecklists?.map((c: any) => (
									<button
										key={c._id}
										type="button"
										onClick={() => handleLoad(c)}
										className="w-full p-3 text-left rounded-lg border hover:bg-muted/50 transition-colors"
									>
										<div className="font-medium">{c.name}</div>
										<div className="text-sm text-muted-foreground">
											{c.categories.reduce((acc: number, cat: { items: unknown[] }) => acc + cat.items.length, 0)} items
										</div>
										<div className="text-xs text-muted-foreground">
											{new Date(c.updatedAt).toLocaleDateString("fr-FR")}
										</div>
									</button>
								))}
							</div>
						</DialogContent>
					</Dialog>
					<Button variant="outline" onClick={handleSave} disabled={isSaving} type="button">
						{isSaving ? (
							<Loader2 className="h-4 w-4 mr-2 animate-spin" />
						) : (
							<Save className="h-4 w-4 mr-2" />
						)}
						Sauvegarder
					</Button>
					<Button type="button">
						<Download className="h-4 w-4 mr-2" />
						Exporter
					</Button>
				</div>
			</div>

			{/* Stats Cards */}
			<div className="grid grid-cols-2 md:grid-cols-5 gap-4">
				<Card>
					<CardContent className="pt-6">
						<div className="text-center">
							<p className="text-3xl font-bold text-emerald-600">{stats.completed}</p>
							<p className="text-sm text-muted-foreground">Termines</p>
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="pt-6">
						<div className="text-center">
							<p className="text-3xl font-bold text-blue-600">{stats.inProgress}</p>
							<p className="text-sm text-muted-foreground">En cours</p>
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="pt-6">
						<div className="text-center">
							<p className="text-3xl font-bold text-red-600">{stats.blocked}</p>
							<p className="text-sm text-muted-foreground">Bloques</p>
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="pt-6">
						<div className="text-center">
							<p className="text-3xl font-bold text-amber-600">{stats.redFlags}</p>
							<p className="text-sm text-muted-foreground">Red Flags</p>
						</div>
					</CardContent>
				</Card>
				<Card className="border-emerald-500/50 bg-gradient-to-br from-emerald-500/5 to-teal-500/5">
					<CardContent className="pt-6">
						<div className="text-center">
							<p className="text-3xl font-bold text-emerald-600">
								{stats.progress.toFixed(0)}%
							</p>
							<Progress value={stats.progress} className="mt-2 h-2" />
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
								placeholder="Rechercher un item..."
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								className="pl-9"
							/>
						</div>
						<Select
							value={statusFilter}
							onValueChange={(v) => setStatusFilter(v as DDStatus | "all")}
						>
							<SelectTrigger className="w-[180px]">
								<Filter className="h-4 w-4 mr-2" />
								<SelectValue placeholder="Filtrer par statut" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">Tous les statuts</SelectItem>
								<SelectItem value="todo">A faire</SelectItem>
								<SelectItem value="in_progress">En cours</SelectItem>
								<SelectItem value="completed">Termine</SelectItem>
								<SelectItem value="blocked">Bloque</SelectItem>
							</SelectContent>
						</Select>
					</div>
				</CardContent>
			</Card>

			{/* Categories & Items */}
			<div className="space-y-4">
				{filteredCategories.map((category) => {
					const isExpanded = expandedCategories.has(category.id);
					const categoryStats = {
						total: category.items.length,
						completed: category.items.filter((i) => i.status === "completed").length,
					};

					return (
						<Card key={category.id}>
							<CardHeader
								className="cursor-pointer hover:bg-muted/50 transition-colors"
								onClick={() => toggleCategory(category.id)}
							>
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-3">
										{isExpanded ? (
											<ChevronDown className="h-5 w-5" />
										) : (
											<ChevronRight className="h-5 w-5" />
										)}
										<span className="text-xl">{category.icon}</span>
										<CardTitle className="text-lg">{category.name}</CardTitle>
									</div>
									<div className="flex items-center gap-3">
										<Badge variant="outline">
											{categoryStats.completed}/{categoryStats.total}
										</Badge>
										<Progress
											value={(categoryStats.completed / categoryStats.total) * 100}
											className="w-24 h-2"
										/>
									</div>
								</div>
							</CardHeader>
							{isExpanded && (
								<CardContent>
									<div className="space-y-2">
										{category.items.map((item) => {
											const StatusIcon = statusConfig[item.status].icon;
											return (
												<div
													key={item.id}
													className={`flex items-center gap-4 p-3 rounded-lg border transition-colors ${
														item.status === "completed"
															? "bg-emerald-500/5 border-emerald-500/20"
															: item.status === "blocked"
															? "bg-red-500/5 border-red-500/20"
															: "bg-muted/30 hover:bg-muted/50"
													}`}
												>
													{/* Status Icon */}
													<button
														onClick={() => {
															const statuses: DDStatus[] = ["todo", "in_progress", "completed", "blocked"];
															const currentIndex = statuses.indexOf(item.status);
															const nextStatus = statuses[(currentIndex + 1) % statuses.length];
															updateItemStatus(item.id, nextStatus);
														}}
														className="flex-shrink-0"
													>
														<StatusIcon
															className={`h-5 w-5 ${
																item.status === "completed"
																	? "text-emerald-500"
																	: item.status === "in_progress"
																	? "text-blue-500"
																	: item.status === "blocked"
																	? "text-red-500"
																	: "text-gray-400"
															}`}
														/>
													</button>

													{/* Item Text */}
													<span
														className={`flex-1 ${
															item.status === "completed" ? "line-through text-muted-foreground" : ""
														}`}
													>
														{item.item}
													</span>

													{/* Priority */}
													<Badge className={priorityConfig[item.priority].color} variant="outline">
														{priorityConfig[item.priority].label}
													</Badge>

													{/* Red Flag */}
													<button
														onClick={() => toggleRedFlag(item.id)}
														className={`p-1 rounded ${
															item.redFlag ? "text-red-500" : "text-gray-300 hover:text-red-400"
														}`}
													>
														<AlertTriangle className="h-4 w-4" />
													</button>

													{/* Status Selector */}
													<Select
														value={item.status}
														onValueChange={(v) => updateItemStatus(item.id, v as DDStatus)}
													>
														<SelectTrigger className="w-[130px] h-8">
															<SelectValue />
														</SelectTrigger>
														<SelectContent>
															<SelectItem value="todo">A faire</SelectItem>
															<SelectItem value="in_progress">En cours</SelectItem>
															<SelectItem value="completed">Termine</SelectItem>
															<SelectItem value="blocked">Bloque</SelectItem>
														</SelectContent>
													</Select>
												</div>
											);
										})}
									</div>
								</CardContent>
							)}
						</Card>
					);
				})}
			</div>
		</div>
	);
}
