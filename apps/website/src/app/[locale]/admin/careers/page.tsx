"use client";

import { useState, useEffect } from "react";
import {
	listJobOffers,
	createJobOffer,
	updateJobOffer,
	deleteJobOffer,
	toggleJobOfferPublished,
} from "@/actions";
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
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Edit, Trash2, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

/**
 * Careers Admin Page
 *
 * Features:
 * - List all job offers
 * - Create new job offers
 * - Edit existing job offers
 * - Delete job offers
 * - Toggle published/unpublished status
 * - Badge for publication status
 */

interface JobOfferForm {
	slug: string;
	title: string;
	type: string;
	location: string;
	description: string;
	requirements?: string;
	contactEmail?: string;
	pdfUrl?: string;
	isPublished: boolean;
}

export default function CareersAdminPage() {
	const [jobOffers, setJobOffers] = useState<any[]>([]);
	const [loading, setLoading] = useState(true);

	const [isCreateOpen, setIsCreateOpen] = useState(false);
	const [editingOffer, setEditingOffer] = useState<string | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);

	const [formData, setFormData] = useState<JobOfferForm>({
		slug: "",
		title: "",
		type: "",
		location: "",
		description: "",
		requirements: "",
		contactEmail: "",
		pdfUrl: "",
		isPublished: false,
	});

	// Fetch job offers on mount
	useEffect(() => {
		listJobOffers(true)
			.then(setJobOffers)
			.finally(() => setLoading(false));
	}, []);

	const resetForm = () => {
		setFormData({
			slug: "",
			title: "",
			type: "",
			location: "",
			description: "",
			requirements: "",
			contactEmail: "",
			pdfUrl: "",
			isPublished: false,
		});
		setEditingOffer(null);
	};

	const handleEdit = (id: string) => {
		const offer = jobOffers?.find((o: { _id: string }) => o._id === id);
		if (!offer) return;

		setFormData({
			slug: offer.slug,
			title: offer.title,
			type: offer.type,
			location: offer.location,
			description: offer.description,
			requirements: Array.isArray(offer.requirements)
				? offer.requirements.join("\n")
				: offer.requirements || "",
			contactEmail: offer.contactEmail || "",
			pdfUrl: offer.pdfUrl || "",
			isPublished: offer.isPublished,
		});
		setEditingOffer(id);
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsSubmitting(true);

		try {
			const submitData = {
				...formData,
				requirements: formData.requirements || undefined,
				contactEmail: formData.contactEmail || undefined,
				pdfUrl: formData.pdfUrl || undefined,
			};

			if (editingOffer) {
				await updateJobOffer(editingOffer, submitData);
				toast.success("Offre mise à jour");
				setEditingOffer(null);
			} else {
				await createJobOffer(submitData);
				toast.success("Offre créée");
				setIsCreateOpen(false);
			}
			resetForm();

			// Re-fetch job offers
			const updatedOffers = await listJobOffers(true);
			setJobOffers(updatedOffers);
		} catch (_error) {
			toast.error("Erreur: " + (_error as Error).message);
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleDelete = async (id: string) => {
		if (!confirm("Êtes-vous sûr de vouloir supprimer cette offre ?")) return;

		try {
			await deleteJobOffer(id);
			toast.success("Offre supprimée");

			// Re-fetch job offers
			const updatedOffers = await listJobOffers(true);
			setJobOffers(updatedOffers);
		} catch (_error) {
			toast.error("Erreur lors de la suppression");
		}
	};

	const handleTogglePublished = async (id: string) => {
		try {
			await toggleJobOfferPublished(id);
			toast.success("Statut mis à jour");

			// Re-fetch job offers
			const updatedOffers = await listJobOffers(true);
			setJobOffers(updatedOffers);
		} catch (error) {
			toast.error("Erreur lors du changement de statut");
		}
	};

	if (loading) {
		return (
			<div className="flex items-center justify-center h-64">
				<Loader2 className="w-8 h-8 animate-spin" />
			</div>
		);
	}

	const JobOfferDialog = ({ children }: { children: React.ReactNode }) => (
		<Dialog
			open={isCreateOpen || !!editingOffer}
			onOpenChange={(open) => {
				if (!open) {
					setIsCreateOpen(false);
					setEditingOffer(null);
					resetForm();
				}
			}}
		>
			{children}
			<DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>
						{editingOffer ? `Modifier l'offre` : "Nouvelle offre"}
					</DialogTitle>
					<DialogDescription>
						{editingOffer
							? `Modifiez les informations de l'offre d'emploi`
							: `Ajoutez une nouvelle offre d'emploi`}
					</DialogDescription>
				</DialogHeader>

				<form onSubmit={handleSubmit} className="space-y-4">
					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label htmlFor="title">Titre du poste *</Label>
							<Input
								id="title"
								value={formData.title}
								onChange={(e) =>
									setFormData({ ...formData, title: e.target.value })
								}
								placeholder="Analyste M&A"
								required
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="slug">Slug (URL) *</Label>
							<Input
								id="slug"
								value={formData.slug}
								onChange={(e) =>
									setFormData({ ...formData, slug: e.target.value })
								}
								placeholder="analyste-ma"
								required
							/>
						</div>
					</div>

					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label htmlFor="type">Type de contrat *</Label>
							<Input
								id="type"
								value={formData.type}
								onChange={(e) =>
									setFormData({ ...formData, type: e.target.value })
								}
								placeholder="CDI, CDD, Stage, Alternance"
								required
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="location">Localisation *</Label>
							<Input
								id="location"
								value={formData.location}
								onChange={(e) =>
									setFormData({ ...formData, location: e.target.value })
								}
								placeholder="Paris, Lyon, Remote"
								required
							/>
						</div>
					</div>

					<div className="space-y-2">
						<Label htmlFor="description">Description du poste *</Label>
						<Textarea
							id="description"
							value={formData.description}
							onChange={(e) =>
								setFormData({ ...formData, description: e.target.value })
							}
							rows={6}
							placeholder="Description détaillée du poste, missions principales..."
							required
						/>
					</div>

					<div className="space-y-2">
						<Label htmlFor="requirements">
							Prérequis / Compétences requises
						</Label>
						<Textarea
							id="requirements"
							value={formData.requirements}
							onChange={(e) =>
								setFormData({ ...formData, requirements: e.target.value })
							}
							rows={6}
							placeholder="- Formation Bac+5 en finance&#10;- Expérience de 2-3 ans en M&A&#10;- Anglais courant..."
						/>
						<p className="text-xs text-muted-foreground">
							Une exigence par ligne (format Markdown supporté)
						</p>
					</div>

					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label htmlFor="contactEmail">Email de contact</Label>
							<Input
								id="contactEmail"
								type="email"
								value={formData.contactEmail}
								onChange={(e) =>
									setFormData({ ...formData, contactEmail: e.target.value })
								}
								placeholder="careers@company.com"
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="pdfUrl">URL du PDF (fiche de poste)</Label>
							<Input
								id="pdfUrl"
								value={formData.pdfUrl}
								onChange={(e) =>
									setFormData({ ...formData, pdfUrl: e.target.value })
								}
								placeholder="/assets/careers/job-offer.pdf"
							/>
						</div>
					</div>

					<div className="flex items-center space-x-2">
						<Switch
							id="isPublished"
							checked={formData.isPublished}
							onCheckedChange={(checked) =>
								setFormData({ ...formData, isPublished: checked })
							}
						/>
						<Label htmlFor="isPublished">Publié (visible sur le site)</Label>
					</div>

					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							onClick={() => {
								setIsCreateOpen(false);
								setEditingOffer(null);
								resetForm();
							}}
						>
							Annuler
						</Button>
						<Button type="submit" disabled={isSubmitting}>
							{isSubmitting && (
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							)}
							{editingOffer ? "Mettre à jour" : "Créer"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);

	return (
		<div className="space-y-6">
			<div className="flex justify-between items-center">
				<div>
					<h1 className="text-3xl font-bold">Carrières</h1>
					<p className="text-muted-foreground">
						Gérez les offres d&apos;emploi
					</p>
				</div>

				<JobOfferDialog>
					<DialogTrigger asChild>
						<Button onClick={() => setIsCreateOpen(true)}>
							<Plus className="mr-2 h-4 w-4" />
							Nouvelle offre
						</Button>
					</DialogTrigger>
				</JobOfferDialog>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Offres d&apos;emploi ({jobOffers.length})</CardTitle>
					<CardDescription>
						{
							jobOffers.filter((o: { isPublished: boolean }) => o.isPublished)
								.length
						}{" "}
						publiées,{" "}
						{
							jobOffers.filter((o: { isPublished: boolean }) => !o.isPublished)
								.length
						}{" "}
						non publiées
					</CardDescription>
				</CardHeader>
				<CardContent>
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Titre</TableHead>
								<TableHead>Type</TableHead>
								<TableHead>Localisation</TableHead>
								<TableHead className="text-center">Statut</TableHead>
								<TableHead className="text-right">Actions</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{jobOffers.length === 0 ? (
								<TableRow>
									<TableCell
										colSpan={5}
										className="text-center text-muted-foreground py-8"
									>
										Aucune offre. Créez-en une pour commencer.
									</TableCell>
								</TableRow>
							) : (
								jobOffers.map((offer: any) => (
									<TableRow key={offer._id}>
										<TableCell className="font-medium">{offer.title}</TableCell>
										<TableCell className="text-sm">{offer.type}</TableCell>
										<TableCell className="text-sm text-muted-foreground">
											{offer.location}
										</TableCell>
										<TableCell className="text-center">
											{offer.isPublished ? (
												<Badge variant="default" className="bg-green-600">
													Publiée
												</Badge>
											) : (
												<Badge variant="secondary">Non publiée</Badge>
											)}
										</TableCell>
										<TableCell className="text-right space-x-2">
											<Button
												variant="ghost"
												size="sm"
												onClick={() => handleTogglePublished(offer._id)}
												title={offer.isPublished ? "Dépublier" : "Publier"}
											>
												{offer.isPublished ? (
													<EyeOff className="h-4 w-4" />
												) : (
													<Eye className="h-4 w-4" />
												)}
											</Button>
											<Button
												variant="ghost"
												size="sm"
												onClick={() => handleEdit(offer._id)}
											>
												<Edit className="h-4 w-4" />
											</Button>
											<Button
												variant="ghost"
												size="sm"
												onClick={() => handleDelete(offer._id)}
											>
												<Trash2 className="h-4 w-4 text-destructive" />
											</Button>
										</TableCell>
									</TableRow>
								))
							)}
						</TableBody>
					</Table>
				</CardContent>
			</Card>
		</div>
	);
}
