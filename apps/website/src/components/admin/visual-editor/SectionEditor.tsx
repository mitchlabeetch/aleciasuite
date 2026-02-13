"use client";

import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
	GripVertical,
	Eye,
	EyeOff,
	Trash2,
	ChevronDown,
	ChevronUp,
	Type,
	Image as ImageIcon,
	Layout,
	Quote,
	Video,
	HelpCircle,
	MousePointerClick,
	Grid3X3,
	Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Section type definitions
 */
export type SectionType =
	| "text"
	| "image"
	| "hero"
	| "cards"
	| "testimonial"
	| "video"
	| "faq"
	| "cta"
	| "gallery"
	| "team";

export interface Section {
	id: string;
	type: SectionType;
	content: Record<string, unknown>;
	order: number;
	visible?: boolean;
}

interface SectionEditorProps {
	section: Section;
	onUpdate: (section: Section) => void;
	onDelete: (id: string) => void;
}

const SECTION_ICONS: Record<
	SectionType,
	React.ComponentType<{ className?: string }>
> = {
	text: Type,
	image: ImageIcon,
	hero: Layout,
	cards: Layout,
	testimonial: Quote,
	video: Video,
	faq: HelpCircle,
	cta: MousePointerClick,
	gallery: Grid3X3,
	team: Users,
};

const SECTION_LABELS: Record<SectionType, string> = {
	text: "Texte",
	image: "Image",
	hero: "En-tête",
	cards: "Cartes",
	testimonial: "Témoignage",
	video: "Vidéo",
	faq: "FAQ",
	cta: "Appel à l'action",
	gallery: "Galerie",
	team: "Équipe",
};

/**
 * SectionEditor - Editable section with drag-and-drop
 */
export function SectionEditor({
	section,
	onUpdate,
	onDelete,
}: SectionEditorProps) {
	const [isExpanded, setIsExpanded] = useState(true);

	const {
		attributes,
		listeners,
		setNodeRef,
		transform,
		transition,
		isDragging,
	} = useSortable({ id: section.id });

	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
		opacity: isDragging ? 0.5 : 1,
	};

	const Icon = SECTION_ICONS[section.type];

	const toggleVisibility = () => {
		onUpdate({
			...section,
			visible: !section.visible,
		});
	};

	const updateContent = (updates: Record<string, unknown>) => {
		onUpdate({
			...section,
			content: {
				...section.content,
				...updates,
			},
		});
	};

	return (
		<div ref={setNodeRef} style={style} className="mb-4">
			<Card
				className={cn(
					"overflow-hidden transition-all",
					!section.visible && "opacity-50 border-dashed",
				)}
			>
				{/* Section Header */}
				<div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 border-b">
					{/* Drag Handle */}
					<button
						className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 p-1"
						{...attributes}
						{...listeners}
					>
						<GripVertical className="w-5 h-5" />
					</button>

					{/* Section Type Icon */}
					<div className="flex items-center gap-2 flex-1">
						<Icon className="w-4 h-4 text-gray-600" />
						<span className="font-medium text-sm">
							{SECTION_LABELS[section.type]}
						</span>
						{!section.visible && (
							<span className="text-xs text-gray-500">(Masqué)</span>
						)}
					</div>

					{/* Actions */}
					<div className="flex items-center gap-1">
						<Button
							variant="ghost"
							size="sm"
							onClick={toggleVisibility}
							title={section.visible ? "Masquer" : "Afficher"}
						>
							{section.visible ? (
								<Eye className="w-4 h-4" />
							) : (
								<EyeOff className="w-4 h-4" />
							)}
						</Button>

						<Button
							variant="ghost"
							size="sm"
							onClick={() => setIsExpanded(!isExpanded)}
						>
							{isExpanded ? (
								<ChevronUp className="w-4 h-4" />
							) : (
								<ChevronDown className="w-4 h-4" />
							)}
						</Button>

						<Button
							variant="ghost"
							size="sm"
							onClick={() => onDelete(section.id)}
							className="text-red-600 hover:text-red-700 hover:bg-red-50"
						>
							<Trash2 className="w-4 h-4" />
						</Button>
					</div>
				</div>

				{/* Section Content Editor */}
				{isExpanded && (
					<div className="p-4 space-y-4">
						{renderSectionEditor(section.type, section.content, updateContent)}
					</div>
				)}
			</Card>
		</div>
	);
}

