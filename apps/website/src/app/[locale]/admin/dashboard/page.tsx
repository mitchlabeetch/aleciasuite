"use client";

import { useState, useEffect } from "react";
import { getDashboardStats } from "@/actions";
import {
	Briefcase,
	Users,
	CheckSquare,
	TrendingUp,
	Calendar as _Calendar,
	FileText as _FileText,
} from "lucide-react";
import { DashboardSkeleton } from "@/components/admin/AdminSkeleton";
import { formatCurrency } from "@/lib/utils";

/**
 * Admin Dashboard Page
 *
 * Displays key metrics and recent activity from PostgreSQL
 */
export default function DashboardPage() {
	const [stats, setStats] = useState<any>(undefined);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		getDashboardStats()
			.then(setStats)
			.finally(() => setLoading(false));
	}, []);

	// Loading state
	if (loading) {
		return <DashboardSkeleton />;
	}

	// Not authenticated
	if (stats === null) {
		return (
			<div className="p-6 text-center text-muted-foreground">
				Veuillez vous connecter pour accéder au tableau de bord.
			</div>
		);
	}

	return (
		<div className="p-6 space-y-8">
			{/* Header */}
			<div>
				<h1 className="text-3xl font-bold text-alecia-midnight dark:text-white">
					Tableau de Bord
				</h1>
				<p className="text-muted-foreground">
					Bienvenue dans votre interface de gestion centralisée.
				</p>
			</div>

			{/* Stats Grid */}
			<div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
				{/* Deals Widget */}
				<StatCard
					title="Deals en cours"
					value={stats.activeDeals}
					icon={Briefcase}
					subtitle={`${Object.keys(stats.dealsByStage).length} étapes`}
					trend={stats.activeDeals > 0 ? "Actif" : undefined}
					trendPositive={stats.activeDeals > 0}
				/>

				{/* Teams Widget */}
				<StatCard
					title="Équipe"
					value={stats.teamSize}
					icon={Users}
					subtitle="Membres actifs"
				/>

				{/* Companies Widget */}
				<StatCard
					title="Sociétés"
					value={stats.companiesCount}
					icon={CheckSquare}
					subtitle="Dans le CRM"
				/>

				{/* Pipeline Value */}
				<StatCard
					title="Valeur Pipeline"
					value={formatCurrency(stats.pipelineValue)}
					icon={TrendingUp}
					subtitle="Valorisation totale"
					trendPositive
				/>
			</div>

			{/* Activity & Recent Deals */}
			<div className="grid gap-6 lg:grid-cols-2">
				{/* Recent Deals */}
				<div className="rounded-2xl border border-border bg-card p-6">
					<h3 className="font-semibold text-alecia-midnight dark:text-white mb-4">
						Deals Récents
					</h3>
					<div className="space-y-4">
						{stats.recentDeals.length === 0 ? (
							<p className="text-sm text-muted-foreground">
								Aucun deal récent.
							</p>
						) : (
							stats.recentDeals.map(
								(deal: {
									id: string;
									title: string;
									stage: string;
									amount?: number;
								}) => (
									<div key={deal.id} className="flex items-start gap-3">
										<div className="w-8 h-8 rounded-full bg-alecia-cloud dark:bg-muted flex items-center justify-center text-alecia-mid-blue">
											<Briefcase className="w-4 h-4" />
										</div>
										<div className="flex-1">
											<p className="text-sm font-medium text-alecia-midnight dark:text-white">
												{deal.title}
											</p>
											<p className="text-xs text-muted-foreground">
												{deal.stage}{" "}
												{deal.amount ? `• ${formatCurrency(deal.amount)}` : ""}
											</p>
										</div>
									</div>
								),
							)
						)}
					</div>
				</div>

				{/* Pipeline by Stage */}
				<div className="rounded-2xl border border-border bg-card p-6">
					<h3 className="font-semibold text-alecia-midnight dark:text-white mb-4">
						Pipeline par Étape
					</h3>
					<div className="space-y-3">
						{Object.entries(stats.dealsByStage).length === 0 ? (
							<p className="text-sm text-muted-foreground">
								Aucune donnée de pipeline.
							</p>
						) : (
							Object.entries(stats.dealsByStage).map(([stage, count]) => (
								<div key={stage} className="flex items-center gap-3">
									<div className="flex-1">
										<div className="flex items-center justify-between mb-1">
											<span className="text-sm font-medium text-alecia-midnight dark:text-white">
												{stage}
											</span>
											<span className="text-sm text-muted-foreground">
												{count as number}
											</span>
										</div>
										<div className="h-2 bg-muted rounded-full overflow-hidden">
											<div
												className="h-full bg-alecia-mid-blue rounded-full"
												style={{
													width: `${Math.min(((count as number) / stats.activeDeals) * 100, 100)}%`,
												}}
											/>
										</div>
									</div>
								</div>
							))
						)}
					</div>
				</div>
			</div>
		</div>
	);
}

// --- Components ---

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
						className={`text-xs font-medium ${trendPositive ? "text-green-600" : "text-red-500"}`}
					>
						{trend}
					</span>
				)}
			</div>
		</div>
	);
}
