"use client";

import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/tailwind/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/tailwind/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Building, ExternalLink } from "lucide-react";

// Prevent static generation
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default function CompaniesPage() {
	return (
		<AppShell>
			<div className="space-y-6">
				<div className="flex items-center justify-between">
					<div>
						<h1 className="text-3xl font-bold tracking-tight">Sociétés</h1>
						<p className="text-muted-foreground">
							Gérez votre portefeuille de sociétés
						</p>
					</div>
					<Button asChild>
						<a href="/admin/crm" target="_blank" rel="noopener noreferrer">
							<ExternalLink className="h-4 w-4 mr-2" />
							Ouvrir le CRM
						</a>
					</Button>
				</div>

				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Building className="h-5 w-5" />
							Gestion des sociétés
						</CardTitle>
						<CardDescription>
							La gestion complète des sociétés est disponible dans le panneau
							d'administration CRM
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<p className="text-sm text-muted-foreground">
							Accédez au CRM pour créer, modifier et gérer vos profils
							d'entreprises, leurs contacts, et historique de transactions.
						</p>
						<Button variant="outline" asChild>
							<a href="/admin/crm" target="_blank" rel="noopener noreferrer">
								<ExternalLink className="h-4 w-4 mr-2" />
								Accéder au CRM Admin
							</a>
						</Button>
					</CardContent>
				</Card>

				<EmptyState
					icon={Building}
					title="Vue rapide des sociétés"
					description="Cette vue intégrée sera bientôt disponible. Pour l'instant, utilisez le CRM dans le panneau admin."
					action={{
						label: "Ouvrir le CRM",
						href: "/admin/crm",
					}}
				/>
			</div>
		</AppShell>
	);
}