/**
 * Render appropriate editor based on section type
 */
function renderSectionEditor(
	type: SectionType,
	content: Record<string, unknown>,
	onUpdate: (updates: Record<string, unknown>) => void,
) {
	switch (type) {
		case "text":
			return <TextSectionEditor content={content} onUpdate={onUpdate} />;
		case "image":
			return <ImageSectionEditor content={content} onUpdate={onUpdate} />;
		case "hero":
			return <HeroSectionEditor content={content} onUpdate={onUpdate} />;
		case "cards":
			return <CardsSectionEditor content={content} onUpdate={onUpdate} />;
		case "testimonial":
			return <TestimonialSectionEditor content={content} onUpdate={onUpdate} />;
		case "video":
			return <VideoSectionEditor content={content} onUpdate={onUpdate} />;
		case "faq":
			return <FAQSectionEditor content={content} onUpdate={onUpdate} />;
		case "cta":
			return <CTASectionEditor content={content} onUpdate={onUpdate} />;
		case "gallery":
			return <GallerySectionEditor content={content} onUpdate={onUpdate} />;
		case "team":
			return <TeamSectionEditor content={content} onUpdate={onUpdate} />;
		default:
			return <div>Type de section non supporté</div>;
	}
}

/**
 * Text Section Editor
 */
function TextSectionEditor({ content, onUpdate }: any) {
	return (
		<div className="space-y-4">
			<div>
				<Label>Titre</Label>
				<Input
					value={content.title || ""}
					onChange={(e) => onUpdate({ title: e.target.value })}
					placeholder="Titre de la section"
				/>
			</div>
			<div>
				<Label>Texte</Label>
				<Textarea
					value={content.text || ""}
					onChange={(e) => onUpdate({ text: e.target.value })}
					placeholder="Contenu texte..."
					rows={6}
				/>
			</div>
		</div>
	);
}

/**
 * Image Section Editor
 */
function ImageSectionEditor({ content, onUpdate }: any) {
	return (
		<div className="space-y-4">
			<div>
				<Label>URL de l&apos;image</Label>
				<Input
					value={content.url || ""}
					onChange={(e) => onUpdate({ url: e.target.value })}
					placeholder="/assets/..."
				/>
			</div>
			<div>
				<Label>Texte alternatif</Label>
				<Input
					value={content.alt || ""}
					onChange={(e) => onUpdate({ alt: e.target.value })}
					placeholder="Description de l'image"
				/>
			</div>
			<div>
				<Label>Légende (optionnel)</Label>
				<Input
					value={content.caption || ""}
					onChange={(e) => onUpdate({ caption: e.target.value })}
					placeholder="Légende sous l'image"
				/>
			</div>
			{content.url && (
				<div className="border rounded-lg p-4 bg-gray-50">
					<img
						src={content.url}
						alt={content.alt || "Aperçu"}
						className="max-h-48 mx-auto"
					/>
				</div>
			)}
		</div>
	);
}

/**
 * Hero Section Editor
 */
