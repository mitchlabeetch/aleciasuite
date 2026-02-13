"use client";

/**
 * Approval Workflows Dashboard (Phase 2.2)
 *
 * Multi-reviewer approval system for:
 * - Documents, Teasers, LOIs
 * - Emails, Data Rooms
 * - Deal Stage Transitions
 */

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { listPendingForUser, listMyRequests, submitReview, getTemplates } from "@/actions";

// Types for approval workflow
type ApprovalStatus = "pending" | "in_review" | "approved" | "rejected" | "cancelled" | "expired";
type ApprovalPriority = "low" | "medium" | "high" | "urgent";
type ApprovalEntityType = "document" | "teaser" | "loi" | "email" | "data_room" | "deal_stage";
type ApprovalDecision = "approved" | "rejected";
type ApprovalType = "any" | "all" | "sequential";

interface ApprovalReview {
	reviewerId: string;
	reviewerName?: string;
	decision: ApprovalDecision;
	comment?: string;
}

interface ApprovalReviewer {
	id: string;
	name: string;
	email?: string;
	hasReviewed: boolean;
	review?: ApprovalReview;
}

interface ApprovalRequest {
	id: string;
	entityType: ApprovalEntityType;
	status: ApprovalStatus;
	priority: ApprovalPriority;
	title: string;
	description?: string;
	createdAt: number;
	dueDate?: number;
	hasReviewed?: boolean;
	approvalCount?: number;
	requiredApprovals?: number;
	rejectionCount?: number;
	requesterName?: string;
	approvalType?: ApprovalType;
	reviewers?: ApprovalReviewer[];
	reviews?: ApprovalReview[];
}

interface ApprovalTemplate {
	id: string;
	name: string;
	description?: string;
	entityTypes: ApprovalEntityType[];
	requiredApprovals: number;
	approvalType: ApprovalType;
	isDefault?: boolean;
}
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	CheckCircle2,
	XCircle,
	Clock,
	FileText,
	Mail,
	FolderOpen,
	GitBranch,
	Loader2,
	CheckCheck,
	User,
	Calendar,
	ArrowRight,
	RotateCcw,
	Settings,
	Plus,
	Inbox,
	Send,
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { fr } from "date-fns/locale";

// Entity type icons
const ENTITY_ICONS: Record<string, React.ElementType> = {
	document: FileText,
	teaser: FileText,
	loi: FileText,
	email: Mail,
	data_room: FolderOpen,
	deal_stage: GitBranch,
};

// Entity type labels (French)
const ENTITY_LABELS: Record<string, string> = {
	document: "Document",
	teaser: "Teaser",
	loi: "Lettre d'intention",
	email: "Email",
	data_room: "Data Room",
	deal_stage: "Changement d'étape",
};

// Status colors and labels
const STATUS_CONFIG: Record<
	string,
	{ label: string; color: string; bgColor: string }
> = {
	pending: {
		label: "En attente",
		color: "text-yellow-600",
		bgColor: "bg-yellow-100 dark:bg-yellow-900/30",
	},
	in_review: {
		label: "En cours",
		color: "text-blue-600",
		bgColor: "bg-blue-100 dark:bg-blue-900/30",
	},
	approved: {
		label: "Approuvé",
		color: "text-green-600",
		bgColor: "bg-green-100 dark:bg-green-900/30",
	},
	rejected: {
		label: "Rejeté",
		color: "text-red-600",
		bgColor: "bg-red-100 dark:bg-red-900/30",
	},
	cancelled: {
		label: "Annulé",
		color: "text-gray-600",
		bgColor: "bg-gray-100 dark:bg-gray-900/30",
	},
	expired: {
		label: "Expiré",
		color: "text-gray-600",
		bgColor: "bg-gray-100 dark:bg-gray-900/30",
	},
};

// Priority colors
const PRIORITY_CONFIG: Record<
	string,
	{
		label: string;
		variant: "default" | "secondary" | "destructive" | "outline";
	}
> = {
	low: { label: "Basse", variant: "secondary" },
	medium: { label: "Normale", variant: "outline" },
	high: { label: "Haute", variant: "default" },
	urgent: { label: "Urgente", variant: "destructive" },
};

