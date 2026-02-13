"use client";

/**
 * Alecia Numbers - M&A Financial Modeling Hub
 *
 * A comprehensive suite of financial tools for M&A professionals:
 * - Fee Calculator (Lehman formula)
 * - Valuation Multiples
 * - Due Diligence Checklist
 * - Financial Model 3-Statement
 * - Comparable Companies Analysis
 * - Deal Pipeline Dashboard
 * - And more...
 */

import { useState, useEffect } from "react";
import { numbersTools } from "@/actions";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	Calculator,
	TrendingUp,
	ClipboardCheck,
	FileSpreadsheet,
	BarChart3,
	PieChart,
	Calendar,
	Users,
	FileText,
	Briefcase,
	ArrowRight,
	Sparkles,
	Table2,
	Plus,
	Brain,
	Clock,
	Activity,
} from "lucide-react";
import { Link } from "@/i18n/navigation";

interface ActivityItem {
	id: string;
	type: string;
	title: string;
	description: string;
	createdAt: number | undefined;
	href: string;
}

interface ToolCard {
	id: string;
	title: string;
	description: string;
	icon: React.ElementType;
	href: string;
	badge?: string;
	badgeVariant?: "default" | "secondary" | "outline";
	status: "available" | "coming-soon" | "beta";
	category: "calculators" | "analysis" | "tracking" | "documents";
}

const tools: ToolCard[] = [
	{
		id: "fee-calculator",
		title: "Calculateur d'Honoraires",
		description:
			"Calcul automatique des fees M&A avec formule Lehman et generation de lettre d'engagement",
		icon: Calculator,
		href: "/admin/numbers/fee-calculator",
		badge: "Populaire",
		status: "available",
		category: "calculators",
	},
	{
		id: "valuation-multiples",
		title: "Multiples de Valorisation",
		description:
			"Analyse par multiples comparables avec calcul automatique des fourchettes de valeur",
		icon: TrendingUp,
		href: "/admin/numbers/valuation",
		status: "available",
		category: "calculators",
	},
	{
		id: "dd-checklist",
		title: "Checklist Due Diligence",
		description:
			"Suivi complet des travaux de DD avec 49 points de controle par categorie",
		icon: ClipboardCheck,
		href: "/admin/numbers/dd-checklist",
		status: "available",
		category: "tracking",
	},
	{
		id: "financial-model",
		title: "Modele Financier 3 Etats",
		description:
			"P&L, Bilan et Cash Flow sur 8 ans avec projections et scenarios",
		icon: FileSpreadsheet,
		href: "/admin/numbers/financial-model",
		badge: "Spreadsheet",
		status: "available",
		category: "analysis",
	},
	{
		id: "comparables",
		title: "Analyse Comparables",
		description:
			"Benchmark de societes comparables avec statistiques et valorisation implicite",
		icon: BarChart3,
		href: "/admin/numbers/comparables",
		status: "available",
		category: "analysis",
	},
	{
		id: "deal-pipeline",
		title: "Pipeline Dashboard",
		description:
			"Vue synthetique du pipeline avec metriques, funnel et valeur ponderee",
		icon: PieChart,
		href: "/admin/numbers/pipeline",
		status: "available",
		category: "tracking",
	},
	{
		id: "deal-timeline",
		title: "Timeline Transaction",
		description:
			"Planning Gantt interactif avec jalons, dependances et responsables",
		icon: Calendar,
		href: "/admin/numbers/timeline",
		status: "available",
		category: "tracking",
	},
	{
		id: "teaser-tracking",
		title: "Suivi Teasers & IM",
		description:
			"Tracking des envois de documents avec taux de reponse et NDA signes",
		icon: FileText,
		href: "/admin/numbers/teaser-tracking",
		status: "available",
		category: "documents",
	},
	{
		id: "post-deal",
		title: "Integration Post-Deal",
		description:
			"Checklist d'integration 100 jours avec synergies et KPIs",
		icon: Briefcase,
		href: "/admin/numbers/post-deal",
		status: "available",
		category: "tracking",
	},
];

const categories = [
	{ id: "all", label: "Tous les outils" },
	{ id: "calculators", label: "Calculateurs" },
	{ id: "analysis", label: "Analyse" },
	{ id: "tracking", label: "Suivi" },
	{ id: "documents", label: "Documents" },
];

