import type { Metadata } from "next";
import Image from "next/image";
import {
	LayoutPanelTop,
	Lock,
	MessagesSquare,
	ShieldCheck,
	Workflow,
} from "lucide-react";

const suiteAssetBase = "/assets/suite";

const aleciaSuiteLogo = `${suiteAssetBase}/alecia-suite.png`;
const aleciaFrLogo = `${suiteAssetBase}/alecia-fr.png`;
const businessIntelligenceLogo = `${suiteAssetBase}/alecia-business-intelligence.png`;
const numbersLogo = `${suiteAssetBase}/alecia-numbers.png`;
const flowsLogo = `${suiteAssetBase}/alecia-flows.png`;
const signLogo = `${suiteAssetBase}/alecia-sign.png`;
const colabLogo = `${suiteAssetBase}/alecia-colab.png`;
const analyticsLogo = `${suiteAssetBase}/alecia-analytics.png`;

interface Props {
	params: Promise<{
		locale: string;
	}>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
	const { locale } = await params;
	const baseUrl = "https://alecia.markets";
	const canonical = `${baseUrl}/${locale}/suite`;

	return {
		title: "Alecia Suite | La plateforme M&A sur-mesure d’Alecia",
		description:
			"Une suite de logiciels web, conçue sur-mesure pour le conseil M&A mid-cap : CRM & market studies, calculs financiers, automatisations, data room & signature, collaboration et analytics.",
		alternates: {
			canonical,
			languages: {
				fr: `${baseUrl}/fr/suite`,
				en: `${baseUrl}/en/suite`,
			},
		},
		openGraph: {
			title: "Alecia Suite",
			description:
				"La plateforme M&A conçue sur-mesure : origination, exécution, data room, signature, collaboration et pilotage.",
			url: canonical,
			siteName: "Alecia",
			type: "website",
			locale,
		},
	};
}

