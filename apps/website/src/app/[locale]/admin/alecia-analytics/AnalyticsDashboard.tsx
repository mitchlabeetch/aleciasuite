"use client";

import {
	BarChart3,
	Users,
	Eye,
	TrendingDown,
	Globe,
	Monitor,
	Smartphone,
	Tablet,
	ExternalLink,
} from "lucide-react";
import type { AnalyticsSummary } from "@/lib/analytics";

interface AnalyticsDashboardProps {
	data: AnalyticsSummary;
}

export function AnalyticsDashboard({ data }: AnalyticsDashboardProps) {
	const totalDevices =
		data.devices.desktop + data.devices.mobile + data.devices.tablet || 1;
	const devicePercentages = {
		desktop: Math.round((data.devices.desktop / totalDevices) * 100),
		mobile: Math.round((data.devices.mobile / totalDevices) * 100),
		tablet: Math.round((data.devices.tablet / totalDevices) * 100),
	};

	// Calculate max values for chart scaling
	const maxPageViews =
		Math.max(...data.dailyData.map((d) => d.pageViews), 1) * 1.1;

	return (
		<div className="p-6 space-y-8">
			{/* Header */}
			<div>
				<h1 className="text-3xl font-bold text-alecia-midnight dark:text-white">
					Alecia Analytics
				</h1>
				<p className="text-muted-foreground">
					Statistiques de trafic du site web (30 derniers jours)
				</p>
			</div>

			{/* Stats Grid */}
			<div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
				<StatCard
					title="Visiteurs"
					value={formatNumber(data.visitors)}
					icon={Users}
					subtitle="Visiteurs uniques"
				/>
				<StatCard
					title="Pages Vues"
					value={formatNumber(data.pageViews)}
					icon={Eye}
					subtitle="Total des vues"
				/>
				<StatCard
					title="Taux de Rebond"
					value={`${data.bounceRate}%`}
					icon={TrendingDown}
					subtitle="Sessions monopage"
					trend={data.bounceRate > 50 ? "Elevé" : "Normal"}
					trendPositive={data.bounceRate <= 50}
				/>
				<StatCard
					title="Pages/Session"
					value={
						data.visitors > 0
							? (data.pageViews / data.visitors).toFixed(1)
							: "0"
					}
					icon={BarChart3}
					subtitle="Engagement moyen"
				/>
			</div>

			{/* Traffic Chart */}
			<div className="rounded-2xl border border-border bg-card p-6">
				<h3 className="font-semibold text-alecia-midnight dark:text-white mb-6">
					Trafic Journalier
				</h3>
				<div className="h-64 relative">
					{data.dailyData.length === 0 ? (
						<div className="flex items-center justify-center h-full text-muted-foreground">
							Aucune donnée disponible
						</div>
					) : (
						<div className="flex items-end justify-between gap-1 h-full">
							{data.dailyData.map((day, index) => (
								<div
									key={day.date}
									className="flex-1 flex flex-col items-center group"
								>
									<div
										className="w-full bg-alecia-mid-blue/80 hover:bg-alecia-mid-blue rounded-t transition-all cursor-pointer relative"
										style={{
											height: `${(day.pageViews / maxPageViews) * 100}%`,
											minHeight: day.pageViews > 0 ? "4px" : "0",
										}}
									>
										{/* Tooltip */}
										<div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10">
											<div className="bg-alecia-midnight text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap shadow-lg">
												<div className="font-semibold">
													{formatDate(day.date)}
												</div>
												<div>{day.pageViews} pages vues</div>
												<div>{day.visitors} visiteurs</div>
											</div>
										</div>
									</div>
									{/* Show date labels for every 7th day */}
									{(index === 0 ||
										index === data.dailyData.length - 1 ||
										index % 7 === 0) && (
										<span className="text-xs text-muted-foreground mt-2 rotate-45 origin-left">
											{formatDate(day.date, true)}
										</span>
									)}
								</div>
							))}
						</div>
					)}
				</div>
			</div>

			{/* Two-column grid */}
			<div className="grid gap-6 lg:grid-cols-2">
				{/* Top Pages */}
				<div className="rounded-2xl border border-border bg-card p-6">
					<h3 className="font-semibold text-alecia-midnight dark:text-white mb-4">
						Pages Populaires
					</h3>
					<div className="space-y-3">
						{data.topPages.length === 0 ? (
							<p className="text-sm text-muted-foreground">
								Aucune donnée disponible
							</p>
						) : (
							data.topPages.slice(0, 8).map((page, index) => (
								<div key={page.path} className="flex items-center gap-3">
									<span className="text-sm font-medium text-muted-foreground w-6">
										{index + 1}.
									</span>
									<div className="flex-1 min-w-0">
										<div className="text-sm font-medium text-alecia-midnight dark:text-white truncate">
											{page.path}
										</div>
									</div>
									<div className="text-sm text-muted-foreground">
										{formatNumber(page.views)} vues
									</div>
								</div>
							))
						)}
					</div>
				</div>

				{/* Countries */}
				<div className="rounded-2xl border border-border bg-card p-6">
					<h3 className="font-semibold text-alecia-midnight dark:text-white mb-4 flex items-center gap-2">
						<Globe className="w-4 h-4" />
						Pays
					</h3>
					<div className="space-y-3">
						{data.countries.length === 0 ? (
							<p className="text-sm text-muted-foreground">
								Aucune donnée disponible
							</p>
						) : (
							data.countries.slice(0, 8).map((country) => (
								<div key={country.code} className="flex items-center gap-3">
									<span className="text-lg">{getCountryFlag(country.code)}</span>
									<div className="flex-1">
										<div className="text-sm font-medium text-alecia-midnight dark:text-white">
											{country.name}
										</div>
									</div>
									<div className="text-sm text-muted-foreground">
										{formatNumber(country.visitors)}
									</div>
								</div>
							))
						)}
					</div>
				</div>
			</div>

			{/* Three-column grid */}
			<div className="grid gap-6 lg:grid-cols-3">
				{/* Devices */}
				<div className="rounded-2xl border border-border bg-card p-6">
					<h3 className="font-semibold text-alecia-midnight dark:text-white mb-4">
						Appareils
					</h3>
					<div className="space-y-4">
						<DeviceRow
							icon={Monitor}
							label="Desktop"
							percentage={devicePercentages.desktop}
							count={data.devices.desktop}
						/>
						<DeviceRow
							icon={Smartphone}
							label="Mobile"
							percentage={devicePercentages.mobile}
							count={data.devices.mobile}
						/>
						<DeviceRow
							icon={Tablet}
							label="Tablet"
							percentage={devicePercentages.tablet}
							count={data.devices.tablet}
						/>
					</div>
				</div>

				{/* Operating Systems */}
				<div className="rounded-2xl border border-border bg-card p-6">
					<h3 className="font-semibold text-alecia-midnight dark:text-white mb-4">
						Systèmes d&apos;Exploitation
					</h3>
					<div className="space-y-3">
						{data.operatingSystems.length === 0 ? (
							<p className="text-sm text-muted-foreground">
								Aucune donnée disponible
							</p>
						) : (
							data.operatingSystems.slice(0, 5).map((os) => (
								<div key={os.name} className="flex items-center justify-between">
									<span className="text-sm text-alecia-midnight dark:text-white">
										{os.name}
									</span>
									<span className="text-sm text-muted-foreground">
										{formatNumber(os.visitors)}
									</span>
								</div>
							))
						)}
					</div>
				</div>

				{/* Referrers */}
				<div className="rounded-2xl border border-border bg-card p-6">
					<h3 className="font-semibold text-alecia-midnight dark:text-white mb-4 flex items-center gap-2">
						<ExternalLink className="w-4 h-4" />
						Sources de Trafic
					</h3>
					<div className="space-y-3">
						{data.referrers.length === 0 ? (
							<p className="text-sm text-muted-foreground">
								Aucune donnée disponible
							</p>
						) : (
							data.referrers.slice(0, 5).map((ref) => (
								<div key={ref.source} className="flex items-center justify-between">
									<span className="text-sm text-alecia-midnight dark:text-white truncate max-w-[150px]">
										{ref.source}
									</span>
									<span className="text-sm text-muted-foreground">
										{formatNumber(ref.visitors)}
									</span>
								</div>
							))
						)}
					</div>
				</div>
			</div>

			{/* Cache info */}
			<div className="text-xs text-muted-foreground text-center">
				Données mises en cache. Rafraîchissement automatique toutes les heures.
			</div>
		</div>
	);
}

