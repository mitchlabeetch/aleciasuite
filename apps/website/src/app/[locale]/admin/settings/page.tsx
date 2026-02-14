"use client";

import {
	Settings as _Settings,
	User,
	Palette,
	Bell,
	Shield,
	Database,
	Globe,
	Plug,
	Download,
	RefreshCw,
	FileText,
	Trash2,
} from "lucide-react";
import Link from "next/link";
import { useToast } from "@/components/ui/use-toast";
import { useRouter, useParams } from "next/navigation";
import { DEFAULT_LOCALE } from "@/lib/constants";

/**
 * Settings Page
 *
 * Configuration options for the admin panel
 */
export default function SettingsPage() {
	const { toast } = useToast();
	const router = useRouter();
	const params = useParams();
	const locale = params?.locale || DEFAULT_LOCALE;

	return (
		<div className="p-6 space-y-6">
			{/* Header */}
			<div>
				<h1 className="text-3xl font-bold text-[var(--alecia-midnight)] dark:text-white">
					Paramètres
				</h1>
				<p className="text-muted-foreground">
					Configuration de votre espace de travail
				</p>
			</div>

			{/* Integrations Card - Featured */}
			<Link
				href={`/${locale}/admin/settings/integrations`}
				className="block rounded-2xl border-2 border-alecia-mid-blue/50 bg-gradient-to-br from-[var(--alecia-mid-blue)]/5 to-transparent dark:from-[var(--alecia-mid-blue)]/10 p-6 hover:shadow-lg hover:border-[var(--alecia-mid-blue)] transition-all duration-200"
			>
				<div className="flex items-start gap-4">
					<div className="p-3 rounded-xl bg-[var(--alecia-mid-blue)]/10 text-alecia-mid-blue">
						<Plug className="w-6 h-6" />
					</div>
					<div className="flex-1">
						<div className="flex items-center gap-2 mb-1">
							<h3 className="font-semibold text-[var(--alecia-midnight)] dark:text-white">
								Intégrations
							</h3>
							<span className="px-2 py-0.5 text-xs font-medium rounded-full bg-[var(--alecia-mid-blue)]/10 text-alecia-mid-blue">
								Nouveau
							</span>
						</div>
						<p className="text-sm text-muted-foreground">
							Connectez Microsoft 365 et Pipedrive pour synchroniser vos données
						</p>
						<ul className="mt-3 space-y-1">
							<li className="text-sm text-alecia-mid-blue">
								Microsoft 365 (Calendar, Contacts)
							</li>
							<li className="text-sm text-alecia-mid-blue">
								Pipedrive (CRM, Deals)
							</li>
						</ul>
					</div>
				</div>
			</Link>

			{/* Settings Grid */}
			<div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
				{SETTINGS_SECTIONS.map((section) => (
					<div
						key={section.title}
						className="rounded-2xl border border-border bg-card p-6 hover:shadow-md transition-shadow cursor-pointer"
					>
						<div className="flex items-start gap-4">
							<div className={`p-3 rounded-xl ${section.color}`}>
								<section.icon className="w-6 h-6" />
							</div>
							<div className="flex-1">
								<h3 className="font-semibold text-[var(--alecia-midnight)] dark:text-white mb-1">
									{section.title}
								</h3>
								<p className="text-sm text-muted-foreground">
									{section.description}
								</p>
								<ul className="mt-3 space-y-1">
									{section.items.map((item, index) => (
										<li
											key={`${section.title}-item-${index}`}
											className="text-sm text-alecia-mid-blue hover:underline cursor-pointer"
										>
											{item}
										</li>
									))}
								</ul>
							</div>
						</div>
					</div>
				))}
			</div>

			{/* Quick Actions */}
			<div className="rounded-2xl border border-border bg-card p-6">
				<h3 className="font-semibold text-[var(--alecia-midnight)] dark:text-white mb-4">
					Actions rapides
				</h3>
				<div className="flex flex-wrap gap-3">
					<button
						type="button"
						onClick={() =>
							toast({
								title: "Export en préparation",
								description:
									"La fonctionnalité d'export sera disponible prochainement.",
							})
						}
						className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-muted hover:bg-muted/80 rounded-lg transition-colors touch-target"
					>
						<Download className="w-4 h-4" />
						Exporter les données
					</button>
					<button
						type="button"
						onClick={() => router.push(`/${locale}/admin/settings/integrations`)}
						className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-muted hover:bg-muted/80 rounded-lg transition-colors touch-target"
					>
						<RefreshCw className="w-4 h-4" />
						Synchroniser Pipedrive
					</button>
					<button
						type="button"
						onClick={() =>
							toast({
								title: "Rapport en cours",
								description:
									"La génération de rapports sera disponible prochainement.",
							})
						}
						className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-muted hover:bg-muted/80 rounded-lg transition-colors touch-target"
					>
						<FileText className="w-4 h-4" />
						Générer rapport
					</button>
					<button
						type="button"
						onClick={() => {
							// Clear localStorage cache
							if (typeof window !== "undefined") {
								const keysCleared = Object.keys(localStorage).length;
								localStorage.clear();
								toast({
									title: "Cache vidé",
									description: `${keysCleared} éléments supprimés du cache local.`,
								});
							}
						}}
						className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/30 transition-colors"
					>
						<Trash2 className="w-4 h-4" />
						Vider le cache
					</button>
				</div>
			</div>
		</div>
	);
}

const SETTINGS_SECTIONS = [
	{
		title: "Profil",
		description: "Gérez vos informations personnelles et préférences",
		icon: User,
		color: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
		items: [
			"Modifier le profil",
			"Changer le mot de passe",
			"Préférences de notification",
		],
	},
	{
		title: "Apparence",
		description: "Personnalisez l'interface du panel",
		icon: Palette,
		color:
			"bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400",
		items: ["Thème clair/sombre", "Couleurs de marque", "Densité d'affichage"],
	},
	{
		title: "Notifications",
		description: "Configurez vos alertes et rappels",
		icon: Bell,
		color:
			"bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400",
		items: ["Email", "Push navigateur", "Digest hebdomadaire"],
	},
	{
		title: "Sécurité",
		description: "Paramètres d'authentification et accès",
		icon: Shield,
		color:
			"bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400",
		items: ["Sessions actives", "Authentification 2FA", "Logs d'audit"],
	},
	{
		title: "Données",
		description: "Import/export et synchronisation",
		icon: Database,
		color: "bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400",
		items: ["Import CSV", "Export données", "Sync Pipedrive"],
	},
	{
		title: "Langue",
		description: "Préférences régionales",
		icon: Globe,
		color: "bg-cyan-100 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400",
		items: ["Français / English", "Format de date", "Devise par défaut"],
	},
];
