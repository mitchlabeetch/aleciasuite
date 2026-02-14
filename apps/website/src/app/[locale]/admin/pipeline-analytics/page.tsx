"use client";

/**
 * Pipeline Analytics Dashboard (Phase 2.1)
 *
 * Advanced analytics for M&A deal pipeline including:
 * - Stage velocity (time spent in each stage)
 * - Conversion funnel with rates
 * - Pipeline health score
 * - Deal journey visualization
 */

import { useState, useEffect } from "react";
import { analyticsActions } from "@/actions";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	BarChart3,
	TrendingUp,
	Clock,
	AlertTriangle,
	CheckCircle2,
	Info,
	Gauge,
	GitBranch,
	Zap,
	Target,
	ArrowRight,
	Loader2,
	Activity,
	AlertCircle,
} from "lucide-react";
import {
	BarChart,
	Bar,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	ResponsiveContainer,
	Cell,
} from "recharts";

// Type definitions
interface VelocityData {
	velocityByStage: Array<{
		stage: string;
		label: string;
		avgDays: number;
		avgMs: number;
		sampleSize: number;
	}>;
	avgCycleTimeDays: number;
	totalHistoryRecords: number;
}

interface ConversionData {
	funnelConversion: Array<{
		stage: string;
		label: string;
		currentDeals: number;
		advancedToNext: number;
		closedWon: number;
		closedLost: number;
		conversionRate: number;
		lossRate: number;
	}>;
	overallWinRate: number;
	transitionMatrix: Record<string, Record<string, number>>;
}

interface HealthData {
	healthScore: number;
	healthLabel: string;
	indicators: {
		stalledDeals: number;
		overdueDeals: number;
		noCloseDateDeals: number;
		unassignedDeals: number;
		noValueDeals: number;
		earlyStageDeals: number;
		lateStageDeals: number;
	};
	insights: Array<{ type: "warning" | "info" | "success"; message: string }>;
	activeDealsCount: number;
	recentStageChanges: number;
	totalPipelineValue: number;
}

// Colors
const CHART_COLORS = {
	primary: "#3b82f6",
	success: "#22c55e",
	warning: "#f59e0b",
	danger: "#ef4444",
	purple: "#8b5cf6",
	cyan: "#06b6d4",
	slate: "#64748b",
};

const STAGE_COLORS: Record<string, string> = {
	sourcing: "#94a3b8",
	qualification: "#3b82f6",
	initial_meeting: "#8b5cf6",
	analysis: "#06b6d4",
	valuation: "#f59e0b",
	due_diligence: "#ec4899",
	negotiation: "#f97316",
	closing: "#22c55e",
};