// --- Helper Components ---

function StatCard({
	title,
	value,
	icon: Icon,
	subtitle,
	trend,
	trendPositive,
}: {
	title: string;
	value: string | number;
	icon: React.ComponentType<{ className?: string }>;
	subtitle: string;
	trend?: string;
	trendPositive?: boolean;
}) {
	return (
		<div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
			<div className="mb-4 flex items-center justify-between">
				<h3 className="font-semibold text-alecia-midnight dark:text-white">
					{title}
				</h3>
				<div className="rounded-full bg-alecia-cloud dark:bg-muted p-2 text-alecia-mid-blue">
					<Icon className="h-5 w-5" />
				</div>
			</div>
			<div className="text-4xl font-bold text-alecia-midnight dark:text-white">
				{value}
			</div>
			<div className="mt-4 flex items-center justify-between">
				<span className="text-sm text-muted-foreground">{subtitle}</span>
				{trend && (
					<span
						className={`text-xs font-medium ${trendPositive ? "text-green-600" : "text-amber-500"}`}
					>
						{trend}
					</span>
				)}
			</div>
		</div>
	);
}

function DeviceRow({
	icon: Icon,
	label,
	percentage,
	count,
}: {
	icon: React.ComponentType<{ className?: string }>;
	label: string;
	percentage: number;
	count: number;
}) {
	return (
		<div className="space-y-2">
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-2">
					<Icon className="w-4 h-4 text-muted-foreground" />
					<span className="text-sm text-alecia-midnight dark:text-white">
						{label}
					</span>
				</div>
				<span className="text-sm text-muted-foreground">
					{percentage}% ({formatNumber(count)})
				</span>
			</div>
			<div className="h-2 bg-muted rounded-full overflow-hidden">
				<div
					className="h-full bg-alecia-mid-blue rounded-full transition-all"
					style={{ width: `${percentage}%` }}
				/>
			</div>
		</div>
	);
}

// --- Helper Functions ---

function formatNumber(num: number): string {
	if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
	if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
	return num.toString();
}

function formatDate(dateStr: string, short = false): string {
	const date = new Date(dateStr);
	if (short) {
		return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
	}
	return date.toLocaleDateString("fr-FR", {
		day: "numeric",
		month: "long",
		year: "numeric",
	});
}

function getCountryFlag(code: string): string {
	// Convert country code to flag emoji
	const codePoints = [...code.toUpperCase()].map(
		(char) => 127397 + char.charCodeAt(0),
	);
	return String.fromCodePoint(...codePoints);
}
