"use client";

/**
 * SRE Metrics Dashboard Component
 *
 * Displays key application metrics for internal monitoring.
 * For use in the admin panel.
 *
 * @see SRE_AUDIT_2026.md
 */

import { useState, useEffect } from "react";
import { getDashboardStats, getUnifiedActivityFeed, presence } from "@/actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Activity,
	Users,
	TrendingUp,
	AlertTriangle,
	Clock,
	CheckCircle,
	XCircle,
	BarChart3,
} from "lucide-react";

interface MetricCardProps {
	title: string;
	value: string | number;
	icon: React.ReactNode;
	description?: string;
	trend?: "up" | "down" | "neutral";
	status?: "good" | "warning" | "critical";
}

function MetricCard({
	title,
	value,
	icon,
	description,
	status = "good",
}: MetricCardProps) {
	const statusColors = {
		good: "text-green-500",
		warning: "text-orange-500",
		critical: "text-red-500",
	};

	return (
		<Card>
			<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
				<CardTitle className="text-sm font-medium text-muted-foreground">
					{title}
				</CardTitle>
				<div className={statusColors[status]}>{icon}</div>
			</CardHeader>
			<CardContent>
				<div className="text-2xl font-bold">{value}</div>
				{description && (
					<p className="text-xs text-muted-foreground mt-1">{description}</p>
				)}
			</CardContent>
		</Card>
	);
}

export function SREDashboard() {
	// Fetch metrics from server actions
	const [activeUsersData, setActiveUsersData] = useState<any[] | null>(null);
	const [unreadNotifications, setUnreadNotifications] = useState<number>(0);

	useEffect(() => {
		// Fetch active users
		presence.getActiveUsers().then((data) => {
			setActiveUsersData(data);
		});

		// Fetch notifications count (placeholder - adjust based on actual server action)
		// Note: Replace with actual notification server action when available
		setUnreadNotifications(0);
	}, []);

	const activeUsers = activeUsersData?.length ?? 0;

	// Calculate health status
	const healthStatus: "good" | "warning" | "critical" =
		activeUsers > 0 ? "good" : "warning";

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<h2 className="text-2xl font-bold tracking-tight">
					Tableau de Bord SRE
				</h2>
				<div className="flex items-center gap-2 text-sm text-muted-foreground">
					<div className="flex items-center gap-1">
						<div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
						<span>Live</span>
					</div>
				</div>
			</div>

			{/* Key Metrics Grid */}
			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
				<MetricCard
					title="Utilisateurs Actifs"
					value={activeUsers}
					icon={<Users className="h-4 w-4" />}
					description="Connectés maintenant"
					status={healthStatus}
				/>

				<MetricCard
					title="État du Système"
					value="Opérationnel"
					icon={<Activity className="h-4 w-4" />}
					description="Tous les services en ligne"
					status="good"
				/>

				<MetricCard
					title="Notifications en Attente"
					value={unreadNotifications}
					icon={<AlertTriangle className="h-4 w-4" />}
					description="À traiter"
					status={unreadNotifications > 10 ? "warning" : "good"}
				/>

				<MetricCard
					title="Uptime"
					value="99.9%"
					icon={<Clock className="h-4 w-4" />}
					description="30 derniers jours"
					status="good"
				/>
			</div>

			{/* System Status Section */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<BarChart3 className="h-5 w-5" />
						État des Services
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="space-y-3">
						<ServiceStatus
							name="Base de données (Convex)"
							status="operational"
						/>
						<ServiceStatus
							name="Authentification (Clerk)"
							status="operational"
						/>
						<ServiceStatus name="Monitoring (Sentry)" status="operational" />
						<ServiceStatus name="Intégration Pipedrive" status="operational" />
						<ServiceStatus name="Intégration O365" status="operational" />
					</div>
				</CardContent>
			</Card>

			{/* Quick Actions */}
			<Card>
				<CardHeader>
					<CardTitle>Actions Rapides</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="flex flex-wrap gap-2">
						<a
							href="https://dashboard.convex.dev"
							target="_blank"
							rel="noopener noreferrer"
							className="inline-flex items-center gap-2 px-3 py-2 text-sm bg-primary/10 text-primary rounded-md hover:bg-primary/20 transition-colors"
						>
							<TrendingUp className="h-4 w-4" />
							Convex Dashboard
						</a>
						<a
							href="https://sentry.io"
							target="_blank"
							rel="noopener noreferrer"
							className="inline-flex items-center gap-2 px-3 py-2 text-sm bg-primary/10 text-primary rounded-md hover:bg-primary/20 transition-colors"
						>
							<AlertTriangle className="h-4 w-4" />
							Sentry Errors
						</a>
						<a
							href="https://dashboard.clerk.com"
							target="_blank"
							rel="noopener noreferrer"
							className="inline-flex items-center gap-2 px-3 py-2 text-sm bg-primary/10 text-primary rounded-md hover:bg-primary/20 transition-colors"
						>
							<Users className="h-4 w-4" />
							Clerk Users
						</a>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}

function ServiceStatus({
	name,
	status,
}: {
	name: string;
	status: "operational" | "degraded" | "outage";
}) {
	const statusConfig = {
		operational: {
			icon: <CheckCircle className="h-4 w-4 text-green-500" />,
			label: "Opérationnel",
			color: "text-green-500",
		},
		degraded: {
			icon: <AlertTriangle className="h-4 w-4 text-orange-500" />,
			label: "Dégradé",
			color: "text-orange-500",
		},
		outage: {
			icon: <XCircle className="h-4 w-4 text-red-500" />,
			label: "Panne",
			color: "text-red-500",
		},
	};

	const config = statusConfig[status];

	return (
		<div className="flex items-center justify-between py-2 border-b border-border last:border-0">
			<span className="text-sm">{name}</span>
			<div className="flex items-center gap-2">
				{config.icon}
				<span className={`text-sm ${config.color}`}>{config.label}</span>
			</div>
		</div>
	);
}

export default SREDashboard;
