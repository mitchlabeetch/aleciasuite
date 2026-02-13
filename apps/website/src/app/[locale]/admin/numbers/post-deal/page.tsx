"use client";

/**
 * Post-Deal Integration Checklist
 *
 * Integration planning and tracking:
 * - Day 1 readiness tasks
 * - 100-day plan milestones
 * - Workstream tracking
 * - Synergy realization
 */

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { numbersTools } from "@/actions";
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
import { Label } from "@/components/ui/label";
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
	Layers,
	ArrowLeft,
	Download,
	Save,
	Plus,
	CheckCircle2,
	Clock,
	AlertTriangle,
	XCircle,
	Target,
	TrendingUp,
	Users,
	Briefcase,
	Settings,
	DollarSign,
	Building2,
	Zap,
	ChevronDown,
	ChevronRight,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import { DealSelector } from "@/components/numbers/deal-selector";
import { CrossToolLinks } from "@/components/numbers/cross-tool-links";

type TaskStatus = "not_started" | "in_progress" | "completed" | "blocked" | "at_risk";
type TaskPriority = "critical" | "high" | "medium" | "low";
type IntegrationPhase = "day1" | "week1" | "month1" | "month3" | "ongoing";

interface IntegrationTask {
	id: string;
	workstream: string;
	task: string;
	phase: IntegrationPhase;
	status: TaskStatus;
	priority: TaskPriority;
	owner: string;
	dueDate: string;
	completedDate: string;
	synergy: number;
	notes: string;
}

interface Workstream {
	id: string;
	name: string;
	icon: typeof Users;
	color: string;
}

const workstreams: Workstream[] = [
	{ id: "governance", name: "Gouvernance & Leadership", icon: Users, color: "bg-purple-500" },
	{ id: "hr", name: "Ressources Humaines", icon: Users, color: "bg-blue-500" },
	{ id: "finance", name: "Finance & Comptabilite", icon: DollarSign, color: "bg-emerald-500" },
	{ id: "operations", name: "Operations", icon: Settings, color: "bg-orange-500" },
	{ id: "commercial", name: "Commercial & Clients", icon: Briefcase, color: "bg-amber-500" },
	{ id: "it", name: "Systemes d'Information", icon: Zap, color: "bg-cyan-500" },
	{ id: "legal", name: "Juridique & Conformite", icon: Building2, color: "bg-slate-500" },
	{ id: "synergies", name: "Synergies", icon: TrendingUp, color: "bg-rose-500" },
];

const phaseConfig: Record<IntegrationPhase, { label: string; days: string }> = {
	day1: { label: "Jour 1", days: "J1" },
	week1: { label: "Semaine 1", days: "S1" },
	month1: { label: "Mois 1", days: "M1" },
	month3: { label: "100 Jours", days: "M3" },
	ongoing: { label: "Continu", days: "Continu" },
};

const statusConfig: Record<TaskStatus, { label: string; color: string; icon: typeof Clock }> = {
	not_started: { label: "A faire", color: "bg-gray-400", icon: Clock },
	in_progress: { label: "En cours", color: "bg-blue-500", icon: Clock },
	completed: { label: "Termine", color: "bg-emerald-500", icon: CheckCircle2 },
	blocked: { label: "Bloque", color: "bg-red-500", icon: XCircle },
	at_risk: { label: "A risque", color: "bg-amber-500", icon: AlertTriangle },
};

const priorityConfig: Record<TaskPriority, { label: string; color: string }> = {
	critical: { label: "Critique", color: "text-red-500 bg-red-500/10" },
	high: { label: "Haute", color: "text-orange-500 bg-orange-500/10" },
	medium: { label: "Moyenne", color: "text-amber-500 bg-amber-500/10" },
	low: { label: "Basse", color: "text-gray-500 bg-gray-500/10" },
};

