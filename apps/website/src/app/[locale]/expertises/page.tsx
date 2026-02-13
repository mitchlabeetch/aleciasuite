"use client";

import { Navbar } from "@/components/layout/Navbar";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import {
	ArrowRight,
	Clock,
	Shield,
	Target,
	Search,
	Wallet,
	Scale,
	FileSearch,
	Handshake,
	Puzzle,
	LucideIcon,
} from "lucide-react";
import { usePageContent, SectionRenderer } from "@/components/sections";

// Animation variants
const fadeInUp = {
	hidden: { opacity: 0, y: 30 },
	visible: {
		opacity: 1,
		y: 0,
		transition: { duration: 0.6, ease: "easeOut" as const },
	},
} as const;

const staggerContainer = {
	hidden: { opacity: 0 },
	visible: {
		opacity: 1,
		transition: { staggerChildren: 0.15 },
	},
} as const;

const cardVariant = {
	hidden: { opacity: 0, y: 20 },
	visible: {
		opacity: 1,
		y: 0,
		transition: { duration: 0.5, ease: "backOut" as const },
	},
} as const;

// Static content structure for fallback
interface ExpertiseItem {
	id: string;
	title: string;
	description: string;
	image: string;
	subItems: Array<{ title: string; description: string }>;
	enjeux: {
		title: string;
		items: Array<{ text: string; icon: LucideIcon }>;
	};
	reverse: boolean;
}

const expertises: ExpertiseItem[] = [
	{
		id: "cession",
		title: "Cession & transmission",
		description:
			"La cession de votre entreprise est un moment décisif, qui requiert une préparation et une exécution irréprochables. alecia vous accompagne pour sécuriser l'opération, défendre vos intérêts et maximiser la valeur de votre entreprise, dans le respect de votre histoire et de vos collaborateurs.",
		image: "/assets/Expertises_Alecia/1_p1600.webp",
		subItems: [
			{
				title: "Préparation",
				description:
					"Étude réaliste et transparente de la valeur de votre entreprise, mise en place d'une stratégie de vente, identification des facteurs d'optimisation et préparation de documents de présentation aux plus hauts standards.",
			},
			{
				title: "Identification d'acheteurs potentiels",
				description:
					"Ciblage et approche discrète des acquéreurs potentiels, pour trouver le meilleur repreneur pour votre entreprise, grâce à notre réseau extensif et notre savoir-faire.",
			},
			{
				title: "Négociation et closing",
				description:
					"Assistance dans toutes les phases de la négociation jusqu'à la conclusion de la vente, en direct et aux côtés de vos conseils, en veillant à protéger vos intérêts.",
			},
		],
		enjeux: {
			title: "Enjeux de la cession",
			items: [
				{
					text: "Garantir la confidentialité des échanges, vis-à-vis de vos équipes, de vos clients et de vos fournisseurs.",
					icon: Shield,
				},
				{
					text: "Préparer une documentation adaptée aux attentes des acheteurs potentiels pour créer la demande.",
					icon: FileSearch,
				},
				{
					text: "Optimiser la valorisation sans être déceptif, négocier et faire entendre vos conditions.",
					icon: Wallet,
				},
			],
		},
		reverse: false,
	},
	{
		id: "levee-de-fonds",
		title: "Levée de fonds & financement",
		description:
			"Que ce soit pour financer votre croissance, investir dans de nouveaux projets, restructurer votre capital ou réaliser votre patrimoine, alecia vous offre un conseil expert en levée de fonds, adapté à vos besoins spécifiques.",
		image: "/assets/Expertises_Alecia/travail_metal_compressed.jpg",
		subItems: [
			{
				title: "Stratégie de financement",
				description:
					"Élaboration de stratégies de financement innovantes, adaptées à votre structure et à vos objectifs, faisant appel à des instruments dilutifs ou non (capital, dette bancaire, obligations, instruments hybrides).",
			},
			{
				title: "Accès à un réseau étendu",
				description:
					"Nous animons un vaste réseau d'investisseurs et d'institutions financières, avec une compréhension fine de leurs attentes et prismes de lecture.",
			},
			{
				title: "Structuration et négociation",
				description:
					"Assistance dans la structuration des opérations de financement et dans la négociation des meilleures conditions possibles.",
			},
		],
		enjeux: {
			title: "Enjeux de la levée de fonds",
			items: [
				{
					text: "Identifier la meilleure combinaison de sources de financement parmi le large panel de fonds d'investissements et prêteurs français et européens.",
					icon: Search,
				},
				{
					text: "Comprendre votre stratégie et vos enjeux, préparer une documentation convaincante et la présenter aux interlocuteurs pertinents.",
					icon: Target,
				},
				{
					text: "Négocier des conditions financières et de gouvernance favorables, alignées avec votre stratégie de développement.",
					icon: Handshake,
				},
			],
		},
		reverse: true,
	},
	{
		id: "acquisition",
		title: "Acquisition",
		description:
			"L'acquisition d'une entreprise est un levier stratégique majeur pour accélérer la croissance de votre société. Nous vous guidons à travers ce processus complexe avec une expertise et une méthodologie éprouvées, assurant une intégration réussie et une valeur ajoutée maximale pour votre entreprise.",
		image: "/assets/Expertises_Alecia/2_p1600.webp",
		subItems: [
			{
				title: "Analyse et évaluation",
				description:
					"Identification précise des cibles potentielles, évaluation rigoureuse de leur valeur et de leur compatibilité stratégique avec votre entreprise.",
			},
			{
				title: "Négociation et structuration",
				description:
					"Accompagnement dans les négociations, avec un souci constant d'optimiser les conditions financières et stratégiques de l'opération.",
			},
			{
				title: "Intégration post-acquisition",
				description:
					"Conseils stratégiques pour une intégration fluide et efficace, garantissant la réalisation des synergies attendues.",
			},
		],
		enjeux: {
			title: "Enjeux de la croissance externe",
			items: [
				{
					text: "Vous faire gagner un temps précieux sur la recherche et l'approche de contreparties potentielles.",
					icon: Clock,
				},
				{
					text: "Négocier le prix, les conditions et les garanties pour maîtriser les risques liés à la surévaluation et à l'intégration.",
					icon: Scale,
				},
				{
					text: "Orchestrer des due diligence approfondies et animer vos conseils ; s'assurer de l'alignement stratégique et anticiper les challenges de l'intégration post-acquisition.",
					icon: Puzzle,
				},
			],
		},
		reverse: false,
	},
];