function HeroSectionEditor({ content, onUpdate }: any) {
	return (
		<div className="space-y-4">
			<div>
				<Label>Titre principal</Label>
				<Input
					value={content.heading || ""}
					onChange={(e) => onUpdate({ heading: e.target.value })}
					placeholder="Titre accrocheur"
					className="text-lg font-semibold"
				/>
			</div>
			<div>
				<Label>Sous-titre</Label>
				<Textarea
					value={content.subheading || ""}
					onChange={(e) => onUpdate({ subheading: e.target.value })}
					placeholder="Description courte"
					rows={3}
				/>
			</div>
			<div>
				<Label>Image de fond (URL)</Label>
				<Input
					value={content.backgroundImage || ""}
					onChange={(e) => onUpdate({ backgroundImage: e.target.value })}
					placeholder="/assets/hero-bg.jpg"
				/>
			</div>
			<div>
				<Label>Texte du bouton (optionnel)</Label>
				<Input
					value={content.ctaText || ""}
					onChange={(e) => onUpdate({ ctaText: e.target.value })}
					placeholder="En savoir plus"
				/>
			</div>
			<div>
				<Label>Lien du bouton</Label>
				<Input
					value={content.ctaLink || ""}
					onChange={(e) => onUpdate({ ctaLink: e.target.value })}
					placeholder="/contact"
				/>
			</div>
		</div>
	);
}

/**
 * Cards Section Editor
 */
function CardsSectionEditor({ content, onUpdate }: any) {
	const cards = content.cards || [];

	const addCard = () => {
		onUpdate({
			cards: [
				...cards,
				{ id: Date.now().toString(), title: "", description: "" },
			],
		});
	};

	const updateCard = (index: number, updates: any) => {
		const newCards = [...cards];
		newCards[index] = { ...newCards[index], ...updates };
		onUpdate({ cards: newCards });
	};

	const removeCard = (index: number) => {
		onUpdate({ cards: cards.filter((_: any, i: number) => i !== index) });
	};

	return (
		<div className="space-y-4">
			<div>
				<Label>Titre de la section</Label>
				<Input
					value={content.sectionTitle || ""}
					onChange={(e) => onUpdate({ sectionTitle: e.target.value })}
					placeholder="Titre de la section de cartes"
				/>
			</div>

			<div className="space-y-3">
				<div className="flex items-center justify-between">
					<Label>Cartes ({cards.length})</Label>
					<Button size="sm" onClick={addCard}>
						Ajouter une carte
					</Button>
				</div>

				{cards.map((card: any, index: number) => (
					<Card key={card.id} className="p-3 space-y-2">
						<div className="flex items-center justify-between mb-2">
							<span className="text-sm font-medium">Carte {index + 1}</span>
							<Button
								variant="ghost"
								size="sm"
								onClick={() => removeCard(index)}
								className="text-red-600"
							>
								<Trash2 className="w-4 h-4" />
							</Button>
						</div>
						<Input
							value={card.title || ""}
							onChange={(e) => updateCard(index, { title: e.target.value })}
							placeholder="Titre de la carte"
							className="text-sm"
						/>
						<Textarea
							value={card.description || ""}
							onChange={(e) =>
								updateCard(index, { description: e.target.value })
							}
							placeholder="Description"
							rows={2}
							className="text-sm"
						/>
					</Card>
				))}
			</div>
		</div>
	);
}

/**
 * Testimonial Section Editor
 */
function TestimonialSectionEditor({ content, onUpdate }: EditorProps) {
	return (
		<div className="space-y-4">
			<div>
				<Label>Citation</Label>
				<Textarea
					value={(content.quote as string) || ""}
					onChange={(e) => onUpdate({ quote: e.target.value })}
					placeholder="Le témoignage..."
					rows={4}
				/>
			</div>
			<div className="grid grid-cols-2 gap-4">
				<div>
					<Label>Auteur</Label>
					<Input
						value={(content.author as string) || ""}
						onChange={(e) => onUpdate({ author: e.target.value })}
						placeholder="Nom de l'auteur"
					/>
				</div>
				<div>
					<Label>Rôle</Label>
					<Input
						value={(content.role as string) || ""}
						onChange={(e) => onUpdate({ role: e.target.value })}
						placeholder="Titre / Entreprise"
					/>
				</div>
			</div>
			<div>
				<Label>Photo (URL)</Label>
				<Input
					value={(content.photo as string) || ""}
					onChange={(e) => onUpdate({ photo: e.target.value })}
					placeholder="/assets/avatar.jpg"
				/>
			</div>
		</div>
	);
}

/**
 * Video Section Editor
 */
