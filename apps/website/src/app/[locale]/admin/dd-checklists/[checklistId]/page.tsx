"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { getChecklist, getChecklistStats, updateItem } from "@/actions";
import {
	AlertCircle,
	AlertTriangle,
	ArrowLeft,
	Check,
	CheckCircle2,
	ChevronDown,
	ChevronRight,
	Clock,
	FileText,
	Loader2,
	MoreHorizontal,
	User,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

type ItemStatus =
	| "pending"
	| "in_progress"
	| "received"
	| "reviewed"
	| "issue_found"
	| "not_applicable";
type ItemPriority = "critical" | "important" | "standard";
type IssueSeverity = "blocker" | "major" | "minor";

interface ChecklistItem {
	_id: string;
	checklistId: string;
	section: string;
	item: string;
	description?: string;
	priority: ItemPriority;
	status: ItemStatus;
	assignedTo?: string;
	dueDate?: number;
	documents?: string[];
	notes?: string;
	issueDescription?: string;
	issueSeverity?: IssueSeverity;
	completedAt?: number;
	completedBy?: string;
	order?: number;
}

const statusConfig: Record<
	ItemStatus,
	{ label: string; color: string; icon: React.ElementType }
> = {
	pending: {
		label: "Pending",
		color: "bg-gray-100 text-gray-700",
		icon: Clock,
	},
	in_progress: {
		label: "In Progress",
		color: "bg-blue-100 text-blue-700",
		icon: Loader2,
	},
	received: {
		label: "Received",
		color: "bg-purple-100 text-purple-700",
		icon: FileText,
	},
	reviewed: {
		label: "Reviewed",
		color: "bg-green-100 text-green-700",
		icon: CheckCircle2,
	},
	issue_found: {
		label: "Issue Found",
		color: "bg-red-100 text-red-700",
		icon: AlertCircle,
	},
	not_applicable: {
		label: "N/A",
		color: "bg-gray-100 text-gray-500",
		icon: Check,
	},
};

const _priorityConfig: Record<ItemPriority, { label: string; color: string }> =
	{
		critical: { label: "Critical", color: "bg-red-500 text-white" },
		important: { label: "Important", color: "bg-yellow-500 text-white" },
		standard: { label: "Standard", color: "bg-gray-400 text-white" },
	};

const severityConfig: Record<IssueSeverity, { label: string; color: string }> =
	{
		blocker: { label: "Blocker", color: "text-red-600" },
		major: { label: "Major", color: "text-orange-600" },
		minor: { label: "Minor", color: "text-yellow-600" },
	};

export default function ChecklistDetailPage() {
	const params = useParams();
	const router = useRouter();
	const checklistId = params.checklistId as string;

	const [checklist, setChecklist] = useState<any | null>(null);
	const [stats, setStats] = useState<any | null>(null);
	const [users, setUsers] = useState<any[] | null>(null);

	// Load data on mount
	useEffect(() => {
		getChecklist(checklistId).then(setChecklist);
		getChecklistStats(checklistId).then(setStats);
		// TODO: Add getAllUsers server action
		// getAllUsers({}).then(setUsers);
	}, [checklistId]);

	const [expandedSections, setExpandedSections] = useState<Set<string>>(
		new Set(),
	);
	const [selectedItem, setSelectedItem] = useState<ChecklistItem | null>(null);
	const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

	// Edit form state
	const [editStatus, setEditStatus] = useState<ItemStatus>("pending");
	const [editAssignee, setEditAssignee] = useState<string>("");
	const [editNotes, setEditNotes] = useState("");
	const [editIssueDescription, setEditIssueDescription] = useState("");
	const [editIssueSeverity, setEditIssueSeverity] = useState<
		IssueSeverity | ""
	>("");
	const [saving, setSaving] = useState(false);

	const toggleSection = (section: string) => {
		const newExpanded = new Set(expandedSections);
		if (newExpanded.has(section)) {
			newExpanded.delete(section);
		} else {
			newExpanded.add(section);
		}
		setExpandedSections(newExpanded);
	};

	const openEditDialog = (item: ChecklistItem) => {
		setSelectedItem(item);
		setEditStatus(item.status);
		setEditAssignee(item.assignedTo ?? "");
		setEditNotes(item.notes ?? "");
		setEditIssueDescription(item.issueDescription ?? "");
		setEditIssueSeverity(item.issueSeverity ?? "");
		setIsEditDialogOpen(true);
	};

	const handleSave = async () => {
		if (!selectedItem) return;

		setSaving(true);
		try {
			await updateItem(selectedItem._id, {
				notes: editNotes || undefined,
			});
			setIsEditDialogOpen(false);
			setSelectedItem(null);
			// Refresh data
			getChecklist(checklistId).then(setChecklist);
			getChecklistStats(checklistId).then(setStats);
			router.refresh();
		} catch (error) {
			console.error("Failed to update item:", error);
		} finally {
			setSaving(false);
		}
	};

	const quickStatusUpdate = async (
		item: ChecklistItem,
		newStatus: ItemStatus,
	) => {
		try {
			if (newStatus === "reviewed") {
				await updateItem(item._id, {
					isCompleted: true,
				});
			} else {
				await updateItem(item._id, {
					isCompleted: false,
				});
			}
			// Refresh data
			getChecklist(checklistId).then(setChecklist);
			getChecklistStats(checklistId).then(setStats);
			router.refresh();
		} catch (error) {
			console.error("Failed to update status:", error);
		}
	};

	if (!checklist) {
		return (
			<div className="flex items-center justify-center h-64">
				<Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
			</div>
		);
	}

	const sections = Object.keys(checklist.sections || {});

	return (
		<div className="space-y-6 p-6">
			{/* Header */}
			<div className="flex items-center gap-4">
				<Link href="/admin/dd-checklists">
					<Button variant="ghost" size="icon">
						<ArrowLeft className="w-4 h-4" />
					</Button>
				</Link>
				<div className="flex-1">
					<h1 className="text-2xl font-bold">{checklist.name}</h1>
					<p className="text-muted-foreground">
						{checklist.progress}% complete
					</p>
				</div>
			</div>

			{/* Stats Cards */}
			{stats && (
				<div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
					<Card>
						<CardHeader className="pb-2">
							<CardTitle className="text-xs font-medium text-muted-foreground">
								Total Items
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="text-xl font-bold">{stats.total}</div>
						</CardContent>
					</Card>
					<Card>
						<CardHeader className="pb-2">
							<CardTitle className="text-xs font-medium text-muted-foreground">
								Pending
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="text-xl font-bold text-gray-600">
								{stats.pending}
							</div>
						</CardContent>
					</Card>
					<Card>
						<CardHeader className="pb-2">
							<CardTitle className="text-xs font-medium text-muted-foreground">
								In Progress
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="text-xl font-bold text-blue-600">
								{stats.inProgress}
							</div>
						</CardContent>
					</Card>
					<Card>
						<CardHeader className="pb-2">
							<CardTitle className="text-xs font-medium text-muted-foreground">
								Received
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="text-xl font-bold text-purple-600">
								{stats.received}
							</div>
						</CardContent>
					</Card>
					<Card>
						<CardHeader className="pb-2">
							<CardTitle className="text-xs font-medium text-muted-foreground">
								Reviewed
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="text-xl font-bold text-green-600">
								{stats.reviewed}
							</div>
						</CardContent>
					</Card>
					<Card>
						<CardHeader className="pb-2">
							<CardTitle className="text-xs font-medium text-muted-foreground">
								Issues
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="text-xl font-bold text-red-600">
								{stats.issueFound}
							</div>
						</CardContent>
					</Card>
					<Card>
						<CardHeader className="pb-2">
							<CardTitle className="text-xs font-medium text-muted-foreground">
								Overdue
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="text-xl font-bold text-orange-600">
								{stats.overdue}
							</div>
						</CardContent>
					</Card>
				</div>
			)}

			{/* Progress by Section */}
			{stats && Object.keys(stats.bySection).length > 0 && (
				<Card>
					<CardHeader>
						<CardTitle className="text-base">Progress by Section</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
							{Object.entries(stats.bySection).map(([section, data]) => {
								const sectionData = data as {
									total: number;
									completed: number;
								};
								const progress =
									sectionData.total > 0
										? Math.round(
												(sectionData.completed / sectionData.total) * 100,
											)
										: 0;
								return (
									<div key={section} className="space-y-2">
										<div className="flex items-center justify-between text-sm">
											<span className="font-medium truncate">{section}</span>
											<span className="text-muted-foreground">
												{sectionData.completed}/{sectionData.total}
											</span>
										</div>
										<div className="h-2 bg-muted rounded-full overflow-hidden">
											<div
												className={`h-full transition-all ${
													progress === 100 ? "bg-green-500" : "bg-blue-500"
												}`}
												style={{ width: `${progress}%` }}
											/>
										</div>
									</div>
								);
							})}
						</div>
					</CardContent>
				</Card>
			)}

			{/* Sections */}
			<div className="space-y-4">
				{sections.map((section) => {
					const items =
						(checklist.sections as Record<string, ChecklistItem[]>)[section] ||
						[];
					const isExpanded = expandedSections.has(section);
					const completedCount = items.filter((i: ChecklistItem) =>
						["received", "reviewed", "not_applicable"].includes(i.status),
					).length;

					return (
						<Card key={section}>
							<CardHeader
								className="cursor-pointer hover:bg-muted/50 transition-colors"
								onClick={() => toggleSection(section)}
							>
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-2">
										{isExpanded ? (
											<ChevronDown className="w-4 h-4" />
										) : (
											<ChevronRight className="w-4 h-4" />
										)}
										<CardTitle className="text-base">{section}</CardTitle>
										<span className="text-sm text-muted-foreground">
											({completedCount}/{items.length})
										</span>
									</div>
									<div className="h-2 w-32 bg-muted rounded-full overflow-hidden">
										<div
											className="h-full bg-green-500 transition-all"
											style={{
												width: `${items.length > 0 ? (completedCount / items.length) * 100 : 0}%`,
											}}
										/>
									</div>
								</div>
							</CardHeader>

							{isExpanded && (
								<CardContent className="pt-0">
									<div className="divide-y">
										{items.map((item: ChecklistItem) => {
											const StatusIcon = statusConfig[item.status].icon;
											return (
												<div
													key={item._id}
													className="py-3 flex items-start gap-3 group"
												>
													{/* Priority indicator */}
													<div
														className={`w-1 h-12 rounded-full ${
															item.priority === "critical"
																? "bg-red-500"
																: item.priority === "important"
																	? "bg-yellow-500"
																	: "bg-gray-300"
														}`}
													/>

													{/* Content */}
													<div className="flex-1 min-w-0">
														<div className="flex items-start justify-between gap-2">
															<div className="flex-1">
																<p className="font-medium">{item.item}</p>
																{item.description && (
																	<p className="text-sm text-muted-foreground mt-1">
																		{item.description}
																	</p>
																)}
																{item.status === "issue_found" &&
																	item.issueDescription && (
																		<div className="mt-2 p-2 bg-red-50 rounded text-sm">
																			<div className="flex items-center gap-1 text-red-700 font-medium">
																				<AlertTriangle className="w-3 h-3" />
																				{item.issueSeverity && (
																					<span
																						className={
																							severityConfig[item.issueSeverity]
																								.color
																						}
																					>
																						{
																							severityConfig[item.issueSeverity]
																								.label
																						}
																						:
																					</span>
																				)}
																			</div>
																			<p className="text-red-600 mt-1">
																				{item.issueDescription}
																			</p>
																		</div>
																	)}
															</div>

															{/* Status badge */}
															<span
																className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium whitespace-nowrap ${statusConfig[item.status].color}`}
															>
																<StatusIcon className="w-3 h-3" />
																{statusConfig[item.status].label}
															</span>
														</div>

														{/* Meta info */}
														<div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
															{item.assignedTo && (
																<span className="flex items-center gap-1">
																	<User className="w-3 h-3" />
																	{users?.find(
																		(u: { _id: string }) =>
																			u._id === item.assignedTo,
																	)?.name ?? "Assigned"}
																</span>
															)}
															{item.dueDate && (
																<span
																	className={`flex items-center gap-1 ${
																		item.dueDate < Date.now() &&
																		![
																			"received",
																			"reviewed",
																			"not_applicable",
																		].includes(item.status)
																			? "text-red-600 font-medium"
																			: ""
																	}`}
																>
																	<Clock className="w-3 h-3" />
																	Due{" "}
																	{new Date(item.dueDate).toLocaleDateString()}
																</span>
															)}
															{item.documents && item.documents.length > 0 && (
																<span className="flex items-center gap-1">
																	<FileText className="w-3 h-3" />
																	{item.documents.length} doc(s)
																</span>
															)}
														</div>
													</div>

													{/* Actions */}
													<DropdownMenu>
														<DropdownMenuTrigger asChild>
															<Button
																variant="ghost"
																size="icon"
																className="opacity-0 group-hover:opacity-100 transition-opacity"
															>
																<MoreHorizontal className="w-4 h-4" />
															</Button>
														</DropdownMenuTrigger>
														<DropdownMenuContent align="end">
															<DropdownMenuItem
																onClick={() => openEditDialog(item)}
															>
																Edit Details
															</DropdownMenuItem>
															{item.status !== "in_progress" && (
																<DropdownMenuItem
																	onClick={() =>
																		quickStatusUpdate(item, "in_progress")
																	}
																>
																	Mark In Progress
																</DropdownMenuItem>
															)}
															{item.status !== "received" && (
																<DropdownMenuItem
																	onClick={() =>
																		quickStatusUpdate(item, "received")
																	}
																>
																	Mark Received
																</DropdownMenuItem>
															)}
															{item.status !== "reviewed" && (
																<DropdownMenuItem
																	onClick={() =>
																		quickStatusUpdate(item, "reviewed")
																	}
																>
																	Mark Reviewed
																</DropdownMenuItem>
															)}
															<DropdownMenuItem
																onClick={() => openEditDialog(item)}
																className="text-red-600"
															>
																Flag Issue
															</DropdownMenuItem>
														</DropdownMenuContent>
													</DropdownMenu>
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

			{/* Edit Dialog */}
			<Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
				<DialogContent className="max-w-lg">
					<DialogHeader>
						<DialogTitle>Edit Checklist Item</DialogTitle>
						<DialogDescription>{selectedItem?.item}</DialogDescription>
					</DialogHeader>

					<div className="space-y-4 py-4">
						<div className="space-y-2">
							<Label>Status</Label>
							<Select
								value={editStatus}
								onValueChange={(v) => setEditStatus(v as ItemStatus)}
							>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="pending">Pending</SelectItem>
									<SelectItem value="in_progress">In Progress</SelectItem>
									<SelectItem value="received">Received</SelectItem>
									<SelectItem value="reviewed">Reviewed</SelectItem>
									<SelectItem value="issue_found">Issue Found</SelectItem>
									<SelectItem value="not_applicable">Not Applicable</SelectItem>
								</SelectContent>
							</Select>
						</div>

						<div className="space-y-2">
							<Label>Assigned To</Label>
							<Select value={editAssignee} onValueChange={setEditAssignee}>
								<SelectTrigger>
									<SelectValue placeholder="Select team member" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="">Unassigned</SelectItem>
									{users?.map((user: { _id: string; name: string }) => (
										<SelectItem key={user._id} value={user._id}>
											{user.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						<div className="space-y-2">
							<Label>Notes</Label>
							<Textarea
								placeholder="Add notes about this item..."
								value={editNotes}
								onChange={(e) => setEditNotes(e.target.value)}
								rows={3}
							/>
						</div>

						{editStatus === "issue_found" && (
							<>
								<div className="space-y-2">
									<Label>Issue Severity</Label>
									<Select
										value={editIssueSeverity}
										onValueChange={(v) =>
											setEditIssueSeverity(v as IssueSeverity)
										}
									>
										<SelectTrigger>
											<SelectValue placeholder="Select severity" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="minor">Minor</SelectItem>
											<SelectItem value="major">Major</SelectItem>
											<SelectItem value="blocker">Blocker</SelectItem>
										</SelectContent>
									</Select>
								</div>

								<div className="space-y-2">
									<Label>Issue Description</Label>
									<Textarea
										placeholder="Describe the issue found..."
										value={editIssueDescription}
										onChange={(e) => setEditIssueDescription(e.target.value)}
										rows={3}
										className="border-red-200 focus:border-red-500"
									/>
								</div>
							</>
						)}
					</div>

					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setIsEditDialogOpen(false)}
						>
							Cancel
						</Button>
						<Button onClick={handleSave} disabled={saving}>
							{saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
							Save Changes
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
