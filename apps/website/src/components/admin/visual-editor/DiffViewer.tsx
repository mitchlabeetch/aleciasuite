"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Minus, Edit, Code, Eye, FileText } from "lucide-react";
import { Section } from "./SectionEditor";
import {
	generateVisualDiff,
	VisualDiffSection,
	calculateChangeStats,
	formatDiffForDisplay,
} from "@/lib/diff-utils";

interface DiffViewerProps {
	before: Section[];
	after: Section[];
	delta?: any;
}

const TYPE_COLORS = {
	added:
		"bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800",
	removed: "bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800",
	modified:
		"bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800",
	unchanged: "bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700",
};

const TYPE_BADGES = {
	added: { label: "Ajouté", color: "bg-green-500" },
	removed: { label: "Supprimé", color: "bg-red-500" },
	modified: { label: "Modifié", color: "bg-blue-500" },
	unchanged: { label: "Inchangé", color: "bg-gray-400" },
};

const SECTION_LABELS: Record<string, string> = {
	text: "Texte",
	image: "Image",
	hero: "En-tête",
	cards: "Cartes",
	testimonial: "Témoignage",
};

/**
 * DiffViewer - Visual and code diff comparison
 */
export function DiffViewer({ before, after, delta }: DiffViewerProps) {
	const visualDiff = generateVisualDiff(before, after);
	const stats = calculateChangeStats(visualDiff);

	return (
		<div className="space-y-4">
			{/* Stats Summary */}
			<Card>
				<CardHeader>
					<CardTitle className="text-lg">Résumé des Changements</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="flex items-center gap-4 flex-wrap">
						{stats.added > 0 && (
							<div className="flex items-center gap-2">
								<div className="w-3 h-3 rounded-full bg-green-500" />
								<span className="text-sm">
									<strong>{stats.added}</strong> ajouté
									{stats.added > 1 ? "s" : ""}
								</span>
							</div>
						)}
						{stats.removed > 0 && (
							<div className="flex items-center gap-2">
								<div className="w-3 h-3 rounded-full bg-red-500" />
								<span className="text-sm">
									<strong>{stats.removed}</strong> supprimé
									{stats.removed > 1 ? "s" : ""}
								</span>
							</div>
						)}
						{stats.modified > 0 && (
							<div className="flex items-center gap-2">
								<div className="w-3 h-3 rounded-full bg-blue-500" />
								<span className="text-sm">
									<strong>{stats.modified}</strong> modifié
									{stats.modified > 1 ? "s" : ""}
								</span>
							</div>
						)}
						{stats.unchanged > 0 && (
							<div className="flex items-center gap-2">
								<div className="w-3 h-3 rounded-full bg-gray-400" />
								<span className="text-sm">
									<strong>{stats.unchanged}</strong> inchangé
									{stats.unchanged > 1 ? "s" : ""}
								</span>
							</div>
						)}
					</div>
				</CardContent>
			</Card>

			{/* Diff Tabs */}
			<Tabs defaultValue="visual" className="space-y-4">
				<TabsList>
					<TabsTrigger value="visual" className="flex items-center gap-2">
						<Eye className="w-4 h-4" />
						Diff Visuel
					</TabsTrigger>
					<TabsTrigger value="sidebyside" className="flex items-center gap-2">
						<FileText className="w-4 h-4" />
						Côte à Côte
					</TabsTrigger>
					<TabsTrigger value="code" className="flex items-center gap-2">
						<Code className="w-4 h-4" />
						Code JSON
					</TabsTrigger>
				</TabsList>

				{/* Visual Diff Tab */}
				<TabsContent value="visual" className="space-y-3">
					{visualDiff
						.filter((item) => item.type !== "unchanged")
						.map((item, index) => (
							<DiffSectionCard
								key={`diff-section-${item.section.id}-${index}`}
								item={item}
							/>
						))}
					{visualDiff.every((item) => item.type === "unchanged") && (
						<Card>
							<CardContent className="py-12 text-center text-gray-500">
								Aucun changement détecté
							</CardContent>
						</Card>
					)}
				</TabsContent>

				{/* Side by Side Tab */}
				<TabsContent value="sidebyside">
					<div className="grid grid-cols-2 gap-4">
						<div>
							<h3 className="text-sm font-semibold mb-3 text-red-600 dark:text-red-400">
								Avant
							</h3>
							<div className="space-y-2">
								{before.map((section, index) => (
									<SectionPreview
										key={`before-section-${section.id}-${index}`}
										section={section}
									/>
								))}
							</div>
						</div>
						<div>
							<h3 className="text-sm font-semibold mb-3 text-green-600 dark:text-green-400">
								Après
							</h3>
							<div className="space-y-2">
								{after.map((section, index) => (
									<SectionPreview
										key={`after-section-${section.id}-${index}`}
										section={section}
									/>
								))}
							</div>
						</div>
					</div>
				</TabsContent>

				{/* Code Diff Tab */}
				<TabsContent value="code">
					<Card>
						<CardHeader>
							<CardTitle className="text-base">
								Diff JSON (jsondiffpatch)
							</CardTitle>
						</CardHeader>
						<CardContent>
							<pre className="text-xs bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
								{formatDiffForDisplay(delta)}
							</pre>
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>
		</div>
	);
}