export default function NumbersPage() {
	const [activeCategory, setActiveCategory] = useState("all");

	// Fetch recent activity from server actions
	const [recentActivity, setRecentActivity] = useState<any>(null);
	const [toolStats, setToolStats] = useState<any>(null);

	useEffect(() => {
		// TODO: numbersTools.getRecentActivity().then(setRecentActivity).catch(console.error);
		// TODO: numbersTools.getToolStats().then(setToolStats).catch(console.error);
	}, []);

	const filteredTools =
		activeCategory === "all"
			? tools
			: tools.filter((t) => t.category === activeCategory);

	const availableCount = tools.filter((t) => t.status === "available").length;
	const betaCount = tools.filter((t) => t.status === "beta").length;

	// Calculate total saved items
	const totalSavedItems = toolStats
		? toolStats.feeCalculations +
		  toolStats.financialModels +
		  toolStats.comparables +
		  toolStats.timelines +
		  toolStats.teaserTracking +
		  toolStats.postDeal
		: 0;

	return (
		<div className="space-y-6 p-6">
			{/* Header */}
			<div className="flex items-start justify-between">
				<div>
					<h1 className="text-3xl font-bold flex items-center gap-3">
						<div className="rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 p-2">
							<Table2 className="h-6 w-6 text-white" />
						</div>
						Alecia Numbers
					</h1>
					<p className="text-muted-foreground mt-2">
						Suite complete d&apos;outils de modelisation financiere pour les
						professionnels M&amp;A
					</p>
				</div>
				<Button asChild>
					<Link href="/admin/numbers/spreadsheet">
						<Plus className="h-4 w-4 mr-2" />
						Nouveau Spreadsheet
					</Link>
				</Button>
			</div>

			{/* Stats */}
			<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
				<Card>
					<CardContent className="pt-6">
						<div className="flex items-center gap-3">
							<div className="rounded-full bg-emerald-500/10 p-2">
								<Sparkles className="h-5 w-5 text-emerald-500" />
							</div>
							<div>
								<p className="text-2xl font-bold">{availableCount}</p>
								<p className="text-sm text-muted-foreground">Outils disponibles</p>
							</div>
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="pt-6">
						<div className="flex items-center gap-3">
							<div className="rounded-full bg-blue-500/10 p-2">
								<FileSpreadsheet className="h-5 w-5 text-blue-500" />
							</div>
							<div>
								<p className="text-2xl font-bold">{totalSavedItems}</p>
								<p className="text-sm text-muted-foreground">Documents sauvegardes</p>
							</div>
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="pt-6">
						<div className="flex items-center gap-3">
							<div className="rounded-full bg-amber-500/10 p-2">
								<Activity className="h-5 w-5 text-amber-500" />
							</div>
							<div>
								<p className="text-2xl font-bold">{recentActivity?.stats.thisWeek || 0}</p>
								<p className="text-sm text-muted-foreground">Cette semaine</p>
							</div>
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="pt-6">
						<div className="flex items-center gap-3">
							<div className="rounded-full bg-purple-500/10 p-2">
								<BarChart3 className="h-5 w-5 text-purple-500" />
							</div>
							<div>
								<p className="text-2xl font-bold">10</p>
								<p className="text-sm text-muted-foreground">Templates M&amp;A</p>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Category Filter */}
			<Tabs value={activeCategory} onValueChange={setActiveCategory}>
				<TabsList>
					{categories.map((cat) => (
						<TabsTrigger key={cat.id} value={cat.id}>
							{cat.label}
						</TabsTrigger>
					))}
				</TabsList>

				<TabsContent value={activeCategory} className="mt-6">
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
						{filteredTools.map((tool) => (
							<ToolCardComponent key={tool.id} tool={tool} />
						))}
					</div>
				</TabsContent>
			</Tabs>

			{/* Quick Actions */}
			<Card className="bg-gradient-to-r from-emerald-500/5 to-teal-500/5 border-emerald-500/20">
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Sparkles className="h-5 w-5 text-emerald-500" />
						Actions rapides
					</CardTitle>
					<CardDescription>
						Demarrez rapidement avec nos outils les plus utilises
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="flex flex-wrap gap-3">
						<Button variant="outline" asChild>
							<Link href="/admin/numbers/fee-calculator">
								<Calculator className="h-4 w-4 mr-2" />
								Calculer des honoraires
							</Link>
						</Button>
						<Button variant="outline" asChild>
							<Link href="/admin/numbers/valuation">
								<TrendingUp className="h-4 w-4 mr-2" />
								Estimer une valorisation
							</Link>
						</Button>
						<Button variant="outline" asChild>
							<Link href="/admin/numbers/dd-checklist">
								<ClipboardCheck className="h-4 w-4 mr-2" />
								Demarrer une DD
							</Link>
						</Button>
						<Button variant="outline" asChild>
							<Link href="/admin/numbers/spreadsheet">
								<FileSpreadsheet className="h-4 w-4 mr-2" />
								Creer un spreadsheet
							</Link>
						</Button>
					</div>
				</CardContent>
			</Card>

			{/* Recent Activity */}
			{recentActivity && recentActivity.items.length > 0 && (
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Clock className="h-5 w-5 text-muted-foreground" />
							Activite recente
						</CardTitle>
						<CardDescription>
							Vos derniers documents et analyses
						</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="space-y-3">
							{recentActivity.items.map((item: ActivityItem) => (
								<Link
									key={item.id}
									href={item.href}
									className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors group"
								>
									<div className="rounded-lg bg-muted p-2 group-hover:bg-emerald-500/10 transition-colors">
										<ActivityIcon type={item.type} />
									</div>
									<div className="flex-1 min-w-0">
										<p className="font-medium truncate">{item.title}</p>
										<p className="text-sm text-muted-foreground truncate">
											{item.description}
										</p>
									</div>
									<div className="text-xs text-muted-foreground">
										{formatRelativeTime(item.createdAt)}
									</div>
									<ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-emerald-500 transition-colors" />
								</Link>
							))}
						</div>
					</CardContent>
				</Card>
			)}

			{/* Business Intelligence Link */}
			<Card className="bg-gradient-to-r from-purple-500/5 to-indigo-500/5 border-purple-500/20">
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Brain className="h-5 w-5 text-purple-500" />
						Alecia Business Intelligence
					</CardTitle>
					<CardDescription>
						Generez des etudes de marche automatisees grace a l&apos;IA
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="flex items-center justify-between">
						<div className="text-sm text-muted-foreground">
							Analysez les tendances sectorielles et generez des rapports detailles pour vos deals M&amp;A
						</div>
						<Button asChild>
							<Link href="/admin/business-intelligence">
								<Brain className="h-4 w-4 mr-2" />
								Lancer une etude
								<ArrowRight className="h-4 w-4 ml-2" />
							</Link>
						</Button>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}

