import { Node } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { CalloutComponent } from "./CalloutComponent";

export interface CalloutOptions {
	HTMLAttributes: Record<string, any>;
}

declare module "@tiptap/core" {
	interface Commands<ReturnType> {
		callout: {
			/**
			 * Set a callout node
			 */
			setCallout: (attributes?: {
				type: "info" | "warning" | "success" | "error";
			}) => ReturnType;
			/**
			 * Toggle a callout node
			 */
			toggleCallout: (attributes?: {
				type: "info" | "warning" | "success" | "error";
			}) => ReturnType;
		};
	}
}

export const CalloutExtension = Node.create<CalloutOptions>({
	name: "callout",

	group: "block",

	content: "block+",

	draggable: true,

	addAttributes() {
		return {
			type: {
				default: "info",
				parseHTML: (element) => element.getAttribute("data-type"),
				renderHTML: (attributes) => {
					return { "data-type": attributes.type };
				},
			},
		};
	},

	parseHTML() {
		return [
			{
				tag: 'div[data-type="callout"]',
			},
		];
	},

	renderHTML({ HTMLAttributes }) {
		return ["div", { "data-type": "callout", ...HTMLAttributes }, 0];
	},

	addNodeView() {
		return ReactNodeViewRenderer(CalloutComponent);
	},

	addCommands() {
		return {
			setCallout:
				(attributes) =>
				({ commands }) => {
					return commands.setNode(this.name, attributes);
				},
			toggleCallout:
				(attributes) =>
				({ commands }) => {
					return commands.toggleNode(this.name, "paragraph", attributes);
				},
		};
	},
});