function VideoSectionEditor({ content, onUpdate }: EditorProps) {
	return (
		<div className="space-y-4">
			<div>
				<Label>URL de la vidéo</Label>
				<Input
					value={(content.url as string) || ""}
					onChange={(e) => onUpdate({ url: e.target.value })}
					placeholder="https://youtube.com/watch?v=... ou https://vimeo.com/..."
				/>
				<p className="text-xs text-muted-foreground mt-1">
					Supporte YouTube, Vimeo, ou liens directs MP4/WebM
				</p>
			</div>
			<div>
				<Label>Titre (optionnel)</Label>
				<Input
					value={(content.title as string) || ""}
					onChange={(e) => onUpdate({ title: e.target.value })}
					placeholder="Titre de la vidéo"
				/>
			</div>
			<div>
				<Label>Description (optionnel)</Label>
				<Textarea
					value={(content.description as string) || ""}
					onChange={(e) => onUpdate({ description: e.target.value })}
					placeholder="Description courte..."
					rows={2}
				/>
			</div>
			<div>
				<Label>Miniature (URL, optionnel)</Label>
				<Input
					value={(content.thumbnail as string) || ""}
					onChange={(e) => onUpdate({ thumbnail: e.target.value })}
					placeholder="/assets/video-thumbnail.jpg"
				/>
			</div>
		</div>
	);
}

/**
 * FAQ Section Editor
 */
interface FAQItem {
	id: string;
	question: string;
	answer: string;
}

function FAQSectionEditor({ content, onUpdate }: EditorProps) {
	const items = (content.items as FAQItem[]) || [];

	const addItem = () => {
		onUpdate({
			items: [
				...items,
				{ id: Date.now().toString(), question: "", answer: "" },
			],
		});
	};

	const updateItem = (index: number, updates: Partial<FAQItem>) => {
		const newItems = [...items];
		newItems[index] = { ...newItems[index], ...updates };
		onUpdate({ items: newItems });
	};

	const removeItem = (index: number) => {
		onUpdate({ items: items.filter((_, i: number) => i !== index) });
	};

	return (
		<div className="space-y-4">
			<div>
				<Label>Titre de la section</Label>
				<Input
					value={(content.sectionTitle as string) || ""}
					onChange={(e) => onUpdate({ sectionTitle: e.target.value })}
					placeholder="Questions fréquentes"
				/>
			</div>

			<div className="space-y-3">
				<div className="flex items-center justify-between">
					<Label>Questions ({items.length})</Label>
					<Button size="sm" onClick={addItem}>
						Ajouter une question
					</Button>
				</div>

				{items.map((item: FAQItem, index: number) => (
					<Card key={item.id} className="p-3 space-y-2">
						<div className="flex items-center justify-between mb-2">
							<span className="text-sm font-medium">Question {index + 1}</span>
							<Button
								variant="ghost"
								size="sm"
								onClick={() => removeItem(index)}
								className="text-red-600"
							>
								<Trash2 className="w-4 h-4" />
							</Button>
						</div>
						<Input
							value={item.question || ""}
							onChange={(e) => updateItem(index, { question: e.target.value })}
							placeholder="La question..."
							className="text-sm"
						/>
						<Textarea
							value={item.answer || ""}
							onChange={(e) => updateItem(index, { answer: e.target.value })}
							placeholder="La réponse..."
							rows={3}
							className="text-sm"
						/>
					</Card>
				))}
			</div>
		</div>
	);
}

/**
 * CTA Section Editor
 */
