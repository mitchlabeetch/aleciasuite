import { Node } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { KanbanComponent } from "./KanbanComponent";

export interface KanbanOptions {
	HTMLAttributes: Record<string, any>;
}

declare module "@tiptap/core" {
	interface Commands<ReturnType> {
		kanban: {
			/**
			 * Insert a kanban board
			 */
			setKanban: (attributes?: { boardId?: string }) => ReturnType;
		};
	}
}

export const KanbanExtension = Node.create<KanbanOptions>({
	name: "kanban",

	group: "block",

	atom: true,

	addAttributes() {
		return {
			boardId: {
				default: null,
			},
		};
	},

	parseHTML() {
		return [
			{
				tag: 'div[data-type="kanban"]',
			},
		];
	},

	renderHTML({ HTMLAttributes }) {
		return ["div", { "data-type": "kanban", ...HTMLAttributes }];
	},

	addNodeView() {
		return ReactNodeViewRenderer(KanbanComponent);
	},

	addCommands() {
		return {
			setKanban:
				(attributes) =>
				({ commands }) => {
					return commands.insertContent({
						type: this.name,
						attrs: attributes,
					});
				},
		};
	},
});
