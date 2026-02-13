"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { CheckCircle2, XCircle, User, Calendar, Loader2 } from "lucide-react";
import { DiffViewer } from "./DiffViewer";
import { toast } from "sonner";
import { useSession } from "@alepanel/auth/client";
import { getPendingChanges, reviewChange } from "@/actions";

interface ApprovalReviewProps {
	changeId: string;
}

/**
 * ApprovalReview - Review and approve/reject pending changes
 */
export function ApprovalReview({ changeId }: ApprovalReviewProps) {
	const [showReviewDialog, setShowReviewDialog] = useState(false);
	const [isApproving, setIsApproving] = useState(true);
	const [comment, setComment] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [changes, setChanges] = useState<any>(null);

	const { data: session } = useSession();
	const userId = session?.user?.id;
	const router = useRouter();

	// Get change details with approvals
	useEffect(() => {
		getPendingChanges({ pageContentId: undefined }).then(setChanges);
	}, []);

	const change = changes?.find((c: any) => c._id === changeId);

	if (!change) {
		return null;
	}

	const hasUserReviewed = change.approvals?.some(
		(a: any) => a.userId === userId,
	);

	const approvalProgress = `${change.approvalCount}/${change.requiredApprovals}`;
	const isApproved = change.approvalCount >= change.requiredApprovals;

	const handleReview = async () => {
		if (!userId) {
			toast.error("Vous devez être connecté");
			return;
		}

		if (hasUserReviewed) {
			toast.error("Vous avez déjà évalué ce changement");
			return;
		}

		setIsSubmitting(true);
		try {
			await reviewChange({
				changeId,
				userId: userId as string,
				userName: "User", // TODO: Get from user profile
				approved: isApproving,
				comment: comment.trim() || undefined,
			});

			toast.success(isApproving ? "Changement approuvé" : "Changement rejeté");
			setShowReviewDialog(false);
			setComment("");
			router.refresh();
			// Reload changes
			const updated = await getPendingChanges({ pageContentId: undefined });
			setChanges(updated);
		} catch (error: any) {
			toast.error(error.message || "Erreur lors de l'évaluation");
			console.error(error);
		} finally {
			setIsSubmitting(false);
		}
	};

	const openReviewDialog = (approve: boolean) => {
		setIsApproving(approve);
		setShowReviewDialog(true);
	};

	return (
		<>
			<Card>
				<CardHeader>
					<div className="flex items-start justify-between">
						<div className="flex-1">
							<CardTitle className="text-xl">{change.pagePath}</CardTitle>
							<CardDescription className="mt-2">
								{change.description || "Aucune description"}
							</CardDescription>
						</div>
						<Badge
							variant={
								change.status === "approved"
									? "default"
									: change.status === "rejected"
										? "destructive"
										: "secondary"
							}
							className="ml-4"
						>
							{change.status === "approved"
								? "Approuvé"
								: change.status === "rejected"
									? "Rejeté"
									: "En attente"}
						</Badge>
					</div>
				</CardHeader>
				<CardContent className="space-y-4">
					{/* Metadata */}
					<div className="flex items-center gap-6 text-sm text-gray-600 dark:text-gray-400">
						<div className="flex items-center gap-2">
							<User className="w-4 h-4" />
							<span>{change.changedByName}</span>
						</div>
						<div className="flex items-center gap-2">
							<Calendar className="w-4 h-4" />
							<span>
								{new Date(change.createdAt).toLocaleDateString("fr-FR")}
							</span>
						</div>
						<div className="flex items-center gap-2">
							<CheckCircle2 className="w-4 h-4" />
							<span>{approvalProgress} approbations</span>
							{isApproved && (
								<Badge variant="default" className="ml-2">
									Seuil atteint
								</Badge>
							)}
						</div>
					</div>

					{/* Change Summary */}
					<div className="border-t pt-4">
						<h4 className="text-sm font-semibold mb-2">
							Résumé des changements:
						</h4>
						<ul className="text-sm space-y-1 list-disc list-inside text-gray-700 dark:text-gray-300">
							{change.visualDiff.changesSummary.map((summary: string) => (
								<li key={`${changeId}-summary-${summary.slice(0, 50)}`}>
									{summary}
								</li>
							))}
						</ul>
					</div>

					{/* Diff Preview */}
					<div className="border-t pt-4">
						<DiffViewer
							before={change.codeDiff.before}
							after={change.codeDiff.after}
							delta={change.codeDiff.delta}
						/>
					</div>

					{/* Approvals List */}
					{change.approvals && change.approvals.length > 0 && (
						<div className="border-t pt-4">
							<h4 className="text-sm font-semibold mb-3">Évaluations:</h4>
							<div className="space-y-2">
								{change.approvals.map((approval: any) => (
									<div
										key={approval._id}
										className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
									>
										<div className="shrink-0">
											{approval.approved ? (
												<CheckCircle2 className="w-5 h-5 text-green-600" />
											) : (
												<XCircle className="w-5 h-5 text-red-600" />
											)}
										</div>
										<div className="flex-1 min-w-0">
											<div className="flex items-center gap-2">
												<span className="text-sm font-medium">
													{approval.userName}
												</span>
												<span className="text-xs text-gray-500">
													{new Date(approval.createdAt).toLocaleDateString(
														"fr-FR",
													)}
												</span>
											</div>
											{approval.comment && (
												<p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
													{approval.comment}
												</p>
											)}
										</div>
									</div>
								))}
							</div>
						</div>
					)}

					{/* Action Buttons */}
					{change.status === "pending" && !hasUserReviewed && (
						<div className="flex items-center gap-3 pt-4 border-t">
							<Button
								variant="outline"
								onClick={() => openReviewDialog(false)}
								className="flex-1"
							>
								<XCircle className="w-4 h-4 mr-2" />
								Rejeter
							</Button>
							<Button onClick={() => openReviewDialog(true)} className="flex-1">
								<CheckCircle2 className="w-4 h-4 mr-2" />
								Approuver
							</Button>
						</div>
					)}

					{hasUserReviewed && (
						<div className="text-center text-sm text-gray-500 py-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
							Vous avez déjà évalué ce changement
						</div>
					)}
				</CardContent>
			</Card>

			{/* Review Dialog */}
			<Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2">
							{isApproving ? (
								<CheckCircle2 className="w-5 h-5 text-green-600" />
							) : (
								<XCircle className="w-5 h-5 text-red-600" />
							)}
							{isApproving ? "Approuver" : "Rejeter"} le changement
						</DialogTitle>
						<DialogDescription>
							{isApproving
								? "Vous confirmez que ce changement est valide et peut être publié."
								: "Vous demandez des modifications avant publication."}
						</DialogDescription>
					</DialogHeader>

					<div className="space-y-4 py-4">
						<div className="space-y-2">
							<Label htmlFor="comment">
								Commentaire {isApproving ? "(optionnel)" : "(requis)"}
							</Label>
							<Textarea
								id="comment"
								placeholder={
									isApproving
										? "Ajoutez un commentaire (optionnel)..."
										: "Expliquez pourquoi vous rejetez ce changement..."
								}
								value={comment}
								onChange={(e) => setComment(e.target.value)}
								rows={4}
							/>
						</div>
					</div>

					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setShowReviewDialog(false)}
							disabled={isSubmitting}
						>
							Annuler
						</Button>
						<Button
							onClick={handleReview}
							disabled={isSubmitting || (!isApproving && !comment.trim())}
							variant={isApproving ? "default" : "destructive"}
						>
							{isSubmitting ? (
								<>
									<Loader2 className="w-4 h-4 mr-2 animate-spin" />
									Envoi...
								</>
							) : (
								<>
									{isApproving ? (
										<CheckCircle2 className="w-4 h-4 mr-2" />
									) : (
										<XCircle className="w-4 h-4 mr-2" />
									)}
									Confirmer
								</>
							)}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
}