/**
 * Individual diff section card
 */
function DiffSectionCard({ item }: { item: VisualDiffSection }) {
	const badgeInfo = TYPE_BADGES[item.type];
	const Icon =
		item.type === "added" ? Plus : item.type === "removed" ? Minus : Edit;

	return (
		<Card className={TYPE_COLORS[item.type]}>
			<CardContent className="p-4">
				<div className="flex items-start justify-between mb-2">
					<div className="flex items-center gap-2">
						<Icon className="w-4 h-4" />
						<span className="font-medium">
							{SECTION_LABELS[item.section.type]}
						</span>
						{!item.section.visible && (
							<span className="text-xs text-gray-500">(Masqué)</span>
						)}
					</div>
					<Badge
						variant="secondary"
						className={`${badgeInfo.color} text-white`}
					>
						{badgeInfo.label}
					</Badge>
				</div>

				{/* Section Content Preview */}
				<div className="text-sm text-gray-700 dark:text-gray-300 mt-2">
					{renderSectionPreview(item.section)}
				</div>

				{/* Field Changes */}
				{item.changes && item.changes.length > 0 && (
					<div className="mt-3 space-y-2 border-t pt-3">
						<p className="text-xs font-semibold text-gray-600 dark:text-gray-400">
							Champs modifiés:
						</p>
						{item.changes.map((change, idx) => (
							<div
								key={`change-${change.field}-${idx}`}
								className="text-xs bg-white dark:bg-gray-900 p-2 rounded"
							>
								<div className="font-medium mb-1">{change.field}</div>
								<div className="flex items-start gap-2">
									<div className="flex-1">
										<div className="text-red-600 dark:text-red-400">
											- {JSON.stringify(change.before)}
										</div>
										<div className="text-green-600 dark:text-green-400">
											+ {JSON.stringify(change.after)}
										</div>
									</div>
								</div>
							</div>
						))}
					</div>
				)}
			</CardContent>
		</Card>
	);
}

/**
 * Section preview component
 */
function SectionPreview({ section }: { section: Section }) {
	return (
		<div className="border rounded p-3 bg-white dark:bg-gray-900 text-sm">
			<div className="font-medium mb-1">
				{SECTION_LABELS[section.type]}
				{!section.visible && (
					<span className="text-xs ml-2 text-gray-500">(Masqué)</span>
				)}
			</div>
			<div className="text-xs text-gray-600 dark:text-gray-400">
				{renderSectionPreview(section)}
			</div>
		</div>
	);
}

/**
 * Render section content preview
 */
function renderSectionPreview(section: Section): string {
	const content = section.content as Record<string, unknown>;

	switch (section.type) {
		case "text":
			return `${content.title || "(Sans titre)"} - ${((content.text as string) || "").substring(0, 50)}...`;
		case "image":
			return `Image: ${content.url || "(Non définie)"}`;
		case "hero":
			return `${content.heading || "(Sans titre)"} - ${content.subheading || ""}`;
		case "cards":
			return `${content.sectionTitle || "(Sans titre)"} - ${(content.cards as unknown[])?.length || 0} carte(s)`;
		case "testimonial":
			return `${content.author || "(Anonyme)"} - "${((content.quote as string) || "").substring(0, 50)}..."`;
		case "video":
			return `Vidéo: ${content.title || content.url || "(Non définie)"}`;
		case "faq":
			return `FAQ: ${content.sectionTitle || "(Sans titre)"} - ${(content.items as unknown[])?.length || 0} question(s)`;
		case "cta":
			return `CTA: ${content.heading || "(Sans titre)"}`;
		case "gallery":
			return `Galerie: ${content.sectionTitle || "(Sans titre)"} - ${(content.items as unknown[])?.length || 0} image(s)`;
		case "team":
			return `Équipe: ${content.sectionTitle || "(Sans titre)"} - ${(content.members as unknown[])?.length || 0} membre(s)`;
		default:
			return "Contenu non disponible";
	}
}
