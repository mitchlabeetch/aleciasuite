"use client";

import { AISelector } from "@/components/tailwind/generative/ai-selector";
import { mentionCommand } from "@/components/tailwind/mention-command";
import { slashCommand } from "@/components/tailwind/slash-command";
import {
	getUserColor,
	useYjsSync,
	type AwarenessState,
} from "@/hooks/use-yjs-sync";
import { useSession } from "@alepanel/auth/client";
import type { AnyExtension } from "@tiptap/core";
import Collaboration from "@tiptap/extension-collaboration";
import CollaborationCursor from "@tiptap/extension-collaboration-cursor";
import { EditorContent, useEditor } from "@tiptap/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { validationExtensions } from "./extensions/validation";
import { getDocument } from "@/actions/colab/documents";

interface CollaborativeEditorProps {
	documentId: string;
}

/**
 * Custom Convex-backed awareness provider for TipTap CollaborationCursor.
 * This bridges the gap between TipTap's expected awareness interface
 * and our Convex-based real-time sync.
 */
class ConvexAwarenessProvider {
	private listeners: Map<string, Set<(...args: unknown[]) => void>> = new Map();
	private localState: Record<string, unknown> = {};
	private states: Map<number, Record<string, unknown>> = new Map();
	private clientId: number;

	constructor(clientId: string) {
		// Convert string client ID to numeric for y-protocols compatibility
		this.clientId = this.hashStringToNumber(clientId);
	}

	private hashStringToNumber(str: string): number {
		let hash = 0;
		for (let i = 0; i < str.length; i++) {
			hash = (hash << 5) - hash + str.charCodeAt(i);
			hash |= 0;
		}
		return Math.abs(hash);
	}

	getLocalState(): Record<string, unknown> | null {
		return this.localState;
	}

	setLocalState(state: Record<string, unknown> | null): void {
		this.localState = state ?? {};
		this.states.set(this.clientId, this.localState);
		this.emit("change", [{ added: [], updated: [this.clientId], removed: [] }]);
	}

	setLocalStateField(field: string, value: unknown): void {
		this.localState[field] = value;
		this.states.set(this.clientId, this.localState);
		this.emit("change", [{ added: [], updated: [this.clientId], removed: [] }]);
	}

	getStates(): Map<number, Record<string, unknown>> {
		return this.states;
	}

	// Update from remote awareness data (called from useYjsSync)
	updateRemoteStates(
		remoteAwareness: Array<{
			clientId: string;
			userId?: string;
			userName?: string;
			userColor?: string;
			cursor?: { anchor: number; head: number };
		}>,
	): void {
		const added: number[] = [];
		const updated: number[] = [];
		const currentIds = new Set(this.states.keys());

		for (const remote of remoteAwareness) {
			const numericId = this.hashStringToNumber(remote.clientId);
			if (numericId === this.clientId) continue; // Skip self

			const state = {
				user: {
					name: remote.userName ?? "Anonymous",
					color: remote.userColor ?? "#888",
				},
				cursor: remote.cursor,
			};

			if (this.states.has(numericId)) {
				updated.push(numericId);
			} else {
				added.push(numericId);
			}
			this.states.set(numericId, state);
			currentIds.delete(numericId);
		}

		// Remove stale states
		const removed: number[] = [];
		for (const staleId of currentIds) {
			if (staleId !== this.clientId) {
				this.states.delete(staleId);
				removed.push(staleId);
			}
		}

		if (added.length > 0 || updated.length > 0 || removed.length > 0) {
			this.emit("change", [{ added, updated, removed }]);
		}
	}

	on(event: string, callback: (...args: unknown[]) => void): void {
		if (!this.listeners.has(event)) {
			this.listeners.set(event, new Set());
		}
		this.listeners.get(event)!.add(callback);
	}

	off(event: string, callback: (...args: unknown[]) => void): void {
		this.listeners.get(event)?.delete(callback);
	}

	private emit(event: string, args: unknown[]): void {
		this.listeners.get(event)?.forEach((cb) => {
			cb(...args);
		});
	}

	destroy(): void {
		this.listeners.clear();
		this.states.clear();
	}
}

