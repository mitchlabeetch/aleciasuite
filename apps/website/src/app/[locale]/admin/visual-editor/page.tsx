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
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	FileEdit,
	CheckCircle2,
	Clock,
	History,
	Pencil,
	Settings,
	ArrowLeft,
} from "lucide-react";
import { VisualEditor } from "@/components/admin/visual-editor/VisualEditor";
import { ApprovalReview } from "@/components/admin/visual-editor/ApprovalReview";
import { VersionHistory } from "@/components/admin/visual-editor/VersionHistory";
import { toast } from "sonner";
import { getEditablePages, getPageContent, getPendingChanges, initializePage } from "@/actions";

/**
 * Visual Website Editor - Admin Page
 *
 * Features:
 * - Page selection and preview
 * - Visual editing with drag-and-drop
 * - Approval workflow visualization
 * - Version history
 */

// Available pages for editing
const EDITABLE_PAGES = [
	{ path: "/", label: "Accueil", locale: "fr" },
	{ path: "/expertises", label: "Expertises", locale: "fr" },
	{ path: "/operations", label: "Opérations", locale: "fr" },
	{ path: "/equipe", label: "Équipe", locale: "fr" },
	{ path: "/actualites", label: "Actualités", locale: "fr" },
	{ path: "/nous-rejoindre", label: "Nous Rejoindre", locale: "fr" },
	{ path: "/contact", label: "Contact", locale: "fr" },
];