// Approval request card component
function ApprovalRequestCard({
	request,
	onReview,
	showRequester = false,
}: {
	request: ApprovalRequest;
	onReview: (request: ApprovalRequest) => void;
	showRequester?: boolean;
}) {
	const EntityIcon = ENTITY_ICONS[request.entityType] || FileText;
	const status = STATUS_CONFIG[request.status];
	const priority = PRIORITY_CONFIG[request.priority];

	const isActionable =
		request.status === "pending" || request.status === "in_review";
	const hasReviewed = request.hasReviewed;

	return (
		<Card className="hover:shadow-md transition-shadow">
			<CardContent className="pt-4">
				<div className="flex items-start justify-between gap-4">
					<div className="flex items-start gap-3 flex-1 min-w-0">
						<div className={`p-2 rounded-lg ${status.bgColor}`}>
							<EntityIcon className={`h-5 w-5 ${status.color}`} />
						</div>
						<div className="flex-1 min-w-0">
							<div className="flex items-center gap-2 flex-wrap">
								<h3 className="font-medium truncate">{request.title}</h3>
								<Badge variant={priority.variant} className="text-xs">
									{priority.label}
								</Badge>
							</div>
							<p className="text-sm text-muted-foreground mt-1">
								{ENTITY_LABELS[request.entityType]}
								{request.description && ` - ${request.description}`}
							</p>
							<div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
								{showRequester && request.requesterName && (
									<span className="flex items-center gap-1">
										<User className="h-3 w-3" />
										{request.requesterName}
									</span>
								)}
								<span className="flex items-center gap-1">
									<Clock className="h-3 w-3" />
									{formatDistanceToNow(new Date(request.createdAt), {
										addSuffix: true,
										locale: fr,
									})}
								</span>
								{request.dueDate && (
									<span className="flex items-center gap-1">
										<Calendar className="h-3 w-3" />
										{format(new Date(request.dueDate), "dd MMM", {
											locale: fr,
										})}
									</span>
								)}
							</div>
						</div>
					</div>

					<div className="flex flex-col items-end gap-2">
						<Badge className={`${status.bgColor} ${status.color} border-0`}>
							{status.label}
						</Badge>
						{isActionable && !hasReviewed && (
							<Button size="sm" onClick={() => onReview(request)}>
								Examiner
								<ArrowRight className="ml-2 h-4 w-4" />
							</Button>
						)}
						{hasReviewed && (
							<Badge variant="outline" className="text-xs">
								<CheckCheck className="h-3 w-3 mr-1" />
								Examiné
							</Badge>
						)}
						{!isActionable && (
							<Button
								variant="outline"
								size="sm"
								onClick={() => onReview(request)}
							>
								Voir détails
							</Button>
						)}
					</div>
				</div>

				{/* Progress indicator for multi-reviewer */}
				{request.approvalCount !== undefined && (
					<div className="mt-3 pt-3 border-t">
						<div className="flex items-center justify-between text-xs text-muted-foreground">
							<span>
								{request.approvalCount} / {request.requiredApprovals}{" "}
								approbations
							</span>
							{(request.rejectionCount ?? 0) > 0 && (
								<span className="text-red-500">
									{request.rejectionCount} rejet(s)
								</span>
							)}
						</div>
						<div className="mt-1 h-1.5 bg-muted rounded-full overflow-hidden">
							<div
								className="h-full bg-green-500 transition-all"
								style={{
									width: `${Math.min(((request.approvalCount ?? 0) / (request.requiredApprovals ?? 1)) * 100, 100)}%`,
								}}
							/>
						</div>
					</div>
				)}
			</CardContent>
		</Card>
	);
}