function SuiteGlobe() {
	const nodes = [
		{ label: "alecia.fr", href: "#module-alecia-fr", tone: "from-alecia-midnight to-alecia-corporate", logo: aleciaFrLogo },
		{ label: "Business Intelligence", href: "#module-bi", tone: "from-alecia-corporate to-alecia-mid", logo: businessIntelligenceLogo },
		{ label: "Numbers", href: "#module-numbers", tone: "from-alecia-midnight to-alecia-mid", logo: numbersLogo },
		{ label: "Flows", href: "#module-flows", tone: "from-alecia-mid to-alecia-light", logo: flowsLogo },
		{ label: "Sign", href: "#module-sign", tone: "from-alecia-corporate to-alecia-light", logo: signLogo },
		{ label: "Colab", href: "#module-colab", tone: "from-alecia-midnight to-alecia-light", logo: colabLogo },
		{ label: "Analytics", href: "#module-analytics", tone: "from-alecia-mid to-alecia-corporate", logo: analyticsLogo },
	] as const;

	const positions = [
		"top-[8%] left-[10%]",
		"top-[18%] right-[6%]",
		"top-1/2 right-[-2%] -translate-y-1/2",
		"bottom-[20%] right-[10%]",
		"bottom-[8%] left-[18%]",
		"top-1/2 left-[-2%] -translate-y-1/2",
		"top-[30%] left-[55%] -translate-x-1/2",
	] as const;

	return (
		<div className="relative w-full max-w-[720px] mx-auto">
			<div className="absolute -inset-16 bg-[radial-gradient(circle_at_30%_30%,rgba(67,112,167,0.35),transparent_45%),radial-gradient(circle_at_70%_80%,rgba(22,62,100,0.28),transparent_50%)] blur-2xl" />

			<div className="relative aspect-square">
				<div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.9),rgba(227,242,253,0.6)_35%,rgba(191,215,234,0.2)_60%,transparent_75%)]" />
				<div className="absolute inset-0 rounded-full bg-gradient-to-br from-alecia-off-white via-[var(--alecia-blue-ice)] to-[var(--alecia-blue-pale)] border border-[var(--border)] shadow-[var(--shadow-navy-xl)] overflow-hidden">
					<div className="absolute inset-0 opacity-[0.55] motion-safe:animate-[spin_46s_linear_infinite] motion-reduce:animate-none">
						<div className="absolute inset-10 rounded-full border border-[rgba(6,26,64,0.14)]" />
						<div className="absolute inset-16 rounded-full border border-[rgba(67,112,167,0.22)]" />
						<div className="absolute inset-0 rounded-full border border-[rgba(6,26,64,0.12)] [transform:rotate(24deg)_scaleY(0.78)]" />
						<div className="absolute inset-0 rounded-full border border-[rgba(6,26,64,0.10)] [transform:rotate(78deg)_scaleY(0.78)]" />
						<div className="absolute inset-0 rounded-full border border-[rgba(67,112,167,0.10)] [transform:rotate(132deg)_scaleY(0.78)]" />
					</div>

					<div className="absolute inset-0 opacity-[0.65] motion-safe:animate-[spin_64s_linear_infinite] motion-reduce:animate-none">
						<div className="absolute left-1/2 top-1/2 size-[10px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[rgba(6,26,64,0.12)] shadow-[0_0_0_10px_rgba(6,26,64,0.05)]" />
						<div className="absolute left-[16%] top-[32%] size-[7px] rounded-full bg-[rgba(67,112,167,0.18)]" />
						<div className="absolute left-[64%] top-[22%] size-[6px] rounded-full bg-[rgba(22,62,100,0.16)]" />
						<div className="absolute left-[74%] top-[62%] size-[7px] rounded-full bg-[rgba(6,26,64,0.12)]" />
						<div className="absolute left-[28%] top-[70%] size-[6px] rounded-full bg-[rgba(67,112,167,0.16)]" />
					</div>
				</div>

				<div className="absolute inset-0 flex items-center justify-center">
					<div className="rounded-3xl border border-[rgba(6,26,64,0.12)] bg-white/70 backdrop-blur-md px-6 py-4 shadow-[var(--shadow-navy-lg)]">
						<div className="flex items-center justify-center gap-4">
							<Image
								src={aleciaSuiteLogo}
								alt=""
								width={168}
								height={40}
								className="h-8 w-auto"
								priority
							/>
							<div className="text-left">
								<p className="text-[11px] tracking-wide uppercase text-muted-foreground">
									Outil interne
								</p>
								<p className="font-playfair text-3xl text-gradient-alecia font-semibold">
									Alecia Suite
								</p>
							</div>
						</div>
					</div>
				</div>

				<div className="absolute inset-0">
					{nodes.map((node, index) => (
						<a
							key={node.label}
							href={node.href}
							className={`absolute ${positions[index]} group`}
							aria-label={node.label}
						>
							<span className="inline-flex items-center gap-3 rounded-full border border-[rgba(6,26,64,0.14)] bg-white/85 backdrop-blur px-4 py-2 text-sm font-medium text-[var(--foreground)] shadow-[var(--shadow-navy-sm)] transition-transform motion-safe:group-hover:-translate-y-0.5">
								<span
									className={`grid place-items-center size-10 rounded-full bg-gradient-to-br ${node.tone} shadow-[0_0_0_10px_rgba(67,112,167,0.10)]`}
									aria-hidden="true"
								>
									<Image
										src={node.logo}
										alt=""
										width={32}
										height={32}
										className="size-7 object-contain"
									/>
								</span>
								<span className="hidden sm:inline">{node.label}</span>
							</span>
						</a>
					))}
				</div>
			</div>
		</div>
	);
}