export const CollaborativeEditor = ({
	documentId,
}: CollaborativeEditorProps) => {
	const { data: session, isPending } = useSession();
	const [colabDocument, setColabDocument] = useState<any>(null);
	const [isLoadingDoc, setIsLoadingDoc] = useState(true);
	const cursorUpdateRef = useRef<NodeJS.Timeout | null>(null);

	// Fetch document from server action
	useEffect(() => {
		getDocument(documentId)
			.then(setColabDocument)
			.finally(() => setIsLoadingDoc(false));
	}, [documentId]);

	// User info for collaboration
	const user = session?.user;
	const userId = user?.id ?? "anonymous";
	const userName = user?.name ?? "Anonymous";
	const userColor = useMemo(() => getUserColor(userId), [userId]);

	// Initialize Yjs sync
	const { ydoc, isConnected, isSyncing, awareness, updateCursor, clientId } =
		useYjsSync({
			documentId,
			enabled: !!colabDocument,
			userId,
			userName,
			userColor,
		});

	// Get the Yjs fragment for TipTap
	const fragment = useMemo(() => ydoc.getXmlFragment("prosemirror"), [ydoc]);

	// Create awareness provider that bridges TipTap and Convex
	const [awarenessProvider] = useState(
		() => new ConvexAwarenessProvider(clientId),
	);

	// Sync remote awareness states from Convex to the provider
	useEffect(() => {
		awarenessProvider.updateRemoteStates(awareness);
	}, [awareness, awarenessProvider]);

	// Set initial local state
	useEffect(() => {
		awarenessProvider.setLocalState({
			user: { name: userName, color: userColor },
		});
	}, [userName, userColor, awarenessProvider]);

	// Cleanup awareness provider on unmount
	useEffect(() => {
		return () => {
			awarenessProvider.destroy();
		};
	}, [awarenessProvider]);

	// Build extensions with collaboration
	const extensions = useMemo(() => {
		const collabExtensions: AnyExtension[] = [
			// Cast to any to avoid version mismatch issues between TipTap v2/v3
			...(validationExtensions as unknown as AnyExtension[]),
			slashCommand as unknown as AnyExtension,
			mentionCommand as unknown as AnyExtension,
			Collaboration.configure({
				fragment,
			}),
			CollaborationCursor.configure({
				provider: {
					awareness: awarenessProvider,
				},
				user: {
					name: userName,
					color: userColor,
				},
				render: (user: { name: string; color: string }) => {
					const cursor = document.createElement("span");
					cursor.classList.add("collaboration-cursor");
					cursor.style.borderLeft = `2px solid ${user.color}`;
					cursor.style.marginLeft = "-1px";
					cursor.style.marginRight = "-1px";
					cursor.style.pointerEvents = "none";
					cursor.style.position = "relative";

					const label = document.createElement("span");
					label.classList.add("collaboration-cursor-label");
					label.style.position = "absolute";
					label.style.top = "-1.4em";
					label.style.left = "-1px";
					label.style.fontSize = "12px";
					label.style.fontWeight = "600";
					label.style.lineHeight = "normal";
					label.style.whiteSpace = "nowrap";
					label.style.color = "#fff";
					label.style.padding = "0.1rem 0.3rem";
					label.style.borderRadius = "3px";
					label.style.backgroundColor = user.color;
					label.textContent = user.name;

					cursor.appendChild(label);
					return cursor;
				},
			}),
		];
		return collabExtensions;
	}, [fragment, userName, userColor, awarenessProvider]);

	// TipTap editor with collaboration extensions
	const editor = useEditor(
		{
			extensions,
			content: "",
			editorProps: {
				attributes: {
					class:
						"prose dark:prose-invert focus:outline-none max-w-full min-h-[500px] p-4",
				},
			},
			onSelectionUpdate: ({ editor }) => {
				// Debounce cursor updates
				if (cursorUpdateRef.current) {
					clearTimeout(cursorUpdateRef.current);
				}
				cursorUpdateRef.current = setTimeout(() => {
					const { from, to } = editor.state.selection;
					updateCursor({ anchor: from, head: to });
				}, 100);
			},
		},
		[fragment, userName, userColor],
	);

	// Initialize content from document if Yjs is empty
	useEffect(() => {
		if (!editor || !colabDocument || !isConnected) return;

		// Check if Yjs doc is empty
		const yContent = fragment.toString();
		if (!yContent || yContent === "<undefined></undefined>") {
			// Initialize with existing document content
			if (colabDocument.content) {
				editor.commands.setContent(colabDocument.content);
			}
		}
	}, [editor, colabDocument, isConnected, fragment]);

	// Cleanup cursor update timeout
	useEffect(() => {
		return () => {
			if (cursorUpdateRef.current) {
				clearTimeout(cursorUpdateRef.current);
			}
		};
	}, []);

	if (!editor || !colabDocument) {
		return (
			<div className="flex items-center justify-center h-64">
				<div className="animate-pulse text-muted-foreground">Chargement...</div>
			</div>
		);
	}

	return (
		<div className="relative w-full max-w-4xl mx-auto border rounded-lg shadow-sm bg-background mt-8">
			{/* Connection status */}
			<div className="absolute left-4 top-4 z-10 flex items-center gap-2">
				<div
					className={`w-2 h-2 rounded-full ${
						isConnected ? "bg-green-500" : "bg-yellow-500 animate-pulse"
					}`}
				/>
				<span className="text-xs text-muted-foreground">
					{isConnected
						? isSyncing
							? "Syncing..."
							: "Connected"
						: "Connecting..."}
				</span>
			</div>

			{/* Active collaborators */}
			{awareness.length > 0 && (
				<div className="absolute left-20 top-3 z-10 flex items-center -space-x-2">
					{awareness.slice(0, 5).map((a: AwarenessState) => (
						<div
							key={a.clientId}
							className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-medium text-white border-2 border-background"
							style={{ backgroundColor: a.userColor || "#888" }}
							title={a.userName || "Anonymous"}
						>
							{(a.userName || "A").charAt(0).toUpperCase()}
						</div>
					))}
					{awareness.length > 5 && (
						<div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-medium bg-muted text-muted-foreground border-2 border-background">
							+{awareness.length - 5}
						</div>
					)}
				</div>
			)}

			{/* AI Selector */}
			<div className="absolute right-4 top-4 z-10">
				<AISelector editor={editor} open={false} onOpenChange={() => {}} />
			</div>

			{/* Editor */}
			<EditorContent editor={editor} className="pt-12" />
		</div>
	);
};
