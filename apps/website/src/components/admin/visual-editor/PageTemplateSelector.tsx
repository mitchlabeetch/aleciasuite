"use client";

import { useState } from "react";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
	Check,
	FileText,
	Layout,
	Users,
	HelpCircle,
	Briefcase,
} from "lucide-react";
import type { Section, SectionType } from "./SectionEditor";

interface PageTemplateProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSelectTemplate: (sections: Section[]) => void;
}

interface Template {
	id: string;
	name: string;
	description: string;
	icon: React.ComponentType<{ className?: string }>;
	sections: Section[];
}

/**
 * Pre-built page templates for quick start
 */
const TEMPLATES: Template[] = [
	{
		id: "blank",
		name: "Page vierge",
		description: "Commencez avec une page vide",
		icon: FileText,
		sections: [],
	},
	{
		id: "landing",
		name: "Page d'atterrissage",
		description: "Hero, texte, cartes et CTA",
		icon: Layout,
		sections: [
			{
				id: "hero-1",
				type: "hero" as SectionType,
				content: {
					heading: "Titre principal de la page",
					subheading:
						"Une description courte et percutante qui présente votre proposition de valeur.",
					ctaText: "En savoir plus",
					ctaLink: "/contact",
				},
				order: 0,
				visible: true,
			},
			{
				id: "text-1",
				type: "text" as SectionType,
				content: {
					title: "Notre approche",
					text: "Décrivez ici votre approche unique et ce qui vous différencie. Expliquez comment vous aidez vos clients à atteindre leurs objectifs.",
				},
				order: 1,
				visible: true,
			},
			{
				id: "cards-1",
				type: "cards" as SectionType,
				content: {
					sectionTitle: "Nos services",
					cards: [
						{
							id: "card-1",
							title: "Service 1",
							description: "Description du premier service offert.",
						},
						{
							id: "card-2",
							title: "Service 2",
							description: "Description du deuxième service offert.",
						},
						{
							id: "card-3",
							title: "Service 3",
							description: "Description du troisième service offert.",
						},
					],
				},
				order: 2,
				visible: true,
			},
			{
				id: "cta-1",
				type: "cta" as SectionType,
				content: {
					heading: "Prêt à démarrer ?",
					subheading:
						"Contactez-nous dès aujourd'hui pour discuter de votre projet.",
					primaryButtonText: "Nous contacter",
					primaryButtonLink: "/contact",
					variant: "gradient",
				},
				order: 3,
				visible: true,
			},
		],
	},
	{
		id: "about",
		name: "À propos",
		description: "Présentez votre équipe et votre histoire",
		icon: Users,
		sections: [
			{
				id: "hero-1",
				type: "hero" as SectionType,
				content: {
					heading: "Notre équipe",
					subheading:
						"Découvrez les personnes qui font notre succès au quotidien.",
				},
				order: 0,
				visible: true,
			},
			{
				id: "text-1",
				type: "text" as SectionType,
				content: {
					title: "Notre histoire",
					text: "Racontez ici l'histoire de votre entreprise, ses origines, sa mission et ses valeurs fondamentales.",
				},
				order: 1,
				visible: true,
			},
			{
				id: "team-1",
				type: "team" as SectionType,
				content: {
					sectionTitle: "Rencontrez l'équipe",
					subtitle: "Des experts passionnés à votre service",
					members: [
						{
							id: "member-1",
							name: "Jean Dupont",
							role: "Directeur Général",
							bio: "Plus de 20 ans d'expérience dans le secteur.",
						},
						{
							id: "member-2",
							name: "Marie Martin",
							role: "Directrice Associée",
							bio: "Experte en stratégie et développement.",
						},
						{
							id: "member-3",
							name: "Pierre Bernard",
							role: "Associé",
							bio: "Spécialiste des opérations complexes.",
						},
					],
				},
				order: 2,
				visible: true,
			},
			{
				id: "testimonial-1",
				type: "testimonial" as SectionType,
				content: {
					quote:
						"Une équipe exceptionnelle qui nous a accompagnés tout au long de notre projet.",
					author: "Client Satisfait",
					role: "PDG, Entreprise Partenaire",
				},
				order: 3,
				visible: true,
			},
		],
	},
	{
		id: "services",
		name: "Services",
		description: "Présentez vos services en détail",
		icon: Briefcase,
		sections: [
			{
				id: "hero-1",
				type: "hero" as SectionType,
				content: {
					heading: "Nos services",
					subheading: "Des solutions adaptées à vos besoins",
				},
				order: 0,
				visible: true,
			},
			{
				id: "cards-1",
				type: "cards" as SectionType,
				content: {
					sectionTitle: "Ce que nous offrons",
					cards: [
						{
							id: "card-1",
							title: "Conseil stratégique",
							description:
								"Accompagnement dans la définition de votre stratégie.",
						},
						{
							id: "card-2",
							title: "Accompagnement opérationnel",
							description: "Support dans la mise en œuvre de vos projets.",
						},
						{
							id: "card-3",
							title: "Expertise sectorielle",
							description: "Connaissance approfondie de votre marché.",
						},
					],
				},
				order: 1,
				visible: true,
			},
			{
				id: "text-1",
				type: "text" as SectionType,
				content: {
					title: "Notre méthodologie",
					text: "Décrivez ici votre approche et votre méthodologie de travail. Expliquez les étapes clés de votre processus.",
				},
				order: 2,
				visible: true,
			},
			{
				id: "gallery-1",
				type: "gallery" as SectionType,
				content: {
					sectionTitle: "Nos réalisations",
					columns: 3,
					items: [],
				},
				order: 3,
				visible: true,
			},
			{
				id: "cta-1",
				type: "cta" as SectionType,
				content: {
					heading: "Besoin d'accompagnement ?",
					subheading: "Discutons de votre projet ensemble.",
					primaryButtonText: "Demander un rendez-vous",
					primaryButtonLink: "/contact",
					variant: "dark",
				},
				order: 4,
				visible: true,
			},
		],
	},
	{
		id: "faq",
		name: "FAQ",
		description: "Questions fréquentes avec CTA",
		icon: HelpCircle,
		sections: [
			{
				id: "hero-1",
				type: "hero" as SectionType,
				content: {
					heading: "Questions fréquentes",
					subheading:
						"Trouvez les réponses à vos questions les plus courantes.",
				},
				order: 0,
				visible: true,
			},
			{
				id: "faq-1",
				type: "faq" as SectionType,
				content: {
					sectionTitle: "",
					items: [
						{
							id: "q1",
							question: "Comment fonctionne votre service ?",
							answer:
								"Expliquez ici le fonctionnement de votre service de manière claire et concise.",
						},
						{
							id: "q2",
							question: "Quels sont vos délais ?",
							answer: "Détaillez les délais habituels pour vos prestations.",
						},
						{
							id: "q3",
							question: "Comment nous contacter ?",
							answer: "Indiquez les différentes façons de vous joindre.",
						},
						{
							id: "q4",
							question: "Quelles sont vos garanties ?",
							answer: "Présentez les garanties que vous offrez à vos clients.",
						},
					],
				},
				order: 1,
				visible: true,
			},
			{
				id: "cta-1",
				type: "cta" as SectionType,
				content: {
					heading: "Vous n'avez pas trouvé votre réponse ?",
					subheading:
						"Notre équipe est disponible pour répondre à toutes vos questions.",
					primaryButtonText: "Nous contacter",
					primaryButtonLink: "/contact",
					variant: "default",
				},
				order: 2,
				visible: true,
			},
		],
	},
];

