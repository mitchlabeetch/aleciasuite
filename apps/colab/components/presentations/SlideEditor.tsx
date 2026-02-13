"use client";

import { Button } from "@/components/tailwind/ui/button";
import type { Slide } from "@/lib/presentation-parser";
import { cn } from "@/lib/utils";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { Download, GripVertical, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import {
	DndContext,
	closestCenter,
	KeyboardSensor,
	PointerSensor,
	useSensor,
	useSensors,
	type DragEndEvent,
} from "@dnd-kit/core";
import {
	arrayMove,
	SortableContext,
	sortableKeyboardCoordinates,
	useSortable,
	verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { getPresentation, updatePresentation } from "@/actions/colab/presentations";

export const exportToPDF = async (elementId: string, fileName: string) => {
	const element = document.getElementById(elementId);
	if (!element) return;

	try {
		const canvas = await html2canvas(element, { scale: 2 });
		const imgData = canvas.toDataURL("image/png");
		const pdf = new jsPDF({
			orientation: "landscape",
			unit: "px",
			format: [canvas.width, canvas.height],
		});

		pdf.addImage(imgData, "PNG", 0, 0, canvas.width, canvas.height);
		pdf.save(`${fileName}.pdf`);
	} catch (error) {
		console.error("Export PDF failed", error);
	}
};

interface SlideEditorProps {
	presentationId: string;
}

const ALECIA_THEMES = {
	midnight: {
		background: "bg-[var(--alecia-midnight)]",
		text: "text-white",
		accent: "text-[var(--alecia-sky)]",
		bgAccent: "bg-[var(--alecia-sky)]",
	},
	corporate: {
		background: "bg-[var(--alecia-corporate)]",
		text: "text-white",
		accent: "text-[var(--alecia-gold-accent)]",
		bgAccent: "bg-[var(--alecia-gold-accent)]",
	},
	light: {
		background: "bg-[var(--alecia-off-white)]",
		text: "text-[var(--alecia-midnight)]",
		accent: "text-[var(--alecia-red)]",
		bgAccent: "bg-[var(--alecia-red)]",
	},
};

// Sortable slide item component
function SortableSlideItem({
	slide,
	index,
	isSelected,
	onSelect,
}: {
	slide: Slide;
	index: number;
	isSelected: boolean;
	onSelect: () => void;
}) {
	const {
		attributes,
		listeners,
		setNodeRef,
		transform,
		transition,
		isDragging,
	} = useSortable({ id: slide.id || `slide-${index}` });

	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
		opacity: isDragging ? 0.5 : 1,
		zIndex: isDragging ? 50 : "auto",
	};

	return (
		<div
			ref={setNodeRef}
			style={style}
			className={cn(
				"flex items-center gap-2 rounded-lg border text-sm transition-all hover:bg-accent bg-card",
				isSelected ? "bg-accent border-primary ring-1 ring-primary" : "",
				isDragging ? "shadow-lg scale-105" : "",
			)}
		>
			<div
				{...attributes}
				{...listeners}
				className="p-2 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
			>
				<GripVertical className="h-4 w-4" />
			</div>
			<button
				type="button"
				onClick={onSelect}
				className="flex-1 text-left p-2 pl-0 truncate"
			>
				<span className="font-medium mr-2">{index + 1}.</span>
				{slide.title}
			</button>
		</div>
	);
}

export function SlideEditor({ presentationId }: SlideEditorProps) {
	const [presentation, setPresentation] = useState<any>(null);
	const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
	const [slides, setSlides] = useState<Slide[]>([]);

	const sensors = useSensors(
		useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
		useSensor(KeyboardSensor, {
			coordinateGetter: sortableKeyboardCoordinates,
		}),
	);

	useEffect(() => {
		async function loadPresentation() {
			const data = await getPresentation(presentationId);
			setPresentation(data);
		}
		loadPresentation();
	}, [presentationId]);

	useEffect(() => {
		if (presentation?.slides) {
			setSlides(presentation.slides as unknown as Slide[]);
		}
	}, [presentation?.slides]);

	if (!presentation) {
		return <div>Chargement...</div>;
	}

	const currentSlide = slides[currentSlideIndex];
	const theme =
		ALECIA_THEMES[presentation.theme as keyof typeof ALECIA_THEMES] ||
		ALECIA_THEMES.corporate;

	const handleExportPDF = () => {
		exportToPDF("slide-content", presentation.title || "presentation");
	};

	const handleAddSlide = async () => {
		const newSlide: Slide = {
			id: Math.random().toString(36).substring(7),
			title: "Nouvelle diapositive",
			content: [],
		};

		const newSlides = [...slides, newSlide];
		setSlides(newSlides);
		setCurrentSlideIndex(newSlides.length - 1);

		await updatePresentation({
			id: presentationId,
			slides: newSlides,
		});
	};

	const handleDragEnd = async (event: DragEndEvent) => {
		const { active, over } = event;
		if (!over || active.id === over.id) return;

		const oldIndex = slides.findIndex(
			(s) => (s.id || `slide-${slides.indexOf(s)}`) === active.id,
		);
		const newIndex = slides.findIndex(
			(s) => (s.id || `slide-${slides.indexOf(s)}`) === over.id,
		);

		if (oldIndex === -1 || newIndex === -1) return;

		const reorderedSlides = arrayMove(slides, oldIndex, newIndex);
		setSlides(reorderedSlides);

		// Update current slide index if needed
		if (currentSlideIndex === oldIndex) {
			setCurrentSlideIndex(newIndex);
		} else if (currentSlideIndex > oldIndex && currentSlideIndex <= newIndex) {
			setCurrentSlideIndex(currentSlideIndex - 1);
		} else if (currentSlideIndex < oldIndex && currentSlideIndex >= newIndex) {
			setCurrentSlideIndex(currentSlideIndex + 1);
		}

		await updatePresentation({
			id: presentationId,
			slides: reorderedSlides,
		});
	};

	return (
		<div className="flex h-[calc(100vh-4rem)] flex-col md:flex-row overflow-hidden">
			{/* Sidebar: Slide List with Drag and Drop */}
			<div className="w-full md:w-64 border-r bg-muted/30 overflow-y-auto p-4 space-y-4 print:hidden flex flex-col">
				<div className="flex items-center justify-between mb-2">
					<h2 className="font-semibold text-sm">Diapositives</h2>
					<Button
						variant="ghost"
						size="icon"
						onClick={handleAddSlide}
						title="Ajouter une diapositive"
					>
						<Plus className="h-4 w-4" />
					</Button>
				</div>

				<div className="flex-1 overflow-y-auto space-y-2">
					<DndContext
						sensors={sensors}
						collisionDetection={closestCenter}
						onDragEnd={handleDragEnd}
					>
						<SortableContext
							items={slides.map((s, i) => s.id || `slide-${i}`)}
							strategy={verticalListSortingStrategy}
						>
							<div className="space-y-2">
								{slides.map((slide, index) => (
									<SortableSlideItem
										key={slide.id || `slide-${index}`}
										slide={slide}
										index={index}
										isSelected={currentSlideIndex === index}
										onSelect={() => setCurrentSlideIndex(index)}
									/>
								))}
							</div>
						</SortableContext>
					</DndContext>
				</div>
			</div>

			{/* Main Editor Area */}
			<div className="flex-1 flex flex-col bg-muted/10">
				{/* Toolbar */}
				<div className="h-14 border-b bg-background px-4 flex items-center justify-between print:hidden">
					<div className="flex items-center gap-2">
						<span className="font-semibold">{presentation.title}</span>
					</div>
					<div className="flex items-center gap-2">
						<Button variant="outline" size="sm" onClick={handleExportPDF}>
							<Download className="mr-2 h-4 w-4" />
							Exporter en PDF
						</Button>
					</div>
				</div>

				{/* Slide Preview / Edit */}
				<div className="flex-1 overflow-auto p-8 flex items-center justify-center print:p-0">
					{currentSlide ? (
						<div
							id="slide-content"
							className="w-full max-w-4xl aspect-video shadow-2xl rounded-lg overflow-hidden print:shadow-none print:w-full print:h-screen print:rounded-none"
						>
							<div
								className={cn(
									"w-full h-full p-12 flex flex-col",
									theme.background,
									theme.text,
								)}
							>
								<h1 className={cn("text-4xl font-bold mb-8", theme.accent)}>
									{currentSlide.title}
								</h1>

								<div className="flex-1 space-y-6">
									{currentSlide.content?.map((block, i) => (
										// biome-ignore lint/suspicious/noArrayIndexKey: No stable ID available for blocks
										<div key={i} className="text-xl">
											{block.type === "bullet" && (
												<div className="flex items-start gap-3">
													<span
														className={cn(
															"mt-2 h-2 w-2 rounded-full flex-shrink-0",
															theme.bgAccent,
														)}
													/>
													<p>{block.content}</p>
												</div>
											)}
										</div>
									))}
								</div>

								{currentSlide.rootImage && (
									<div className="mt-8 h-48 bg-black/20 rounded-lg flex items-center justify-center border-2 border-dashed border-white/20">
										<p className="text-sm opacity-70">
											Image placeholder: {currentSlide.rootImage.query}
										</p>
									</div>
								)}

								{currentSlide.notes && (
									<div className="hidden print:block mt-8 p-4 border-t border-white/20 text-sm">
										<p className="font-bold mb-1">Notes:</p>
										<p>{currentSlide.notes}</p>
									</div>
								)}

								<div className="mt-auto text-sm opacity-50 flex justify-between">
									<span>Alecia Colab</span>
									<span>
										{currentSlideIndex + 1} / {slides.length}
									</span>
								</div>
							</div>
						</div>
					) : (
						<div className="text-muted-foreground">
							Sélectionnez une diapositive
						</div>
					)}
				</div>
			</div>

			{/* Print-only View (renders all slides) */}
			<div className="hidden print:block fixed inset-0 bg-white z-[9999]">
				{slides.map((slide, index) => (
					// biome-ignore lint/suspicious/noArrayIndexKey: Index is stable for print view
					<div
						key={`print-slide-${index}`}
						className="w-screen h-screen page-break-after-always"
					>
						<div
							className={cn(
								"w-full h-full p-12 flex flex-col",
								theme.background,
								theme.text,
							)}
						>
							<h1 className={cn("text-4xl font-bold mb-8", theme.accent)}>
								{slide.title}
							</h1>

							<div className="flex-1 space-y-6">
								{slide.content?.map((block, i) => (
									// biome-ignore lint/suspicious/noArrayIndexKey: No stable ID available for blocks
									<div key={i} className="text-xl">
										{block.type === "bullet" && (
											<div className="flex items-start gap-3">
												<span
													className={cn(
														"mt-2 h-2 w-2 rounded-full flex-shrink-0",
														theme.bgAccent,
													)}
												/>
												<p>{block.content}</p>
											</div>
										)}
									</div>
								))}
							</div>

							{slide.notes && (
								<div className="mt-8 p-4 border-t border-white/20 text-sm">
									<p className="font-bold mb-1">Notes:</p>
									<p>{slide.notes}</p>
								</div>
							)}

							<div className="mt-auto text-sm opacity-50 flex justify-between">
								<span>Alecia Colab</span>
								<span>
									{index + 1} / {slides.length}
								</span>
							</div>
						</div>
					</div>
				))}
			</div>
		</div>
	);
}
