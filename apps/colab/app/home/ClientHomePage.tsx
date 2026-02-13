"use client";

/**
 * ClientHomePage - Page d'accueil utilisateur (Client Component)
 * Route: colab.alecia.markets/home
 */

import { Button } from "@/components/tailwind/ui/button";
import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "@/components/tailwind/ui/tabs";
import { useSession, signIn } from "@alepanel/auth/client";
import {
	Briefcase,
	Clock,
	FileText,
	FolderOpen,
	Plus,
	TrendingUp,
	Users,
} from "lucide-react";
import nextDynamic from "next/dynamic";
import { useState } from "react";

// Dynamic imports for heavy components
const TailwindAdvancedEditor = nextDynamic(
	() => import("@/components/tailwind/advanced-editor"),
	{
		ssr: false,
		loading: () => <div className="animate-pulse h-96 bg-muted rounded-lg" />,
	},
);

const DealPipeline = nextDynamic(() => import("@/components/deal-pipeline"), {
	ssr: false,
	loading: () => <div className="animate-pulse h-64 bg-muted rounded-lg" />,
});

// Stats
const stats = [
	{ label: "Deals actifs", value: 12, icon: Briefcase, color: "text-blue-500" },
	{ label: "Documents", value: 48, icon: FileText, color: "text-green-500" },
	{ label: "Équipe", value: 6, icon: Users, color: "text-purple-500" },
	{ label: "Ce mois", value: "+3", icon: TrendingUp, color: "text-orange-500" },
];

// Activités récentes
const recentActivity = [
	{ title: "Deal Acquisition XYZ", time: "Il y a 2h", type: "deal" },
	{ title: "Note de synthèse modifiée", time: "Il y a 4h", type: "doc" },
	{ title: "Nouveau membre ajouté", time: "Hier", type: "team" },
	{ title: "Due diligence terminée", time: "Il y a 2j", type: "deal" },
];

export default function ClientHomePage() {
	const [activeTab, setActiveTab] = useState("overview");
	const { data: session, isPending } = useSession();

	return (
		<div className="min-h-screen bg-background">
			{/* Header */}
			<header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-40">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="flex items-center justify-between h-16">
						<div className="flex items-center gap-3">
							<Briefcase className="h-6 w-6 text-primary" />
							<span className="text-xl font-semibold">Alecia Colab</span>
						</div>

						<div className="flex items-center gap-4">
							{!session?.user ? (
								<Button onClick={() => signIn.social({ provider: "google" })}>
									Connexion
								</Button>
							) : (
								<>
									<Button variant="outline" size="sm" className="gap-2">
										<Plus className="h-4 w-4" />
										Nouveau Deal
									</Button>
									<div className="flex items-center gap-2">
										{session.user.image && (
											<img
												src={session.user.image}
												alt={session.user.name || "User"}
												className="h-8 w-8 rounded-full"
											/>
										)}
									</div>
								</>
							)}
						</div>
					</div>
				</div>
			</header>

			{/* Main Content */}
			<main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				{/* Welcome */}
				<div className="mb-8">
					<h1 className="text-2xl font-bold text-foreground">
						Bienvenue sur Alecia Colab
					</h1>
					<p className="text-muted-foreground mt-1">
						Votre plateforme M&A de centralisation et collaboration
					</p>
				</div>

				{/* Stats Grid */}
				<div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
					{stats.map((stat) => (
						<div
							key={stat.label}
							className="bg-card border rounded-xl p-4 hover:shadow-md transition-shadow"
						>
							<div className="flex items-center gap-3">
								<div className={`p-2 rounded-lg bg-muted ${stat.color}`}>
									<stat.icon className="h-5 w-5" />
								</div>
								<div>
									<p className="text-2xl font-bold">{stat.value}</p>
									<p className="text-sm text-muted-foreground">{stat.label}</p>
								</div>
							</div>
						</div>
					))}
				</div>

				{/* Tabs */}
				<Tabs
					value={activeTab}
					onValueChange={setActiveTab}
					className="space-y-6"
				>
					<TabsList className="grid w-full max-w-lg grid-cols-3">
						<TabsTrigger value="overview" className="gap-2">
							<FolderOpen className="h-4 w-4" />
							Vue d'ensemble
						</TabsTrigger>
						<TabsTrigger value="editor" className="gap-2">
							<FileText className="h-4 w-4" />
							Éditeur
						</TabsTrigger>
						<TabsTrigger value="pipeline" className="gap-2">
							<Briefcase className="h-4 w-4" />
							Pipeline
						</TabsTrigger>
					</TabsList>

					<TabsContent value="overview" className="space-y-6">
						{/* Recent Activity */}
						<div className="bg-card border rounded-xl p-6">
							<h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
								<Clock className="h-5 w-5 text-muted-foreground" />
								Activité récente
							</h2>
							<div className="space-y-3">
								{recentActivity.map((item, index) => (
									<div
										key={`${item.title}-${index}`}
										className="flex items-center justify-between py-2 border-b last:border-0"
									>
										<div className="flex items-center gap-3">
											<div
												className={`w-2 h-2 rounded-full ${
													item.type === "deal"
														? "bg-blue-500"
														: item.type === "doc"
															? "bg-green-500"
															: "bg-purple-500"
												}`}
											/>
											<span className="text-sm">{item.title}</span>
										</div>
										<span className="text-xs text-muted-foreground">
											{item.time}
										</span>
									</div>
								))}
							</div>
						</div>

						{/* Quick Actions */}
						<div className="grid md:grid-cols-3 gap-4">
							<Button variant="outline" className="h-24 flex-col gap-2">
								<Plus className="h-6 w-6" />
								<span>Créer un deal</span>
							</Button>
							<Button variant="outline" className="h-24 flex-col gap-2">
								<FileText className="h-6 w-6" />
								<span>Nouvelle note</span>
							</Button>
							<Button variant="outline" className="h-24 flex-col gap-2">
								<Users className="h-6 w-6" />
								<span>Inviter un membre</span>
							</Button>
						</div>
					</TabsContent>

					<TabsContent value="editor">
						<div className="bg-card border rounded-xl p-6">
							<TailwindAdvancedEditor documentId="demo-document-v1" />
						</div>
					</TabsContent>

					<TabsContent value="pipeline">
						<div className="bg-card border rounded-xl p-6">
							<DealPipeline />
						</div>
					</TabsContent>
				</Tabs>
			</main>

			{/* Footer */}
			<footer className="border-t mt-16 py-6 text-center text-sm text-muted-foreground">
				<p>© 2026 Alecia. Tous droits réservés.</p>
			</footer>
		</div>
	);
}
