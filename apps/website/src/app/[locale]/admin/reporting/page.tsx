"use client";

/**
 * Analytics & Reporting Dashboard
 *
 * Comprehensive analytics for M&A deal management including:
 * - Pipeline health metrics and funnel visualization
 * - Win/loss rates and deal velocity
 * - Team performance metrics
 * - Trend analysis over time
 */

import { useState, useEffect } from "react";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
	BarChart3,
	TrendingUp,
	Target,
	Users,
	Briefcase,
	DollarSign,
	Clock,
	AlertTriangle,
	CheckCircle2,
	XCircle,
	Calendar,
	Loader2,
	ArrowUpRight,
	ArrowDownRight,
} from "lucide-react";
import {
	BarChart,
	Bar,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	ResponsiveContainer,
	LineChart,
	Line,
	PieChart,
	Pie,
	Cell,
	AreaChart,
	Area,
	Legend,
} from "recharts";

// Type definitions
interface PipelineAnalytics {
	totalDeals: number;
	activeDeals: number;
	wonDeals: number;
	lostDeals: number;
	winRate: number;
	avgDealValue: number;
	totalPipelineValue: number;
	activePipelineValue: number;
	wonValue: number;
	dealsByStage: Array<{
		stage: string;
		label: string;
		count: number;
		value: number;
	}>;
	recentDeals: number;
	closingThisMonth: number;
	closingThisMonthValue: number;
	overdueDeals: number;
	stalledDeals: number;
	dealsByPriority: {
		high: number;
		medium: number;
		low: number;
		none: number;
	};
}

interface TeamPerformance {
	ownerId: string;
	ownerName: string;
	totalDeals: number;
	activeDeals: number;
	wonDeals: number;
	lostDeals: number;
	winRate: number;
	pipelineValue: number;
	wonValue: number;
}

interface TrendData {
	month: string;
	monthLabel: string;
	newDeals: number;
	wonDeals: number;
	lostDeals: number;
	pipelineValue: number;
	wonValue: number;
}

interface ActivityAnalytics {
	totalEvents: number;
	eventsByType: Record<string, number>;
	eventsByDay: Array<{ day: string; count: number }>;
	topUsers: Array<{ userId: string; userName: string; eventCount: number }>;
	avgEventsPerDay: number;
}

// Colors for charts
const CHART_COLORS = {
	primary: "#3b82f6",
	success: "#22c55e",
	warning: "#f59e0b",
	danger: "#ef4444",
	purple: "#8b5cf6",
	cyan: "#06b6d4",
};

const PRIORITY_COLORS = ["#ef4444", "#f59e0b", "#22c55e", "#94a3b8"];

