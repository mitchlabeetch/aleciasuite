"use client";

import { useSession } from "@alepanel/auth/client";
import {
	Bell,
	Calendar,
	Database,
	Download,
	Loader2,
	Monitor,
	Moon,
	Palette,
	Shield,
	Sun,
	User,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useState } from "react";

import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/tailwind/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/tailwind/ui/card";
import { Label } from "@/components/tailwind/ui/label";
import { Separator } from "@/components/tailwind/ui/separator";
import { Switch } from "@/components/tailwind/ui/switch";

// Prevent static generation
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default function SettingsPage() {
	const { theme, setTheme } = useTheme();
	const { data: session } = useSession();
	const [notifications, setNotifications] = useState(true);

	// Calendar sync state - TODO: Implement server actions for calendar sync
	const [isSyncing, setIsSyncing] = useState<"google" | "microsoft" | null>(
		null,
	);

	// Placeholder sync states - TODO: Replace with actual data from server actions
	interface CalendarSyncState {
		isEnabled: boolean;
		lastSyncedAt?: number;
		lastError?: string;
	}
	const googleSync = null as CalendarSyncState | null;
	const microsoftSync = null as CalendarSyncState | null;

	// Data export - TODO: Implement server action for data export
	const [isExporting, setIsExporting] = useState(false);

	const handleExportData = async () => {
		setIsExporting(true);
		try {
			// TODO: Call server action when available
			console.log("Data export not yet implemented");
			alert("L'export de données sera bientôt disponible");
		} finally {
			setIsExporting(false);
		}
	};

	const handleToggleSync = async (
		provider: "google" | "microsoft",
		enabled: boolean,
	) => {
		setIsSyncing(provider);
		try {
			// TODO: Call server action when available
			console.log(`Toggle sync for ${provider}: ${enabled}`);
		} finally {
			setIsSyncing(null);
		}
	};

	const formatLastSync = (timestamp?: number) => {
		if (!timestamp) return "Jamais";
		const date = new Date(timestamp);
		const now = new Date();
		const diffMs = now.getTime() - date.getTime();
		const diffMins = Math.floor(diffMs / 60000);

		if (diffMins < 1) return "À l'instant";
		if (diffMins < 60) return `Il y a ${diffMins} min`;
		const diffHours = Math.floor(diffMins / 60);
		if (diffHours < 24) return `Il y a ${diffHours}h`;
		return date.toLocaleDateString("fr-FR");
	};

	// Compute sync status strings to avoid TypeScript narrowing issues
	const googleSyncStatus = googleSync && googleSync.lastSyncedAt
		? `Dernière sync: ${formatLastSync(googleSync.lastSyncedAt)}`
		: "Non synchronisé";
	const microsoftSyncStatus = microsoftSync && microsoftSync.lastSyncedAt
		? `Dernière sync: ${formatLastSync(microsoftSync.lastSyncedAt)}`
		: "Non synchronisé";

	return (
		<AppShell>
			<div className="space-y-6">
				<div>
					<h1 className="text-3xl font-bold tracking-tight">Paramètres</h1>
					<p className="text-muted-foreground">
						Gérez vos préférences et paramètres de compte
					</p>
				</div>

				<div className="grid gap-6">
					{/* Appearance */}
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Palette className="h-5 w-5" />
								Apparence
							</CardTitle>
							<CardDescription>
								Personnalisez l'apparence de l'application
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="flex items-center justify-between">
								<div className="space-y-0.5">
									<Label>Thème</Label>
									<p className="text-sm text-muted-foreground">
										Choisissez votre thème préféré
									</p>
								</div>
							</div>
							<div className="flex gap-2">
								<Button
									variant={theme === "light" ? "default" : "outline"}
									size="sm"
									onClick={() => setTheme("light")}
								>
									<Sun className="h-4 w-4 mr-2" />
									Clair
								</Button>
								<Button
									variant={theme === "dark" ? "default" : "outline"}
									size="sm"
									onClick={() => setTheme("dark")}
								>
									<Moon className="h-4 w-4 mr-2" />
									Sombre
								</Button>
								<Button
									variant={theme === "system" ? "default" : "outline"}
									size="sm"
									onClick={() => setTheme("system")}
								>
									<Monitor className="h-4 w-4 mr-2" />
									Système
								</Button>
							</div>
						</CardContent>
					</Card>

					{/* Notifications */}
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Bell className="h-5 w-5" />
								Notifications
							</CardTitle>
							<CardDescription>
								Configurez vos préférences de notification
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="flex items-center justify-between">
								<div className="space-y-0.5">
									<Label>Activer les notifications</Label>
									<p className="text-sm text-muted-foreground">
										Recevoir des notifications pour les mises à jour
									</p>
								</div>
								<Switch
									checked={notifications}
									onCheckedChange={setNotifications}
								/>
							</div>
						</CardContent>
					</Card>

					{/* Calendar Sync */}
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Calendar className="h-5 w-5" />
								Synchronisation Calendrier
							</CardTitle>
							<CardDescription>
								Synchronisez vos calendriers Google et Microsoft
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							{/* Google Calendar */}
							<div className="flex items-center justify-between">
								<div className="space-y-0.5">
									<Label className="flex items-center gap-2">
										<svg className="h-4 w-4" viewBox="0 0 24 24">
											<path
												fill="#4285F4"
												d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
											/>
											<path
												fill="#34A853"
												d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
											/>
											<path
												fill="#FBBC05"
												d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
											/>
											<path
												fill="#EA4335"
												d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
											/>
										</svg>
										Google Calendar
									</Label>
									<p className="text-sm text-muted-foreground">
										{googleSync?.lastSyncedAt
											? `Dernière sync: ${formatLastSync(googleSync?.lastSyncedAt ?? 0)}`
											: "Non synchronisé"}
										{googleSync?.lastError && (
											<span className="text-destructive ml-2">• Erreur</span>
										)}
									</p>
								</div>
								<div className="flex items-center gap-2">
									{isSyncing === "google" && (
										<Loader2 className="h-4 w-4 animate-spin" />
									)}
									<Switch
										checked={googleSync?.isEnabled ?? false}
										onCheckedChange={(checked) =>
											handleToggleSync("google", checked)
										}
										disabled={isSyncing !== null}
									/>
								</div>
							</div>

							<Separator />

							{/* Microsoft Calendar */}
							<div className="flex items-center justify-between">
								<div className="space-y-0.5">
									<Label className="flex items-center gap-2">
										<svg className="h-4 w-4" viewBox="0 0 23 23">
											<path fill="#f25022" d="M1 1h10v10H1z" />
											<path fill="#00a4ef" d="M1 12h10v10H1z" />
											<path fill="#7fba00" d="M12 1h10v10H12z" />
											<path fill="#ffb900" d="M12 12h10v10H12z" />
										</svg>
										Microsoft 365
									</Label>
									<p className="text-sm text-muted-foreground">
										{microsoftSync?.lastSyncedAt
											? `Dernière sync: ${formatLastSync(microsoftSync.lastSyncedAt)}`
											: "Non synchronisé"}
										{microsoftSync?.lastError && (
											<span className="text-destructive ml-2">• Erreur</span>
										)}
									</p>
								</div>
								<div className="flex items-center gap-2">
									{isSyncing === "microsoft" && (
										<Loader2 className="h-4 w-4 animate-spin" />
									)}
									<Switch
										checked={microsoftSync?.isEnabled ?? false}
										onCheckedChange={(checked) =>
											handleToggleSync("microsoft", checked)
										}
										disabled={isSyncing !== null}
									/>
								</div>
							</div>

							<Separator />

							<p className="text-sm text-muted-foreground">
								La synchronisation automatique s'effectue toutes les 15 minutes.
							</p>
						</CardContent>
					</Card>

					{/* Profile */}
					{session?.user && (
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<User className="h-5 w-5" />
									Profil
								</CardTitle>
								<CardDescription>Informations de votre compte</CardDescription>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="space-y-2">
									<Label>Email</Label>
									<p className="text-sm">
										{session.user.email}
									</p>
								</div>
								<Separator />
								<div className="space-y-2">
									<Label>Nom</Label>
									<p className="text-sm">{session.user.name || "Non défini"}</p>
								</div>
							</CardContent>
						</Card>
					)}

					{/* Security */}
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Shield className="h-5 w-5" />
								Sécurité
							</CardTitle>
							<CardDescription>
								Gérez vos paramètres de sécurité
							</CardDescription>
						</CardHeader>
						<CardContent>
							<p className="text-sm text-muted-foreground">
								La gestion de la sécurité est assurée par Clerk. Visitez votre
								profil pour plus d'options.
							</p>
						</CardContent>
					</Card>

					{/* Data Export */}
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Database className="h-5 w-5" />
								Export des données
							</CardTitle>
							<CardDescription>
								Exportez toutes vos données pour sauvegarde
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							<p className="text-sm text-muted-foreground">
								Téléchargez une copie complète de vos données au format JSON.
								Cela inclut vos deals, entreprises, contacts, documents,
								événements de calendrier et présentations.
							</p>
							<Button
								onClick={handleExportData}
								disabled={isExporting}
								className="gap-2"
							>
								{isExporting ? (
									<Loader2 className="h-4 w-4 animate-spin" />
								) : (
									<Download className="h-4 w-4" />
								)}
								{isExporting
									? "Export en cours..."
									: "Exporter toutes mes données"}
							</Button>
						</CardContent>
					</Card>
				</div>
			</div>
		</AppShell>
	);
}
