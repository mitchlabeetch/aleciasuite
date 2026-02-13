"use client";

/**
 * Task & Research Management Hub
 *
 * Kanban-style task board for managing M&A research tasks with:
 * - Drag-and-drop between columns (Todo, In Progress, Review, Done)
 * - Task creation with deal/company linking
 * - Priority and due date management
 * - Task templates for common workflows
 */

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getTasks, getMyTasks, createTask as createTaskAction, updateTask as updateTaskAction, deleteTask as deleteTaskAction, moveTask as moveTaskAction } from "@/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import {
	CheckSquare,
	Plus,
	Calendar,
	Briefcase,
	Building2,
	Clock,
	AlertCircle,
	Loader2,
	MoreHorizontal,
	Trash2,
	Edit,
	ListTodo,
	Kanban,
	Filter,
	X,
} from "lucide-react";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Type definitions
interface Task {
	id: string;
	createdAt: Date;
	title: string;
	description?: string;
	dealId?: string;
	companyId?: string;
	assigneeId?: string;
	creatorId: string;
	priority: "low" | "medium" | "high";
	status: "todo" | "in_progress" | "review" | "done";
	dueDate?: number;
	completedAt?: number;
	tags?: string[];
	assigneeName?: string;
	assigneeAvatar?: string;
	creatorName?: string;
	dealTitle?: string;
	companyName?: string;
}

interface TaskStats {
	total: number;
	todo: number;
	inProgress: number;
	review: number;
	done: number;
	overdue: number;
}

interface UserInfo {
	id: string;
	name?: string;
	avatarUrl?: string;
}

// Status configuration
const STATUS_CONFIG = {
	todo: {
		label: "À faire",
		color: "bg-slate-100 text-slate-700 border-slate-200",
		columnColor: "bg-slate-50",
	},
	in_progress: {
		label: "En cours",
		color: "bg-blue-100 text-blue-700 border-blue-200",
		columnColor: "bg-blue-50",
	},
	review: {
		label: "Révision",
		color: "bg-purple-100 text-purple-700 border-purple-200",
		columnColor: "bg-purple-50",
	},
	done: {
		label: "Terminé",
		color: "bg-green-100 text-green-700 border-green-200",
		columnColor: "bg-green-50",
	},
} as const;

const PRIORITY_CONFIG = {
	high: { label: "Haute", color: "bg-red-100 text-red-700", icon: AlertCircle },
	medium: {
		label: "Moyenne",
		color: "bg-orange-100 text-orange-700",
		icon: Clock,
	},
	low: {
		label: "Basse",
		color: "bg-green-100 text-green-700",
		icon: CheckSquare,
	},
} as const;

// Task templates for M&A workflows
const TASK_TEMPLATES = [
	{
		name: "Due Diligence Financière",
		tasks: [
			{
				title: "Analyse des états financiers (3 ans)",
				priority: "high" as const,
			},
			{ title: "Revue du budget et prévisions", priority: "high" as const },
			{ title: "Analyse du BFR et trésorerie", priority: "medium" as const },
			{
				title: "Revue des contrats clients majeurs",
				priority: "medium" as const,
			},
			{
				title: "Analyse de la dette et engagements",
				priority: "high" as const,
			},
		],
	},
	{
		name: "Due Diligence Juridique",
		tasks: [
			{ title: "Revue des statuts et pactes", priority: "high" as const },
			{
				title: "Analyse des contrats de travail clés",
				priority: "medium" as const,
			},
			{ title: "Vérification des litiges en cours", priority: "high" as const },
			{
				title: "Revue de la propriété intellectuelle",
				priority: "medium" as const,
			},
			{ title: "Conformité réglementaire", priority: "medium" as const },
		],
	},
	{
		name: "Processus NDA",
		tasks: [
			{ title: "Préparer le NDA", priority: "high" as const },
			{ title: "Envoyer pour signature", priority: "high" as const },
			{ title: "Relancer si pas de retour (J+3)", priority: "medium" as const },
			{ title: "Archiver le NDA signé", priority: "low" as const },
		],
	},
];