function ModuleCard(props: {
	id: string;
	logo: string;
	logoAlt: string;
	title: string;
	subtitle: string;
	bullets: string[];
}) {
	return (
		<section
			id={props.id}
			className="bg-card rounded-2xl border border-[var(--border)] p-7 shadow-sm card-hover"
		>
			<div className="flex items-start gap-5">
				<div className="shrink-0 rounded-2xl border border-[var(--border)] bg-[var(--background)] p-4 shadow-[var(--shadow-navy-sm)]">
					<Image
						src={props.logo}
						alt={props.logoAlt}
						width={200}
						height={48}
						className="h-10 w-auto"
					/>
				</div>
				<div className="min-w-0">
					<h3 className="text-xl font-semibold text-[var(--foreground)]">
						{props.title}
					</h3>
					<p className="mt-2 text-sm text-muted-foreground leading-relaxed">
						{props.subtitle}
					</p>
				</div>
			</div>

			<ul className="mt-5 space-y-2 text-sm text-[var(--foreground)]">
				{props.bullets.map((bullet) => (
					<li key={bullet} className="flex items-start gap-2">
						<span
							className="mt-1 size-1.5 rounded-full bg-alecia-midnight/70"
							aria-hidden="true"
						/>
						<span className="text-muted-foreground">{bullet}</span>
					</li>
				))}
			</ul>
		</section>
	);
}

