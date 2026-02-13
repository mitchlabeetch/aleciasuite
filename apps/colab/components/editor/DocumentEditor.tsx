"use client";

import { AISelector } from "@/components/tailwind/generative/ai-selector";
import { mentionCommand } from "@/components/tailwind/mention-command";
import { slashCommand } from "@/components/tailwind/slash-command";
import type { AnyExtension } from "@tiptap/core";
import { EditorContent, useEditor } from "@tiptap/react";
import { useEffect, useMemo, useState } from "react";
import { useDebounce } from "use-debounce";
import { validationExtensions } from "./extensions/validation";
import { getDocument, updateDocument } from "@/actions/colab/documents";

interface DocumentEditorProps {
	documentId: string;
}

export const DocumentEditor = ({ documentId }: DocumentEditorProps) => {
	const [document, setDocument] = useState<{ id: string; content: unknown } | null>(null);
	const [content, setContent] = useState<string | undefined>(undefined);
	const [debouncedContent] = useDebounce(content, 1000);

	useEffect(() => {
		async function loadDocument() {
			const doc = await getDocument(documentId);
			setDocument(doc);
		}
		loadDocument();
	}, [documentId]);

	useEffect(() => {
		if (document && content === undefined) {
			// Convert unknown to string safely
			const docContent = typeof document.content === 'string'
				? document.content
				: JSON.stringify(document.content || '');
			setContent(docContent);
		}
	}, [document, content]);

	useEffect(() => {
		async function saveDocument() {
			if (debouncedContent !== undefined && document) {
				await updateDocument({
					id: documentId,
					content: debouncedContent,
				});
			}
		}
		saveDocument();
	}, [debouncedContent, documentId, document]);

	// Build extensions with type casting for TipTap v2/v3 compatibility
	const extensions = useMemo(() => {
		return [
			...(validationExtensions as unknown as AnyExtension[]),
			slashCommand as unknown as AnyExtension,
			mentionCommand as unknown as AnyExtension,
		];
	}, []);

	const editor = useEditor({
		extensions,
		content: content,
		onUpdate: ({ editor }) => {
			setContent(editor.getHTML());
		},
		editorProps: {
			attributes: {
				class:
					"prose dark:prose-invert focus:outline-none max-w-full min-h-[500px] p-4",
			},
		},
	});

	if (!editor || !document) return <div>Chargement...</div>;

	return (
		<div className="relative w-full max-w-4xl mx-auto border rounded-lg shadow-sm bg-background mt-8">
			<div className="absolute right-4 top-4 z-10">
				<AISelector editor={editor} open={false} onOpenChange={() => {}} />
			</div>
			<EditorContent editor={editor} />
		</div>
	);
};