// Get initials from name
function getInitials(name: string): string {
	return name
		.split(" ")
		.map((n) => n.charAt(0))
		.join("")
		.slice(0, 2)
		.toUpperCase();
}

// Format date
function formatDate(timestamp: number): string {
	return new Date(timestamp).toLocaleDateString("fr-FR", {
		day: "numeric",
		month: "short",
	});
}

// Check if date is overdue
function isOverdue(dueDate?: number): boolean {
	if (!dueDate) return false;
	return dueDate < Date.now();
}

// Task card component
function TaskCard({
	task,
	onMove,
	onEdit,
	onDelete,
}: {
	task: Task;
	onMove: (taskId: string, newStatus: Task["status"]) => void;
	onEdit: (task: Task) => void;
	onDelete: (taskId: string) => void;
}) {
	const priorityConfig = PRIORITY_CONFIG[task.priority];
	const overdue = isOverdue(task.dueDate) && task.status !== "done";

	return (
		<div
			className={`group bg-white dark:bg-gray-800 rounded-lg border p-3 shadow-sm hover:shadow-md transition-all ${
				overdue ? "border-red-300 bg-red-50/50" : "border-gray-200"
			}`}
		>
			{/* Header */}
			<div className="flex items-start justify-between gap-2 mb-2">
				<h4 className="font-medium text-sm line-clamp-2">{task.title}</h4>
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button
							variant="ghost"
							size="icon"
							className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
						>
							<MoreHorizontal className="h-4 w-4" />
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end">
						<DropdownMenuItem onClick={() => onEdit(task)}>
							<Edit className="h-4 w-4 mr-2" />
							Modifier
						</DropdownMenuItem>
						{task.status !== "todo" && (
							<DropdownMenuItem onClick={() => onMove(task.id, "todo")}>
								Déplacer vers À faire
							</DropdownMenuItem>
						)}
						{task.status !== "in_progress" && (
							<DropdownMenuItem onClick={() => onMove(task.id, "in_progress")}>
								Déplacer vers En cours
							</DropdownMenuItem>
						)}
						{task.status !== "review" && (
							<DropdownMenuItem onClick={() => onMove(task.id, "review")}>
								Déplacer vers Révision
							</DropdownMenuItem>
						)}
						{task.status !== "done" && (
							<DropdownMenuItem onClick={() => onMove(task.id, "done")}>
								Marquer comme Terminé
							</DropdownMenuItem>
						)}
						<DropdownMenuItem
							onClick={() => onDelete(task.id)}
							className="text-red-600"
						>
							<Trash2 className="h-4 w-4 mr-2" />
							Supprimer
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</div>

			{/* Description */}
			{task.description && (
				<p className="text-xs text-muted-foreground line-clamp-2 mb-2">
					{task.description}
				</p>
			)}

			{/* Linked entities */}
			<div className="flex flex-wrap gap-1 mb-2">
				{task.dealTitle && (
					<Badge variant="outline" className="text-xs gap-1">
						<Briefcase className="h-3 w-3" />
						{task.dealTitle}
					</Badge>
				)}
				{task.companyName && (
					<Badge variant="outline" className="text-xs gap-1">
						<Building2 className="h-3 w-3" />
						{task.companyName}
					</Badge>
				)}
			</div>

			{/* Footer */}
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-2">
					{/* Priority */}
					<Badge className={`text-xs ${priorityConfig.color}`}>
						{priorityConfig.label}
					</Badge>

					{/* Due date */}
					{task.dueDate && (
						<span
							className={`text-xs flex items-center gap-1 ${
								overdue ? "text-red-600 font-medium" : "text-muted-foreground"
							}`}
						>
							<Calendar className="h-3 w-3" />
							{formatDate(task.dueDate)}
						</span>
					)}
				</div>

				{/* Assignee */}
				{task.assigneeName && (
					<Avatar className="h-6 w-6">
						{task.assigneeAvatar && <AvatarImage src={task.assigneeAvatar} />}
						<AvatarFallback className="text-[10px] bg-primary/10">
							{getInitials(task.assigneeName)}
						</AvatarFallback>
					</Avatar>
				)}
			</div>
		</div>
	);
}

