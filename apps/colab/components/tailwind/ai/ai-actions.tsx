import { Expand, Languages, Minimize, RefreshCw, Sparkles } from "lucide-react";

export const AI_ACTIONS = [
	{
		value: "improve",
		label: "Améliorer le texte",
		icon: <Sparkles className="h-4 w-4" />,
		prompt: "Améliore ce texte pour le rendre plus professionnel et clair.",
	},
	{
		value: "summarize",
		label: "Résumer",
		icon: <Minimize className="h-4 w-4" />,
		prompt: "Résume ce contenu en quelques points clés.",
	},
	{
		value: "expand",
		label: "Développer",
		icon: <Expand className="h-4 w-4" />,
		prompt: "Développe cette idée avec plus de détails et d'exemples.",
	},
	{
		value: "translate_en",
		label: "Traduire en Anglais",
		icon: <Languages className="h-4 w-4" />,
		prompt: "Traduis ce texte en anglais professionnel.",
	},
	{
		value: "translate_fr",
		label: "Traduire en Français",
		icon: <Languages className="h-4 w-4" />,
		prompt: "Traduis ce texte en français professionnel.",
	},
	{
		value: "simplify",
		label: "Simplifier",
		icon: <RefreshCw className="h-4 w-4" />,
		prompt:
			"Simplifie ce texte pour le rendre accessible à un public non expert.",
	},
];
