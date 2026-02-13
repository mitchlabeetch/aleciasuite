"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
	DndContext,
	closestCenter,
	KeyboardSensor,
	PointerSensor,
	useSensor,
	useSensors,
	DragEndEvent,
} from "@dnd-kit/core";
import {
	arrayMove,
	SortableContext,
	sortableKeyboardCoordinates,
	verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Plus,
	Save,
	Eye,
	Send,
	Undo,
	Redo,
	LayoutTemplate,
} from "lucide-react";
import { SectionEditor, Section, SectionType } from "./SectionEditor";
import { SubmitDialog, SubmitData } from "./SubmitDialog";
import { PreviewModal } from "./PreviewModal";
import { PageTemplateSelector } from "./PageTemplateSelector";
import { toast } from "sonner";
import { useSession } from "@alepanel/auth/client";
import { updatePageSections, submitChanges } from "@/actions";

interface VisualEditorProps {
	pageContentId: string;
	initialSections: Section[];
	pagePath?: string;
	onSave?: () => void;
}

/**
 * VisualEditor - Main drag-and-drop visual editor
 *
 * Features:
 * - Drag-and-drop section reordering
 * - Add/remove sections
 * - Inline editing
 * - Auto-save drafts
 * - Submit for approval
 */
export function VisualEditor({
	pageContentId,
	initialSections,
	pagePath = "/",
	onSave,
}: VisualEditorProps) {
	const [sections, setSections] = useState<Section[]>(initialSections);
	const [hasChanges, setHasChanges] = useState(false);
	const [history, setHistory] = useState<Section[][]>([initialSections]);
	const [historyIndex, setHistoryIndex] = useState(0);
	const [showSubmitDialog, setShowSubmitDialog] = useState(false);
	const [showPreview, setShowPreview] = useState(false);
	const [showTemplates, setShowTemplates] = useState(false);

	const { data: session } = useSession();
	const userId = session?.user?.id;
	const router = useRouter();

	// Setup drag-and-drop sensors
	const sensors = useSensors(
		useSensor(PointerSensor),
		useSensor(KeyboardSensor, {
			coordinateGetter: sortableKeyboardCoordinates,
		}),
	);

	// Track changes
	useEffect(() => {
		const changed =
			JSON.stringify(sections) !== JSON.stringify(initialSections);
		setHasChanges(changed);
	}, [sections, initialSections]);

	/**
	 * Handle drag end event
	 */
	const handleDragEnd = (event: DragEndEvent) => {
		const { active, over } = event;

		if (over && active.id !== over.id) {
			setSections((items) => {
				const oldIndex = items.findIndex((item) => item.id === active.id);
				const newIndex = items.findIndex((item) => item.id === over.id);

				const newSections = arrayMove(items, oldIndex, newIndex).map(
					(item, index) => ({
						...item,
						order: index,
					}),
				);

				addToHistory(newSections);
				return newSections;
			});
		}
	};

	/**
	 * Add a new section
	 */
	const addSection = (type: SectionType) => {
		const newSection: Section = {
			id: `section-${Date.now()}`,
			type,
			content: getDefaultContent(type),
			order: sections.length,
			visible: true,
		};

		const newSections = [...sections, newSection];
		setSections(newSections);
		addToHistory(newSections);
		toast.success("Section ajoutée");
	};

	/**
	 * Update a section
	 */
	const updateSection = (updatedSection: Section) => {
		const newSections = sections.map((s) =>
			s.id === updatedSection.id ? updatedSection : s,
		);
		setSections(newSections);
		addToHistory(newSections);
	};

	/**
	 * Delete a section
	 */
	const deleteSection = (id: string) => {
		const newSections = sections.filter((s) => s.id !== id);
		setSections(newSections);
		addToHistory(newSections);
		toast.success("Section supprimée");
	};

	/**
	 * Add to history for undo/redo
	 */
	const addToHistory = (newSections: Section[]) => {
		const newHistory = history.slice(0, historyIndex + 1);
		newHistory.push(newSections);
		setHistory(newHistory);
		setHistoryIndex(newHistory.length - 1);
	};

	/**
	 * Undo
	 */
	const undo = () => {
		if (historyIndex > 0) {
			setHistoryIndex(historyIndex - 1);
			setSections(history[historyIndex - 1]);
			toast.info("Action annulée");
		}
	};

	/**
	 * Redo
	 */
	const redo = () => {
		if (historyIndex < history.length - 1) {
			setHistoryIndex(historyIndex + 1);
			setSections(history[historyIndex + 1]);
			toast.info("Action rétablie");
		}
	};

	/**
	 * Save draft
	 */
	const saveDraft = async () => {
		try {
			await updatePageSections(pageContentId, sections);
			toast.success("Brouillon enregistré");
			setHasChanges(false);
			router.refresh();
			onSave?.();
		} catch (error) {
			toast.error("Erreur lors de l'enregistrement");
			console.error(error);
		}
	};

	/**
	 * Submit for approval (placeholder - will be implemented in approval workflow phase)
	 */
	const submitForApproval = () => {
		setShowSubmitDialog(true);
	};

	/**
	 * Apply template sections
	 */
	const handleApplyTemplate = (templateSections: Section[]) => {
		setSections(templateSections);
		addToHistory(templateSections);
		toast.success("Modèle appliqué");
	};

	/**
	 * Handle submission
	 */
	const handleSubmit = async (data: SubmitData) => {
		if (!userId) {
			toast.error("Vous devez être connecté");
			return;
		}

		try {
			// First save the current sections
			await updatePageSections(pageContentId, sections);

			// Then submit for approval
			await submitChanges({
				pageContentId,
				changedBy: userId as string,
				changedByName: "User", // TODO: Get from user profile
				changeType: "content",
				description: data.description,
				visualDiff: data.visualDiff,
				codeDiff: data.codeDiff,
				requiredApprovals: data.requiredApprovals,
			});

			toast.success("Changements soumis pour approbation");
			setHasChanges(false);
			router.refresh();
			onSave?.();
		} catch (error) {
			toast.error("Erreur lors de la soumission");
			console.error(error);
			throw error;
		}
	};

	return (
		<div className="space-y-4">
			{/* Toolbar */}
			<Card>
				<CardHeader>
					<div className="flex items-center justify-between">
						<div>
							<CardTitle>Éditeur de Sections</CardTitle>
							<CardDescription>
								Glissez-déposez pour réorganiser • {sections.length} section
								{sections.length > 1 ? "s" : ""}
							</CardDescription>
						</div>
						<div className="flex items-center gap-2">
							{/* Undo/Redo */}
							<Button
								variant="outline"
								size="sm"
								onClick={undo}
								disabled={historyIndex === 0}
								title="Annuler"
							>
								<Undo className="w-4 h-4" />
							</Button>
							<Button
								variant="outline"
								size="sm"
								onClick={redo}
								disabled={historyIndex === history.length - 1}
								title="Rétablir"
							>
								<Redo className="w-4 h-4" />
							</Button>

							{/* Save */}
							<Button
								variant="outline"
								size="sm"
								onClick={saveDraft}
								disabled={!hasChanges}
							>
								<Save className="w-4 h-4 mr-2" />
								Sauvegarder
							</Button>

							{/* Preview */}
							<Button
								variant="outline"
								size="sm"
								onClick={() => setShowPreview(true)}
							>
								<Eye className="w-4 h-4 mr-2" />
								Aperçu
							</Button>

							{/* Submit for approval */}
							<Button size="sm" onClick={submitForApproval}>
								<Send className="w-4 h-4 mr-2" />
								Soumettre
							</Button>
						</div>
					</div>
				</CardHeader>
				<CardContent>
					{/* Add Section */}
					<div className="flex items-center gap-4">
						<div className="flex items-center gap-2">
							<span className="text-sm font-medium">Ajouter une section:</span>
							<Select
								onValueChange={(value) => addSection(value as SectionType)}
							>
								<SelectTrigger className="w-48">
									<SelectValue placeholder="Choisir un type" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="text">Texte</SelectItem>
									<SelectItem value="image">Image</SelectItem>
									<SelectItem value="hero">En-tête</SelectItem>
									<SelectItem value="cards">Cartes</SelectItem>
									<SelectItem value="testimonial">Témoignage</SelectItem>
									<SelectItem value="video">Vidéo</SelectItem>
									<SelectItem value="faq">FAQ</SelectItem>
									<SelectItem value="cta">Appel à l&apos;action</SelectItem>
									<SelectItem value="gallery">Galerie</SelectItem>
									<SelectItem value="team">Équipe</SelectItem>
								</SelectContent>
							</Select>
						</div>

						<div className="border-l pl-4">
							<Button
								variant="outline"
								size="sm"
								onClick={() => setShowTemplates(true)}
							>
								<LayoutTemplate className="w-4 h-4 mr-2" />
								Utiliser un modèle
							</Button>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Sections List with Drag-and-Drop */}
			<DndContext
				sensors={sensors}
				collisionDetection={closestCenter}
				onDragEnd={handleDragEnd}
			>
				<SortableContext
					items={sections.map((s) => s.id)}
					strategy={verticalListSortingStrategy}
				>
					<div className="space-y-4">
						{sections.length === 0 ? (
							<Card>
								<CardContent className="py-12 text-center text-gray-500">
									<Plus className="w-12 h-12 mx-auto mb-4 opacity-20" />
									<p className="text-lg font-medium">Aucune section</p>
									<p className="text-sm mt-2">
										Ajoutez une section pour commencer à éditer
									</p>
								</CardContent>
							</Card>
						) : (
							sections.map((section) => (
								<SectionEditor
									key={section.id}
									section={section}
									onUpdate={updateSection}
									onDelete={deleteSection}
								/>
							))
						)}
					</div>
				</SortableContext>
			</DndContext>

			{/* Bottom Save Bar */}
			{hasChanges && (
				<div className="fixed bottom-6 right-6 z-50">
					<Card className="shadow-lg">
						<CardContent className="p-4 flex items-center gap-3">
							<div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
							<span className="text-sm font-medium">
								Modifications non enregistrées
							</span>
							<Button size="sm" onClick={saveDraft}>
								<Save className="w-4 h-4 mr-2" />
								Enregistrer
							</Button>
						</CardContent>
					</Card>
				</div>
			)}

			{/* Submit Dialog */}
			<SubmitDialog
				open={showSubmitDialog}
				onOpenChange={setShowSubmitDialog}
				beforeSections={initialSections}
				afterSections={sections}
				onSubmit={handleSubmit}
			/>

			{/* Preview Modal */}
			<PreviewModal
				open={showPreview}
				onOpenChange={setShowPreview}
				sections={sections}
				pagePath={pagePath}
			/>

			{/* Template Selector Modal */}
			<PageTemplateSelector
				open={showTemplates}
				onOpenChange={setShowTemplates}
				onSelectTemplate={handleApplyTemplate}
			/>
		</div>
	);
}

/**
 * Get default content for a section type
 */
function getDefaultContent(type: SectionType): Record<string, unknown> {
	switch (type) {
		case "text":
			return { title: "", text: "" };
		case "image":
			return { url: "", alt: "", caption: "" };
		case "hero":
			return {
				heading: "",
				subheading: "",
				backgroundImage: "",
				ctaText: "",
				ctaLink: "",
			};
		case "cards":
			return { sectionTitle: "", cards: [] };
		case "testimonial":
			return { quote: "", author: "", role: "", photo: "" };
		case "video":
			return { url: "", title: "", description: "", thumbnail: "" };
		case "faq":
			return { sectionTitle: "", items: [] };
		case "cta":
			return {
				heading: "",
				subheading: "",
				primaryButtonText: "",
				primaryButtonLink: "",
				secondaryButtonText: "",
				secondaryButtonLink: "",
				variant: "default",
			};
		case "gallery":
			return { sectionTitle: "", items: [], columns: 3 };
		case "team":
			return { sectionTitle: "", subtitle: "", members: [] };
		default:
			return {};
	}
}