// Review dialog component
function ReviewDialog({
	request,
	open,
	onClose,
}: {
	request: ApprovalRequest | null;
	open: boolean;
	onClose: () => void;
}) {
	const router = useRouter();
	const [decision, setDecision] = useState<
		"approved" | "rejected" | ""
	>("");
	const [comment, setComment] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);

	// Fetch detailed request data
	const [detailedRequest, setDetailedRequest] = useState<any>(null);

	useEffect(() => {
		if (request?.id) {
			// Note: This would need a getApprovalRequest server action
			// For now, we use the request data passed in
			setDetailedRequest(request);
		}
	}, [request]);

	const handleSubmit = async () => {
		if (!decision || !request?.id) return;

		setIsSubmitting(true);
		try {
			await submitReview({
				requestId: request.id,
				decision,
				comment: comment || undefined,
			});
			onClose();
			setDecision("");
			setComment("");
			router.refresh();
		} catch (error) {
			console.error("Failed to submit review:", error);
			alert(error instanceof Error ? error.message : "Erreur lors de la soumission");
		} finally {
			setIsSubmitting(false);
		}
	};

	const canReview =
		detailedRequest &&
		["pending", "in_review"].includes(detailedRequest.status) &&
		!detailedRequest.reviews?.some(
			(r: ApprovalReview) =>
				r.reviewerId ===
				detailedRequest.reviewers?.find((rev: ApprovalReviewer) => rev.hasReviewed === false)
					?.id,
		);

	const EntityIcon = request
		? ENTITY_ICONS[request.entityType] || FileText
		: FileText;

	return (
		<Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
			<DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<EntityIcon className="h-5 w-5" />
						{request?.title}
					</DialogTitle>
					<DialogDescription>
						{ENTITY_LABELS[request?.entityType ?? "document"]} - Demande d&apos;approbation
					</DialogDescription>
				</DialogHeader>

				{detailedRequest ? (
					<div className="space-y-6">
						{/* Request details */}
						<div className="space-y-2">
							<Label className="text-muted-foreground">Description</Label>
							<p className="text-sm">
								{detailedRequest.description || "Aucune description"}
							</p>
						</div>

						<div className="grid grid-cols-2 gap-4">
							<div>
								<Label className="text-muted-foreground">Demandeur</Label>
								<p className="text-sm font-medium">
									{detailedRequest.requesterName}
								</p>
							</div>
							<div>
								<Label className="text-muted-foreground">
									Type d&apos;approbation
								</Label>
								<p className="text-sm font-medium capitalize">
									{detailedRequest.approvalType === "any"
										? "N&apos;importe quel approbateur"
										: detailedRequest.approvalType === "all"
											? "Tous les approbateurs"
											: "Séquentiel"}
								</p>
							</div>
							<div>
								<Label className="text-muted-foreground">
									Approbations requises
								</Label>
								<p className="text-sm font-medium">
									{detailedRequest.approvalCount} /{" "}
									{detailedRequest.requiredApprovals}
								</p>
							</div>
							<div>
								<Label className="text-muted-foreground">Statut</Label>
								<Badge
									className={`${STATUS_CONFIG[detailedRequest.status].bgColor} ${STATUS_CONFIG[detailedRequest.status].color} border-0`}
								>
									{STATUS_CONFIG[detailedRequest.status].label}
								</Badge>
							</div>
						</div>

						{/* Reviewers */}
						<div>
							<Label className="text-muted-foreground mb-2 block">
								Approbateurs
							</Label>
							<div className="space-y-2">
								{detailedRequest.reviewers?.map((reviewer: ApprovalReviewer) => (
									<div
										key={reviewer.id}
										className="flex items-center justify-between p-2 bg-muted/50 rounded-lg"
									>
										<div className="flex items-center gap-2">
											<div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
												<User className="h-4 w-4" />
											</div>
											<div>
												<p className="text-sm font-medium">{reviewer.name}</p>
												<p className="text-xs text-muted-foreground">
													{reviewer.email}
												</p>
											</div>
										</div>
										{reviewer.hasReviewed ? (
											<Badge
												variant={
													reviewer.review?.decision === "approved"
														? "default"
														: reviewer.review?.decision === "rejected"
															? "destructive"
															: "secondary"
												}
											>
												{reviewer.review?.decision === "approved" && (
													<CheckCircle2 className="h-3 w-3 mr-1" />
												)}
												{reviewer.review?.decision === "rejected" && (
													<XCircle className="h-3 w-3 mr-1" />
												)}
							{reviewer.review?.decision === "approved"
								? "Approuvé"
								: "Rejeté"}
						</Badge>
										) : (
											<Badge variant="outline">En attente</Badge>
										)}
									</div>
								))}
							</div>
						</div>

						{/* Previous reviews with comments */}
						{detailedRequest.reviews?.some((r: ApprovalReview) => r.comment) && (
							<div>
								<Label className="text-muted-foreground mb-2 block">
									Commentaires précédents
								</Label>
								<div className="space-y-2">
									{detailedRequest.reviews
										.filter((r: ApprovalReview) => r.comment)
										.map((review: ApprovalReview, idx: number) => (
											<div key={idx} className="p-3 bg-muted/50 rounded-lg">
												<div className="flex items-center gap-2 mb-1">
													<span className="font-medium text-sm">
														{review.reviewerName}
													</span>
													<Badge variant="outline" className="text-xs">
														{review.decision === "approved"
															? "Approuvé"
															: review.decision === "rejected"
																? "Rejeté"
																: "Modifications"}
													</Badge>
												</div>
												<p className="text-sm text-muted-foreground">
													{review.comment}
												</p>
											</div>
										))}
								</div>
							</div>
						)}

						{/* Review form */}
						{canReview && (
							<div className="space-y-4 pt-4 border-t">
								<div>
									<Label>Votre décision</Label>
									<Select
										value={decision}
										onValueChange={(v) => setDecision(v as typeof decision)}
									>
										<SelectTrigger className="mt-1">
											<SelectValue placeholder="Sélectionnez votre décision" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="approved">
												<div className="flex items-center gap-2">
													<CheckCircle2 className="h-4 w-4 text-green-500" />
													Approuver
												</div>
											</SelectItem>
											<SelectItem value="rejected">
												<div className="flex items-center gap-2">
													<XCircle className="h-4 w-4 text-red-500" />
													Rejeter
												</div>
											</SelectItem>
										</SelectContent>
									</Select>
								</div>

								<div>
									<Label>Commentaire (optionnel)</Label>
									<Textarea
										value={comment}
										onChange={(e) => setComment(e.target.value)}
										placeholder="Ajoutez un commentaire..."
										className="mt-1"
										rows={3}
									/>
								</div>
							</div>
						)}
					</div>
				) : (
					<div className="flex items-center justify-center py-8">
						<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
					</div>
				)}

				<DialogFooter>
					<Button variant="outline" onClick={onClose}>
						Fermer
					</Button>
					{canReview && (
						<Button onClick={handleSubmit} disabled={!decision || isSubmitting}>
							{isSubmitting && (
								<Loader2 className="h-4 w-4 mr-2 animate-spin" />
							)}
							Soumettre
						</Button>
					)}
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

// Empty state component
function EmptyState({
	icon: Icon,
	title,
	description,
}: {
	icon: React.ElementType;
	title: string;
	description: string;
}) {
	return (
		<div className="flex flex-col items-center justify-center py-12 text-center">
			<div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
				<Icon className="h-8 w-8 text-muted-foreground" />
			</div>
			<h3 className="font-medium text-lg">{title}</h3>
			<p className="text-muted-foreground text-sm mt-1 max-w-sm">
				{description}
			</p>
		</div>
	);
}

export default function ApprovalsPage() {
	const [selectedTab, setSelectedTab] = useState("inbox");
	const [selectedRequest, setSelectedRequest] = useState<ApprovalRequest | null>(null);
	const [reviewDialogOpen, setReviewDialogOpen] = useState(false);

	// Fetch approval data
	const [pendingForUser, setPendingForUser] = useState<ApprovalRequest[] | null>(null);
	const [myRequests, setMyRequests] = useState<ApprovalRequest[] | null>(null);
	const [templates, setTemplates] = useState<ApprovalTemplate[] | null>(null);

	useEffect(() => {
		listPendingForUser(50).then(data => setPendingForUser(data as unknown as ApprovalRequest[]));
		listMyRequests().then(data => setMyRequests(data as unknown as ApprovalRequest[]));
		getTemplates().then(data => setTemplates(data as unknown as ApprovalTemplate[]));
	}, []);

	const isLoading = pendingForUser === null || myRequests === null;

	const handleReview = (request: ApprovalRequest) => {
		setSelectedRequest(request);
		setReviewDialogOpen(true);
	};

	const handleCloseReview = () => {
		setReviewDialogOpen(false);
		setSelectedRequest(null);
	};

	// Count pending approvals
	const pendingCount = pendingForUser?.length || 0;

	if (isLoading) {
		return (
			<div className="flex items-center justify-center min-h-100">
				<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
			</div>
		);
	}

	return (
		<div className="space-y-6 p-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold flex items-center gap-2">
						<CheckCheck className="h-8 w-8 text-primary" />
						Approbations
					</h1>
					<p className="text-muted-foreground">
						Gérez les demandes d&apos;approbation pour documents, emails et
						transitions.
					</p>
				</div>
			</div>

			{/* Quick stats */}
			<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
				<Card>
					<CardContent className="pt-4">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm text-muted-foreground">En attente</p>
								<p className="text-2xl font-bold">{pendingCount}</p>
							</div>
							<div className="h-10 w-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
								<Clock className="h-5 w-5 text-yellow-500" />
							</div>
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="pt-4">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm text-muted-foreground">Mes demandes</p>
								<p className="text-2xl font-bold">{myRequests?.length || 0}</p>
							</div>
							<div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
								<Send className="h-5 w-5 text-blue-500" />
							</div>
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="pt-4">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm text-muted-foreground">Approuvées</p>
								<p className="text-2xl font-bold">
									{myRequests?.filter(
										(r: ApprovalRequest) => r.status === "approved",
									).length || 0}
								</p>
							</div>
							<div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
								<CheckCircle2 className="h-5 w-5 text-green-500" />
							</div>
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="pt-4">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm text-muted-foreground">Rejetées</p>
								<p className="text-2xl font-bold">
									{myRequests?.filter(
										(r: ApprovalRequest) => r.status === "rejected",
									).length || 0}
								</p>
							</div>
							<div className="h-10 w-10 rounded-lg bg-red-500/10 flex items-center justify-center">
								<XCircle className="h-5 w-5 text-red-500" />
							</div>
						</div>
					</CardContent>
				</Card>
			</div>

			<Tabs value={selectedTab} onValueChange={setSelectedTab}>
				<TabsList>
					<TabsTrigger value="inbox" className="gap-2">
						<Inbox className="h-4 w-4" />
						Boîte de réception
						{pendingCount > 0 && (
							<Badge variant="destructive" className="ml-1 h-5 px-1.5">
								{pendingCount}
							</Badge>
						)}
					</TabsTrigger>
					<TabsTrigger value="sent" className="gap-2">
						<Send className="h-4 w-4" />
						Mes demandes
					</TabsTrigger>
					<TabsTrigger value="templates" className="gap-2">
						<Settings className="h-4 w-4" />
						Modèles
					</TabsTrigger>
				</TabsList>

				{/* Inbox Tab */}
				<TabsContent value="inbox" className="space-y-4 mt-6">
					{pendingForUser && pendingForUser.length > 0 ? (
						<div className="space-y-3">
							{pendingForUser.map((request: ApprovalRequest) => (
								<ApprovalRequestCard
									key={request.id}
									request={request as ApprovalRequest}
									onReview={handleReview}
									showRequester
								/>
							))}
						</div>
					) : (
						<EmptyState
							icon={CheckCircle2}
							title="Aucune approbation en attente"
							description="Vous n'avez aucune demande d'approbation à traiter pour le moment."
						/>
					)}
				</TabsContent>

				{/* Sent Tab */}
				<TabsContent value="sent" className="space-y-4 mt-6">
					{myRequests && myRequests.length > 0 ? (
						<div className="space-y-3">
							{myRequests.map((request: ApprovalRequest) => (
								<ApprovalRequestCard
									key={request.id}
									request={request as ApprovalRequest}
									onReview={handleReview}
								/>
							))}
						</div>
					) : (
						<EmptyState
							icon={Send}
							title="Aucune demande envoyée"
							description="Vous n'avez pas encore soumis de demande d'approbation."
						/>
					)}
				</TabsContent>

				{/* Templates Tab */}
				<TabsContent value="templates" className="space-y-4 mt-6">
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center justify-between">
								Modèles d&apos;approbation
								<Button size="sm" disabled>
									<Plus className="h-4 w-4 mr-2" />
									Nouveau modèle
								</Button>
							</CardTitle>
							<CardDescription>
								Configurez des workflows d&apos;approbation réutilisables
							</CardDescription>
						</CardHeader>
						<CardContent>
							{templates && templates.length > 0 ? (
								<div className="space-y-3">
									{templates.map((template: ApprovalTemplate) => (
										<div
											key={template.id}
											className="flex items-center justify-between p-4 border rounded-lg"
										>
											<div>
												<h4 className="font-medium">{template.name}</h4>
												<p className="text-sm text-muted-foreground">
													{template.description || "Aucune description"}
												</p>
												<div className="flex gap-2 mt-2">
													{template.entityTypes.map((type) => (
														<Badge
															key={type}
															variant="secondary"
															className="text-xs"
														>
															{ENTITY_LABELS[type]}
														</Badge>
													))}
												</div>
											</div>
											<div className="text-right">
												<p className="text-sm">
													{template.requiredApprovals} approbation(s)
												</p>
												<p className="text-xs text-muted-foreground capitalize">
													{template.approvalType === "any"
														? "N&apos;importe lequel"
														: template.approvalType === "all"
															? "Tous requis"
															: "Séquentiel"}
												</p>
												{template.isDefault && (
													<Badge className="mt-2">Par défaut</Badge>
												)}
											</div>
										</div>
									))}
								</div>
							) : (
								<EmptyState
									icon={Settings}
									title="Aucun modèle configuré"
									description="Créez des modèles pour standardiser vos workflows d'approbation."
								/>
							)}
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>

			{/* Review Dialog */}
			<ReviewDialog
				request={selectedRequest}
				open={reviewDialogOpen}
				onClose={handleCloseReview}
			/>
		</div>
	);
}