export default function VisualEditorPage() {
	const [selectedPage, setSelectedPage] = useState<string | null>(null);
	const [selectedLocale, setSelectedLocale] = useState<string>("fr");
	const [isEditing, setIsEditing] = useState(false);
	const [pages, setPages] = useState<any>(null);
	const [pendingChanges, setPendingChanges] = useState<any>(null);
	const [currentPage, setCurrentPage] = useState<any>(null);

	const router = useRouter();

	// Query for pages and pending changes
	useEffect(() => {
		getEditablePages(selectedLocale).then(setPages);
	}, [selectedLocale]);

	useEffect(() => {
		getPendingChanges({ status: "pending" }).then(setPendingChanges);
	}, []);

	// Get current page content - only when page is selected
	useEffect(() => {
		if (selectedPage) {
			getPageContent(selectedPage, selectedLocale).then(setCurrentPage);
		} else {
			setCurrentPage(null);
		}
	}, [selectedPage, selectedLocale]);

	const pendingChangesCount = pendingChanges?.length ?? 0;

	// Initialize page if it doesn't exist
	const handleStartEditing = async () => {
		if (!selectedPage) return;

		try {
			if (!currentPage) {
				// Initialize page with default sections
				await initializePage({
					path: selectedPage,
					locale: selectedLocale,
					initialSections: [],
				});
				toast.success("Page initialisée");
				router.refresh();
				// Reload current page
				const updated = await getPageContent(selectedPage, selectedLocale);
				setCurrentPage(updated);
			}
			setIsEditing(true);
		} catch (error) {
			toast.error("Erreur lors de l'initialisation");
			console.error(error);
		}
	};

	return (
		<div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
			<div className="max-w-7xl mx-auto space-y-6">
				{/* Header */}
				{!isEditing ? (
					<div className="flex items-center justify-between">
						<div>
							<h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
								<FileEdit className="w-8 h-8 text-alecia-gold" />
								Éditeur Visuel de Site Web
							</h1>
							<p className="text-gray-600 dark:text-gray-400 mt-2">
								Modifiez le contenu du site web avec aperçu en temps réel et
								workflow d&apos;approbation
							</p>
						</div>

						{pendingChangesCount > 0 && (
							<Badge variant="outline" className="h-8 px-3">
								<Clock className="w-4 h-4 mr-2" />
								{pendingChangesCount} changement
								{pendingChangesCount > 1 ? "s" : ""} en attente
							</Badge>
						)}
					</div>
				) : (
					<div className="flex items-center gap-4">
						<Button
							variant="ghost"
							onClick={() => setIsEditing(false)}
							className="gap-2"
						>
							<ArrowLeft className="w-4 h-4" />
							Retour
						</Button>
						<div>
							<h1 className="text-2xl font-bold text-gray-900 dark:text-white">
								{EDITABLE_PAGES.find((p) => p.path === selectedPage)?.label}
							</h1>
							<p className="text-sm text-gray-600 dark:text-gray-400">
								{selectedPage} • {selectedLocale.toUpperCase()}
							</p>
						</div>
					</div>
				)}

				{/* Main Content */}
				{!isEditing ? (
					<Tabs defaultValue="editor" className="space-y-4">
						<TabsList className="grid w-full grid-cols-3 max-w-md">
							<TabsTrigger value="editor" className="flex items-center gap-2">
								<Pencil className="w-4 h-4" />
								Éditeur
							</TabsTrigger>
							<TabsTrigger
								value="approvals"
								className="flex items-center gap-2"
							>
								<CheckCircle2 className="w-4 h-4" />
								Approbations
								{pendingChangesCount > 0 && (
									<Badge variant="secondary" className="ml-1 text-xs">
										{pendingChangesCount}
									</Badge>
								)}
							</TabsTrigger>
							<TabsTrigger value="history" className="flex items-center gap-2">
								<History className="w-4 h-4" />
								Historique
							</TabsTrigger>
						</TabsList>

						{/* Editor Tab */}
						<TabsContent value="editor" className="space-y-4">
							{/* Page Selection */}
							<Card>
								<CardHeader>
									<CardTitle className="flex items-center gap-2">
										<Settings className="w-5 h-5" />
										Sélection de Page
									</CardTitle>
									<CardDescription>
										Choisissez une page à modifier
									</CardDescription>
								</CardHeader>
								<CardContent className="space-y-4">
									<div className="grid grid-cols-2 gap-4">
										<div className="space-y-2">
											<label
												htmlFor="page-select"
												className="text-sm font-medium"
											>
												Page
											</label>
											<Select
												value={selectedPage || ""}
												onValueChange={setSelectedPage}
											>
												<SelectTrigger id="page-select">
													<SelectValue placeholder="Sélectionnez une page" />
												</SelectTrigger>
												<SelectContent>
													{EDITABLE_PAGES.map((page) => (
														<SelectItem key={page.path} value={page.path}>
															{page.label}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
										</div>

										<div className="space-y-2">
											<label
												htmlFor="locale-select"
												className="text-sm font-medium"
											>
												Langue
											</label>
											<Select
												value={selectedLocale}
												onValueChange={setSelectedLocale}
											>
												<SelectTrigger id="locale-select">
													<SelectValue />
												</SelectTrigger>
												<SelectContent>
													<SelectItem value="fr">Français</SelectItem>
													<SelectItem value="en">English</SelectItem>
												</SelectContent>
											</Select>
										</div>
									</div>

									{selectedPage && (
										<div className="flex items-center gap-2 pt-2">
											<Button size="sm" onClick={handleStartEditing}>
												<Pencil className="w-4 h-4 mr-2" />
												{currentPage ? "Modifier" : "Initialiser et Modifier"}
											</Button>
											{currentPage && (
												<p className="text-sm text-gray-500">
													Version {currentPage.version} •
													{currentPage.publishedAt
														? ` Publiée le ${new Date(currentPage.publishedAt).toLocaleDateString("fr-FR")}`
														: " Jamais publiée"}
												</p>
											)}
										</div>
									)}
								</CardContent>
							</Card>

							{/* Initial State */}
							{!selectedPage && (
								<Card>
									<CardContent className="py-12">
										<div className="text-center text-gray-500">
											<FileEdit className="w-16 h-16 mx-auto mb-4 opacity-20" />
											<p className="text-lg font-medium">
												Sélectionnez une page pour commencer
											</p>
											<p className="text-sm mt-2">
												Choisissez une page dans le menu déroulant ci-dessus
											</p>
										</div>
									</CardContent>
								</Card>
							)}
						</TabsContent>

						{/* Approvals Tab */}
						<TabsContent value="approvals" className="space-y-4">
							{!pendingChanges || pendingChanges.length === 0 ? (
								<Card>
									<CardContent className="py-12 text-center text-gray-500">
										<CheckCircle2 className="w-16 h-16 mx-auto mb-4 opacity-20" />
										<p className="text-lg font-medium">
											Aucun changement en attente
										</p>
										<p className="text-sm mt-2">
											Tous les changements ont été approuvés ou rejetés
										</p>
									</CardContent>
								</Card>
							) : (
								<div className="space-y-4">
									{pendingChanges.map((change: any) => (
										<ApprovalReview key={change._id} changeId={change._id} />
									))}
								</div>
							)}
						</TabsContent>

						{/* History Tab */}
						<TabsContent value="history" className="space-y-4">
							{selectedPage && currentPage ? (
								<VersionHistory pageContentId={currentPage._id} />
							) : (
								<Card>
									<CardContent className="py-12 text-center text-gray-500">
										<History className="w-16 h-16 mx-auto mb-4 opacity-20" />
										<p className="text-lg font-medium">Sélectionnez une page</p>
										<p className="text-sm mt-2">
											Choisissez une page dans l&apos;onglet Éditeur pour voir
											son historique
										</p>
									</CardContent>
								</Card>
							)}
						</TabsContent>
					</Tabs>
				) : (
					// Visual Editor View
					currentPage && (
						<VisualEditor
							pageContentId={currentPage._id}
							initialSections={currentPage.sections || []}
							pagePath={selectedPage || "/"}
							onSave={() => {
								toast.success("Modifications sauvegardées");
							}}
						/>
					)
				)}
			</div>
		</div>
	);
}
