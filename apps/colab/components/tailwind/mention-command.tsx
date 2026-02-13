import { Command, createSuggestionItems, renderItems } from "novel";
import { Sparkles } from "lucide-react";
import { AI_ACTIONS } from "./ai/ai-actions";

export const mentionItems = createSuggestionItems(
	AI_ACTIONS.map((action) => ({
		title: action.label,
		description: action.prompt,
		searchTerms: ["ai", "ia", "alecia", ...action.label.split(" ")],
		icon: <Sparkles size={18} />,
		command: ({ editor, range }) => {
			// We will trigger the AI completion here
			// Since we don't have direct access to the `complete` function from `useCompletion` here easily without context,
			// we might need a way to signal the AI selector to open or run.
			// However, `slashCommand` runs commands directly.

			// A common pattern in Novel is to insert text or update state.
			// To integrate with the existing `AISelector` logic, we might need a custom event or a different approach.

			// But looking at `AISelector.tsx`, it takes `editor` as prop.
			// Maybe we can simply use the `ai-completion-command` if it exists.

			// Let's check `apps/web/components/tailwind/generative/ai-completion-command.tsx`

			// For now, let's just insert a placeholder or try to trigger the AI action if possible.
			// Actually, standard Tiptap commands run synchronously. AI is async.

			// The requirement says: "Trigger: Typing @alecia or selecting text and clicking 'AI'".
			// If I type @alecia, I should see options.

			// If I select "Améliorer", it should take the previous paragraph (or selection) and improve it.
			// If there is no selection, maybe it improves the block before?

			// Let's assume the user selects text THEN types @alecia (replacing text) OR types @alecia on a new line to generate content?
			// "Magic commands" usually work on selection or generation.

			// Let's try to make it work like `AISelector`.
			// We can use a custom extension command that dispatches an event that `AISelector` listens to?
			// Or simply, we can use the `AISelector` logic here if we can access the API.

			// Since `slashCommand` is defined outside of React component (it's a static config), we can't use hooks like `useCompletion`.

			// workaround: We can define the items, but the `command` execution might need to be handled carefully.
			// However, `novel` documentation or examples usually show how to do this.

			// Let's look at `apps/web/components/tailwind/generative/ai-selector-commands.tsx` if it exists.

			editor.chain().focus().deleteRange(range).run();
			// We need to trigger the AI action.
			// We can dispatch a custom event on the editor DOM node?
			const event = new CustomEvent("ai-action", {
				detail: { action: action.value, prompt: action.prompt },
			});
			editor.view.dom.dispatchEvent(event);
		},
	})),
);

export const mentionCommand = Command.configure({
	suggestion: {
		char: "@",
		items: ({ query }: { query: string }) => {
			// Filter for "alecia" or show all if query is empty/partial matches
			if (query.toLowerCase().startsWith("ale")) {
				return mentionItems.filter(
					(item) =>
						item.title.toLowerCase().includes(query.toLowerCase()) ||
						"alecia".includes(query.toLowerCase()),
				);
			}
			return [];
		},
		render: renderItems,
	},
});