export default function SuitePage() {
	return (
		<div className="bg-[var(--background)]">
			<header className="relative overflow-hidden">
				<div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(67,112,167,0.16),transparent_48%),radial-gradient(circle_at_15%_90%,rgba(22,62,100,0.12),transparent_55%)]" />
				<div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-18 md:pt-22 pb-12 md:pb-16">
					<div className="max-w-3xl mx-auto text-center">
						<h1 className="font-playfair text-5xl md:text-7xl font-semibold tracking-tight text-[var(--foreground)]">
							<span className="block text-gradient-alecia">Alecia Suite</span>
						</h1>
						<p className="mt-6 text-lg md:text-xl text-muted-foreground leading-relaxed">
							Suite logicielle interne, conçue exclusivement pour les équipes d’Alecia.
							Elle n’est pas commercialisée : c’est un socle sur-mesure, aligné sur
							les méthodes et exigences du M&A mid-cap.
						</p>
					</div>

					<div className="mt-10 md:mt-14">
						<SuiteGlobe />
						<p className="mt-7 text-center text-xs text-muted-foreground">
							Cliquer sur un logo vous amène à la section correspondante.
						</p>
					</div>
				</div>
			</header>

			<main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
				<section className="pt-14 md:pt-16">
					<div className="grid grid-cols-1 lg:grid-cols-3 gap-10 lg:gap-12 items-start">
						<div className="lg:col-span-2">
							<h2 className="font-playfair text-4xl md:text-5xl font-semibold text-[var(--foreground)]">
								Un socle interne pour exécuter, mieux
							</h2>
							<p className="mt-5 text-lg text-muted-foreground leading-relaxed">
								Alecia Suite outille l’ensemble de la chaîne de valeur : origination,
								exécution, production documentaire, data room, calculs, collaboration
								et pilotage. L’enjeu est de standardiser ce qui doit l’être,
								et de rester flexible là où chaque mandat est différent.
							</p>
						</div>
						<aside className="rounded-2xl border border-[var(--border)] bg-white p-7 shadow-sm">
							<h3 className="text-sm font-semibold text-[var(--foreground)]">
								Principes de conception
							</h3>
							<ul className="mt-4 space-y-3 text-sm text-muted-foreground">
								<li className="flex items-start gap-3">
									<ShieldCheck className="mt-0.5 size-4 text-alecia-midnight" aria-hidden="true" />
									Gouvernance et traçabilité, sans alourdir l’opérationnel.
								</li>
								<li className="flex items-start gap-3">
									<Workflow className="mt-0.5 size-4 text-alecia-midnight" aria-hidden="true" />
									Automatisation ciblée des tâches répétitives et des contrôles.
								</li>
								<li className="flex items-start gap-3">
									<Lock className="mt-0.5 size-4 text-alecia-midnight" aria-hidden="true" />
									Sécurité de bout en bout : accès, preuves, logs, conformité.
								</li>
								<li className="flex items-start gap-3">
									<MessagesSquare className="mt-0.5 size-4 text-alecia-midnight" aria-hidden="true" />
									Un espace de travail conçu “par l’équipe, pour l’équipe”.
								</li>
							</ul>
						</aside>
					</div>
				</section>

				<section className="pt-14 md:pt-16" aria-labelledby="modules-title">
					<div className="flex items-end justify-between gap-6 flex-wrap">
						<div>
							<h2
								id="modules-title"
								className="font-playfair text-4xl md:text-5xl font-semibold text-[var(--foreground)]"
							>
								Les modules
							</h2>
							<p className="mt-3 text-muted-foreground text-lg max-w-3xl leading-relaxed">
								Des briques internes, cohérentes entre elles : référentiels,
								permissions, historisation et automatismes.
							</p>
						</div>
					</div>

					<div className="mt-10 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
						<ModuleCard
							id="module-alecia-fr"
							logo={aleciaFrLogo}
							logoAlt="Logo alecia.fr"
							title="alecia.fr — Site & Studio"
							subtitle="Le site vitrine nouvelle génération, couplé à un studio visuel sur-mesure pour piloter l’image et le contenu en autonomie."
							bullets={[
								"Éditeur visuel pour publier et itérer sans friction.",
								"Gestion des articles, offres, tombstones et assets sociaux.",
								"Workflow d’approbation et historique des versions.",
							]}
						/>
						<ModuleCard
							id="module-bi"
							logo={businessIntelligenceLogo}
							logoAlt="Logo Alecia Business Intelligence"
							title="Business Intelligence"
							subtitle="CRM, datasets et études de marché : l’outil d’origination et de connaissance sectorielle, enrichi automatiquement."
							bullets={[
								"Gestion des leads, process et opérations (passées, en cours, à venir).",
								"Génération d’études sectorielles assistée par IA et fact-checking.",
								"Enrichissement et veille : banques M&A, news éco/finance, signaux.",
							]}
						/>
						<ModuleCard
							id="module-numbers"
							logo={numbersLogo}
							logoAlt="Logo Alecia Numbers"
							title="Numbers"
							subtitle="Le framework de calcul corporate finance : modèles, runners, templates et outils tableur, pensés pour la production M&A."
							bullets={[
								"Bibliothèque de templates et workbooks orientés exécution.",
								"Runners de calculs sur-mesure (valorisation, fees, scénarios).",
								"Exports et formats compatibles pour partager et auditer.",
							]}
						/>
						<ModuleCard
							id="module-flows"
							logo={flowsLogo}
							logoAlt="Logo Alecia Flows"
							title="Flows"
							subtitle="Un outil d’automatisation propriétaire, inspiré d’un n8n orienté M&A : des workflows utiles, sans code, et réellement actionnables."
							bullets={[
								"Automatisations conçues pour les process d’origination et d’exécution.",
								"Connecteurs internes : CRM, documents, data room, notifications.",
								"Déclencheurs et contrôles pour fiabiliser la production.",
							]}
						/>
						<ModuleCard
							id="module-sign"
							logo={signLogo}
							logoAlt="Logo Alecia Sign"
							title="Sign"
							subtitle="Signature électronique et data room maîtrisées : certificats valides, API et contrôle des coûts et des données."
							bullets={[
								"Parcours de signature clair, horodatage et preuves.",
								"API d’intégration et logs pour audit et conformité.",
								"Gestion des accès et des périmètres de diffusion.",
							]}
						/>
						<ModuleCard
							id="module-colab"
							logo={colabLogo}
							logoAlt="Logo Alecia Colab"
							title="Colab"
							subtitle="Le workspace collaboratif “Notion-like” d’Alecia : documents, kanbans, commentaires live, tableaux, et collaboration sécurisée."
							bullets={[
								"Édition simultanée et historique : une production collective et tracée.",
								"Briques métier : pipeline, boards, documents et templates.",
								"Pensé “par l’équipe, pour l’équipe”, avec exigences M&A.",
							]}
						/>
						<ModuleCard
							id="module-analytics"
							logo={analyticsLogo}
							logoAlt="Logo Alecia Analytics"
							title="Analytics"
							subtitle="Une brique de pilotage self-hosted : mesure des workflows métier et des performances web/social, au même endroit."
							bullets={[
								"Suivi exhaustif des flux : activité, délais, qualité et conformité.",
								"Trafic site & campagnes : lecture simple et actionnable.",
								"Pensé pour explorer, contrôler et améliorer en continu.",
							]}
						/>
					</div>
				</section>

				<section className="pt-14 md:pt-16">
					<div className="rounded-3xl border border-[var(--border)] bg-white p-8 md:p-10 shadow-sm">
						<div className="grid grid-cols-1 lg:grid-cols-3 gap-10 lg:gap-12 items-start">
							<div className="lg:col-span-2">
								<h2 className="font-playfair text-3xl md:text-4xl font-semibold text-[var(--foreground)]">
									Une suite cohérente, pas un empilement
								</h2>
								<p className="mt-4 text-muted-foreground leading-relaxed">
									Chaque module a une responsabilité claire, et la suite conserve une
									colonne vertébrale commune : permissions, référentiels, traces,
									exportabilité et intégrations. Cela permet d’industrialiser les
									bonnes pratiques et de garder la maîtrise sur les données.
								</p>
								<div className="mt-7 grid grid-cols-1 sm:grid-cols-2 gap-5">
									<div className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-5">
										<p className="text-sm font-semibold text-[var(--foreground)]">
											Studio → diffusion
										</p>
										<p className="mt-2 text-sm text-muted-foreground">
											Production de contenu maîtrisée, publication, traçabilité et
											retour sur impact.
										</p>
									</div>
									<div className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-5">
										<p className="text-sm font-semibold text-[var(--foreground)]">
											Origination → exécution
										</p>
										<p className="mt-2 text-sm text-muted-foreground">
											Du lead à l’opération : une continuité de données et de décisions.
										</p>
									</div>
									<div className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-5">
										<p className="text-sm font-semibold text-[var(--foreground)]">
											Closing → conformité
										</p>
										<p className="mt-2 text-sm text-muted-foreground">
											Data room, signature, preuves, journaux et contrôles.
										</p>
									</div>
									<div className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-5">
										<p className="text-sm font-semibold text-[var(--foreground)]">
											Automatisations
										</p>
										<p className="mt-2 text-sm text-muted-foreground">
											Moins de tâches répétitives, plus de temps pour l’analyse et le
											relationnel.
										</p>
									</div>
								</div>
							</div>
							<div className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-6">
								<h3 className="text-sm font-semibold text-[var(--foreground)]">
									Sécurité & gouvernance
								</h3>
								<ul className="mt-4 space-y-3 text-sm text-muted-foreground">
									<li className="flex items-start gap-3">
										<Lock className="mt-0.5 size-4 text-alecia-midnight" aria-hidden="true" />
										Contrôles d’accès, cloisonnement et traçabilité.
									</li>
									<li className="flex items-start gap-3">
										<LayoutPanelTop className="mt-0.5 size-4 text-alecia-midnight" aria-hidden="true" />
										Interfaces pensées pour réduire les erreurs de production.
									</li>
									<li className="flex items-start gap-3">
										<Workflow className="mt-0.5 size-4 text-alecia-midnight" aria-hidden="true" />
										Automatisations avec garde-fous et logs.
									</li>
								</ul>
							</div>
						</div>
					</div>
				</section>

			</main>
		</div>
	);
}