// Kanban column
function KanbanColumn({
	status,
	tasks,
	onMove,
	onEdit,
	onDelete,
}: {
	status: Task["status"];
	tasks: Task[];
	onMove: (taskId: string, newStatus: Task["status"]) => void;
	onEdit: (task: Task) => void;
	onDelete: (taskId: string) => void;
}) {
	const config = STATUS_CONFIG[status];

	return (
		<div
			className={`flex-1 min-w-[280px] rounded-lg ${config.columnColor} p-3`}
		>
			{/* Column header */}
			<div className="flex items-center justify-between mb-3">
				<div className="flex items-center gap-2">
					<Badge className={config.color}>{config.label}</Badge>
					<span className="text-sm text-muted-foreground">{tasks.length}</span>
				</div>
			</div>

			{/* Tasks */}
			<div className="space-y-2">
				{tasks.map((task) => (
					<TaskCard
						key={task.id}
						task={task}
						onMove={onMove}
						onEdit={onEdit}
						onDelete={onDelete}
					/>
				))}
				{tasks.length === 0 && (
					<p className="text-sm text-muted-foreground text-center py-4">
						Aucune tâche
					</p>
				)}
			</div>
		</div>
	);
}

// Create/Edit task dialog
function TaskDialog({
	task,
	isOpen,
	onClose,
	onSuccess,
}: {
	task?: Task;
	isOpen: boolean;
	onClose: () => void;
	onSuccess: () => void;
}) {
	const { toast } = useToast();
	const router = useRouter();
	const [deals, setDeals] = useState<Array<{ id: string; title: string }> | null>(null);
	const [users, setUsers] = useState<UserInfo[] | null>(null);

	useEffect(() => {
		if (isOpen) {
			// Fetch deals and users when dialog opens
			// Note: We need getDeals and getAllUsers server actions
			// For now, keeping placeholders
			setDeals([]);
			setUsers([]);
		}
	}, [isOpen]);

	const [isSubmitting, setIsSubmitting] = useState(false);
	const [formData, setFormData] = useState({
		title: task?.title || "",
		description: task?.description || "",
		dealId: task?.dealId || "",
		assigneeId: task?.assigneeId || "",
		priority: task?.priority || ("medium" as const),
		dueDate: task?.dueDate
			? new Date(task.dueDate).toISOString().split("T")[0]
			: "",
	});

	const handleSubmit = async () => {
		if (!formData.title.trim()) {
			toast({
				title: "Erreur",
				description: "Le titre est requis.",
				variant: "destructive",
			});
			return;
		}

		setIsSubmitting(true);
		try {
			if (task) {
				await updateTaskAction(
					task.id,
					{
						title: formData.title,
						description: formData.description || undefined,
						assigneeId: formData.assigneeId || undefined,
						dueDate: formData.dueDate
							? new Date(formData.dueDate).getTime()
							: undefined,
					}
				);
				toast({ title: "Tâche mise à jour" });
			} else {
				await createTaskAction({
					title: formData.title,
					description: formData.description || undefined,
					dealId: formData.dealId || undefined,
					assigneeId: formData.assigneeId || undefined,
					dueDate: formData.dueDate
						? new Date(formData.dueDate).getTime()
						: undefined,
				});
				toast({ title: "Tâche créée" });
			}
			onSuccess();
			onClose();
			router.refresh();
		} catch {
			toast({
				title: "Erreur",
				description: "Impossible de sauvegarder la tâche.",
				variant: "destructive",
			});
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>
						{task ? "Modifier la tâche" : "Nouvelle tâche"}
					</DialogTitle>
					<DialogDescription>
						{task
							? "Modifiez les détails de la tâche."
							: "Créez une nouvelle tâche de recherche."}
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-4 py-4">
					{/* Title */}
					<div>
						<label className="text-sm font-medium mb-2 block">
							Titre <span className="text-destructive">*</span>
						</label>
						<Input
							placeholder="Ex: Analyser les états financiers"
							value={formData.title}
							onChange={(e) =>
								setFormData((prev) => ({ ...prev, title: e.target.value }))
							}
						/>
					</div>

					{/* Description */}
					<div>
						<label className="text-sm font-medium mb-2 block">
							Description
						</label>
						<Textarea
							placeholder="Détails de la tâche..."
							value={formData.description}
							onChange={(e) =>
								setFormData((prev) => ({
									...prev,
									description: e.target.value,
								}))
							}
							rows={3}
						/>
					</div>

					{/* Deal */}
					<div>
						<label className="text-sm font-medium mb-2 block">
							Deal associé
						</label>
						<Select
							value={formData.dealId}
							onValueChange={(value) =>
								setFormData((prev) => ({ ...prev, dealId: value }))
							}
						>
							<SelectTrigger>
								<SelectValue placeholder="Sélectionner un deal..." />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="">Aucun deal</SelectItem>
								{deals?.map((deal: { id: string; title: string }) => (
									<SelectItem key={deal.id} value={deal.id}>
										{deal.title}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					{/* Assignee */}
					<div>
						<label className="text-sm font-medium mb-2 block">Assigné à</label>
						<Select
							value={formData.assigneeId}
							onValueChange={(value) =>
								setFormData((prev) => ({ ...prev, assigneeId: value }))
							}
						>
							<SelectTrigger>
								<SelectValue placeholder="Sélectionner un membre..." />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="">Non assigné</SelectItem>
								{users?.map((user: UserInfo) => (
									<SelectItem key={user.id} value={user.id}>
										{user.name || "Utilisateur"}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					{/* Priority and Due Date */}
					<div className="grid grid-cols-2 gap-4">
						<div>
							<label className="text-sm font-medium mb-2 block">Priorité</label>
							<Select
								value={formData.priority}
								onValueChange={(value: "low" | "medium" | "high") =>
									setFormData((prev) => ({ ...prev, priority: value }))
								}
							>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="low">Basse</SelectItem>
									<SelectItem value="medium">Moyenne</SelectItem>
									<SelectItem value="high">Haute</SelectItem>
								</SelectContent>
							</Select>
						</div>
						<div>
							<label className="text-sm font-medium mb-2 block">Échéance</label>
							<Input
								type="date"
								value={formData.dueDate}
								onChange={(e) =>
									setFormData((prev) => ({ ...prev, dueDate: e.target.value }))
								}
							/>
						</div>
					</div>
				</div>

				<DialogFooter>
					<Button variant="outline" onClick={onClose}>
						Annuler
					</Button>
					<Button onClick={handleSubmit} disabled={isSubmitting}>
						{isSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
						{task ? "Enregistrer" : "Créer"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

// Template dialog
function TemplateDialog({
	isOpen,
	onClose,
	onApply,
}: {
	isOpen: boolean;
	onClose: () => void;
	onApply: (
		tasks: Array<{ title: string; priority: "low" | "medium" | "high" }>,
	) => void;
}) {
	const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null);

	const handleApply = () => {
		if (selectedTemplate !== null) {
			onApply(TASK_TEMPLATES[selectedTemplate].tasks);
			onClose();
		}
	};

	return (
		<Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
			<DialogContent className="max-w-lg">
				<DialogHeader>
					<DialogTitle>Templates de tâches</DialogTitle>
					<DialogDescription>
						Sélectionnez un template pour créer plusieurs tâches.
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-3 py-4">
					{TASK_TEMPLATES.map((template, index) => (
						<button
							key={template.name}
							onClick={() => setSelectedTemplate(index)}
							className={`w-full text-left p-4 rounded-lg border transition-colors ${
								selectedTemplate === index
									? "border-primary bg-primary/5"
									: "border-gray-200 hover:bg-muted"
							}`}
						>
							<p className="font-medium">{template.name}</p>
							<p className="text-sm text-muted-foreground">
								{template.tasks.length} tâches
							</p>
							<div className="flex flex-wrap gap-1 mt-2">
								{template.tasks.slice(0, 3).map((t) => (
									<Badge key={t.title} variant="outline" className="text-xs">
										{t.title.slice(0, 25)}...
									</Badge>
								))}
								{template.tasks.length > 3 && (
									<Badge variant="outline" className="text-xs">
										+{template.tasks.length - 3} autres
									</Badge>
								)}
							</div>
						</button>
					))}
				</div>

				<DialogFooter>
					<Button variant="outline" onClick={onClose}>
						Annuler
					</Button>
					<Button onClick={handleApply} disabled={selectedTemplate === null}>
						Appliquer le template
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

export default function TasksPage() {
	const { toast } = useToast();
	const router = useRouter();

	// State
	const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban");
	const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
	const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
	const [editingTask, setEditingTask] = useState<Task | undefined>(undefined);
	const [filterDeal, setFilterDeal] = useState<string>("all");
	const [filterAssignee, setFilterAssignee] = useState<string>("all");

	// Data
	const [tasks, setTasks] = useState<Task[] | null>(null);
	const [stats, setStats] = useState<TaskStats | null>(null);
	const [deals, setDeals] = useState<Array<{ id: string; title: string }> | null>(null);
	const [users, setUsers] = useState<UserInfo[] | null>(null);

	useEffect(() => {
		getTasks({}).then(data => setTasks(data as unknown as Task[]));
		// Note: getTaskStats not in mappings, would need to be added
		// For now, calculating stats client-side
		// getDeals and getAllUsers also not in mappings
		setDeals([]);
		setUsers([]);
	}, []);

	// Calculate stats from tasks
	useEffect(() => {
		if (tasks) {
			const now = Date.now();
			setStats({
				total: tasks.length,
				todo: tasks.filter((t) => t.status === "todo").length,
				inProgress: tasks.filter((t) => t.status === "in_progress").length,
				review: tasks.filter((t) => t.status === "review").length,
				done: tasks.filter((t) => t.status === "done").length,
				overdue: tasks.filter((t) => t.dueDate && t.dueDate < now && t.status !== "done").length,
			});
		}
	}, [tasks]);

	const isLoading = tasks === null || stats === null;

	// Filter tasks
	const filteredTasks = (tasks || []).filter((task: Task) => {
		if (filterDeal !== "all" && task.dealId !== filterDeal) return false;
		if (filterAssignee !== "all" && task.assigneeId !== filterAssignee)
			return false;
		return true;
	});

	// Group tasks by status
	const tasksByStatus = {
		todo: filteredTasks.filter((t: Task) => t.status === "todo"),
		in_progress: filteredTasks.filter((t: Task) => t.status === "in_progress"),
		review: filteredTasks.filter((t: Task) => t.status === "review"),
		done: filteredTasks.filter((t: Task) => t.status === "done"),
	};

	const handleMove = async (
		taskId: string,
		newStatus: Task["status"],
	) => {
		try {
			await moveTaskAction(taskId, newStatus);
			toast({ title: "Tâche déplacée" });
			// Refresh data
			getTasks({}).then(data => setTasks(data as unknown as Task[]));
			router.refresh();
		} catch {
			toast({
				title: "Erreur",
				description: "Impossible de déplacer la tâche.",
				variant: "destructive",
			});
		}
	};

	const handleDelete = async (taskId: string) => {
		try {
			await deleteTaskAction(taskId);
			toast({ title: "Tâche supprimée" });
			// Refresh data
			getTasks({}).then(data => setTasks(data as unknown as Task[]));
			router.refresh();
		} catch {
			toast({
				title: "Erreur",
				description: "Impossible de supprimer la tâche.",
				variant: "destructive",
			});
		}
	};

	const handleEdit = (task: Task) => {
		setEditingTask(task);
		setIsTaskDialogOpen(true);
	};

	const handleApplyTemplate = async (
		templateTasks: Array<{
			title: string;
			priority: "low" | "medium" | "high";
		}>,
	) => {
		try {
			for (const t of templateTasks) {
				await createTaskAction({
					title: t.title,
				});
			}
			toast({
				title: "Template appliqué",
				description: `${templateTasks.length} tâches créées.`,
			});
			// Refresh data
			getTasks({}).then(data => setTasks(data as unknown as Task[]));
			router.refresh();
		} catch {
			toast({
				title: "Erreur",
				description: "Impossible d'appliquer le template.",
				variant: "destructive",
			});
		}
	};

	const activeFilters =
		(filterDeal !== "all" ? 1 : 0) + (filterAssignee !== "all" ? 1 : 0);

	const clearFilters = () => {
		setFilterDeal("all");
		setFilterAssignee("all");
	};

	if (isLoading) {
		return (
			<div className="flex items-center justify-center min-h-[400px]">
				<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
			</div>
		);
	}

	const taskStats = stats as TaskStats;

	return (
		<div className="space-y-6 p-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold flex items-center gap-2">
						<CheckSquare className="h-8 w-8 text-primary" />
						Gestion des Tâches
					</h1>
					<p className="text-muted-foreground">
						Organisez et suivez les tâches de recherche M&A.
					</p>
				</div>
				<div className="flex items-center gap-2">
					<Button
						variant="outline"
						onClick={() => setIsTemplateDialogOpen(true)}
					>
						<ListTodo className="h-4 w-4 mr-2" />
						Templates
					</Button>
					<Button onClick={() => setIsTaskDialogOpen(true)}>
						<Plus className="h-4 w-4 mr-2" />
						Nouvelle tâche
					</Button>
				</div>
			</div>

			{/* Stats */}
			<div className="grid grid-cols-2 md:grid-cols-6 gap-4">
				<Card>
					<CardContent className="pt-4">
						<p className="text-2xl font-bold">{taskStats.total}</p>
						<p className="text-sm text-muted-foreground">Total</p>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="pt-4">
						<p className="text-2xl font-bold">{taskStats.todo}</p>
						<p className="text-sm text-muted-foreground">À faire</p>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="pt-4">
						<p className="text-2xl font-bold">{taskStats.inProgress}</p>
						<p className="text-sm text-muted-foreground">En cours</p>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="pt-4">
						<p className="text-2xl font-bold">{taskStats.review}</p>
						<p className="text-sm text-muted-foreground">Révision</p>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="pt-4">
						<p className="text-2xl font-bold text-green-600">
							{taskStats.done}
						</p>
						<p className="text-sm text-muted-foreground">Terminé</p>
					</CardContent>
				</Card>
				<Card
					className={taskStats.overdue > 0 ? "border-red-200 bg-red-50/50" : ""}
				>
					<CardContent className="pt-4">
						<p
							className={`text-2xl font-bold ${taskStats.overdue > 0 ? "text-red-600" : ""}`}
						>
							{taskStats.overdue}
						</p>
						<p className="text-sm text-muted-foreground">En retard</p>
					</CardContent>
				</Card>
			</div>

			{/* Filters and View Toggle */}
			<Card>
				<CardContent className="pt-4">
					<div className="flex items-center gap-4 flex-wrap">
						<div className="flex items-center gap-2 text-sm font-medium">
							<Filter className="h-4 w-4" />
							Filtres
						</div>

						{/* Deal filter */}
						<Select value={filterDeal} onValueChange={setFilterDeal}>
							<SelectTrigger className="w-[180px]">
								<SelectValue placeholder="Deal" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">Tous les deals</SelectItem>
								{deals?.map((deal: { id: string; title: string }) => (
									<SelectItem key={deal.id} value={deal.id}>
										{deal.title}
									</SelectItem>
								))}
							</SelectContent>
						</Select>

						{/* Assignee filter */}
						<Select value={filterAssignee} onValueChange={setFilterAssignee}>
							<SelectTrigger className="w-[180px]">
								<SelectValue placeholder="Assigné" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">Tous les membres</SelectItem>
								{users?.map((user: UserInfo) => (
									<SelectItem key={user.id} value={user.id}>
										{user.name || "Utilisateur"}
									</SelectItem>
								))}
							</SelectContent>
						</Select>

						{activeFilters > 0 && (
							<Button variant="ghost" size="sm" onClick={clearFilters}>
								<X className="h-4 w-4 mr-1" />
								Effacer ({activeFilters})
							</Button>
						)}

						<div className="flex-1" />

						{/* View toggle */}
						<div className="flex items-center border rounded-lg p-1">
							<Button
								variant={viewMode === "kanban" ? "secondary" : "ghost"}
								size="sm"
								onClick={() => setViewMode("kanban")}
							>
								<Kanban className="h-4 w-4" />
							</Button>
							<Button
								variant={viewMode === "list" ? "secondary" : "ghost"}
								size="sm"
								onClick={() => setViewMode("list")}
							>
								<ListTodo className="h-4 w-4" />
							</Button>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Kanban Board */}
			{viewMode === "kanban" && (
				<div className="flex gap-4 overflow-x-auto pb-4">
					{(["todo", "in_progress", "review", "done"] as const).map(
						(status) => (
							<KanbanColumn
								key={status}
								status={status}
								tasks={tasksByStatus[status]}
								onMove={handleMove}
								onEdit={handleEdit}
								onDelete={handleDelete}
							/>
						),
					)}
				</div>
			)}

			{/* List View */}
			{viewMode === "list" && (
				<Card>
					<CardContent className="pt-4">
						{filteredTasks.length === 0 ? (
							<div className="text-center py-8 text-muted-foreground">
								Aucune tâche trouvée.
							</div>
						) : (
							<div className="space-y-2">
								{filteredTasks.map((task: Task) => (
									<div
										key={task.id}
										className="flex items-center gap-4 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
									>
										<Badge className={STATUS_CONFIG[task.status].color}>
											{STATUS_CONFIG[task.status].label}
										</Badge>
										<div className="flex-1 min-w-0">
											<p className="font-medium truncate">{task.title}</p>
											{task.dealTitle && (
												<p className="text-sm text-muted-foreground">
													{task.dealTitle}
												</p>
											)}
										</div>
										<Badge className={PRIORITY_CONFIG[task.priority].color}>
											{PRIORITY_CONFIG[task.priority].label}
										</Badge>
										{task.dueDate && (
											<span
												className={`text-sm ${
													isOverdue(task.dueDate) && task.status !== "done"
														? "text-red-600"
														: "text-muted-foreground"
												}`}
											>
												{formatDate(task.dueDate)}
											</span>
										)}
										{task.assigneeName && (
											<Avatar className="h-6 w-6">
												<AvatarFallback className="text-[10px]">
													{getInitials(task.assigneeName)}
												</AvatarFallback>
											</Avatar>
										)}
										<DropdownMenu>
											<DropdownMenuTrigger asChild>
												<Button variant="ghost" size="icon" className="h-8 w-8">
													<MoreHorizontal className="h-4 w-4" />
												</Button>
											</DropdownMenuTrigger>
											<DropdownMenuContent align="end">
												<DropdownMenuItem onClick={() => handleEdit(task)}>
													<Edit className="h-4 w-4 mr-2" />
													Modifier
												</DropdownMenuItem>
												<DropdownMenuItem
													onClick={() => handleDelete(task.id)}
													className="text-red-600"
												>
													<Trash2 className="h-4 w-4 mr-2" />
													Supprimer
												</DropdownMenuItem>
											</DropdownMenuContent>
										</DropdownMenu>
									</div>
								))}
							</div>
						)}
					</CardContent>
				</Card>
			)}

			{/* Task Dialog */}
			<TaskDialog
				task={editingTask}
				isOpen={isTaskDialogOpen}
				onClose={() => {
					setIsTaskDialogOpen(false);
					setEditingTask(undefined);
				}}
				onSuccess={() => {
					getTasks({}).then(data => setTasks(data as unknown as Task[]));
				}}
			/>

			{/* Template Dialog */}
			<TemplateDialog
				isOpen={isTemplateDialogOpen}
				onClose={() => setIsTemplateDialogOpen(false)}
				onApply={handleApplyTemplate}
			/>
		</div>
	);
}