function CTASectionEditor({ content, onUpdate }: EditorProps) {
	return (
		<div className="space-y-4">
			<div>
				<Label>Titre</Label>
				<Input
					value={(content.heading as string) || ""}
					onChange={(e) => onUpdate({ heading: e.target.value })}
					placeholder="Prêt à commencer ?"
				/>
			</div>
			<div>
				<Label>Sous-titre</Label>
				<Textarea
					value={(content.subheading as string) || ""}
					onChange={(e) => onUpdate({ subheading: e.target.value })}
					placeholder="Description de l'appel à l'action..."
					rows={2}
				/>
			</div>
			<div className="grid grid-cols-2 gap-4">
				<div>
					<Label>Texte bouton principal</Label>
					<Input
						value={(content.primaryButtonText as string) || ""}
						onChange={(e) => onUpdate({ primaryButtonText: e.target.value })}
						placeholder="Nous contacter"
					/>
				</div>
				<div>
					<Label>Lien bouton principal</Label>
					<Input
						value={(content.primaryButtonLink as string) || ""}
						onChange={(e) => onUpdate({ primaryButtonLink: e.target.value })}
						placeholder="/contact"
					/>
				</div>
			</div>
			<div className="grid grid-cols-2 gap-4">
				<div>
					<Label>Texte bouton secondaire (optionnel)</Label>
					<Input
						value={(content.secondaryButtonText as string) || ""}
						onChange={(e) => onUpdate({ secondaryButtonText: e.target.value })}
						placeholder="En savoir plus"
					/>
				</div>
				<div>
					<Label>Lien bouton secondaire</Label>
					<Input
						value={(content.secondaryButtonLink as string) || ""}
						onChange={(e) => onUpdate({ secondaryButtonLink: e.target.value })}
						placeholder="/expertises"
					/>
				</div>
			</div>
			<div>
				<Label>Style</Label>
				<select
					value={(content.variant as string) || "default"}
					onChange={(e) => onUpdate({ variant: e.target.value })}
					className="w-full p-2 border rounded-md bg-background"
				>
					<option value="default">Clair</option>
					<option value="dark">Sombre</option>
					<option value="gradient">Dégradé</option>
				</select>
			</div>
		</div>
	);
}

/**
 * Gallery Section Editor
 */
interface GalleryItem {
	id: string;
	url: string;
	alt?: string;
	caption?: string;
}

function GallerySectionEditor({ content, onUpdate }: EditorProps) {
	const items = (content.items as GalleryItem[]) || [];

	const addItem = () => {
		onUpdate({
			items: [
				...items,
				{ id: Date.now().toString(), url: "", alt: "", caption: "" },
			],
		});
	};

	const updateItem = (index: number, updates: Partial<GalleryItem>) => {
		const newItems = [...items];
		newItems[index] = { ...newItems[index], ...updates };
		onUpdate({ items: newItems });
	};

	const removeItem = (index: number) => {
		onUpdate({ items: items.filter((_, i: number) => i !== index) });
	};

	return (
		<div className="space-y-4">
			<div>
				<Label>Titre de la section</Label>
				<Input
					value={(content.sectionTitle as string) || ""}
					onChange={(e) => onUpdate({ sectionTitle: e.target.value })}
					placeholder="Galerie"
				/>
			</div>
			<div>
				<Label>Colonnes</Label>
				<select
					value={(content.columns as number) || 3}
					onChange={(e) => onUpdate({ columns: parseInt(e.target.value) })}
					className="w-full p-2 border rounded-md bg-background"
				>
					<option value={2}>2 colonnes</option>
					<option value={3}>3 colonnes</option>
					<option value={4}>4 colonnes</option>
				</select>
			</div>

			<div className="space-y-3">
				<div className="flex items-center justify-between">
					<Label>Images ({items.length})</Label>
					<Button size="sm" onClick={addItem}>
						Ajouter une image
					</Button>
				</div>

				{items.map((item: GalleryItem, index: number) => (
					<Card key={item.id} className="p-3 space-y-2">
						<div className="flex items-center justify-between mb-2">
							<span className="text-sm font-medium">Image {index + 1}</span>
							<Button
								variant="ghost"
								size="sm"
								onClick={() => removeItem(index)}
								className="text-red-600"
							>
								<Trash2 className="w-4 h-4" />
							</Button>
						</div>
						<Input
							value={item.url || ""}
							onChange={(e) => updateItem(index, { url: e.target.value })}
							placeholder="URL de l'image"
							className="text-sm"
						/>
						<Input
							value={item.alt || ""}
							onChange={(e) => updateItem(index, { alt: e.target.value })}
							placeholder="Texte alternatif"
							className="text-sm"
						/>
						<Input
							value={item.caption || ""}
							onChange={(e) => updateItem(index, { caption: e.target.value })}
							placeholder="Légende (optionnel)"
							className="text-sm"
						/>
						{item.url && (
							<div className="border rounded p-2 bg-gray-50">
								<img
									src={item.url}
									alt={item.alt || ""}
									className="max-h-24 mx-auto"
								/>
							</div>
						)}
					</Card>
				))}
			</div>
		</div>
	);
}