const defaultTasks: IntegrationTask[] = [
	// Day 1
	{ id: "t1", workstream: "governance", task: "Annonce officielle aux employes", phase: "day1", status: "completed", priority: "critical", owner: "DG", dueDate: "2026-03-01", completedDate: "2026-03-01", synergy: 0, notes: "Communication reussie" },
	{ id: "t2", workstream: "governance", task: "Installation nouveau COMEX", phase: "day1", status: "completed", priority: "critical", owner: "DG", dueDate: "2026-03-01", completedDate: "2026-03-01", synergy: 0, notes: "" },
	{ id: "t3", workstream: "hr", task: "Communication aux managers", phase: "day1", status: "completed", priority: "critical", owner: "DRH", dueDate: "2026-03-01", completedDate: "2026-03-01", synergy: 0, notes: "" },
	{ id: "t4", workstream: "legal", task: "Transfert des contrats cles", phase: "day1", status: "in_progress", priority: "critical", owner: "DAJ", dueDate: "2026-03-01", completedDate: "", synergy: 0, notes: "3 contrats en attente" },
	{ id: "t5", workstream: "it", task: "Acces aux systemes critiques", phase: "day1", status: "completed", priority: "critical", owner: "DSI", dueDate: "2026-03-01", completedDate: "2026-03-01", synergy: 0, notes: "" },

	// Week 1
	{ id: "t6", workstream: "hr", task: "Reunions equipes (tous sites)", phase: "week1", status: "in_progress", priority: "high", owner: "DRH", dueDate: "2026-03-07", completedDate: "", synergy: 0, notes: "2/4 sites faits" },
	{ id: "t7", workstream: "finance", task: "Rapprochement comptable", phase: "week1", status: "in_progress", priority: "high", owner: "DAF", dueDate: "2026-03-07", completedDate: "", synergy: 0, notes: "" },
	{ id: "t8", workstream: "commercial", task: "Communication clients strategiques", phase: "week1", status: "completed", priority: "high", owner: "DC", dueDate: "2026-03-05", completedDate: "2026-03-04", synergy: 0, notes: "Top 20 contactes" },
	{ id: "t9", workstream: "it", task: "Audit infrastructure IT", phase: "week1", status: "in_progress", priority: "high", owner: "DSI", dueDate: "2026-03-07", completedDate: "", synergy: 0, notes: "" },
	{ id: "t10", workstream: "operations", task: "Cartographie des processus", phase: "week1", status: "not_started", priority: "medium", owner: "DOP", dueDate: "2026-03-07", completedDate: "", synergy: 0, notes: "" },

	// Month 1
	{ id: "t11", workstream: "hr", task: "Harmonisation grilles salariales", phase: "month1", status: "not_started", priority: "high", owner: "DRH", dueDate: "2026-03-31", completedDate: "", synergy: 200000, notes: "" },
	{ id: "t12", workstream: "finance", task: "Integration reporting financier", phase: "month1", status: "not_started", priority: "high", owner: "DAF", dueDate: "2026-03-31", completedDate: "", synergy: 0, notes: "" },
	{ id: "t13", workstream: "synergies", task: "Plan de synergies achats", phase: "month1", status: "not_started", priority: "high", owner: "DA", dueDate: "2026-03-31", completedDate: "", synergy: 500000, notes: "" },
	{ id: "t14", workstream: "it", task: "Plan migration SI", phase: "month1", status: "not_started", priority: "medium", owner: "DSI", dueDate: "2026-03-31", completedDate: "", synergy: 150000, notes: "" },
	{ id: "t15", workstream: "commercial", task: "Unification catalogue produits", phase: "month1", status: "not_started", priority: "medium", owner: "DC", dueDate: "2026-03-31", completedDate: "", synergy: 0, notes: "" },

	// 100 Days
	{ id: "t16", workstream: "hr", task: "Finalisation plan de retention", phase: "month3", status: "not_started", priority: "high", owner: "DRH", dueDate: "2026-06-01", completedDate: "", synergy: 0, notes: "" },
	{ id: "t17", workstream: "finance", task: "Premiere cloture combinee", phase: "month3", status: "not_started", priority: "critical", owner: "DAF", dueDate: "2026-06-01", completedDate: "", synergy: 0, notes: "" },
	{ id: "t18", workstream: "synergies", task: "Realisation synergies Q1", phase: "month3", status: "not_started", priority: "critical", owner: "PMO", dueDate: "2026-06-01", completedDate: "", synergy: 1000000, notes: "" },
	{ id: "t19", workstream: "operations", task: "Optimisation supply chain", phase: "month3", status: "not_started", priority: "high", owner: "DOP", dueDate: "2026-06-01", completedDate: "", synergy: 300000, notes: "" },
	{ id: "t20", workstream: "it", task: "Integration ERP phase 1", phase: "month3", status: "not_started", priority: "high", owner: "DSI", dueDate: "2026-06-01", completedDate: "", synergy: 200000, notes: "" },

	// Ongoing
	{ id: "t21", workstream: "synergies", task: "Suivi mensuel synergies", phase: "ongoing", status: "in_progress", priority: "high", owner: "PMO", dueDate: "", completedDate: "", synergy: 0, notes: "Comite mensuel" },
	{ id: "t22", workstream: "hr", task: "Suivi climat social", phase: "ongoing", status: "in_progress", priority: "medium", owner: "DRH", dueDate: "", completedDate: "", synergy: 0, notes: "Enquete trimestrielle" },
	{ id: "t23", workstream: "governance", task: "Reporting integration", phase: "ongoing", status: "in_progress", priority: "high", owner: "PMO", dueDate: "", completedDate: "", synergy: 0, notes: "Hebdomadaire" },
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

export default function PostDealPage() {
	const [tasks, setTasks] = useState<IntegrationTask[]>(defaultTasks);
	const [dealName, setDealName] = useState("Projet Alpha");
	const [closingDate, setClosingDate] = useState("2026-03-01");
	const [selectedPhase, setSelectedPhase] = useState<IntegrationPhase | "all">("all");
	const [expandedWorkstreams, setExpandedWorkstreams] = useState<Set<string>>(
		new Set(workstreams.map((w) => w.id))
	);
	const [isSaving, setIsSaving] = useState(false);
	const router = useRouter();

	// Stats
	const stats = useMemo(() => {
		const total = tasks.length;
		const completed = tasks.filter((t) => t.status === "completed").length;
		const inProgress = tasks.filter((t) => t.status === "in_progress").length;
		const blocked = tasks.filter((t) => t.status === "blocked").length;
		const atRisk = tasks.filter((t) => t.status === "at_risk").length;
		const progress = total > 0 ? (completed / total) * 100 : 0;

		const totalSynergies = tasks.reduce((sum, t) => sum + t.synergy, 0);
		const realizedSynergies = tasks
			.filter((t) => t.status === "completed")
			.reduce((sum, t) => sum + t.synergy, 0);

		return { total, completed, inProgress, blocked, atRisk, progress, totalSynergies, realizedSynergies };
	}, [tasks]);

	// Phase progress
	const phaseProgress = useMemo(() => {
		const phases: IntegrationPhase[] = ["day1", "week1", "month1", "month3", "ongoing"];
		return phases.map((phase) => {
			const phaseTasks = tasks.filter((t) => t.phase === phase);
			const completed = phaseTasks.filter((t) => t.status === "completed").length;
			return {
				phase,
				total: phaseTasks.length,
				completed,
				progress: phaseTasks.length > 0 ? (completed / phaseTasks.length) * 100 : 0,
			};
		});
	}, [tasks]);

	// Workstream progress
	const workstreamProgress = useMemo(() => {
		return workstreams.map((ws) => {
			const wsTasks = tasks.filter((t) => t.workstream === ws.id);
			const completed = wsTasks.filter((t) => t.status === "completed").length;
			const synergies = wsTasks.reduce((sum, t) => sum + t.synergy, 0);
			const realizedSynergies = wsTasks
				.filter((t) => t.status === "completed")
				.reduce((sum, t) => sum + t.synergy, 0);

			return {
				...ws,
				total: wsTasks.length,
				completed,
				progress: wsTasks.length > 0 ? (completed / wsTasks.length) * 100 : 0,
				synergies,
				realizedSynergies,
			};
		});
	}, [tasks]);

	// Filtered tasks
	const filteredTasks = useMemo(() => {
		return tasks.filter((t) => selectedPhase === "all" || t.phase === selectedPhase);
	}, [tasks, selectedPhase]);

	// Group tasks by workstream
	const tasksByWorkstream = useMemo(() => {
		return workstreams.map((ws) => ({
			...ws,
			tasks: filteredTasks.filter((t) => t.workstream === ws.id),
		}));
	}, [filteredTasks]);

	const toggleWorkstream = (wsId: string) => {
		setExpandedWorkstreams((prev) => {
			const next = new Set(prev);
			if (next.has(wsId)) {
				next.delete(wsId);
			} else {
				next.add(wsId);
			}
			return next;
		});
	};

	const updateTaskStatus = (taskId: string, status: TaskStatus) => {
		setTasks((prev) =>
			prev.map((t) =>
				t.id === taskId
					? {
							...t,
							status,
							completedDate: status === "completed" ? new Date().toISOString().split("T")[0] : t.completedDate,
					  }
					: t
			)
		);
	};

	const handleSave = useCallback(async () => {
		if (isSaving) return;

		setIsSaving(true);
		try {
			await numbersTools.savePostDealIntegration({
				workstream: dealName,
				startDate: new Date(closingDate),
				status: "in_progress",
				tasks: tasks.map(t => ({
					id: t.id,
					task: t.task,
					workstream: t.workstream,
					phase: t.phase,
					status: t.status,
					owner: t.owner,
					dueDate: t.dueDate,
				})) as any,
			});
			router.refresh();
			toast.success("Integration sauvegardee", {
				description: `${tasks.length} taches pour ${dealName}`,
			});
		} catch (error) {
			console.error("Error saving post-deal:", error);
			toast.error("Erreur de sauvegarde", {
				description: "Impossible de sauvegarder l'integration. Veuillez reessayer.",
			});
		} finally {
			setIsSaving(false);
		}
	}, [isSaving, dealName, closingDate, tasks, router]);

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
							<Layers className="h-6 w-6" />
							Integration Post-Deal
						</h1>
						<p className="text-muted-foreground">
							{dealName} | Closing: {closingDate}
						</p>
					</div>
				</div>
				<div className="flex items-center gap-3">
					<DealSelector toolId="post-deal" compact />
					<CrossToolLinks currentTool="post-deal" variant="compact" />
					<div className="flex gap-2">
						<Button variant="outline" onClick={handleSave} disabled={isSaving}>
							{isSaving ? (
								<>
									<span className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent" />
									Sauvegarde...
								</>
							) : (
								<>
									<Save className="h-4 w-4 mr-2" />
									Sauvegarder
								</>
							)}
						</Button>
						<Button>
							<Download className="h-4 w-4 mr-2" />
							Exporter
						</Button>
					</div>
				</div>
			</div>

			{/* Overall Progress */}
			<div className="grid md:grid-cols-4 gap-6">
				<Card className="md:col-span-2">
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Target className="h-5 w-5" />
							Progression Globale
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="space-y-4">
							<div className="flex items-center justify-between">
								<span className="text-4xl font-bold text-emerald-600">
									{stats.progress.toFixed(0)}%
								</span>
								<div className="text-right text-sm text-muted-foreground">
									<p>{stats.completed}/{stats.total} taches</p>
									<p>{stats.inProgress} en cours</p>
								</div>
							</div>
							<Progress value={stats.progress} className="h-3" />
							<div className="flex gap-4 text-sm">
								{stats.blocked > 0 && (
									<Badge variant="destructive">{stats.blocked} bloques</Badge>
								)}
								{stats.atRisk > 0 && (
									<Badge className="bg-amber-500">{stats.atRisk} a risque</Badge>
								)}
							</div>
						</div>
					</CardContent>
				</Card>

				<Card className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10">
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<TrendingUp className="h-5 w-5 text-emerald-600" />
							Synergies
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="space-y-2">
							<p className="text-3xl font-bold text-emerald-600">
								{formatCurrency(stats.realizedSynergies)} EUR
							</p>
							<p className="text-sm text-muted-foreground">
								sur {formatCurrency(stats.totalSynergies)} EUR prevues
							</p>
							<Progress
								value={(stats.realizedSynergies / stats.totalSynergies) * 100}
								className="h-2"
							/>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle className="text-sm">Par Phase</CardTitle>
					</CardHeader>
					<CardContent className="space-y-2">
						{phaseProgress.map((p) => (
							<div key={p.phase} className="flex items-center gap-2">
								<span className="text-xs w-12">{phaseConfig[p.phase].days}</span>
								<Progress value={p.progress} className="h-2 flex-1" />
								<span className="text-xs text-muted-foreground w-10">
									{p.completed}/{p.total}
								</span>
							</div>
						))}
					</CardContent>
				</Card>
			</div>

			{/* Workstream Summary */}
			<div className="grid md:grid-cols-4 gap-4">
				{workstreamProgress.slice(0, 4).map((ws) => (
					<Card key={ws.id}>
						<CardContent className="pt-4">
							<div className="flex items-center gap-2 mb-2">
								<div className={`p-1.5 rounded ${ws.color}`}>
									<ws.icon className="h-4 w-4 text-white" />
								</div>
								<span className="font-medium text-sm truncate">{ws.name}</span>
							</div>
							<div className="flex items-center justify-between text-sm">
								<span>{ws.completed}/{ws.total}</span>
								<span className="text-muted-foreground">{ws.progress.toFixed(0)}%</span>
							</div>
							<Progress value={ws.progress} className="h-1.5 mt-2" />
						</CardContent>
					</Card>
				))}
			</div>

			{/* Phase Filter */}
			<Card>
				<CardContent className="pt-6">
					<div className="flex items-center gap-4">
						<Label>Filtrer par phase:</Label>
						<Select
							value={selectedPhase}
							onValueChange={(v) => setSelectedPhase(v as IntegrationPhase | "all")}
						>
							<SelectTrigger className="w-[200px]">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">Toutes les phases</SelectItem>
								{Object.entries(phaseConfig).map(([key, config]) => (
									<SelectItem key={key} value={key}>
										{config.label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
				</CardContent>
			</Card>

			{/* Tasks by Workstream */}
			<div className="space-y-4">
				{tasksByWorkstream
					.filter((ws) => ws.tasks.length > 0)
					.map((ws) => {
						const isExpanded = expandedWorkstreams.has(ws.id);
						const wsStats = {
							completed: ws.tasks.filter((t) => t.status === "completed").length,
							total: ws.tasks.length,
						};

						return (
							<Card key={ws.id}>
								<CardHeader
									className="cursor-pointer hover:bg-muted/50 transition-colors"
									onClick={() => toggleWorkstream(ws.id)}
								>
									<div className="flex items-center justify-between">
										<div className="flex items-center gap-3">
											{isExpanded ? (
												<ChevronDown className="h-5 w-5" />
											) : (
												<ChevronRight className="h-5 w-5" />
											)}
											<div className={`p-2 rounded ${ws.color}`}>
												<ws.icon className="h-5 w-5 text-white" />
											</div>
											<CardTitle className="text-lg">{ws.name}</CardTitle>
										</div>
										<div className="flex items-center gap-3">
											<Badge variant="outline">
												{wsStats.completed}/{wsStats.total}
											</Badge>
											<Progress
												value={(wsStats.completed / wsStats.total) * 100}
												className="w-24 h-2"
											/>
										</div>
									</div>
								</CardHeader>
								{isExpanded && (
									<CardContent>
										<div className="space-y-2">
											{ws.tasks.map((task) => {
												const statusConf = statusConfig[task.status];
												const priorityConf = priorityConfig[task.priority];
												const StatusIcon = statusConf.icon;

												return (
													<div
														key={task.id}
														className={`flex items-center gap-4 p-3 rounded-lg border transition-colors ${
															task.status === "completed"
																? "bg-emerald-500/5 border-emerald-500/20"
																: task.status === "blocked"
																? "bg-red-500/5 border-red-500/20"
																: task.status === "at_risk"
																? "bg-amber-500/5 border-amber-500/20"
																: "bg-muted/30 hover:bg-muted/50"
														}`}
													>
														{/* Status Icon */}
														<button
															onClick={() => {
																const statuses: TaskStatus[] = [
																	"not_started",
																	"in_progress",
																	"completed",
																	"blocked",
																];
																const currentIndex = statuses.indexOf(task.status);
																const nextStatus = statuses[(currentIndex + 1) % statuses.length];
																updateTaskStatus(task.id, nextStatus);
															}}
															className="flex-shrink-0"
														>
															<StatusIcon
																className={`h-5 w-5 ${
																	task.status === "completed"
																		? "text-emerald-500"
																		: task.status === "in_progress"
																		? "text-blue-500"
																		: task.status === "blocked"
																		? "text-red-500"
																		: task.status === "at_risk"
																		? "text-amber-500"
																		: "text-gray-400"
																}`}
															/>
														</button>

														{/* Task Info */}
														<div className="flex-1 min-w-0">
															<p
																className={`font-medium ${
																	task.status === "completed"
																		? "line-through text-muted-foreground"
																		: ""
																}`}
															>
																{task.task}
															</p>
															<div className="flex items-center gap-3 text-xs text-muted-foreground">
																<span>{task.owner}</span>
																{task.dueDate && (
																	<>
																		<span>|</span>
																		<span>Echeance: {task.dueDate}</span>
																	</>
																)}
																{task.synergy > 0 && (
																	<>
																		<span>|</span>
																		<span className="text-emerald-600">
																			Synergie: {formatCurrency(task.synergy)} EUR
																		</span>
																	</>
																)}
															</div>
														</div>

														{/* Phase */}
														<Badge variant="outline" className="text-xs">
															{phaseConfig[task.phase].label}
														</Badge>

														{/* Priority */}
														<Badge className={priorityConf.color} variant="outline">
															{priorityConf.label}
														</Badge>

														{/* Status Select */}
														<Select
															value={task.status}
															onValueChange={(v) => updateTaskStatus(task.id, v as TaskStatus)}
														>
															<SelectTrigger className="w-[120px] h-8">
																<SelectValue />
															</SelectTrigger>
															<SelectContent>
																<SelectItem value="not_started">A faire</SelectItem>
																<SelectItem value="in_progress">En cours</SelectItem>
																<SelectItem value="completed">Termine</SelectItem>
																<SelectItem value="at_risk">A risque</SelectItem>
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
