"use client";

/**
 * Keyboard Shortcuts Help Dialog
 *
 * Shows available keyboard shortcuts for the current tool.
 * Can be triggered with Cmd/Ctrl + /
 */

import { useState, useEffect } from "react";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Keyboard } from "lucide-react";

interface ShortcutInfo {
	keys: string;
	description: string;
	category?: string;
}

const defaultShortcuts: ShortcutInfo[] = [
	{ keys: "⌘ S", description: "Sauvegarder le document", category: "General" },
	{ keys: "⌘ E", description: "Exporter (Excel/PDF)", category: "General" },
	{ keys: "⌘ N", description: "Nouveau element", category: "General" },
	{ keys: "Esc", description: "Fermer le dialogue", category: "General" },
	{ keys: "⌘ /", description: "Afficher les raccourcis", category: "Aide" },
];

interface KeyboardShortcutsHelpProps {
	additionalShortcuts?: ShortcutInfo[];
	toolName?: string;
}

export function KeyboardShortcutsHelp({
	additionalShortcuts = [],
	toolName = "Numbers",
}: KeyboardShortcutsHelpProps) {
	const [isOpen, setIsOpen] = useState(false);

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if ((e.metaKey || e.ctrlKey) && e.key === "/") {
				e.preventDefault();
				setIsOpen((prev) => !prev);
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, []);

	const allShortcuts = [...defaultShortcuts, ...additionalShortcuts];
	const categories = Array.from(new Set(allShortcuts.map((s) => s.category || "General")));

	return (
		<Dialog open={isOpen} onOpenChange={setIsOpen}>
			<DialogContent className="max-w-md">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<Keyboard className="h-5 w-5" />
						Raccourcis clavier - {toolName}
					</DialogTitle>
					<DialogDescription>
						Utilisez ces raccourcis pour naviguer plus rapidement
					</DialogDescription>
				</DialogHeader>
				<div className="space-y-4">
					{categories.map((category) => (
						<div key={category} className="space-y-2">
							<h4 className="text-sm font-medium text-muted-foreground">
								{category}
							</h4>
							<div className="space-y-1">
								{allShortcuts
									.filter((s) => (s.category || "General") === category)
									.map((shortcut, index) => (
										<div
											key={index}
											className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-muted/50"
										>
											<span className="text-sm">{shortcut.description}</span>
											<Badge variant="outline" className="font-mono text-xs">
												{shortcut.keys}
											</Badge>
										</div>
									))}
							</div>
						</div>
					))}
				</div>
				<div className="pt-2 border-t">
					<p className="text-xs text-muted-foreground text-center">
						Appuyez sur <Badge variant="outline" className="font-mono text-xs mx-1">⌘ /</Badge> pour afficher/masquer
					</p>
				</div>
			</DialogContent>
		</Dialog>
	);
}