/**
 * Team Section Editor
 */
interface TeamMember {
	id: string;
	name: string;
	role?: string;
	photo?: string;
	bio?: string;
	linkedin?: string;
	email?: string;
}

function TeamSectionEditor({ content, onUpdate }: EditorProps) {
	const members = (content.members as TeamMember[]) || [];

	const addMember = () => {
		onUpdate({
			members: [
				...members,
				{ id: Date.now().toString(), name: "", role: "", photo: "", bio: "" },
			],
		});
	};

	const updateMember = (index: number, updates: Partial<TeamMember>) => {
		const newMembers = [...members];
		newMembers[index] = { ...newMembers[index], ...updates };
		onUpdate({ members: newMembers });
	};

	const removeMember = (index: number) => {
		onUpdate({ members: members.filter((_, i: number) => i !== index) });
	};

	return (
		<div className="space-y-4">
			<div>
				<Label>Titre de la section</Label>
				<Input
					value={(content.sectionTitle as string) || ""}
					onChange={(e) => onUpdate({ sectionTitle: e.target.value })}
					placeholder="Notre équipe"
				/>
			</div>
			<div>
				<Label>Sous-titre (optionnel)</Label>
				<Input
					value={(content.subtitle as string) || ""}
					onChange={(e) => onUpdate({ subtitle: e.target.value })}
					placeholder="Une équipe d'experts..."
				/>
			</div>

			<div className="space-y-3">
				<div className="flex items-center justify-between">
					<Label>Membres ({members.length})</Label>
					<Button size="sm" onClick={addMember}>
						Ajouter un membre
					</Button>
				</div>

				{members.map((member: TeamMember, index: number) => (
					<Card key={member.id} className="p-3 space-y-2">
						<div className="flex items-center justify-between mb-2">
							<span className="text-sm font-medium">Membre {index + 1}</span>
							<Button
								variant="ghost"
								size="sm"
								onClick={() => removeMember(index)}
								className="text-red-600"
							>
								<Trash2 className="w-4 h-4" />
							</Button>
						</div>
						<div className="grid grid-cols-2 gap-2">
							<Input
								value={member.name || ""}
								onChange={(e) => updateMember(index, { name: e.target.value })}
								placeholder="Nom"
								className="text-sm"
							/>
							<Input
								value={member.role || ""}
								onChange={(e) => updateMember(index, { role: e.target.value })}
								placeholder="Poste"
								className="text-sm"
							/>
						</div>
						<Input
							value={member.photo || ""}
							onChange={(e) => updateMember(index, { photo: e.target.value })}
							placeholder="URL de la photo"
							className="text-sm"
						/>
						<Textarea
							value={member.bio || ""}
							onChange={(e) => updateMember(index, { bio: e.target.value })}
							placeholder="Biographie courte..."
							rows={2}
							className="text-sm"
						/>
						<div className="grid grid-cols-2 gap-2">
							<Input
								value={member.linkedin || ""}
								onChange={(e) =>
									updateMember(index, { linkedin: e.target.value })
								}
								placeholder="LinkedIn URL"
								className="text-sm"
							/>
							<Input
								value={member.email || ""}
								onChange={(e) => updateMember(index, { email: e.target.value })}
								placeholder="Email"
								className="text-sm"
							/>
						</div>
					</Card>
				))}
			</div>
		</div>
	);
}

// Editor props interface for all section editors
interface EditorProps {
	content: Record<string, unknown>;
	onUpdate: (updates: Record<string, unknown>) => void;
}