function ToolCardComponent({ tool }: { tool: ToolCard }) {
	const Icon = tool.icon;
	const isDisabled = tool.status === "coming-soon";

	const content = (
		<Card
			className={`group transition-all duration-200 ${
				isDisabled
					? "opacity-60 cursor-not-allowed"
					: "hover:shadow-lg hover:border-emerald-500/50 cursor-pointer"
			}`}
		>
			<CardHeader>
				<div className="flex items-start justify-between">
					<div className="rounded-lg bg-muted p-2 group-hover:bg-emerald-500/10 transition-colors">
						<Icon className="h-5 w-5 text-muted-foreground group-hover:text-emerald-500 transition-colors" />
					</div>
					{tool.badge && (
						<Badge variant={tool.badgeVariant || "default"}>{tool.badge}</Badge>
					)}
					{tool.status === "coming-soon" && (
						<Badge variant="secondary">Bientot</Badge>
					)}
				</div>
				<CardTitle className="text-lg mt-3">{tool.title}</CardTitle>
				<CardDescription className="line-clamp-2">
					{tool.description}
				</CardDescription>
			</CardHeader>
			<CardContent>
				<div className="flex items-center text-sm text-emerald-600 dark:text-emerald-400 group-hover:translate-x-1 transition-transform">
					{isDisabled ? "Disponible prochainement" : "Ouvrir l'outil"}
					{!isDisabled && <ArrowRight className="h-4 w-4 ml-1" />}
				</div>
			</CardContent>
		</Card>
	);

	if (isDisabled) {
		return content;
	}

	return <Link href={tool.href}>{content}</Link>;
}

// Helper component for activity icons
function ActivityIcon({ type }: { type: string }) {
	switch (type) {
		case "fee-calculator":
			return <Calculator className="h-4 w-4 text-muted-foreground" />;
		case "financial-model":
			return <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />;
		case "comparables":
			return <BarChart3 className="h-4 w-4 text-muted-foreground" />;
		case "timeline":
			return <Calendar className="h-4 w-4 text-muted-foreground" />;
		case "teaser-tracking":
			return <FileText className="h-4 w-4 text-muted-foreground" />;
		case "post-deal":
			return <Briefcase className="h-4 w-4 text-muted-foreground" />;
		default:
			return <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />;
	}
}

// Helper function for relative time formatting
function formatRelativeTime(timestamp: number | undefined): string {
	if (!timestamp) return "";

	const now = Date.now();
	const diff = now - timestamp;

	const minutes = Math.floor(diff / (1000 * 60));
	const hours = Math.floor(diff / (1000 * 60 * 60));
	const days = Math.floor(diff / (1000 * 60 * 60 * 24));

	if (minutes < 1) return "A l'instant";
	if (minutes < 60) return `Il y a ${minutes} min`;
	if (hours < 24) return `Il y a ${hours}h`;
	if (days < 7) return `Il y a ${days}j`;

	return new Date(timestamp).toLocaleDateString("fr-FR", {
		day: "numeric",
		month: "short",
	});
}