// Format currency
function formatCurrency(value: number): string {
	if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M€`;
	if (value >= 1000) return `${(value / 1000).toFixed(0)}K€`;
	return `${value}€`;
}

// Format percentage with trend indicator
function TrendBadge({
	value,
	suffix = "%",
	inverse = false,
}: {
	value: number;
	suffix?: string;
	inverse?: boolean;
}) {
	const isPositive = inverse ? value < 0 : value > 0;
	const Icon = isPositive ? ArrowUpRight : ArrowDownRight;
	const colorClass = isPositive ? "text-green-600" : "text-red-600";

	return (
		<span className={`inline-flex items-center gap-0.5 text-sm ${colorClass}`}>
			<Icon className="h-3 w-3" />
			{Math.abs(value)}
			{suffix}
		</span>
	);
}

// Stat card component
function StatCard({
	title,
	value,
	subtitle,
	icon: Icon,
	iconColor,
	trend,
}: {
	title: string;
	value: string | number;
	subtitle?: string;
	icon: React.ElementType;
	iconColor: string;
	trend?: number;
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
					<div className="flex flex-col items-end gap-2">
						<div
							className={`h-10 w-10 rounded-lg flex items-center justify-center ${iconColor}`}
						>
							<Icon className="h-5 w-5" />
						</div>
						{trend !== undefined && <TrendBadge value={trend} />}
					</div>
				</div>
			</CardContent>
		</Card>
	);
}

// Get initials from name
function getInitials(name: string): string {
	return name
		.split(" ")
		.map((n) => n.charAt(0))
		.join("")
		.slice(0, 2)
		.toUpperCase();
}

export default function ReportingPage() {
	const [selectedTab, setSelectedTab] = useState("overview");

	// Fetch analytics data
	const [analytics, setAnalytics] = useState<any>(undefined);
	const [teamPerformance, setTeamPerformance] = useState<any>(undefined);
	const [trends, setTrends] = useState<any>(undefined);
	const [activityAnalytics, setActivityAnalytics] = useState<any>(undefined);

	useEffect(() => {
		// Placeholder: Replace with actual server actions when available
		// getPipelineAnalytics({}).then(setAnalytics);
		// getTeamPerformance().then(setTeamPerformance);
		// getPipelineTrends({ months: 6 }).then(setTrends);
		// getActivityAnalytics({ days: 30 }).then(setActivityAnalytics);
	}, []);

	const isLoading =
		analytics === undefined ||
		teamPerformance === undefined ||
		trends === undefined;

	if (isLoading) {
		return (
			<div className="flex items-center justify-center min-h-[400px]">
				<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
			</div>
		);
	}

	if (!analytics) {
		return (
			<div className="flex items-center justify-center min-h-[400px]">
				<p className="text-muted-foreground">
					Connectez-vous pour voir les analytics.
				</p>
			</div>
		);
	}

	const pipelineData = analytics as PipelineAnalytics;
	const teamData = (teamPerformance || []) as TeamPerformance[];
	const trendData = (trends || []) as TrendData[];
	const activityData = activityAnalytics as ActivityAnalytics | null;

	// Prepare priority pie chart data
	const priorityData = [
		{
			name: "Haute",
			value: pipelineData.dealsByPriority.high,
			color: PRIORITY_COLORS[0],
		},
		{
			name: "Moyenne",
			value: pipelineData.dealsByPriority.medium,
			color: PRIORITY_COLORS[1],
		},
		{
			name: "Basse",
			value: pipelineData.dealsByPriority.low,
			color: PRIORITY_COLORS[2],
		},
		{
			name: "Non définie",
			value: pipelineData.dealsByPriority.none,
			color: PRIORITY_COLORS[3],
		},
	].filter((d) => d.value > 0);

	return (
		<div className="space-y-6 p-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold flex items-center gap-2">
						<BarChart3 className="h-8 w-8 text-primary" />
						Analytics & Reporting
					</h1>
					<p className="text-muted-foreground">
						Vue d&apos;ensemble de la performance du pipeline M&A.
					</p>
				</div>
			</div>

			{/* Key Metrics */}
			<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
				<StatCard
					title="Deals Actifs"
					value={pipelineData.activeDeals}
					subtitle={`${pipelineData.totalDeals} total`}
					icon={Briefcase}
					iconColor="bg-blue-500/10 text-blue-500"
				/>
				<StatCard
					title="Pipeline Actif"
					value={formatCurrency(pipelineData.activePipelineValue)}
					subtitle={`${formatCurrency(pipelineData.totalPipelineValue)} total`}
					icon={DollarSign}
					iconColor="bg-green-500/10 text-green-500"
				/>
				<StatCard
					title="Taux de Conversion"
					value={`${pipelineData.winRate}%`}
					subtitle={`${pipelineData.wonDeals} gagnés / ${pipelineData.lostDeals} perdus`}
					icon={Target}
					iconColor="bg-purple-500/10 text-purple-500"
				/>
				<StatCard
					title="Valeur Moyenne"
					value={formatCurrency(pipelineData.avgDealValue)}
					icon={TrendingUp}
					iconColor="bg-orange-500/10 text-orange-500"
				/>
			</div>

			{/* Alerts Row */}
			{(pipelineData.overdueDeals > 0 || pipelineData.stalledDeals > 0) && (
				<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
					{pipelineData.overdueDeals > 0 && (
						<Card className="border-orange-200 bg-orange-50/50 dark:bg-orange-900/10">
							<CardContent className="pt-4">
								<div className="flex items-center gap-3">
									<AlertTriangle className="h-5 w-5 text-orange-500" />
									<div>
										<p className="font-medium text-orange-700 dark:text-orange-400">
											{pipelineData.overdueDeals} deal(s) en retard
										</p>
										<p className="text-xs text-orange-600/70">
											Date de closing dépassée
										</p>
									</div>
								</div>
							</CardContent>
						</Card>
					)}
					{pipelineData.stalledDeals > 0 && (
						<Card className="border-red-200 bg-red-50/50 dark:bg-red-900/10">
							<CardContent className="pt-4">
								<div className="flex items-center gap-3">
									<Clock className="h-5 w-5 text-red-500" />
									<div>
										<p className="font-medium text-red-700 dark:text-red-400">
											{pipelineData.stalledDeals} deal(s) stagnants
										</p>
										<p className="text-xs text-red-600/70">
											Aucune activité depuis 30j
										</p>
									</div>
								</div>
							</CardContent>
						</Card>
					)}
					{pipelineData.closingThisMonth > 0 && (
						<Card className="border-green-200 bg-green-50/50 dark:bg-green-900/10">
							<CardContent className="pt-4">
								<div className="flex items-center gap-3">
									<Calendar className="h-5 w-5 text-green-500" />
									<div>
										<p className="font-medium text-green-700 dark:text-green-400">
											{pipelineData.closingThisMonth} closing ce mois
										</p>
										<p className="text-xs text-green-600/70">
											{formatCurrency(pipelineData.closingThisMonthValue)}
										</p>
									</div>
								</div>
							</CardContent>
						</Card>
					)}
				</div>
			)}

			{/* Tabs */}
			<Tabs value={selectedTab} onValueChange={setSelectedTab}>
				<TabsList>
					<TabsTrigger value="overview" className="gap-2">
						<BarChart3 className="h-4 w-4" />
						Vue d&apos;ensemble
					</TabsTrigger>
					<TabsTrigger value="funnel" className="gap-2">
						<Target className="h-4 w-4" />
						Entonnoir
					</TabsTrigger>
					<TabsTrigger value="team" className="gap-2">
						<Users className="h-4 w-4" />
						Équipe
					</TabsTrigger>
					<TabsTrigger value="trends" className="gap-2">
						<TrendingUp className="h-4 w-4" />
						Tendances
					</TabsTrigger>
				</TabsList>

				{/* Overview Tab */}
				<TabsContent value="overview" className="space-y-6">
					<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
						{/* Pipeline Funnel Chart */}
						<Card>
							<CardHeader>
								<CardTitle>Entonnoir Pipeline</CardTitle>
								<CardDescription>
									Répartition des deals par étape
								</CardDescription>
							</CardHeader>
							<CardContent>
								<div className="h-[300px]">
									<ResponsiveContainer width="100%" height="100%">
										<BarChart
											data={pipelineData.dealsByStage.filter(
												(s) =>
													s.stage !== "closed_won" && s.stage !== "closed_lost",
											)}
											layout="vertical"
											margin={{ left: 80, right: 20 }}
										>
											<CartesianGrid strokeDasharray="3 3" horizontal={false} />
											<XAxis type="number" />
											<YAxis dataKey="label" type="category" width={80} />
											<Tooltip
												formatter={(value) => [`${value}`, "Deals"]}
												labelFormatter={(label) => `Étape: ${label}`}
											/>
											<Bar
												dataKey="count"
												fill={CHART_COLORS.primary}
												radius={4}
											/>
										</BarChart>
									</ResponsiveContainer>
								</div>
							</CardContent>
						</Card>

						{/* Priority Distribution */}
						<Card>
							<CardHeader>
								<CardTitle>Répartition par Priorité</CardTitle>
								<CardDescription>
									Deals actifs par niveau de priorité
								</CardDescription>
							</CardHeader>
							<CardContent>
								<div className="h-[300px]">
									<ResponsiveContainer width="100%" height="100%">
										<PieChart>
											<Pie
												data={priorityData}
												cx="50%"
												cy="50%"
												innerRadius={60}
												outerRadius={100}
												paddingAngle={2}
												dataKey="value"
												label={({ name, value }) => `${name}: ${value}`}
											>
												{priorityData.map((entry, _index) => (
													<Cell key={`cell-${_index}`} fill={entry.color} />
												))}
											</Pie>
											<Tooltip />
										</PieChart>
									</ResponsiveContainer>
								</div>
							</CardContent>
						</Card>
					</div>

					{/* Won vs Lost */}
					<Card>
						<CardHeader>
							<CardTitle>Performance Mensuelle</CardTitle>
							<CardDescription>
								Deals gagnés vs perdus sur les 6 derniers mois
							</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="h-[300px]">
								<ResponsiveContainer width="100%" height="100%">
									<BarChart data={trendData}>
										<CartesianGrid strokeDasharray="3 3" vertical={false} />
										<XAxis dataKey="monthLabel" />
										<YAxis />
										<Tooltip />
										<Legend />
										<Bar
											dataKey="wonDeals"
											name="Gagnés"
											fill={CHART_COLORS.success}
											radius={[4, 4, 0, 0]}
										/>
										<Bar
											dataKey="lostDeals"
											name="Perdus"
											fill={CHART_COLORS.danger}
											radius={[4, 4, 0, 0]}
										/>
									</BarChart>
								</ResponsiveContainer>
							</div>
						</CardContent>
					</Card>
				</TabsContent>

				{/* Funnel Tab */}
				<TabsContent value="funnel" className="space-y-6">
					<Card>
						<CardHeader>
							<CardTitle>Entonnoir de Conversion</CardTitle>
							<CardDescription>
								Nombre de deals et valeur à chaque étape du pipeline
							</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="space-y-3">
								{pipelineData.dealsByStage
									.filter(
										(s) =>
											s.stage !== "closed_won" && s.stage !== "closed_lost",
									)
									.map((stage, _index) => {
										const maxCount = Math.max(
											...pipelineData.dealsByStage.map((s) => s.count),
										);
										const percentage =
											maxCount > 0 ? (stage.count / maxCount) * 100 : 0;

										return (
											<div key={stage.stage} className="space-y-1">
												<div className="flex items-center justify-between text-sm">
													<span className="font-medium">{stage.label}</span>
													<span className="text-muted-foreground">
														{stage.count} deals • {formatCurrency(stage.value)}
													</span>
												</div>
												<div className="h-8 bg-muted rounded-lg overflow-hidden">
													<div
														className="h-full bg-primary/80 rounded-lg flex items-center justify-end pr-3 transition-all"
														style={{ width: `${Math.max(percentage, 5)}%` }}
													>
														{stage.count > 0 && (
															<span className="text-xs font-medium text-white">
																{stage.count}
															</span>
														)}
													</div>
												</div>
											</div>
										);
									})}
							</div>

							{/* Closed deals summary */}
							<div className="mt-6 pt-6 border-t grid grid-cols-2 gap-4">
								<div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
									<CheckCircle2 className="h-8 w-8 text-green-500" />
									<div>
										<p className="text-2xl font-bold text-green-700 dark:text-green-400">
											{pipelineData.wonDeals}
										</p>
										<p className="text-sm text-green-600/70">
											Gagnés • {formatCurrency(pipelineData.wonValue)}
										</p>
									</div>
								</div>
								<div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
									<XCircle className="h-8 w-8 text-red-500" />
									<div>
										<p className="text-2xl font-bold text-red-700 dark:text-red-400">
											{pipelineData.lostDeals}
										</p>
										<p className="text-sm text-red-600/70">Perdus</p>
									</div>
								</div>
							</div>
						</CardContent>
					</Card>
				</TabsContent>

				{/* Team Tab */}
				<TabsContent value="team" className="space-y-6">
					<Card>
						<CardHeader>
							<CardTitle>Performance par Membre</CardTitle>
							<CardDescription>
								Répartition des deals et taux de conversion par responsable
							</CardDescription>
						</CardHeader>
						<CardContent>
							{teamData.length === 0 ? (
								<div className="text-center py-8 text-muted-foreground">
									Aucune donnée de performance disponible.
								</div>
							) : (
								<div className="space-y-4">
									{teamData.map((member) => (
										<div
											key={member.ownerId}
											className="flex items-center gap-4 p-4 rounded-lg border hover:bg-muted/50 transition-colors"
										>
											<Avatar className="h-10 w-10">
												<AvatarFallback className="bg-primary/10 text-primary font-medium">
													{getInitials(member.ownerName)}
												</AvatarFallback>
											</Avatar>
											<div className="flex-1 min-w-0">
												<p className="font-medium">{member.ownerName}</p>
												<p className="text-sm text-muted-foreground">
													{member.activeDeals} actifs • {member.wonDeals} gagnés
													• {member.lostDeals} perdus
												</p>
											</div>
											<div className="text-right">
												<p className="font-bold">
													{formatCurrency(member.pipelineValue)}
												</p>
												<p className="text-sm text-muted-foreground">
													pipeline
												</p>
											</div>
											<Badge
												variant={member.winRate >= 50 ? "default" : "secondary"}
												className="ml-2"
											>
												{member.winRate}% win
											</Badge>
										</div>
									))}
								</div>
							)}
						</CardContent>
					</Card>

					{/* Team Chart */}
					{teamData.length > 0 && (
						<Card>
							<CardHeader>
								<CardTitle>Deals par Membre</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="h-[300px]">
									<ResponsiveContainer width="100%" height="100%">
										<BarChart data={teamData.slice(0, 10)}>
											<CartesianGrid strokeDasharray="3 3" vertical={false} />
											<XAxis
												dataKey="ownerName"
												tick={{ fontSize: 12 }}
												interval={0}
												angle={-45}
												textAnchor="end"
												height={80}
											/>
											<YAxis />
											<Tooltip />
											<Legend />
											<Bar
												dataKey="activeDeals"
												name="Actifs"
												fill={CHART_COLORS.primary}
												stackId="a"
											/>
											<Bar
												dataKey="wonDeals"
												name="Gagnés"
												fill={CHART_COLORS.success}
												stackId="a"
											/>
											<Bar
												dataKey="lostDeals"
												name="Perdus"
												fill={CHART_COLORS.danger}
												stackId="a"
											/>
										</BarChart>
									</ResponsiveContainer>
								</div>
							</CardContent>
						</Card>
					)}
				</TabsContent>

				{/* Trends Tab */}
				<TabsContent value="trends" className="space-y-6">
					{/* New Deals Trend */}
					<Card>
						<CardHeader>
							<CardTitle>Nouveaux Deals</CardTitle>
							<CardDescription>
								Évolution des nouveaux deals sur 6 mois
							</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="h-[300px]">
								<ResponsiveContainer width="100%" height="100%">
									<AreaChart data={trendData}>
										<CartesianGrid strokeDasharray="3 3" vertical={false} />
										<XAxis dataKey="monthLabel" />
										<YAxis />
										<Tooltip />
										<Area
											type="monotone"
											dataKey="newDeals"
											name="Nouveaux deals"
											stroke={CHART_COLORS.primary}
											fill={CHART_COLORS.primary}
											fillOpacity={0.2}
										/>
									</AreaChart>
								</ResponsiveContainer>
							</div>
						</CardContent>
					</Card>

					{/* Pipeline Value Trend */}
					<Card>
						<CardHeader>
							<CardTitle>Valeur Gagnée</CardTitle>
							<CardDescription>
								Valeur des deals fermés par mois
							</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="h-[300px]">
								<ResponsiveContainer width="100%" height="100%">
									<LineChart data={trendData}>
										<CartesianGrid strokeDasharray="3 3" vertical={false} />
										<XAxis dataKey="monthLabel" />
										<YAxis tickFormatter={(v) => formatCurrency(v)} />
										<Tooltip
											formatter={(v) => [formatCurrency(Number(v)), "Valeur"]}
										/>
										<Line
											type="monotone"
											dataKey="wonValue"
											name="Valeur gagnée"
											stroke={CHART_COLORS.success}
											strokeWidth={2}
											dot={{ r: 4 }}
										/>
									</LineChart>
								</ResponsiveContainer>
							</div>
						</CardContent>
					</Card>

					{/* Activity Trend */}
					{activityData && activityData.eventsByDay.length > 0 && (
						<Card>
							<CardHeader>
								<CardTitle>Activité Quotidienne</CardTitle>
								<CardDescription>
									Nombre d&apos;événements par jour (30 derniers jours)
								</CardDescription>
							</CardHeader>
							<CardContent>
								<div className="h-[200px]">
									<ResponsiveContainer width="100%" height="100%">
										<AreaChart data={activityData.eventsByDay}>
											<CartesianGrid strokeDasharray="3 3" vertical={false} />
											<XAxis
												dataKey="day"
												tickFormatter={(d) =>
													new Date(d).toLocaleDateString("fr-FR", {
														day: "2-digit",
													})
												}
											/>
											<YAxis />
											<Tooltip
												labelFormatter={(d) =>
													new Date(d).toLocaleDateString("fr-FR", {
														day: "numeric",
														month: "short",
													})
												}
											/>
											<Area
												type="monotone"
												dataKey="count"
												name="Événements"
												stroke={CHART_COLORS.purple}
												fill={CHART_COLORS.purple}
												fillOpacity={0.2}
											/>
										</AreaChart>
									</ResponsiveContainer>
								</div>
							</CardContent>
						</Card>
					)}
				</TabsContent>
			</Tabs>
		</div>
	);
}