/**
 * Static Expertises Content - Used as fallback when no visual editor content is published
 */
function StaticExpertisesContent() {
	const t = useTranslations("ExpertisesPage");

	return (
		<>
			{/* Hero Section */}
			<motion.div
				initial="hidden"
				animate="visible"
				variants={fadeInUp}
				className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mb-16"
			>
				<Breadcrumbs />
				<h1 className="font-playfair text-5xl md:text-6xl font-bold text-[var(--foreground)] mb-16 text-gradient-alecia">
					{t("heading")}
				</h1>
				<p className="text-xl text-muted-foreground max-w-3xl">
					{t("subtitle")}
				</p>
			</motion.div>

			{/* Quick Navigation Cards */}
			<motion.div
				initial="hidden"
				whileInView="visible"
				viewport={{ once: true, margin: "-100px" }}
				variants={staggerContainer}
				className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mb-24"
			>
				<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
					{expertises.map((exp) => (
						<motion.a
							key={exp.id}
							href={`#${exp.id}`}
							variants={cardVariant}
							className="group relative overflow-hidden rounded-2xl aspect-[4/3] cursor-pointer shadow-lg hover:shadow-2xl transition-shadow duration-300"
						>
							<Image
								src={exp.image}
								alt={exp.title}
								fill
								className="object-cover transition-transform duration-700 group-hover:scale-110"
							/>
							<div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
							<div className="absolute inset-0 flex flex-col justify-end p-6">
								<h3 className="font-bold text-white text-xl mb-2 drop-shadow-lg">
									{exp.title}
								</h3>
								<p className="text-white/80 text-sm line-clamp-2">
									{exp.description.slice(0, 100)}...
								</p>
							</div>
						</motion.a>
					))}
				</div>
			</motion.div>

			{/* Detailed Expertise Sections */}
			<div className="space-y-0">
				{expertises.map((expertise, index) => (
					<section
						key={expertise.id}
						id={expertise.id}
						className={`scroll-mt-28 py-20 ${index % 2 === 1 ? "bg-secondary" : ""}`}
					>
						{/* Main Content */}
						<motion.div
							initial="hidden"
							whileInView="visible"
							viewport={{ once: true, margin: "-100px" }}
							variants={fadeInUp}
							className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8"
						>
							<div
								className={`flex flex-col lg:flex-row gap-12 items-center ${expertise.reverse ? "lg:flex-row-reverse" : ""}`}
							>
								<div className="flex-1 space-y-6">
									<h2 className="font-playfair text-4xl md:text-5xl font-bold text-[var(--foreground)]">
										{expertise.title}
									</h2>
									<p className="text-lg text-muted-foreground leading-relaxed">
										{expertise.description}
									</p>
									<Button asChild className="btn-gold mt-4 group">
										<Link href="/contact">
											Contacter l&apos;un de nos associés
											<ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
										</Link>
									</Button>
								</div>
								<div className="flex-1 w-full">
									<div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl border border-[var(--border)]">
										<Image
											src={expertise.image}
											alt={expertise.title}
											fill
											className="object-cover hover:scale-105 transition-transform duration-700"
										/>
									</div>
								</div>
							</div>
						</motion.div>

						{/* Sub-items Cards */}
						<motion.div
							initial="hidden"
							whileInView="visible"
							viewport={{ once: true, margin: "-50px" }}
							variants={staggerContainer}
							className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-16"
						>
							<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
								{expertise.subItems.map((item, idx) => (
									<motion.div
										key={`${expertise.id}-subitem-${item.title}`}
										variants={cardVariant}
										className="group bg-white dark:bg-slate-800/50 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-[var(--border)] hover:border-[var(--alecia-blue-light)]/50"
									>
										<div className="flex items-center gap-3 mb-4">
											<div className="w-10 h-10 rounded-full bg-[var(--alecia-blue-midnight)]/10 flex items-center justify-center text-alecia-midnight">
												{idx + 1}
											</div>
											<h4 className="font-bold text-[var(--foreground)] text-lg">
												{item.title}
											</h4>
										</div>
										<p className="text-muted-foreground text-sm leading-relaxed">
											{item.description}
										</p>
									</motion.div>
								))}
							</div>
						</motion.div>

						{/* Enjeux Section */}
						<motion.div
							initial="hidden"
							whileInView="visible"
							viewport={{ once: true, margin: "-50px" }}
							variants={fadeInUp}
							className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-20"
						>
							<div className="bg-gradient-to-br from-[#0a1628] via-[#0f2847] to-[#1a3a5c] rounded-3xl p-12 md:p-16 text-white shadow-2xl">
								<h3 className="font-playfair text-3xl md:text-4xl font-bold mb-4 text-center">
									{expertise.enjeux.title}
								</h3>
								<div className="h-1 w-24 bg-white mx-auto mb-12 rounded-full"></div>
								<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
									{expertise.enjeux.items.map((item, idx) => {
										const IconComponent = item.icon;
										return (
											<div
												key={`${expertise.id}-enjeu-${idx}-${item.text.substring(0, 20)}`}
												className="flex flex-col gap-4 bg-white/10 backdrop-blur-sm rounded-2xl p-7 hover:bg-white/15 transition-all duration-300 border border-white/10 hover:border-white/30"
											>
												<div className="flex items-start gap-3">
													<div className="flex-shrink-0 w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
														<IconComponent className="w-5 h-5 text-white" />
													</div>
													<p className="text-white/95 text-base leading-relaxed pt-1.5">
														{item.text}
													</p>
												</div>
											</div>
										);
									})}
								</div>
							</div>
						</motion.div>
					</section>
				))}
			</div>

			{/* Final CTA */}
			<motion.div
				initial="hidden"
				whileInView="visible"
				viewport={{ once: true }}
				variants={fadeInUp}
				className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-24 text-center"
			>
				<h2 className="font-playfair text-3xl md:text-4xl font-bold text-[var(--foreground)] mb-6">
					Prêt à discuter de votre projet ?
				</h2>
				<p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
					Nos associés sont à votre disposition pour échanger sur vos enjeux et
					vous accompagner dans vos réflexions stratégiques.
				</p>
				<Button asChild size="lg" className="btn-gold">
					<Link href="/contact">
						Nous contacter
						<ArrowRight className="ml-2 h-5 w-5" />
					</Link>
				</Button>
			</motion.div>
		</>
	);
}

/**
 * Expertises Page
 *
 * This page supports both:
 * 1. Dynamic content from the visual editor (when published)
 * 2. Static fallback content (default)
 *
 * When content is published via the visual editor at /admin/visual-editor,
 * it will automatically be displayed instead of the static content.
 */
export default function ExpertisesPage() {
	const { hasContent, sections, isLoading } = usePageContent("/expertises");

	return (
		<>
			<Navbar />
			<main className="min-h-screen pt-24 pb-20 bg-[var(--background)]">
				{/* Show dynamic content if available, otherwise show static fallback */}
				{hasContent && !isLoading ? (
					<SectionRenderer sections={sections} />
				) : (
					<StaticExpertisesContent />
				)}
			</main>
		</>
	);
}
