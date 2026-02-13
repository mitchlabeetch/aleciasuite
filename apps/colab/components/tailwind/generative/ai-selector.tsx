import { Button } from "@/components/tailwind/ui/button";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "@/components/tailwind/ui/command";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/tailwind/ui/popover";
import type { Editor } from "@tiptap/core";
import { useCompletion } from "ai/react";
import { Sparkles } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { AI_ACTIONS } from "../ai/ai-actions";

interface AISelectorProps {
	editor: Editor;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export function AISelector({ editor, open, onOpenChange }: AISelectorProps) {
	const { complete, isLoading } = useCompletion({
		api: "/api/generate",
		onResponse: (response) => {
			if (response.status === 429) {
				toast.error("Limite de débit atteinte.");
				return;
			}
		},
		onError: (e) => {
			toast.error(e.message);
		},
		onFinish: (_prompt, completion) => {
			// Replace selection with completion or handle it
			// For now, we will just insert it.
			// But novel usually handles this with completion updates.
			// Let's insert it at selection
			const selection = editor.state.selection;
			editor
				.chain()
				.focus()
				.insertContentAt({ from: selection.from, to: selection.to }, completion)
				.run();
		},
	});

	const [inputValue, setInputValue] = useState("");

	const handleAction = useCallback(
		async (action: (typeof AI_ACTIONS)[number]) => {
			const selection = editor.state.selection;
			const text = editor.state.doc.textBetween(
				selection.from,
				selection.to,
				" ",
			);

			if (!text) {
				toast.error("Veuillez sélectionner du texte pour utiliser l'IA.");
				return;
			}

			const prompt = `${action.prompt}:\n"${text}"`;

			complete(prompt);

			toast.info(`IA: ${action.label}...`);
			onOpenChange(false);
		},
		[editor, complete, onOpenChange],
	);

	useEffect(() => {
		const handleAIAction = (e: Event) => {
			const customEvent = e as CustomEvent;
			const { action, prompt } = customEvent.detail;
			const aiAction = AI_ACTIONS.find((a) => a.value === action);
			if (aiAction) {
				handleAction(aiAction);
			}
		};

		editor.view.dom.addEventListener("ai-action", handleAIAction);
		return () => {
			editor.view.dom.removeEventListener("ai-action", handleAIAction);
		};
	}, [editor, handleAction]);

	return (
		<Popover open={open} onOpenChange={onOpenChange}>
			<PopoverTrigger asChild>
				<Button
					variant="ghost"
					className="gap-2 rounded-none border-none text-purple-500 hover:text-purple-600"
					size="sm"
				>
					<Sparkles className="h-4 w-4" />
					IA
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-72 p-0" align="start">
				<Command>
					<CommandInput
						placeholder="Demander à l'IA..."
						value={inputValue}
						onValueChange={setInputValue}
						autoFocus
					/>
					<CommandList>
						<CommandEmpty>Aucune action trouvée.</CommandEmpty>
						<CommandGroup heading="Actions IA">
							{AI_ACTIONS.map((action) => (
								<CommandItem
									key={action.value}
									onSelect={() => handleAction(action)}
									className="flex cursor-pointer items-center gap-2"
								>
									{action.icon}
									<span>{action.label}</span>
								</CommandItem>
							))}
						</CommandGroup>
					</CommandList>
				</Command>
			</PopoverContent>
		</Popover>
	);
}
