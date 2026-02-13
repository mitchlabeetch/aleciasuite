"use client";

import { useState } from "react";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DiffViewer } from "./DiffViewer";
import { Section } from "./SectionEditor";
import { Send, Loader2 } from "lucide-react";
import {
	generateDiff,
	generateChangeSummary,
	generateVisualHTML,
} from "@/lib/diff-utils";

interface SubmitDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	beforeSections: Section[];
	afterSections: Section[];
	onSubmit: (data: SubmitData) => Promise<void>;
}

export interface SubmitData {
	description: string;
	requiredApprovals: number;
	visualDiff: {
		before: string;
		after: string;
		changesSummary: string[];
	};
	codeDiff: {
		before: any;
		after: any;
		delta: any;
	};
}

/**
 * SubmitDialog - Submit changes for approval with diff preview
 */
export function SubmitDialog({
	open,
	onOpenChange,
	beforeSections,
	afterSections,
	onSubmit,
}: SubmitDialogProps) {
	const [description, setDescription] = useState("");
	const [requiredApprovals, setRequiredApprovals] = useState(2);
	const [isSubmitting, setIsSubmitting] = useState(false);

	// Generate diffs
	const delta = generateDiff(beforeSections, afterSections);
	const changesSummary = generateChangeSummary(beforeSections, afterSections);
	const visualHTML = generateVisualHTML(beforeSections, afterSections);

	const handleSubmit = async () => {
		if (!description.trim()) {
			return;
		}

		setIsSubmitting(true);
		try {
			await onSubmit({
				description,
				requiredApprovals,
				visualDiff: {
					before: visualHTML.before,
					after: visualHTML.after,
					changesSummary,
				},
				codeDiff: {
					before: beforeSections,
					after: afterSections,
					delta,
				},
			});
			setDescription("");
			setRequiredApprovals(2);
			onOpenChange(false);
		} catch (error) {
			console.error(error);
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<Send className="w-5 h-5" />
						Soumettre pour Approbation
					</DialogTitle>
					<DialogDescription>
						Décrivez vos modifications et visualisez les changements avant
						soumission
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-6 py-4">
					{/* Description */}
					<div className="space-y-2">
						<Label htmlFor="description">Description des changements *</Label>
						<Textarea
							id="description"
							placeholder="Décrivez brièvement les modifications apportées..."
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							rows={3}
							required
						/>
					</div>

					{/* Required Approvals */}
					<div className="space-y-2">
						<Label htmlFor="approvals">
							Nombre d&apos;approbations requises
						</Label>
						<Input
							id="approvals"
							type="number"
							min={1}
							max={5}
							value={requiredApprovals}
							onChange={(e) =>
								setRequiredApprovals(parseInt(e.target.value) || 1)
							}
						/>
						<p className="text-xs text-gray-500">
							Nombre de personnes devant approuver avant publication
						</p>
					</div>

					{/* Changes Summary */}
					<div className="space-y-2">
						<Label>Résumé automatique</Label>
						<div className="border rounded-lg p-3 bg-gray-50 dark:bg-gray-900">
							<ul className="text-sm space-y-1 list-disc list-inside">
								{changesSummary.map((change, index) => (
									<li
										key={`change-summary-${index}-${change.substring(0, 20)}`}
									>
										{change}
									</li>
								))}
							</ul>
						</div>
					</div>

					{/* Diff Preview */}
					<div className="space-y-2">
						<Label>Aperçu des changements</Label>
						<DiffViewer
							before={beforeSections}
							after={afterSections}
							delta={delta}
						/>
					</div>
				</div>

				<DialogFooter>
					<Button
						variant="outline"
						onClick={() => onOpenChange(false)}
						disabled={isSubmitting}
					>
						Annuler
					</Button>
					<Button
						onClick={handleSubmit}
						disabled={!description.trim() || isSubmitting}
					>
						{isSubmitting ? (
							<>
								<Loader2 className="w-4 h-4 mr-2 animate-spin" />
								Soumission...
							</>
						) : (
							<>
								<Send className="w-4 h-4 mr-2" />
								Soumettre
							</>
						)}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
