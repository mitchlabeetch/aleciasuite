"use client";

import { generateOutlineAction } from "@/app/actions/presentation/generate";
import { Button } from "@/components/tailwind/ui/button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@/components/tailwind/ui/card";
import { Textarea } from "@/components/tailwind/ui/textarea";
import { parsePresentationStream } from "@/lib/presentation-parser";
import type { Slide } from "@/lib/presentation-parser";
import { useSession } from "@alepanel/auth/client";
import { readStreamableValue } from "ai/rsc";
import { ChevronLeft, Loader2, Wand2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createPresentation, updatePresentation } from "@/actions/colab/presentations";

export function PresentationGenerator() {
	const router = useRouter();

	const { data: session } = useSession();
	const user = session?.user;

	const [prompt, setPrompt] = useState("");
	const [isGenerating, setIsGenerating] = useState(false);
	const [previewSlides, setPreviewSlides] = useState<Slide[]>([]);

	const handleGenerate = async () => {
		if (!prompt.trim() || !user) return;

		setIsGenerating(true);
		setPreviewSlides([]);

		try {
			// 1. Create draft presentation
			const presentationId = await createPresentation({
				title: prompt.slice(0, 50) + (prompt.length > 50 ? "..." : ""),
			});

			// 2. Start generation
			const { stream } = await generateOutlineAction(prompt);

			let fullText = "";
			for await (const delta of readStreamableValue(stream)) {
				fullText += delta;

				// Progressive parsing for preview
				const currentSlides = parsePresentationStream(fullText);
				setPreviewSlides(currentSlides);
			}

			// 3. Save final slides
			const slides = parsePresentationStream(fullText);
			await updatePresentation({
				id: presentationId,
				slides,
			});

			router.push(`/presentations/${presentationId}`);
		} catch (error) {
			console.error("Generation failed:", error);
		} finally {
			setIsGenerating(false);
		}
	};

	return (
		<div className="container max-w-3xl mx-auto p-6 space-y-8">
			<div className="flex items-center gap-4">
				<Button variant="ghost" size="icon" onClick={() => router.back()}>
					<ChevronLeft className="h-5 w-5" />
				</Button>
				<h1 className="text-2xl font-bold">Nouvelle Présentation IA</h1>
			</div>

			<Card className="border-2 border-primary/10 shadow-lg">
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Wand2 className="h-5 w-5 text-primary" />
						Décrivez votre présentation
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-6">
					<div className="space-y-2">
						<Textarea
							placeholder="Ex: Stratégie de croissance pour une startup SaaS B2B, avec focus sur l'expansion internationale et l'acquisition client..."
							value={prompt}
							onChange={(e) => setPrompt(e.target.value)}
							className="min-h-[200px] text-lg p-4 resize-none"
							disabled={isGenerating}
						/>
						<p className="text-sm text-muted-foreground text-right">
							Soyez précis pour de meilleurs résultats.
						</p>
					</div>

					<Button
						onClick={handleGenerate}
						disabled={isGenerating || !prompt.trim() || !user}
						className="w-full h-12 text-lg"
					>
						{isGenerating ? (
							<>
								<Loader2 className="mr-2 h-5 w-5 animate-spin" />
								Génération en cours ({previewSlides.length} slides)...
							</>
						) : (
							"Générer la présentation"
						)}
					</Button>

					{/* Live Preview during generation */}
					{isGenerating && previewSlides.length > 0 && (
						<div className="mt-8 border rounded-xl overflow-hidden bg-muted/30">
							<div className="bg-muted p-3 border-b text-sm font-medium flex justify-between items-center">
								<span>Aperçu en temps réel</span>
								<span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full animate-pulse">
									Génération...
								</span>
							</div>
							<div className="p-4 max-h-[300px] overflow-y-auto space-y-3">
								{previewSlides.map((slide, i) => (
									// biome-ignore lint/suspicious/noArrayIndexKey: Index stable for preview
									<div
										key={i}
										className="flex items-start gap-3 p-3 bg-card rounded-lg border shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-500"
									>
										<span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
											{i + 1}
										</span>
										<div>
											<h4 className="font-semibold text-sm">
												{slide.title || "Titre en cours..."}
											</h4>
											<p className="text-xs text-muted-foreground mt-1">
												{slide.content.length} éléments
											</p>
										</div>
									</div>
								))}
							</div>
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
