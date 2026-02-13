"use client";

/**
 * Deal Timeline - Gantt Chart
 *
 * Visual timeline for M&A deal milestones:
 * - Phase-based organization
 * - Drag to adjust dates
 * - Dependencies between tasks
 * - Critical path highlighting
 */

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { numbersTools } from "@/actions";
import { toast } from "sonner";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import {
	Calendar,
	ArrowLeft,
	Download,
	Save,
	Plus,
	ChevronLeft,
	ChevronRight,
	Flag,
	CheckCircle2,
	Clock,
	AlertTriangle,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import { DealSelector } from "@/components/numbers/deal-selector";
import { CrossToolLinks } from "@/components/numbers/cross-tool-links";

type TaskStatus = "not_started" | "in_progress" | "completed" | "delayed";

interface TimelineTask {
	id: string;
	phase: string;
	name: string;
	startDate: string;
	endDate: string;
	status: TaskStatus;
	owner: string;
	isMilestone: boolean;
	dependencies: string[];
}

interface Phase {
	id: string;
	name: string;
	color: string;
}

const phases: Phase[] = [
	{ id: "preparation", name: "Preparation", color: "bg-slate-500" },
	{ id: "marketing", name: "Marketing", color: "bg-blue-500" },
	{ id: "due_diligence", name: "Due Diligence", color: "bg-amber-500" },
	{ id: "negotiation", name: "Negociation", color: "bg-orange-500" },
	{ id: "closing", name: "Closing", color: "bg-emerald-500" },
];

const statusConfig: Record<TaskStatus, { label: string; color: string; icon: typeof Clock }> = {
	not_started: { label: "A faire", color: "bg-gray-400", icon: Clock },
	in_progress: { label: "En cours", color: "bg-blue-500", icon: Clock },
	completed: { label: "Termine", color: "bg-emerald-500", icon: CheckCircle2 },
	delayed: { label: "Retard", color: "bg-red-500", icon: AlertTriangle },
};

const defaultTasks: TimelineTask[] = [
	// Preparation
	{ id: "t1", phase: "preparation", name: "Mandat signe", startDate: "2026-02-01", endDate: "2026-02-01", status: "completed", owner: "Equipe", isMilestone: true, dependencies: [] },
	{ id: "t2", phase: "preparation", name: "VDD Financiere", startDate: "2026-02-03", endDate: "2026-02-21", status: "in_progress", owner: "CFO", isMilestone: false, dependencies: ["t1"] },
	{ id: "t3", phase: "preparation", name: "VDD Juridique", startDate: "2026-02-03", endDate: "2026-02-21", status: "in_progress", owner: "Avocat", isMilestone: false, dependencies: ["t1"] },
	{ id: "t4", phase: "preparation", name: "Preparation Teaser", startDate: "2026-02-10", endDate: "2026-02-17", status: "not_started", owner: "M&A", isMilestone: false, dependencies: ["t1"] },
	{ id: "t5", phase: "preparation", name: "Preparation IM", startDate: "2026-02-17", endDate: "2026-03-03", status: "not_started", owner: "M&A", isMilestone: false, dependencies: ["t2", "t4"] },

	// Marketing
	{ id: "t6", phase: "marketing", name: "Lancement process", startDate: "2026-03-03", endDate: "2026-03-03", status: "not_started", owner: "M&A", isMilestone: true, dependencies: ["t5"] },
	{ id: "t7", phase: "marketing", name: "Envoi Teasers", startDate: "2026-03-03", endDate: "2026-03-10", status: "not_started", owner: "M&A", isMilestone: false, dependencies: ["t6"] },
	{ id: "t8", phase: "marketing", name: "Reception NDA", startDate: "2026-03-10", endDate: "2026-03-24", status: "not_started", owner: "M&A", isMilestone: false, dependencies: ["t7"] },
	{ id: "t9", phase: "marketing", name: "Envoi IM", startDate: "2026-03-17", endDate: "2026-03-24", status: "not_started", owner: "M&A", isMilestone: false, dependencies: ["t8"] },
	{ id: "t10", phase: "marketing", name: "Reception IOI", startDate: "2026-04-07", endDate: "2026-04-14", status: "not_started", owner: "M&A", isMilestone: false, dependencies: ["t9"] },

	// Due Diligence
	{ id: "t11", phase: "due_diligence", name: "Selection shortlist", startDate: "2026-04-14", endDate: "2026-04-14", status: "not_started", owner: "Client", isMilestone: true, dependencies: ["t10"] },
	{ id: "t12", phase: "due_diligence", name: "Acces Data Room", startDate: "2026-04-14", endDate: "2026-04-21", status: "not_started", owner: "M&A", isMilestone: false, dependencies: ["t11"] },
	{ id: "t13", phase: "due_diligence", name: "Management Presentations", startDate: "2026-04-21", endDate: "2026-05-05", status: "not_started", owner: "Client", isMilestone: false, dependencies: ["t12"] },
	{ id: "t14", phase: "due_diligence", name: "Q&A Due Diligence", startDate: "2026-04-21", endDate: "2026-05-19", status: "not_started", owner: "Client", isMilestone: false, dependencies: ["t12"] },
	{ id: "t15", phase: "due_diligence", name: "Reception Binding Offers", startDate: "2026-05-26", endDate: "2026-05-26", status: "not_started", owner: "M&A", isMilestone: true, dependencies: ["t14"] },

	// Negotiation
	{ id: "t16", phase: "negotiation", name: "Selection acquereur prefere", startDate: "2026-05-26", endDate: "2026-06-02", status: "not_started", owner: "Client", isMilestone: false, dependencies: ["t15"] },
	{ id: "t17", phase: "negotiation", name: "Negociation SPA", startDate: "2026-06-02", endDate: "2026-06-23", status: "not_started", owner: "Avocat", isMilestone: false, dependencies: ["t16"] },
	{ id: "t18", phase: "negotiation", name: "Confirmatory DD", startDate: "2026-06-02", endDate: "2026-06-16", status: "not_started", owner: "Acquereur", isMilestone: false, dependencies: ["t16"] },

	// Closing
	{ id: "t19", phase: "closing", name: "Signing", startDate: "2026-06-30", endDate: "2026-06-30", status: "not_started", owner: "Tous", isMilestone: true, dependencies: ["t17", "t18"] },
	{ id: "t20", phase: "closing", name: "Conditions suspensives", startDate: "2026-06-30", endDate: "2026-07-31", status: "not_started", owner: "Avocat", isMilestone: false, dependencies: ["t19"] },
	{ id: "t21", phase: "closing", name: "Closing", startDate: "2026-07-31", endDate: "2026-07-31", status: "not_started", owner: "Tous", isMilestone: true, dependencies: ["t20"] },
];

function parseDate(dateStr: string): Date {
	return new Date(dateStr);
}

function addDays(date: Date, days: number): Date {
	const result = new Date(date);
	result.setDate(result.getDate() + days);
	return result;
}

function getDaysBetween(start: Date, end: Date): number {
	return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
}

export default function TimelinePage() {
	const [tasks, setTasks] = useState<TimelineTask[]>(defaultTasks);
	const [dealName] = useState("Projet Alpha");
	const [viewStart, setViewStart] = useState(new Date("2026-02-01"));
	const [isAddOpen, setIsAddOpen] = useState(false);
	const [newTask, setNewTask] = useState<Partial<TimelineTask>>({
		phase: "preparation",
		status: "not_started",
		isMilestone: false,
		dependencies: [],
	});
	const [isSaving, setIsSaving] = useState(false);
	const router = useRouter();

	const viewDays = 120; // 4 months view
	const dayWidth = 8; // pixels per day

	const viewEnd = addDays(viewStart, viewDays);

	// Generate week markers
	const weeks = useMemo(() => {
		const result: { date: Date; label: string }[] = [];
		const current = new Date(viewStart);
		current.setDate(current.getDate() - current.getDay() + 1); // Start on Monday

		while (current <= viewEnd) {
			result.push({
				date: new Date(current),
				label: `${current.getDate()}/${current.getMonth() + 1}`,
			});
			current.setDate(current.getDate() + 7);
		}
		return result;
	}, [viewStart, viewEnd]);

	// Generate month markers
	const months = useMemo(() => {
		const result: { date: Date; label: string; width: number }[] = [];
		const current = new Date(viewStart);
		current.setDate(1);

		while (current <= viewEnd) {
			const monthStart = new Date(current);
			const monthEnd = new Date(current.getFullYear(), current.getMonth() + 1, 0);
			const visibleStart = monthStart < viewStart ? viewStart : monthStart;
			const visibleEnd = monthEnd > viewEnd ? viewEnd : monthEnd;
			const days = getDaysBetween(visibleStart, visibleEnd) + 1;

			result.push({
				date: new Date(current),
				label: current.toLocaleDateString("fr-FR", { month: "long", year: "numeric" }),
				width: days * dayWidth,
			});
			current.setMonth(current.getMonth() + 1);
		}
		return result;
	}, [viewStart, viewEnd, dayWidth]);

	// Group tasks by phase
	const tasksByPhase = useMemo(() => {
		return phases.map((phase) => ({
			...phase,
			tasks: tasks.filter((t) => t.phase === phase.id),
		}));
	}, [tasks]);

	// Calculate task position
	const getTaskPosition = (task: TimelineTask) => {
		const start = parseDate(task.startDate);
		const end = parseDate(task.endDate);
		const left = Math.max(0, getDaysBetween(viewStart, start)) * dayWidth;
		const width = Math.max(1, getDaysBetween(start, end) + 1) * dayWidth;
		return { left, width };
	};

	// Today marker position
	const today = new Date();
	const todayPosition = getDaysBetween(viewStart, today) * dayWidth;

	const handleAddTask = () => {
		if (!newTask.name || !newTask.startDate || !newTask.endDate) return;

		const task: TimelineTask = {
			id: `t${Date.now()}`,
			phase: newTask.phase || "preparation",
			name: newTask.name,
			startDate: newTask.startDate,
			endDate: newTask.endDate,
			status: newTask.status as TaskStatus,
			owner: newTask.owner || "",
			isMilestone: newTask.isMilestone || false,
			dependencies: [],
		};

		setTasks((prev) => [...prev, task]);
		setNewTask({
			phase: "preparation",
			status: "not_started",
			isMilestone: false,
			dependencies: [],
		});
		setIsAddOpen(false);
	};

	const updateTaskStatus = (taskId: string, status: TaskStatus) => {
		setTasks((prev) =>
			prev.map((t) => (t.id === taskId ? { ...t, status } : t))
		);
	};

	const navigateView = (direction: "prev" | "next") => {
		const days = direction === "prev" ? -30 : 30;
		setViewStart(addDays(viewStart, days));
	};

	// Stats
	const stats = useMemo(() => {
		const total = tasks.length;
		const completed = tasks.filter((t) => t.status === "completed").length;
		const inProgress = tasks.filter((t) => t.status === "in_progress").length;
		const delayed = tasks.filter((t) => t.status === "delayed").length;
		const milestones = tasks.filter((t) => t.isMilestone).length;

		return { total, completed, inProgress, delayed, milestones };
	}, [tasks]);

	const handleSave = useCallback(async () => {
		if (isSaving) return;

		setIsSaving(true);
		try {
			await numbersTools.saveTimeline({
				name: dealName,
				milestones: tasks.map(t => ({
					id: t.id,
					phase: t.phase,
					description: t.name,
					startDate: t.startDate,
					endDate: t.endDate,
					status: t.status as "not_started" | "in_progress" | "completed" | "delayed",
				})),
			});
			router.refresh();
			toast.success("Timeline sauvegardee", {
				description: `${tasks.length} taches pour ${dealName}`,
			});
		} catch (error) {
			console.error("Error saving timeline:", error);
			toast.error("Erreur de sauvegarde", {
				description: "Impossible de sauvegarder la timeline. Veuillez reessayer.",
			});
		} finally {
			setIsSaving(false);
		}
	}, [isSaving, dealName, viewStart, tasks, router]);

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
							<Calendar className="h-6 w-6" />
							Timeline - {dealName}
						</h1>
						<p className="text-muted-foreground">
							{stats.total} taches | {stats.milestones} jalons
						</p>
					</div>
				</div>
				<div className="flex items-center gap-3">
					<DealSelector toolId="timeline" compact />
					<CrossToolLinks currentTool="timeline" variant="compact" />
					<div className="flex gap-2">
						<Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
						<DialogTrigger asChild>
							<Button variant="outline">
								<Plus className="h-4 w-4 mr-2" />
								Ajouter Tache
							</Button>
						</DialogTrigger>
						<DialogContent>
							<DialogHeader>
								<DialogTitle>Nouvelle tache</DialogTitle>
								<DialogDescription>Ajoutez une tache au planning</DialogDescription>
							</DialogHeader>
							<div className="space-y-4">
								<div className="space-y-2">
									<Label>Nom</Label>
									<Input
										value={newTask.name || ""}
										onChange={(e) =>
											setNewTask((prev) => ({ ...prev, name: e.target.value }))
										}
									/>
								</div>
								<div className="grid grid-cols-2 gap-4">
									<div className="space-y-2">
										<Label>Phase</Label>
										<Select
											value={newTask.phase}
											onValueChange={(v) =>
												setNewTask((prev) => ({ ...prev, phase: v }))
											}
										>
											<SelectTrigger>
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												{phases.map((p) => (
													<SelectItem key={p.id} value={p.id}>
														{p.name}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</div>
									<div className="space-y-2">
										<Label>Responsable</Label>
										<Input
											value={newTask.owner || ""}
											onChange={(e) =>
												setNewTask((prev) => ({ ...prev, owner: e.target.value }))
											}
										/>
									</div>
								</div>
								<div className="grid grid-cols-2 gap-4">
									<div className="space-y-2">
										<Label>Date debut</Label>
										<Input
											type="date"
											value={newTask.startDate || ""}
											onChange={(e) =>
												setNewTask((prev) => ({ ...prev, startDate: e.target.value }))
											}
										/>
									</div>
									<div className="space-y-2">
										<Label>Date fin</Label>
										<Input
											type="date"
											value={newTask.endDate || ""}
											onChange={(e) =>
												setNewTask((prev) => ({ ...prev, endDate: e.target.value }))
											}
										/>
									</div>
								</div>
								<div className="flex items-center gap-2">
									<input
										type="checkbox"
										id="milestone"
										checked={newTask.isMilestone}
										onChange={(e) =>
											setNewTask((prev) => ({ ...prev, isMilestone: e.target.checked }))
										}
									/>
									<Label htmlFor="milestone">Jalon (milestone)</Label>
								</div>
								<Button onClick={handleAddTask} className="w-full">
									Ajouter
								</Button>
							</div>
						</DialogContent>
					</Dialog>
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

			{/* Stats */}
			<div className="grid grid-cols-2 md:grid-cols-5 gap-4">
				<Card>
					<CardContent className="pt-4">
						<div className="text-center">
							<p className="text-2xl font-bold">{stats.total}</p>
							<p className="text-xs text-muted-foreground">Taches</p>
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="pt-4">
						<div className="text-center">
							<p className="text-2xl font-bold text-emerald-600">{stats.completed}</p>
							<p className="text-xs text-muted-foreground">Terminees</p>
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="pt-4">
						<div className="text-center">
							<p className="text-2xl font-bold text-blue-600">{stats.inProgress}</p>
							<p className="text-xs text-muted-foreground">En cours</p>
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="pt-4">
						<div className="text-center">
							<p className="text-2xl font-bold text-red-600">{stats.delayed}</p>
							<p className="text-xs text-muted-foreground">En retard</p>
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="pt-4">
						<div className="text-center">
							<p className="text-2xl font-bold text-amber-600">{stats.milestones}</p>
							<p className="text-xs text-muted-foreground">Jalons</p>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Gantt Chart */}
			<Card>
				<CardHeader>
					<div className="flex items-center justify-between">
						<CardTitle>Planning</CardTitle>
						<div className="flex items-center gap-2">
							<Button variant="outline" size="icon" onClick={() => navigateView("prev")}>
								<ChevronLeft className="h-4 w-4" />
							</Button>
							<span className="text-sm text-muted-foreground px-2">
								{viewStart.toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}
							</span>
							<Button variant="outline" size="icon" onClick={() => navigateView("next")}>
								<ChevronRight className="h-4 w-4" />
							</Button>
						</div>
					</div>
				</CardHeader>
				<CardContent>
					<div className="overflow-x-auto">
						<div className="min-w-[1000px]">
							{/* Month Headers */}
							<div className="flex border-b">
								<div className="w-[250px] flex-shrink-0 p-2 font-medium bg-muted/50">
									Tache
								</div>
								<div className="flex-1 flex">
									{months.map((month) => (
										<div
											key={month.label}
											className="text-center text-sm font-medium py-2 border-l bg-muted/30"
											style={{ width: month.width }}
										>
											{month.label}
										</div>
									))}
								</div>
							</div>

							{/* Week Headers */}
							<div className="flex border-b">
								<div className="w-[250px] flex-shrink-0 p-2 text-xs text-muted-foreground bg-muted/30">
									Responsable
								</div>
								<div className="flex-1 relative" style={{ width: viewDays * dayWidth }}>
									{weeks.map((week) => (
										<div
											key={week.label}
											className="absolute text-xs text-muted-foreground border-l px-1 py-2"
											style={{ left: getDaysBetween(viewStart, week.date) * dayWidth }}
										>
											{week.label}
										</div>
									))}
								</div>
							</div>

							{/* Tasks by Phase */}
							{tasksByPhase.map((phase) => (
								<div key={phase.id}>
									{/* Phase Header */}
									<div className="flex border-b bg-muted/50">
										<div className="w-[250px] flex-shrink-0 p-2 flex items-center gap-2">
											<div className={`w-3 h-3 rounded ${phase.color}`} />
											<span className="font-medium">{phase.name}</span>
											<Badge variant="outline" className="text-xs">
												{phase.tasks.length}
											</Badge>
										</div>
										<div className="flex-1" />
									</div>

									{/* Phase Tasks */}
									{phase.tasks.map((task) => {
										const pos = getTaskPosition(task);
										const statusConf = statusConfig[task.status];

										return (
											<div key={task.id} className="flex border-b hover:bg-muted/30">
												<div className="w-[250px] flex-shrink-0 p-2 flex items-center justify-between">
													<div className="flex items-center gap-2">
														{task.isMilestone && (
															<Flag className="h-3 w-3 text-amber-500" />
														)}
														<span className="text-sm truncate">{task.name}</span>
													</div>
													<span className="text-xs text-muted-foreground">
														{task.owner}
													</span>
												</div>
												<div
													className="flex-1 relative h-10"
													style={{ width: viewDays * dayWidth }}
												>
													{/* Today line */}
													{todayPosition > 0 && todayPosition < viewDays * dayWidth && (
														<div
															className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10"
															style={{ left: todayPosition }}
														/>
													)}

													{/* Task bar */}
													{task.isMilestone ? (
														<div
															className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rotate-45 bg-amber-500 border-2 border-amber-600"
															style={{ left: pos.left - 8 }}
														/>
													) : (
														<button
															type="button"
															className={`absolute top-2 h-6 rounded ${statusConf.color} cursor-pointer transition-all hover:brightness-110`}
															style={{ left: pos.left, width: Math.max(pos.width, 4) }}
															onClick={() => {
																const nextStatus: Record<TaskStatus, TaskStatus> = {
																	not_started: "in_progress",
																	in_progress: "completed",
																	completed: "not_started",
																	delayed: "in_progress",
																};
																updateTaskStatus(task.id, nextStatus[task.status]);
															}}
														>
															<span className="text-xs text-white px-1 truncate block leading-6">
																{pos.width > 60 ? task.name : ""}
															</span>
														</button>
													)}
												</div>
											</div>
										);
									})}
								</div>
							))}
						</div>
					</div>

					{/* Legend */}
					<div className="mt-4 flex items-center gap-6 text-sm">
						<div className="flex items-center gap-2">
							<div className="w-4 h-4 rounded bg-gray-400" />
							<span>A faire</span>
						</div>
						<div className="flex items-center gap-2">
							<div className="w-4 h-4 rounded bg-blue-500" />
							<span>En cours</span>
						</div>
						<div className="flex items-center gap-2">
							<div className="w-4 h-4 rounded bg-emerald-500" />
							<span>Termine</span>
						</div>
						<div className="flex items-center gap-2">
							<div className="w-4 h-4 rounded bg-red-500" />
							<span>Retard</span>
						</div>
						<div className="flex items-center gap-2">
							<div className="w-4 h-4 rotate-45 bg-amber-500" />
							<span>Jalon</span>
						</div>
						<div className="flex items-center gap-2">
							<div className="w-0.5 h-4 bg-red-500" />
							<span>Aujourd&apos;hui</span>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
