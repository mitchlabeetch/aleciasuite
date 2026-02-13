import { create, DiffPatcher, Delta } from "jsondiffpatch";
import { Section } from "@/components/admin/visual-editor/SectionEditor";

/**
 * Diff Generation Utilities
 *
 * Uses jsondiffpatch to generate visual and code diffs for approval workflow
 */

/** Object with optional id for jsondiffpatch objectHash */
interface HashableObject {
	id?: string;
	_id?: string;
}

// Configure jsondiffpatch
const diffPatcher: DiffPatcher = create({
	objectHash: (obj: HashableObject) => obj.id || obj._id || JSON.stringify(obj),
	arrays: {
		detectMove: true,
		includeValueOnMove: false,
	},
});

/**
 * Generate diff delta between two section arrays
 */
export function generateDiff(before: Section[], after: Section[]): Delta | undefined {
	return diffPatcher.diff(before, after);
}

/**
 * Apply diff delta to sections
 */
export function applyDiff(sections: Section[], delta: Delta): Section[] {
	return diffPatcher.patch(sections, delta) as Section[];
}

/**
 * Generate human-readable change summary
 */
export function generateChangeSummary(
	before: Section[],
	after: Section[],
): string[] {
	const changes: string[] = [];

	// Check for added sections
	const beforeIds = new Set(before.map((s) => s.id));
	const afterIds = new Set(after.map((s) => s.id));

	const added = after.filter((s) => !beforeIds.has(s.id));
	const removed = before.filter((s) => !afterIds.has(s.id));

	if (added.length > 0) {
		changes.push(
			`Ajout de ${added.length} section(s): ${added.map((s) => s.type).join(", ")}`,
		);
	}

	if (removed.length > 0) {
		changes.push(
			`Suppression de ${removed.length} section(s): ${removed.map((s) => s.type).join(", ")}`,
		);
	}

	// Check for modifications
	const modified = after.filter((afterSection) => {
		const beforeSection = before.find((b) => b.id === afterSection.id);
		if (!beforeSection) return false;

		return (
			JSON.stringify(beforeSection.content) !==
				JSON.stringify(afterSection.content) ||
			beforeSection.visible !== afterSection.visible ||
			beforeSection.order !== afterSection.order
		);
	});

	if (modified.length > 0) {
		changes.push(`Modification de ${modified.length} section(s)`);
	}

	// Check for reordering
	const orderChanged = after.some((s, idx) => {
		const beforeIdx = before.findIndex((b) => b.id === s.id);
		return beforeIdx !== -1 && beforeIdx !== idx;
	});

	if (orderChanged) {
		changes.push("Réorganisation des sections");
	}

	if (changes.length === 0) {
		changes.push("Aucun changement détecté");
	}

	return changes;
}

/**
 * Generate visual diff representation
 */
export interface FieldChange {
	field: string;
	before: unknown;
	after: unknown;
}

export interface VisualDiffSection {
	type: "added" | "removed" | "modified" | "unchanged";
	section: Section;
	changes?: FieldChange[];
}

export function generateVisualDiff(
	before: Section[],
	after: Section[],
): VisualDiffSection[] {
	const result: VisualDiffSection[] = [];
	const beforeMap = new Map(before.map((s) => [s.id, s]));
	const afterMap = new Map(after.map((s) => [s.id, s]));

	// Process all sections from after (including added)
	after.forEach((afterSection) => {
		const beforeSection = beforeMap.get(afterSection.id);

		if (!beforeSection) {
			// Added section
			result.push({
				type: "added",
				section: afterSection,
			});
		} else {
			// Check if modified
			const changes: FieldChange[] = [];

			// Compare content
			if (
				JSON.stringify(beforeSection.content) !==
				JSON.stringify(afterSection.content)
			) {
				Object.keys(afterSection.content).forEach((key) => {
					if (beforeSection.content[key] !== afterSection.content[key]) {
						changes.push({
							field: key,
							before: beforeSection.content[key],
							after: afterSection.content[key],
						});
					}
				});
			}

			// Compare visibility
			if (beforeSection.visible !== afterSection.visible) {
				changes.push({
					field: "visible",
					before: beforeSection.visible,
					after: afterSection.visible,
				});
			}

			// Compare order
			if (beforeSection.order !== afterSection.order) {
				changes.push({
					field: "order",
					before: beforeSection.order,
					after: afterSection.order,
				});
			}

			result.push({
				type: changes.length > 0 ? "modified" : "unchanged",
				section: afterSection,
				changes: changes.length > 0 ? changes : undefined,
			});
		}
	});

	// Process removed sections
	before.forEach((beforeSection) => {
		if (!afterMap.has(beforeSection.id)) {
			result.push({
				type: "removed",
				section: beforeSection,
			});
		}
	});

	return result;
}