/**
 * PageTemplateSelector - Modal for selecting a page template
 */
export function PageTemplateSelector({
	open,
	onOpenChange,
	onSelectTemplate,
}: PageTemplateProps) {
	const [selectedId, setSelectedId] = useState<string | null>(null);

	const handleApply = () => {
		const template = TEMPLATES.find((t) => t.id === selectedId);
		if (template) {
			// Generate unique IDs for sections
			const sectionsWithNewIds = template.sections.map((section) => ({
				...section,
				id: `${section.type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
			}));
			onSelectTemplate(sectionsWithNewIds);
			onOpenChange(false);
			setSelectedId(null);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-3xl">
				<DialogHeader>
					<DialogTitle>Choisir un modèle de page</DialogTitle>
					<DialogDescription>
						Sélectionnez un modèle pour démarrer rapidement avec des sections
						pré-configurées.
					</DialogDescription>
				</DialogHeader>

				<div className="grid grid-cols-2 md:grid-cols-3 gap-4 py-4">
					{TEMPLATES.map((template) => {
						const Icon = template.icon;
						const isSelected = selectedId === template.id;

						return (
							<Card
								key={template.id}
								className={`relative cursor-pointer p-4 transition-all hover:shadow-lg ${
									isSelected
										? "ring-2 ring-[var(--alecia-gold)] border-[var(--alecia-gold)]"
										: "hover:border-gray-300"
								}`}
								onClick={() => setSelectedId(template.id)}
							>
								{isSelected && (
									<div className="absolute top-2 right-2 w-5 h-5 bg-[var(--alecia-gold)] rounded-full flex items-center justify-center">
										<Check className="w-3 h-3 text-white" />
									</div>
								)}
								<div className="flex flex-col items-center text-center gap-3">
									<div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
										<Icon className="w-6 h-6 text-gray-600 dark:text-gray-400" />
									</div>
									<div>
										<h3 className="font-medium text-sm">{template.name}</h3>
										<p className="text-xs text-muted-foreground mt-1">
											{template.description}
										</p>
										<p className="text-xs text-muted-foreground mt-2">
											{template.sections.length} section
											{template.sections.length !== 1 ? "s" : ""}
										</p>
									</div>
								</div>
							</Card>
						);
					})}
				</div>

				<div className="flex justify-end gap-3 pt-4 border-t">
					<Button variant="outline" onClick={() => onOpenChange(false)}>
						Annuler
					</Button>
					<Button onClick={handleApply} disabled={!selectedId}>
						Appliquer le modèle
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
}
