import {
	Briefcase,
	Building,
	CheckSquare,
	ClipboardCheck,
	Code,
	File,
	Heading1,
	Heading2,
	Heading3,
	ImageIcon,
	KanbanSquare,
	List,
	ListOrdered,
	MessageSquare,
	Minus,
	Table as TableIcon,
	Text,
	TextQuote,
	TrendingUp,
	Users,
} from "lucide-react";
import { Command, createSuggestionItems, renderItems } from "novel";
import { uploadFn } from "./image-upload";

export const suggestionItems = createSuggestionItems([
	// M&A Templates
	{
		title: "Teaser de cession",
		description:
			"Document de présentation anonymisé pour acquéreurs potentiels",
		searchTerms: ["teaser", "cession", "m&a", "template"],
		icon: <Briefcase size={18} />,
		command: ({ editor, range }) => {
			editor
				.chain()
				.focus()
				.deleteRange(range)
				.insertContent([
					{
						type: "heading",
						attrs: { level: 1 },
						content: [{ type: "text", text: "Teaser de Cession" }],
					},
					{
						type: "paragraph",
						content: [
							{ type: "text", marks: [{ type: "bold" }], text: "Secteur : " },
							{ type: "text", text: "[Secteur d'activité]" },
						],
					},
					{
						type: "paragraph",
						content: [
							{
								type: "text",
								marks: [{ type: "bold" }],
								text: "Code Projet : ",
							},
							{ type: "text", text: "[Nom de code]" },
						],
					},
					{
						type: "heading",
						attrs: { level: 2 },
						content: [{ type: "text", text: "Points Clés d'Investissement" }],
					},
					{
						type: "bulletList",
						content: [
							{
								type: "listItem",
								content: [
									{
										type: "paragraph",
										content: [
											{
												type: "text",
												text: "Position de leader sur le marché de niche",
											},
										],
									},
								],
							},
							{
								type: "listItem",
								content: [
									{
										type: "paragraph",
										content: [
											{ type: "text", text: "Croissance du CA de +XX% par an" },
										],
									},
								],
							},
							{
								type: "listItem",
								content: [
									{
										type: "paragraph",
										content: [
											{
												type: "text",
												text: "Technologie propriétaire brevetée",
											},
										],
									},
								],
							},
						],
					},
					{
						type: "heading",
						attrs: { level: 2 },
						content: [{ type: "text", text: "Aperçu Financier" }],
					},
					{
						type: "paragraph",
						content: [
							{ type: "text", text: "[Insérer tableau synthétique ici]" },
						],
					},
				])
				.run();
		},
	},
	{
		title: "Mémorandum d'information",
		description: "Document détaillé de présentation de la société",
		searchTerms: ["im", "memorandum", "info", "m&a"],
		icon: <File size={18} />,
		command: ({ editor, range }) => {
			editor
				.chain()
				.focus()
				.deleteRange(range)
				.insertContent([
					{
						type: "heading",
						attrs: { level: 1 },
						content: [{ type: "text", text: "Mémorandum d'Information" }],
					},
					{
						type: "heading",
						attrs: { level: 2 },
						content: [{ type: "text", text: "Résumé Exécutif" }],
					},
					{
						type: "paragraph",
						content: [{ type: "text", text: "[Synthèse de l'opportunité]" }],
					},
					{
						type: "heading",
						attrs: { level: 2 },
						content: [{ type: "text", text: "Présentation de la Société" }],
					},
					{
						type: "heading",
						attrs: { level: 3 },
						content: [{ type: "text", text: "Historique" }],
					},
					{
						type: "heading",
						attrs: { level: 3 },
						content: [{ type: "text", text: "Produits et Services" }],
					},
					{
						type: "heading",
						attrs: { level: 2 },
						content: [{ type: "text", text: "Marché et Concurrence" }],
					},
					{
						type: "heading",
						attrs: { level: 2 },
						content: [{ type: "text", text: "Plan Stratégique" }],
					},
				])
				.run();
		},
	},
	{
		title: "Checklist Due Diligence",
		description: "Liste des documents et vérifications",
		searchTerms: ["dd", "checklist", "diligence"],
		icon: <ClipboardCheck size={18} />,
		command: ({ editor, range }) => {
			editor
				.chain()
				.focus()
				.deleteRange(range)
				.insertContent([
					{
						type: "heading",
						attrs: { level: 1 },
						content: [{ type: "text", text: "Checklist Due Diligence" }],
					},
					{
						type: "taskList",
						content: [
							{
								type: "taskItem",
								attrs: { checked: false },
								content: [
									{
										type: "paragraph",
										content: [
											{ type: "text", text: "Statuts de la société à jour" },
										],
									},
								],
							},
							{
								type: "taskItem",
								attrs: { checked: false },
								content: [
									{
										type: "paragraph",
										content: [
											{
												type: "text",
												text: "États financiers (3 derniers exercices)",
											},
										],
									},
								],
							},
							{
								type: "taskItem",
								attrs: { checked: false },
								content: [
									{
										type: "paragraph",
										content: [
											{
												type: "text",
												text: "Liste des contrats significatifs",
											},
										],
									},
								],
							},
							{
								type: "taskItem",
								attrs: { checked: false },
								content: [
									{
										type: "paragraph",
										content: [
											{
												type: "text",
												text: "Organigramme juridique et fonctionnel",
											},
										],
									},
								],
							},
						],
					},
				])
				.run();
		},
	},
	{
		title: "Plan d'intégration",
		description: "Suivi post-acquisition",
		searchTerms: ["integration", "pmi"],
		icon: <TrendingUp size={18} />,
		command: ({ editor, range }) => {
			editor
				.chain()
				.focus()
				.deleteRange(range)
				.insertContent([
					{
						type: "heading",
						attrs: { level: 1 },
						content: [{ type: "text", text: "Plan d'Intégration (100 Jours)" }],
					},
					{
						type: "heading",
						attrs: { level: 2 },
						content: [{ type: "text", text: "Communication" }],
					},
					{
						type: "taskList",
						content: [
							{
								type: "taskItem",
								attrs: { checked: false },
								content: [
									{
										type: "paragraph",
										content: [{ type: "text", text: "Annonce aux employés" }],
									},
								],
							},
							{
								type: "taskItem",
								attrs: { checked: false },
								content: [
									{
										type: "paragraph",
										content: [{ type: "text", text: "Communiqué de presse" }],
									},
								],
							},
						],
					},
				])
				.run();
		},
	},
	{
		title: "Profil Société",
		description: "Fiche d'identité d'une cible",
		searchTerms: ["profil", "société", "cible"],
		icon: <Building size={18} />,
		command: ({ editor, range }) => {
			editor
				.chain()
				.focus()
				.deleteRange(range)
				.insertContent([
					{
						type: "heading",
						attrs: { level: 1 },
						content: [{ type: "text", text: "Profil Société" }],
					},
					{
						type: "paragraph",
						content: [
							{ type: "text", marks: [{ type: "bold" }], text: "Nom : " },
							{ type: "text", text: "..." },
						],
					},
					{
						type: "paragraph",
						content: [
							{ type: "text", marks: [{ type: "bold" }], text: "Siège : " },
							{ type: "text", text: "..." },
						],
					},
					{
						type: "paragraph",
						content: [
							{ type: "text", marks: [{ type: "bold" }], text: "CA : " },
							{ type: "text", text: "..." },
						],
					},
					{
						type: "paragraph",
						content: [
							{ type: "text", marks: [{ type: "bold" }], text: "EBE : " },
							{ type: "text", text: "..." },
						],
					},
				])
				.run();
		},
	},
	{
		title: "Compte-rendu",
		description: "Notes de réunion",
		searchTerms: ["cr", "réunion", "notes"],
		icon: <Users size={18} />,
		command: ({ editor, range }) => {
			editor
				.chain()
				.focus()
				.deleteRange(range)
				.insertContent([
					{
						type: "heading",
						attrs: { level: 1 },
						content: [{ type: "text", text: "Compte-rendu de réunion" }],
					},
					{
						type: "paragraph",
						content: [
							{ type: "text", marks: [{ type: "bold" }], text: "Date : " },
							{ type: "text", text: "..." },
						],
					},
					{
						type: "paragraph",
						content: [
							{
								type: "text",
								marks: [{ type: "bold" }],
								text: "Participants : ",
							},
							{ type: "text", text: "..." },
						],
					},
					{
						type: "heading",
						attrs: { level: 2 },
						content: [{ type: "text", text: "Points abordés" }],
					},
					{
						type: "bulletList",
						content: [
							{
								type: "listItem",
								content: [
									{
										type: "paragraph",
										content: [{ type: "text", text: "..." }],
									},
								],
							},
						],
					},
				])
				.run();
		},
	},

	// Standard Blocks (French)
	{
		title: "Texte",
		description: "Commencez à écrire du texte simple.",
		searchTerms: ["p", "paragraphe", "texte"],
		icon: <Text size={18} />,
		command: ({ editor, range }) => {
			editor
				.chain()
				.focus()
				.deleteRange(range)
				.toggleNode("paragraph", "paragraph")
				.run();
		},
	},
	{
		title: "Titre 1",
		description: "Grand titre de section.",
		searchTerms: ["titre", "h1", "grand"],
		icon: <Heading1 size={18} />,
		command: ({ editor, range }) => {
			editor
				.chain()
				.focus()
				.deleteRange(range)
				.setNode("heading", { level: 1 })
				.run();
		},
	},
	{
		title: "Titre 2",
		description: "Titre de section moyen.",
		searchTerms: ["sous-titre", "h2", "moyen"],
		icon: <Heading2 size={18} />,
		command: ({ editor, range }) => {
			editor
				.chain()
				.focus()
				.deleteRange(range)
				.setNode("heading", { level: 2 })
				.run();
		},
	},
	{
		title: "Titre 3",
		description: "Petit titre de section.",
		searchTerms: ["sous-titre", "h3", "petit"],
		icon: <Heading3 size={18} />,
		command: ({ editor, range }) => {
			editor
				.chain()
				.focus()
				.deleteRange(range)
				.setNode("heading", { level: 3 })
				.run();
		},
	},
	{
		title: "Liste à puces",
		description: "Créer une liste simple.",
		searchTerms: ["liste", "puces", "ul"],
		icon: <List size={18} />,
		command: ({ editor, range }) => {
			editor.chain().focus().deleteRange(range).toggleBulletList().run();
		},
	},
	{
		title: "Liste numérotée",
		description: "Créer une liste ordonnée.",
		searchTerms: ["liste", "numéros", "ol"],
		icon: <ListOrdered size={18} />,
		command: ({ editor, range }) => {
			editor.chain().focus().deleteRange(range).toggleOrderedList().run();
		},
	},
	{
		title: "Liste de tâches",
		description: "Suivre des tâches avec une checklist.",
		searchTerms: ["tâche", "todo", "check", "checklist"],
		icon: <CheckSquare size={18} />,
		command: ({ editor, range }) => {
			editor.chain().focus().deleteRange(range).toggleTaskList().run();
		},
	},
	{
		title: "Tableau",
		description: "Insérer un tableau.",
		searchTerms: ["tableau", "table"],
		icon: <TableIcon size={18} />,
		command: ({ editor, range }) => {
			// Note: insertTable may not be available in all editor configurations
			// Commenting out until table extension is properly configured in novel editor
			editor
				.chain()
				.focus()
				.deleteRange(range)
				.insertContent({
					type: "paragraph",
					content: [{ type: "text", text: "[Table - Feature coming soon]" }],
				})
				.run();
		},
	},
	{
		title: "Kanban",
		description: "Insérer une vue Kanban.",
		searchTerms: ["kanban", "board", "tableau"],
		icon: <KanbanSquare size={18} />,
		command: ({ editor, range }) => {
			editor
				.chain()
				.focus()
				.deleteRange(range)
				.insertContent({
					type: "paragraph",
					content: [{ type: "text", text: "[Kanban - Feature coming soon]" }],
				})
				.run();
		},
	},
	{
		title: "Encadré (Callout)",
		description: "Mettre en avant une information importante.",
		searchTerms: ["callout", "encadré", "info", "attention"],
		icon: <MessageSquare size={18} />,
		command: ({ editor, range }) => {
			editor
				.chain()
				.focus()
				.deleteRange(range)
				.insertContent({
					type: "paragraph",
					content: [{ type: "text", text: "[Callout - Feature coming soon]" }],
				})
				.run();
		},
	},
	{
		title: "Bloc de code",
		description: "Insérer un snippet de code.",
		searchTerms: ["code", "bloc"],
		icon: <Code size={18} />,
		command: ({ editor, range }) =>
			editor.chain().focus().deleteRange(range).toggleCodeBlock().run(),
	},
	{
		title: "Image",
		description: "Télécharger une image.",
		searchTerms: ["photo", "image", "media"],
		icon: <ImageIcon size={18} />,
		command: ({ editor, range }) => {
			editor.chain().focus().deleteRange(range).run();
			const input = document.createElement("input");
			input.type = "file";
			input.accept = "image/*";
			input.onchange = async () => {
				if (input.files?.length) {
					const file = input.files[0];
					const pos = editor.view.state.selection.from;
					uploadFn(file, editor.view, pos);
				}
			};
			input.click();
		},
	},
	{
		title: "Citation",
		description: "Capturer une citation.",
		searchTerms: ["citation", "quote"],
		icon: <TextQuote size={18} />,
		command: ({ editor, range }) =>
			editor
				.chain()
				.focus()
				.deleteRange(range)
				.toggleNode("paragraph", "paragraph")
				.toggleBlockquote()
				.run(),
	},
	{
		title: "Ligne de séparation",
		description: "Séparer le contenu visuellement.",
		searchTerms: ["ligne", "séparateur", "divider"],
		icon: <Minus size={18} />,
		command: ({ editor, range }) =>
			editor.chain().focus().deleteRange(range).setHorizontalRule().run(),
	},
]);

export const slashCommand = Command.configure({
	suggestion: {
		items: () => suggestionItems,
		render: renderItems,
	},
});