/**
 * Format diff for display
 */
export function formatDiffForDisplay(delta: Delta | undefined): string {
	if (!delta) return "Aucun changement";

	try {
		return JSON.stringify(delta, null, 2);
	} catch (_error) {
		return "Erreur lors du formatage du diff";
	}
}

/**
 * Calculate change statistics
 */
export interface ChangeStats {
	added: number;
	removed: number;
	modified: number;
	unchanged: number;
	total: number;
}

export function calculateChangeStats(
	visualDiff: VisualDiffSection[],
): ChangeStats {
	const stats: ChangeStats = {
		added: 0,
		removed: 0,
		modified: 0,
		unchanged: 0,
		total: visualDiff.length,
	};

	visualDiff.forEach((item) => {
		stats[item.type]++;
	});

	return stats;
}

/**
 * Generate visual HTML representation for email/notifications
 */
export function generateVisualHTML(
	before: Section[],
	after: Section[],
): { before: string; after: string } {
	const renderSection = (section: Section): string => {
		const typeLabels: Record<string, string> = {
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
		const typeLabel = typeLabels[section.type] || section.type;
		const content_data = section.content as Record<string, unknown>;

		let content = `<div style="border: 1px solid #ddd; padding: 12px; margin: 8px 0; border-radius: 4px;">
      <strong>${typeLabel}</strong> ${section.visible ? "" : "(Masqué)"}<br/>`;

		// Add content preview based on type
		if (section.type === "text") {
			content += `<div style="margin-top: 8px;">
        <div style="font-weight: 600;">${content_data.title || "(Sans titre)"}</div>
        <div style="color: #666;">${((content_data.text as string) || "").substring(0, 100)}...</div>
      </div>`;
		} else if (section.type === "image") {
			content += `<div style="margin-top: 8px;">
        <div>Image: ${content_data.url || "(Non définie)"}</div>
        <div style="color: #666;">${content_data.alt || ""}</div>
      </div>`;
		} else if (section.type === "hero") {
			content += `<div style="margin-top: 8px;">
        <div style="font-weight: 600;">${content_data.heading || "(Sans titre)"}</div>
        <div style="color: #666;">${content_data.subheading || ""}</div>
      </div>`;
		} else if (section.type === "video") {
			content += `<div style="margin-top: 8px;">
        <div>Vidéo: ${content_data.title || content_data.url || "(Non définie)"}</div>
      </div>`;
		} else if (section.type === "faq") {
			content += `<div style="margin-top: 8px;">
        <div style="font-weight: 600;">${content_data.sectionTitle || "(Sans titre)"}</div>
        <div style="color: #666;">${(content_data.items as unknown[])?.length || 0} question(s)</div>
      </div>`;
		} else if (section.type === "cta") {
			content += `<div style="margin-top: 8px;">
        <div style="font-weight: 600;">${content_data.heading || "(Sans titre)"}</div>
      </div>`;
		} else if (section.type === "gallery") {
			content += `<div style="margin-top: 8px;">
        <div style="font-weight: 600;">${content_data.sectionTitle || "(Sans titre)"}</div>
        <div style="color: #666;">${(content_data.items as unknown[])?.length || 0} image(s)</div>
      </div>`;
		} else if (section.type === "team") {
			content += `<div style="margin-top: 8px;">
        <div style="font-weight: 600;">${content_data.sectionTitle || "(Sans titre)"}</div>
        <div style="color: #666;">${(content_data.members as unknown[])?.length || 0} membre(s)</div>
      </div>`;
		}

		content += `</div>`;
		return content;
	};

	return {
		before: `<div>${before.map(renderSection).join("")}</div>`,
		after: `<div>${after.map(renderSection).join("")}</div>`,
	};
}
