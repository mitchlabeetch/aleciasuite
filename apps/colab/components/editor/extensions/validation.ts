// Placeholder for missing DOM environment stuff if needed
import { Table } from "@tiptap/extension-table";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import { TableRow } from "@tiptap/extension-table-row";
import TaskItem from "@tiptap/extension-task-item";
import TaskList from "@tiptap/extension-task-list";
import StarterKit from "@tiptap/starter-kit";
import { Markdown } from "tiptap-markdown";
import TiptapImage from "@tiptap/extension-image";
// Import TiptapLink from novel to avoid duplicate extension with different versions
// (novel uses @tiptap/extension-link@2.x, while colab has @3.x directly)
import { TiptapLink } from "novel";
import { CalloutExtension } from "./callout-extension";
import { KanbanExtension } from "./kanban-extension";

// Validation-only extensions list that mirrors the main app BUT excludes UI-heavy extensions
// that fail in Node.js (like slashCommand/mentionCommand which import 'novel' which has issues with TiptapImage).
// We only need the SCHEMA related extensions (nodes/marks).
// slashCommand and mentionCommand generally do NOT add new nodes to the schema, they use existing ones.
// (slashCommand might use custom nodes if configured, but looking at slash-command.tsx, it uses standard nodes + Callout + Kanban).

export const validationExtensions = [
	StarterKit.configure({
		bulletList: {
			keepMarks: true,
			keepAttributes: false,
		},
		orderedList: {
			keepMarks: true,
			keepAttributes: false,
		},
	}),
	Markdown,
	// slashCommand, // Excluded for validation to avoid runtime errors
	// mentionCommand, // Excluded for validation to avoid runtime errors
	Table.configure({
		resizable: true,
	}),
	TableRow,
	TableHeader,
	TableCell,
	TaskList,
	TaskItem.configure({
		nested: true,
	}),
	TiptapImage.configure({
		allowBase64: true,
	}),
	TiptapLink.configure({
		openOnClick: false,
	}),
	CalloutExtension,
	KanbanExtension,
];
