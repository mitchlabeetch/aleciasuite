"use client";

/**
 * Keyboard Shortcuts Hook for Numbers Tools
 *
 * Provides common keyboard shortcuts for the Numbers suite:
 * - Cmd/Ctrl + S: Save
 * - Cmd/Ctrl + E: Export
 * - Cmd/Ctrl + N: New item
 * - Escape: Close dialogs
 */

import { useEffect, useCallback } from "react";

interface ShortcutConfig {
	key: string;
	ctrl?: boolean;
	meta?: boolean;
	shift?: boolean;
	alt?: boolean;
	action: () => void;
	description?: string;
}

interface UseKeyboardShortcutsOptions {
	shortcuts: ShortcutConfig[];
	enabled?: boolean;
}

export function useKeyboardShortcuts({
	shortcuts,
	enabled = true,
}: UseKeyboardShortcutsOptions) {
	const handleKeyDown = useCallback(
		(event: KeyboardEvent) => {
			if (!enabled) return;

			// Skip if user is typing in an input
			const target = event.target as HTMLElement;
			if (
				target.tagName === "INPUT" ||
				target.tagName === "TEXTAREA" ||
				target.isContentEditable
			) {
				// Only allow Escape to work in inputs
				if (event.key !== "Escape") {
					return;
				}
			}

			for (const shortcut of shortcuts) {
				const ctrlOrMeta = event.ctrlKey || event.metaKey;
				const matchesModifiers =
					(shortcut.ctrl || shortcut.meta ? ctrlOrMeta : !ctrlOrMeta) &&
					(shortcut.shift ? event.shiftKey : !event.shiftKey) &&
					(shortcut.alt ? event.altKey : !event.altKey);

				if (
					event.key.toLowerCase() === shortcut.key.toLowerCase() &&
					matchesModifiers
				) {
					event.preventDefault();
					shortcut.action();
					return;
				}
			}
		},
		[shortcuts, enabled]
	);

	useEffect(() => {
		window.addEventListener("keydown", handleKeyDown);
		return () => {
			window.removeEventListener("keydown", handleKeyDown);
		};
	}, [handleKeyDown]);
}

// Common shortcut presets
export const createNumbersShortcuts = ({
	onSave,
	onExport,
	onNew,
	onEscape,
}: {
	onSave?: () => void;
	onExport?: () => void;
	onNew?: () => void;
	onEscape?: () => void;
}): ShortcutConfig[] => {
	const shortcuts: ShortcutConfig[] = [];

	if (onSave) {
		shortcuts.push({
			key: "s",
			meta: true,
			action: onSave,
			description: "Sauvegarder",
		});
	}

	if (onExport) {
		shortcuts.push({
			key: "e",
			meta: true,
			action: onExport,
			description: "Exporter",
		});
	}

	if (onNew) {
		shortcuts.push({
			key: "n",
			meta: true,
			action: onNew,
			description: "Nouveau",
		});
	}

	if (onEscape) {
		shortcuts.push({
			key: "Escape",
			action: onEscape,
			description: "Fermer",
		});
	}

	return shortcuts;
};

// Shortcut display helper
export function formatShortcut(shortcut: ShortcutConfig): string {
	const parts: string[] = [];

	if (shortcut.meta || shortcut.ctrl) {
		// Use ⌘ for Mac, Ctrl for others
		parts.push(typeof navigator !== "undefined" && /Mac/.test(navigator.platform) ? "⌘" : "Ctrl");
	}
	if (shortcut.shift) parts.push("⇧");
	if (shortcut.alt) parts.push("⌥");
	parts.push(shortcut.key.toUpperCase());

	return parts.join("");
}
