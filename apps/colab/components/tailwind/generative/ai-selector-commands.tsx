import {
	ArrowDownWideNarrow,
	CheckCheck,
	RefreshCcwDot,
	StepForward,
	WrapText,
} from "lucide-react";
import { getPrevText, useEditor } from "novel";
import { CommandGroup, CommandItem, CommandSeparator } from "../ui/command";

const options = [
	{
		value: "improve",
		label: "Améliorer l'écriture",
		icon: RefreshCcwDot,
	},
	{
		value: "fix",
		label: "Corriger la grammaire",
		icon: CheckCheck,
	},
	{
		value: "shorter",
		label: "Raccourcir",
		icon: ArrowDownWideNarrow,
	},
	{
		value: "longer",
		label: "Allonger",
		icon: WrapText,
	},
];

interface AISelectorCommandsProps {
	onSelect: (value: string, option: string) => void;
}

const AISelectorCommands = ({ onSelect }: AISelectorCommandsProps) => {
	const { editor } = useEditor();

	// Guard against null editor
	if (!editor) return null;

	return (
		<>
			<CommandGroup heading="Modifier ou réviser la sélection">
				{options.map((option) => (
					<CommandItem
						onSelect={(value) => {
							const slice = editor.state.selection.content();
							const text = editor.storage.markdown.serializer.serialize(
								slice.content,
							);
							onSelect(text, value);
						}}
						className="flex gap-2 px-4"
						key={option.value}
						value={option.value}
					>
						<option.icon className="h-4 w-4 text-purple-500" />
						{option.label}
					</CommandItem>
				))}
			</CommandGroup>
			<CommandSeparator />
			<CommandGroup heading="Utiliser l'IA pour en faire plus">
				<CommandItem
					onSelect={() => {
						const pos = editor.state.selection.from;
						const text = getPrevText(editor, pos);
						onSelect(text, "continue");
					}}
					value="continue"
					className="gap-2 px-4"
				>
					<StepForward className="h-4 w-4 text-purple-500" />
					Continuer à écrire
				</CommandItem>
			</CommandGroup>
		</>
	);
};

export default AISelectorCommands;