// Format currency
function formatCurrency(value: number): string {
	if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M€`;
	if (value >= 1000) return `${(value / 1000).toFixed(0)}K€`;
	return `${value}€`;
}

// Health score gauge component
function HealthGauge({ score, label }: { score: number; label: string }) {
	const getColor = () => {
		if (score >= 80) return "text-green-500";
		if (score >= 60) return "text-yellow-500";
		if (score >= 40) return "text-orange-500";
		return "text-red-500";
	};

	const getBgColor = () => {
		if (score >= 80) return "bg-green-500";
		if (score >= 60) return "bg-yellow-500";
		if (score >= 40) return "bg-orange-500";
		return "bg-red-500";
	};

	return (
		<div className="flex flex-col items-center">
			<div className="relative w-32 h-32">
				<svg className="w-full h-full transform -rotate-90">
					<circle
						cx="64"
						cy="64"
						r="56"
						stroke="currentColor"
						strokeWidth="12"
						fill="none"
						className="text-muted/20"
					/>
					<circle
						cx="64"
						cy="64"
						r="56"
						stroke="currentColor"
						strokeWidth="12"
						fill="none"
						strokeDasharray={`${(score / 100) * 352} 352`}
						className={getColor()}
						strokeLinecap="round"
					/>
				</svg>
				<div className="absolute inset-0 flex flex-col items-center justify-center">
					<span className={`text-3xl font-bold ${getColor()}`}>{score}</span>
					<span className="text-xs text-muted-foreground">/ 100</span>
				</div>
			</div>
			<Badge className={`mt-2 ${getBgColor()} text-white`}>{label}</Badge>
		</div>
	);
}

// Insight item component
function InsightItem({
	type,
	message,
}: {
	type: "warning" | "info" | "success";
	message: string;
}) {
	const icons = {
		warning: AlertTriangle,
		info: Info,
		success: CheckCircle2,
	};
	const colors = {
		warning: "text-orange-500 bg-orange-50 dark:bg-orange-900/20",
		info: "text-blue-500 bg-blue-50 dark:bg-blue-900/20",
		success: "text-green-500 bg-green-50 dark:bg-green-900/20",
	};

	const Icon = icons[type];

	return (
		<div className={`flex items-center gap-3 p-3 rounded-lg ${colors[type]}`}>
			<Icon className="h-5 w-5 flex-shrink-0" />
			<span className="text-sm">{message}</span>
		</div>
	);
}

// Stat card component
function StatCard({
	title,
	value,
	subtitle,
	icon: Icon,
	iconColor,
}: {
	title: string;
	value: string | number;
	subtitle?: string;
	icon: React.ElementType;
	iconColor: string;
}) {
	return (
		<Card>
			<CardContent className="pt-4">
				<div className="flex items-start justify-between">
					<div>
						<p className="text-sm text-muted-foreground">{title}</p>
						<p className="text-2xl font-bold mt-1">{value}</p>
						{subtitle && (
							<p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
						)}
					</div>
					<div
						className={`h-10 w-10 rounded-lg flex items-center justify-center ${iconColor}`}
					>
						<Icon className="h-5 w-5" />
					</div>
				</div>
			</CardContent>
		</Card>
	);
}

// Velocity bar chart tooltip
function VelocityTooltip({ active, payload, label }: any) {
	if (!active || !payload || !payload.length) return null;

	return (
		<div className="bg-popover border rounded-lg shadow-lg p-3">
			<p className="font-medium">{label}</p>
			<p className="text-sm text-muted-foreground">
				Durée moyenne:{" "}
				<span className="font-medium text-foreground">
					{payload[0].value} jours
				</span>
			</p>
			<p className="text-xs text-muted-foreground mt-1">
				Basé sur {payload[0].payload.sampleSize} transition(s)
			</p>
		</div>
	);
}

// Conversion funnel tooltip
function _FunnelTooltip({ active, payload }: any) {
	if (!active || !payload || !payload.length) return null;

	const data = payload[0].payload;

	return (
		<div className="bg-popover border rounded-lg shadow-lg p-3">
			<p className="font-medium">{data.label}</p>
			<div className="grid grid-cols-2 gap-2 mt-2 text-sm">
				<div>
					<span className="text-muted-foreground">En cours:</span>
					<span className="font-medium ml-1">{data.currentDeals}</span>
				</div>
				<div>
					<span className="text-muted-foreground">Conversion:</span>
					<span className="font-medium ml-1 text-green-500">
						{data.conversionRate}%
					</span>
				</div>
				<div>
					<span className="text-muted-foreground">Gagnés:</span>
					<span className="font-medium ml-1 text-green-500">
						{data.closedWon}
					</span>
				</div>
				<div>
					<span className="text-muted-foreground">Perdus:</span>
					<span className="font-medium ml-1 text-red-500">
						{data.closedLost}
					</span>
				</div>
			</div>
		</div>
	);
}

export default function PipelineAnalyticsPage() {
	const [selectedTab, setSelectedTab] = useState("overview");

	const [velocity, setVelocity] = useState<VelocityData | undefined>(undefined);
	const [conversion, setConversion] = useState<ConversionData | undefined>(undefined);
	const [health, setHealth] = useState<HealthData | undefined>(undefined);
	const [pipelineAnalytics, setPipelineAnalytics] = useState<any>(undefined);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		// Stub analytics functions not yet ported
		const getStageVelocity = async () => ({
			velocityByStage: [],
			avgCycleTimeDays: 0,
			totalHistoryRecords: 0,
		});
		const getConversionRates = async () => ({
			funnelConversion: [],
			overallWinRate: 0,
			transitionMatrix: {},
		});
		const getPipelineHealth = async () => ({
			healthScore: 0,
			healthLabel: "N/A",
			indicators: {
				stalledDeals: 0,
				overdueDeals: 0,
				noCloseDateDeals: 0,
				unassignedDeals: 0,
				noValueDeals: 0,
				earlyStageDeals: 0,
				lateStageDeals: 0,
			},
			insights: [],
			activeDealsCount: 0,
			recentStageChanges: 0,
			totalPipelineValue: 0,
		});
		const getPipelineAnalytics = async () => ({ summary: {}, trends: [] });

		Promise.all([
			getStageVelocity(),
			getConversionRates(),
			getPipelineHealth(),
			getPipelineAnalytics(),
		])
			.then(([vel, conv, hlth, pipe]) => {
				setVelocity(vel as VelocityData);
				setConversion(conv as ConversionData);
				setHealth(hlth as HealthData);
				setPipelineAnalytics(pipe);
			})
			.finally(() => setLoading(false));
	}, []);

	if (loading) {
		return (
			<div className="flex items-center justify-center min-h-[400px]">
				<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
			</div>
		);
	}

	if (!velocity || !conversion || !health) {
		return (
			<div className="flex items-center justify-center min-h-[400px]">
				<p className="text-muted-foreground">
					Connectez-vous pour voir les analytics.
				</p>
			</div>
		);
	}

	const velocityData = velocity as VelocityData;
	const conversionData = conversion as ConversionData;
	const healthData = health as HealthData;

	// Prepare funnel data with values for visualization
	const _funnelData = conversionData.funnelConversion.map((stage, _index) => ({
		...stage,
		value: Math.max(stage.currentDeals, 1), // Ensure minimum value for visibility
		fill: STAGE_COLORS[stage.stage] || CHART_COLORS.slate,
	}));

	return (
		<div className="space-y-6 p-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold flex items-center gap-2">
						<BarChart3 className="h-8 w-8 text-primary" />
						Pipeline Analytics
					</h1>
					<p className="text-muted-foreground">
						Analyse avancée de la vélocité et des conversions du pipeline M&A.
					</p>
				</div>
			</div>

			{/* Key Metrics Row */}
			<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
				<StatCard
					title="Cycle Moyen"
					value={`${velocityData.avgCycleTimeDays} jours`}
					subtitle="Création → Closing"
					icon={Clock}
					iconColor="bg-blue-500/10 text-blue-500"
				/>
				<StatCard
					title="Taux de Conversion"
					value={`${conversionData.overallWinRate}%`}
					subtitle="Deals gagnés"
					icon={Target}
					iconColor="bg-green-500/10 text-green-500"
				/>
				<StatCard
					title="Deals Actifs"
					value={healthData.activeDealsCount}
					subtitle={formatCurrency(healthData.totalPipelineValue)}
					icon={Activity}
					iconColor="bg-purple-500/10 text-purple-500"
				/>
				<StatCard
					title="Mouvements Récents"
					value={healthData.recentStageChanges}
					subtitle="30 derniers jours"
					icon={GitBranch}
					iconColor="bg-orange-500/10 text-orange-500"
				/>
			</div>

			<Tabs value={selectedTab} onValueChange={setSelectedTab}>
				<TabsList className="grid w-full grid-cols-4 lg:w-auto lg:grid-cols-none lg:inline-flex">
					<TabsTrigger value="overview" className="gap-2">
						<Gauge className="h-4 w-4" />
						<span className="hidden sm:inline">Vue d&apos;ensemble</span>
					</TabsTrigger>
					<TabsTrigger value="velocity" className="gap-2">
						<Zap className="h-4 w-4" />
						<span className="hidden sm:inline">Vélocité</span>
					</TabsTrigger>
					<TabsTrigger value="conversion" className="gap-2">
						<TrendingUp className="h-4 w-4" />
						<span className="hidden sm:inline">Conversion</span>
					</TabsTrigger>
					<TabsTrigger value="health" className="gap-2">
						<Activity className="h-4 w-4" />
						<span className="hidden sm:inline">Santé</span>
					</TabsTrigger>
				</TabsList>

				{/* Overview Tab */}
				<TabsContent value="overview" className="space-y-6 mt-6">
					<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
						{/* Health Score */}
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<Gauge className="h-5 w-5" />
									Santé du Pipeline
								</CardTitle>
								<CardDescription>
									Score basé sur l&apos;activité et la qualité des données
								</CardDescription>
							</CardHeader>
							<CardContent className="flex flex-col items-center">
								<HealthGauge
									score={healthData.healthScore}
									label={healthData.healthLabel}
								/>
								<div className="mt-6 w-full space-y-2">
									{healthData.insights.slice(0, 3).map((insight, idx) => (
										<InsightItem
											key={idx}
											type={insight.type}
											message={insight.message}
										/>
									))}
								</div>
							</CardContent>
						</Card>

						{/* Velocity Overview */}
						<Card className="lg:col-span-2">
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<Zap className="h-5 w-5" />
									Temps par Étape
								</CardTitle>
								<CardDescription>
									Durée moyenne passée dans chaque étape du pipeline
								</CardDescription>
							</CardHeader>
							<CardContent>
								<div className="h-[300px]">
									<ResponsiveContainer width="100%" height="100%">
										<BarChart
											data={velocityData.velocityByStage}
											layout="vertical"
											margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
										>
											<CartesianGrid
												strokeDasharray="3 3"
												horizontal={true}
												vertical={false}
											/>
											<XAxis type="number" unit=" j" />
											<YAxis dataKey="label" type="category" width={90} />
											<Tooltip content={<VelocityTooltip />} />
											<Bar dataKey="avgDays" radius={[0, 4, 4, 0]}>
												{velocityData.velocityByStage.map((entry) => (
													<Cell
														key={entry.stage}
														fill={
															STAGE_COLORS[entry.stage] || CHART_COLORS.slate
														}
													/>
												))}
											</Bar>
										</BarChart>
									</ResponsiveContainer>
								</div>
							</CardContent>
						</Card>
					</div>

					{/* Conversion Funnel Overview */}
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<TrendingUp className="h-5 w-5" />
								Entonnoir de Conversion
							</CardTitle>
							<CardDescription>
								Progression des deals à travers les étapes du pipeline
							</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="grid grid-cols-1 lg:grid-cols-8 gap-4">
								{conversionData.funnelConversion.map((stage, index) => (
									<div key={stage.stage} className="flex flex-col items-center">
										<div
											className="w-full h-24 rounded-lg flex items-center justify-center text-white font-bold text-2xl relative"
											style={{
												backgroundColor:
													STAGE_COLORS[stage.stage] || CHART_COLORS.slate,
											}}
										>
											{stage.currentDeals}
											<div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 translate-y-full">
												{index < conversionData.funnelConversion.length - 1 && (
													<ArrowRight className="h-4 w-4 text-muted-foreground" />
												)}
											</div>
										</div>
										<p className="text-xs text-center mt-3 font-medium">
											{stage.label}
										</p>
										<Badge
											variant={
												stage.conversionRate >= 50 ? "default" : "secondary"
											}
											className="mt-1"
										>
											{stage.conversionRate}%
										</Badge>
									</div>
								))}
							</div>
						</CardContent>
					</Card>
				</TabsContent>

				{/* Velocity Tab */}
				<TabsContent value="velocity" className="space-y-6 mt-6">
					<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
						<Card>
							<CardHeader>
								<CardTitle>Vélocité par Étape</CardTitle>
								<CardDescription>
									Temps moyen passé dans chaque étape (en jours)
								</CardDescription>
							</CardHeader>
							<CardContent>
								<div className="h-[400px]">
									<ResponsiveContainer width="100%" height="100%">
										<BarChart
											data={velocityData.velocityByStage}
											layout="vertical"
											margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
										>
											<CartesianGrid
												strokeDasharray="3 3"
												horizontal={true}
												vertical={false}
											/>
											<XAxis type="number" unit=" jours" />
											<YAxis dataKey="label" type="category" width={90} />
											<Tooltip content={<VelocityTooltip />} />
											<Bar dataKey="avgDays" radius={[0, 4, 4, 0]}>
												{velocityData.velocityByStage.map((entry) => (
													<Cell
														key={entry.stage}
														fill={
															STAGE_COLORS[entry.stage] || CHART_COLORS.slate
														}
													/>
												))}
											</Bar>
										</BarChart>
									</ResponsiveContainer>
								</div>
							</CardContent>
						</Card>

						<Card>
							<CardHeader>
								<CardTitle>Détail par Étape</CardTitle>
								<CardDescription>
									Statistiques détaillées de vélocité
								</CardDescription>
							</CardHeader>
							<CardContent>
								<div className="space-y-4">
									{velocityData.velocityByStage.map((stage) => (
										<div key={stage.stage} className="space-y-2">
											<div className="flex items-center justify-between">
												<div className="flex items-center gap-2">
													<div
														className="w-3 h-3 rounded-full"
														style={{
															backgroundColor: STAGE_COLORS[stage.stage],
														}}
													/>
													<span className="font-medium">{stage.label}</span>
												</div>
												<div className="flex items-center gap-4 text-sm">
													<span className="text-muted-foreground">
														{stage.sampleSize} transition(s)
													</span>
													<Badge variant="outline">{stage.avgDays} jours</Badge>
												</div>
											</div>
											<Progress
												value={Math.min(
													(stage.avgDays / velocityData.avgCycleTimeDays) * 100,
													100,
												)}
												className="h-2"
											/>
										</div>
									))}
								</div>

								<div className="mt-6 p-4 bg-muted/50 rounded-lg">
									<div className="flex items-center justify-between">
										<span className="font-medium">Cycle Total Moyen</span>
										<span className="text-2xl font-bold text-primary">
											{velocityData.avgCycleTimeDays} jours
										</span>
									</div>
									<p className="text-xs text-muted-foreground mt-1">
										Basé sur {velocityData.totalHistoryRecords} transitions
										enregistrées
									</p>
								</div>
							</CardContent>
						</Card>
					</div>
				</TabsContent>

				{/* Conversion Tab */}
				<TabsContent value="conversion" className="space-y-6 mt-6">
					<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
						<Card>
							<CardHeader>
								<CardTitle>Taux de Conversion</CardTitle>
								<CardDescription>
									Pourcentage de progression vers l&apos;étape suivante
								</CardDescription>
							</CardHeader>
							<CardContent>
								<div className="space-y-4">
									{conversionData.funnelConversion.map((stage, _index) => (
										<div key={stage.stage} className="space-y-2">
											<div className="flex items-center justify-between">
												<div className="flex items-center gap-2">
													<div
														className="w-3 h-3 rounded-full"
														style={{
															backgroundColor: STAGE_COLORS[stage.stage],
														}}
													/>
													<span className="font-medium">{stage.label}</span>
												</div>
												<div className="flex items-center gap-2">
													<Badge variant="default" className="bg-green-500">
														{stage.conversionRate}%
													</Badge>
													{stage.lossRate > 0 && (
														<Badge variant="destructive">
															-{stage.lossRate}%
														</Badge>
													)}
												</div>
											</div>
											<div className="flex gap-1 h-3">
												<div
													className="bg-green-500 rounded-l"
													style={{ width: `${stage.conversionRate}%` }}
												/>
												<div
													className="bg-red-500"
													style={{ width: `${stage.lossRate}%` }}
												/>
												<div className="bg-muted rounded-r flex-1" />
											</div>
											<div className="flex justify-between text-xs text-muted-foreground">
												<span>{stage.currentDeals} en cours</span>
												<span>
													{stage.closedWon} gagnés / {stage.closedLost} perdus
												</span>
											</div>
										</div>
									))}
								</div>
							</CardContent>
						</Card>

						<Card>
							<CardHeader>
								<CardTitle>Résumé Global</CardTitle>
								<CardDescription>
									Métriques de conversion globales
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-6">
								<div className="text-center p-6 bg-muted/50 rounded-lg">
									<p className="text-muted-foreground mb-2">
										Taux de Conversion Global
									</p>
									<p className="text-5xl font-bold text-green-500">
										{conversionData.overallWinRate}%
									</p>
									<p className="text-sm text-muted-foreground mt-2">
										des deals sourcés deviennent des deals gagnés
									</p>
								</div>

								<div className="grid grid-cols-2 gap-4">
									<div className="p-4 border rounded-lg text-center">
										<CheckCircle2 className="h-8 w-8 text-green-500 mx-auto mb-2" />
										<p className="text-2xl font-bold">
											{pipelineAnalytics?.wonDeals || 0}
										</p>
										<p className="text-sm text-muted-foreground">
											Deals Gagnés
										</p>
									</div>
									<div className="p-4 border rounded-lg text-center">
										<AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
										<p className="text-2xl font-bold">
											{pipelineAnalytics?.lostDeals || 0}
										</p>
										<p className="text-sm text-muted-foreground">
											Deals Perdus
										</p>
									</div>
								</div>
							</CardContent>
						</Card>
					</div>
				</TabsContent>

				{/* Health Tab */}
				<TabsContent value="health" className="space-y-6 mt-6">
					<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<Gauge className="h-5 w-5" />
									Score de Santé
								</CardTitle>
							</CardHeader>
							<CardContent className="flex flex-col items-center py-6">
								<HealthGauge
									score={healthData.healthScore}
									label={healthData.healthLabel}
								/>
							</CardContent>
						</Card>

						<Card className="lg:col-span-2">
							<CardHeader>
								<CardTitle>Indicateurs de Santé</CardTitle>
								<CardDescription>
									Facteurs impactant le score de santé du pipeline
								</CardDescription>
							</CardHeader>
							<CardContent>
								<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
									<div className="p-4 border rounded-lg text-center">
										<Clock className="h-6 w-6 text-orange-500 mx-auto mb-2" />
										<p className="text-2xl font-bold">
											{healthData.indicators.stalledDeals}
										</p>
										<p className="text-xs text-muted-foreground">
											Deals Inactifs
										</p>
									</div>
									<div className="p-4 border rounded-lg text-center">
										<AlertTriangle className="h-6 w-6 text-red-500 mx-auto mb-2" />
										<p className="text-2xl font-bold">
											{healthData.indicators.overdueDeals}
										</p>
										<p className="text-xs text-muted-foreground">En Retard</p>
									</div>
									<div className="p-4 border rounded-lg text-center">
										<Info className="h-6 w-6 text-blue-500 mx-auto mb-2" />
										<p className="text-2xl font-bold">
											{healthData.indicators.unassignedDeals}
										</p>
										<p className="text-xs text-muted-foreground">
											Non Assignés
										</p>
									</div>
									<div className="p-4 border rounded-lg text-center">
										<Activity className="h-6 w-6 text-purple-500 mx-auto mb-2" />
										<p className="text-2xl font-bold">
											{healthData.indicators.noValueDeals}
										</p>
										<p className="text-xs text-muted-foreground">Sans Valeur</p>
									</div>
								</div>
							</CardContent>
						</Card>
					</div>

					<Card>
						<CardHeader>
							<CardTitle>Insights & Recommandations</CardTitle>
							<CardDescription>
								Actions suggérées pour améliorer la santé du pipeline
							</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="space-y-3">
								{healthData.insights.map((insight, idx) => (
									<InsightItem
										key={idx}
										type={insight.type}
										message={insight.message}
									/>
								))}
								{healthData.insights.length === 0 && (
									<div className="text-center py-8 text-muted-foreground">
										<CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-green-500" />
										<p>
											Aucun problème détecté. Votre pipeline est en excellente
											santé !
										</p>
									</div>
								)}
							</div>
						</CardContent>
					</Card>

					<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
						<Card>
							<CardHeader>
								<CardTitle>Distribution des Étapes</CardTitle>
								<CardDescription>
									Répartition des deals dans le pipeline
								</CardDescription>
							</CardHeader>
							<CardContent>
								<div className="space-y-3">
									<div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
										<span className="text-sm">
											Étapes initiales (Sourcing/Qualification)
										</span>
										<Badge>{healthData.indicators.earlyStageDeals}</Badge>
									</div>
									<div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
										<span className="text-sm">
											Étapes finales (Négociation/Closing)
										</span>
										<Badge variant="default" className="bg-green-500">
											{healthData.indicators.lateStageDeals}
										</Badge>
									</div>
									<div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
										<span className="text-sm">Sans date de closing</span>
										<Badge variant="secondary">
											{healthData.indicators.noCloseDateDeals}
										</Badge>
									</div>
								</div>
							</CardContent>
						</Card>

						<Card>
							<CardHeader>
								<CardTitle>Activité Récente</CardTitle>
								<CardDescription>
									Mouvements dans le pipeline (30 derniers jours)
								</CardDescription>
							</CardHeader>
							<CardContent>
								<div className="text-center py-6">
									<GitBranch className="h-12 w-12 mx-auto mb-4 text-primary" />
									<p className="text-4xl font-bold text-primary">
										{healthData.recentStageChanges}
									</p>
									<p className="text-muted-foreground mt-2">
										transitions d&apos;étapes enregistrées
									</p>
								</div>
								<div className="mt-4 p-4 bg-muted/50 rounded-lg">
									<div className="flex items-center justify-between">
										<span className="text-sm">Pipeline Actif</span>
										<span className="font-bold">
											{formatCurrency(healthData.totalPipelineValue)}
										</span>
									</div>
								</div>
							</CardContent>
						</Card>
					</div>
				</TabsContent>
			</Tabs>
		</div>
	);
}
