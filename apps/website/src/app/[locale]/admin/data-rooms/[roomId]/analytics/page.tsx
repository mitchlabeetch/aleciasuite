"use client";

/**
 * Data Room Analytics Dashboard
 *
 * Displays access analytics for a data room:
 * - Total views and downloads
 * - Unique users
 * - Views over time chart
 * - Most viewed documents
 * - User activity breakdown
 */

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
	FolderLock,
	Eye,
	Download,
	Users,
	TrendingUp,
	FileText,
	ArrowLeft,
	Loader2,
	BarChart3,
	Calendar,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import { getDealRoom, getAccessLog } from "@/actions";

// Format date
function formatDate(timestamp: number): string {
	return new Date(timestamp).toLocaleDateString("fr-FR", {
		day: "numeric",
		month: "short",
		year: "numeric",
	});
}

// Simple bar chart component
function SimpleBarChart({ data }: { data: Record<string, number> }) {
	const entries = Object.entries(data).sort((a, b) => a[0].localeCompare(b[0]));
	const maxValue = Math.max(...entries.map(([, v]) => v), 1);

	if (entries.length === 0) {
		return (
			<div className="flex items-center justify-center h-40 text-muted-foreground">
				Aucune donnée
			</div>
		);
	}

	return (
		<div className="flex items-end gap-1 h-40">
			{entries.slice(-14).map(([date, value]) => (
				<div key={date} className="flex-1 flex flex-col items-center gap-1">
					<div
						className="w-full bg-primary rounded-t transition-all"
						style={{
							height: `${(value / maxValue) * 100}%`,
							minHeight: value > 0 ? 4 : 0,
						}}
					/>
					<span className="text-[10px] text-muted-foreground rotate-45 origin-left">
						{date.slice(5)}
					</span>
				</div>
			))}
		</div>
	);
}

export default function DataRoomAnalyticsPage() {
	const params = useParams();
	const roomId = params.roomId as string;

	// Data state
	const [room, setRoom] = useState<any>(null);
	const [analytics, setAnalytics] = useState<any>(null);
	const [accessLog, setAccessLog] = useState<any[]>([]);

	// Fetch data
	useEffect(() => {
		getDealRoom(roomId).then(setRoom);
		// Note: getRoomAnalytics will need to be added to actions
		// For now using placeholder
		setAnalytics({
			totalViews: 0,
			totalDownloads: 0,
			uniqueUsers: 0,
			topDocuments: [],
			viewsByDay: {}
		});
		getAccessLog(roomId, 50).then(setAccessLog);
	}, [roomId]);

	if (!room || !analytics) {
		return (
			<div className="flex items-center justify-center min-h-screen">
				<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
			</div>
		);
	}

	return (
		<div className="space-y-6 p-6">
			{/* Header */}
			<div className="flex items-center gap-4">
				<Link href={`/admin/data-rooms/${roomId}`}>
					<Button variant="ghost" size="icon">
						<ArrowLeft className="h-4 w-4" />
					</Button>
				</Link>
				<div>
					<div className="flex items-center gap-2">
						<BarChart3 className="h-6 w-6 text-primary" />
						<h1 className="text-2xl font-bold">Analytics</h1>
					</div>
					<p className="text-muted-foreground flex items-center gap-2">
						<FolderLock className="h-4 w-4" />
						{room.name}
					</p>
				</div>
			</div>

			{/* Stats cards */}
			<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-sm font-medium text-muted-foreground">
							Vues totales
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="flex items-center gap-2">
							<Eye className="h-5 w-5 text-blue-600" />
							<span className="text-3xl font-bold">{analytics.totalViews}</span>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-sm font-medium text-muted-foreground">
							Téléchargements
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="flex items-center gap-2">
							<Download className="h-5 w-5 text-green-600" />
							<span className="text-3xl font-bold">
								{analytics.totalDownloads}
							</span>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-sm font-medium text-muted-foreground">
							Utilisateurs uniques
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="flex items-center gap-2">
							<Users className="h-5 w-5 text-purple-600" />
							<span className="text-3xl font-bold">
								{analytics.uniqueUsers}
							</span>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-sm font-medium text-muted-foreground">
							Documents consultés
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="flex items-center gap-2">
							<FileText className="h-5 w-5 text-orange-600" />
							<span className="text-3xl font-bold">
								{analytics.topDocuments.length}
							</span>
						</div>
					</CardContent>
				</Card>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				{/* Views over time */}
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<TrendingUp className="h-5 w-5" />
							Activité (30 derniers jours)
						</CardTitle>
						<CardDescription>Nombre de consultations par jour</CardDescription>
					</CardHeader>
					<CardContent>
						<SimpleBarChart data={analytics.viewsByDay} />
					</CardContent>
				</Card>

				{/* Top documents */}
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<FileText className="h-5 w-5" />
							Documents les plus consultés
						</CardTitle>
						<CardDescription>
							Top 10 des documents par nombre de vues
						</CardDescription>
					</CardHeader>
					<CardContent>
						{analytics.topDocuments.length === 0 ? (
							<div className="text-center py-8 text-muted-foreground">
								Aucune activité enregistrée
							</div>
						) : (
							<div className="space-y-3">
								{analytics.topDocuments.map(
									(
										doc: {
											documentId: string;
											fileName: string;
											views: number;
										},
										index: number,
									) => (
										<div
											key={doc.documentId}
											className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50"
										>
											<div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
												{index + 1}
											</div>
											<div className="flex-1 min-w-0">
												<p className="font-medium truncate">{doc.fileName}</p>
											</div>
											<Badge variant="secondary">
												<Eye className="h-3 w-3 mr-1" />
												{doc.views}
											</Badge>
										</div>
									),
								)}
							</div>
						)}
					</CardContent>
				</Card>
			</div>

			{/* Recent activity log */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Calendar className="h-5 w-5" />
						Historique d&apos;activité
					</CardTitle>
					<CardDescription>
						Les 50 dernières actions dans cette Data Room
					</CardDescription>
				</CardHeader>
				<CardContent>
					{!accessLog || accessLog.length === 0 ? (
						<div className="text-center py-8 text-muted-foreground">
							Aucune activité enregistrée
						</div>
					) : (
						<div className="space-y-2">
							<div className="grid grid-cols-5 gap-4 p-2 text-sm font-medium text-muted-foreground border-b">
								<div>Utilisateur</div>
								<div>Action</div>
								<div className="col-span-2">Document</div>
								<div>Date</div>
							</div>
							{accessLog.map(
								(log: {
									id: string;
									userEmail: string;
									action: string;
									documentName?: string;
									timestamp: number;
								}) => (
									<div
										key={log.id}
										className="grid grid-cols-5 gap-4 p-2 text-sm hover:bg-muted/50 rounded-lg"
									>
										<div className="truncate">{log.userEmail}</div>
										<div>
											<Badge
												variant={
													log.action === "download" ? "default" : "secondary"
												}
												className="text-xs"
											>
												{log.action === "view" ? (
													<>
														<Eye className="h-3 w-3 mr-1" />
														Vue
													</>
												) : (
													<>
														<Download className="h-3 w-3 mr-1" />
														Téléchargement
													</>
												)}
											</Badge>
										</div>
										<div className="col-span-2 truncate text-muted-foreground">
											{log.documentName || "—"}
										</div>
										<div className="text-muted-foreground">
											{formatDate(log.timestamp)}
										</div>
									</div>
								),
							)}
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
