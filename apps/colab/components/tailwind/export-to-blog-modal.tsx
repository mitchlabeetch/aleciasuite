"use client";

import { AlertTriangle, FileText, Loader2 } from "lucide-react";
import { useState } from "react";
import { Button } from "./ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";

interface ExportToBlogModalProps {
	isOpen: boolean;
	onClose: () => void;
	documentId: string;
	documentTitle?: string;
}

const UNSUPPORTED_FEATURES = [
	{ name: "Kanban", description: "Les tableaux Kanban ne seront pas affichés" },
	{ name: "YouTube", description: "Les embeds YouTube ne seront pas visibles" },
	{
		name: "Twitter/X",
		description: "Les embeds Twitter ne seront pas visibles",
	},
	{
		name: "Formules Math",
		description:
			"Les formules mathématiques (LaTeX) peuvent ne pas s'afficher correctement",
	},
];

export function ExportToBlogModal({
	isOpen,
	onClose,
	documentId,
	documentTitle = "",
}: ExportToBlogModalProps) {
	const [title, setTitle] = useState(documentTitle);
	const [excerpt, setExcerpt] = useState("");
	const [featuredImage, setFeaturedImage] = useState("");
	const [category, setCategory] = useState("");
	const [isExporting, setIsExporting] = useState(false);
	const [step, setStep] = useState<"warning" | "form">("warning");
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState<{ slug: string } | null>(null);

	// Note: exportFromColab would need to be implemented as a server action
	const exportFromColab = async (params: {
		documentId: string;
		title: string;
		excerpt?: string;
		featuredImage?: string;
		category?: string;
	}): Promise<{ slug: string }> => {
		// TODO: Implement server action
		console.log("Export from colab:", params);
		throw new Error("Export not yet implemented");
	};

	const handleExport = async () => {
		if (!title.trim()) {
			setError("Le titre est requis");
			return;
		}

		setIsExporting(true);
		setError(null);

		try {
			const result = await exportFromColab({
				documentId: documentId,
				title: title.trim(),
				excerpt: excerpt.trim() || undefined,
				featuredImage: featuredImage.trim() || undefined,
				category: category.trim() || undefined,
			});

			setSuccess({ slug: result.slug });
		} catch (err) {
			setError(err instanceof Error ? err.message : "Erreur lors de l'export");
		} finally {
			setIsExporting(false);
		}
	};

	const handleClose = () => {
		setStep("warning");
		setTitle(documentTitle);
		setExcerpt("");
		setFeaturedImage("");
		setCategory("");
		setError(null);
		setSuccess(null);
		onClose();
	};

	return (
		<Dialog open={isOpen} onOpenChange={handleClose}>
			<DialogContent className="sm:max-w-[500px]">
				{success ? (
					<>
						<DialogHeader>
							<DialogTitle className="flex items-center gap-2 text-green-600">
								<FileText className="h-5 w-5" />
								Article cree avec succes
							</DialogTitle>
							<DialogDescription>
								Votre article a ete exporte en tant que brouillon.
							</DialogDescription>
						</DialogHeader>

						<div className="rounded-md bg-green-50 dark:bg-green-950 p-4 text-sm">
							<p className="text-green-800 dark:text-green-200">
								L'article "{title}" a ete cree avec le slug{" "}
								<code className="bg-green-100 dark:bg-green-900 px-1 rounded">
									{success.slug}
								</code>
								.
							</p>
							<p className="mt-2 text-green-700 dark:text-green-300">
								Rendez-vous dans le panneau d'administration pour le reviser et
								le publier.
							</p>
						</div>

						<DialogFooter>
							<Button onClick={handleClose}>Fermer</Button>
						</DialogFooter>
					</>
				) : step === "warning" ? (
					<>
						<DialogHeader>
							<DialogTitle className="flex items-center gap-2">
								<AlertTriangle className="h-5 w-5 text-amber-500" />
								Exporter vers le Blog
							</DialogTitle>
							<DialogDescription>
								Attention : certains contenus ne seront pas compatibles avec le
								blog.
							</DialogDescription>
						</DialogHeader>

						<div className="rounded-md bg-amber-50 dark:bg-amber-950 p-4">
							<h4 className="text-sm font-medium text-amber-800 dark:text-amber-200 mb-2">
								Fonctionnalites non supportees :
							</h4>
							<ul className="space-y-2">
								{UNSUPPORTED_FEATURES.map((feature) => (
									<li
										key={feature.name}
										className="flex items-start gap-2 text-sm text-amber-700 dark:text-amber-300"
									>
										<span className="font-medium">{feature.name}:</span>
										<span>{feature.description}</span>
									</li>
								))}
							</ul>
						</div>

						<p className="text-sm text-muted-foreground">
							L'article sera cree en tant que <strong>brouillon</strong> pour
							vous permettre de le reviser avant publication.
						</p>

						<DialogFooter>
							<Button variant="outline" onClick={handleClose}>
								Annuler
							</Button>
							<Button onClick={() => setStep("form")}>Continuer</Button>
						</DialogFooter>
					</>
				) : (
					<>
						<DialogHeader>
							<DialogTitle>Details de l'article</DialogTitle>
							<DialogDescription>
								Renseignez les informations pour votre article de blog.
							</DialogDescription>
						</DialogHeader>

						<div className="space-y-4">
							<div className="space-y-2">
								<Label htmlFor="title">Titre *</Label>
								<Input
									id="title"
									value={title}
									onChange={(e) => setTitle(e.target.value)}
									placeholder="Titre de l'article"
								/>
							</div>

							<div className="space-y-2">
								<Label htmlFor="excerpt">Extrait</Label>
								<Textarea
									id="excerpt"
									value={excerpt}
									onChange={(e) => setExcerpt(e.target.value)}
									placeholder="Courte description de l'article (optionnel)"
									rows={3}
								/>
							</div>

							<div className="space-y-2">
								<Label htmlFor="featuredImage">Image de couverture (URL)</Label>
								<Input
									id="featuredImage"
									value={featuredImage}
									onChange={(e) => setFeaturedImage(e.target.value)}
									placeholder="https://exemple.com/image.jpg (optionnel)"
								/>
							</div>

							<div className="space-y-2">
								<Label htmlFor="category">Categorie</Label>
								<Input
									id="category"
									value={category}
									onChange={(e) => setCategory(e.target.value)}
									placeholder="Ex: Actualites, Conseils (optionnel)"
								/>
							</div>

							{error && (
								<div className="rounded-md bg-red-50 dark:bg-red-950 p-3 text-sm text-red-600 dark:text-red-400">
									{error}
								</div>
							)}
						</div>

						<DialogFooter>
							<Button variant="outline" onClick={() => setStep("warning")}>
								Retour
							</Button>
							<Button onClick={handleExport} disabled={isExporting}>
								{isExporting ? (
									<>
										<Loader2 className="mr-2 h-4 w-4 animate-spin" />
										Export en cours...
									</>
								) : (
									"Creer l'article"
								)}
							</Button>
						</DialogFooter>
					</>
				)}
			</DialogContent>
		</Dialog>
	);
}
