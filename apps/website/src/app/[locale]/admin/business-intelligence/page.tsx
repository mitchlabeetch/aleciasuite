"use client";

/**
 * Business Intelligence Page - Admin Panel
 *
 * Provides access to AI-powered automated sector studies:
 * - Automated market research generation
 * - Industry analysis with projections
 * - Multi-source data aggregation
 *
 * @see Alecia-Study-Step1.json workflow
 */

import { useState } from "react";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
	Brain,
	Loader2,
	CheckCircle,
	AlertTriangle,
	Mail,
	Sparkles,
	TrendingUp,
	Globe,
	Calendar,
	Coins,
	Factory,
	Tag,
	ArrowLeft,
	Table2,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Link } from "@/i18n/navigation";

interface StudyFormData {
	location: string;
	market: string;
	period: string;
	baseYear: string;
	projectionYear: string;
	recentEvent: string;
	currency: string;
	subsegments: string;
	wantsEmail: boolean;
	email: string;
}

const defaultFormData: StudyFormData = {
	location: "France",
	market: "Pates et Semoules",
	period: "2020-2025",
	baseYear: "2023",
	projectionYear: "2030",
	recentEvent: "Inflation des matieres premieres",
	currency: "EUR",
	subsegments: "Pates seches, Fraiches, Couscous",
	wantsEmail: false,
	email: "",
};

export default function BusinessIntelligencePage() {
	const { toast } = useToast();
	const [formData, setFormData] = useState<StudyFormData>(defaultFormData);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isSuccess, setIsSuccess] = useState(false);

	const updateField = <K extends keyof StudyFormData>(
		field: K,
		value: StudyFormData[K],
	) => {
		setFormData((prev) => ({ ...prev, [field]: value }));
	};

	const handleSubmit = async () => {
		// Validate required fields
		if (!formData.location.trim() || !formData.market.trim()) {
			toast({
				title: "Champs requis",
				description: "Veuillez remplir au minimum la localisation et le marche.",
				variant: "destructive",
			});
			return;
		}

		// Validate email if user wants to receive by email
		if (formData.wantsEmail && !formData.email.trim()) {
			toast({
				title: "Email requis",
				description:
					"Veuillez entrer votre adresse email pour recevoir l'etude.",
				variant: "destructive",
			});
			return;
		}

		if (
			formData.wantsEmail &&
			!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)
		) {
			toast({
				title: "Email invalide",
				description: "Veuillez entrer une adresse email valide.",
				variant: "destructive",
			});
			return;
		}

		setIsSubmitting(true);
		setIsSuccess(false);

		try {
			const payload = {
				vars: {
					LOCATION: formData.location,
					MARKET: formData.market,
					PERIOD: formData.period,
					BASE_YEAR: formData.baseYear,
					PROJECTION_YEAR: formData.projectionYear,
					RECENT_EVENT: formData.recentEvent,
					CURRENCY: formData.currency,
					SUBSEGMENTS: formData.subsegments,
					...(formData.wantsEmail && formData.email
						? { EMAIL: formData.email }
						: {}),
				},
			};

			const response = await fetch("/api/business-intelligence/trigger", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(payload),
			});

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}));
				throw new Error(errorData.error || "Erreur lors de l'envoi");
			}

			setIsSuccess(true);
			toast({
				title: "Etude lancee avec succes",
				description: formData.wantsEmail
					? "Vous recevrez l'etude par email sous peu. Elle sera egalement disponible dans Colab."
					: "L'etude sera disponible dans Colab une fois terminee.",
			});
		} catch (error) {
			toast({
				title: "Erreur",
				description:
					error instanceof Error ? error.message : "Une erreur est survenue.",
				variant: "destructive",
			});
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleReset = () => {
		setFormData(defaultFormData);
		setIsSuccess(false);
	};

	return (
		<div className="space-y-6 p-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold flex items-center gap-2">
						<Brain className="h-8 w-8" />
						Alecia Business Intelligence
					</h1>
					<p className="text-muted-foreground mt-1">
						Intelligence artificielle pour la generation automatique d&apos;etudes
						sectorielles
					</p>
				</div>
				<Button variant="outline" asChild>
					<Link href="/admin/numbers">
						<Table2 className="h-4 w-4 mr-2" />
						Alecia Numbers
					</Link>
				</Button>
			</div>

			{/* Description Card */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Sparkles className="h-5 w-5 text-primary" />A propos de cet outil
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<p className="text-muted-foreground leading-relaxed">
						<strong>Conduite automatique d&apos;etude de secteur</strong> : cet outil
						utilise l&apos;intelligence artificielle pour generer des etudes de
						marche completes et personnalisees. En renseignant quelques
						parametres cles (localisation, secteur d&apos;activite, periode
						d&apos;analyse...), vous obtenez une analyse approfondie comprenant :
					</p>
					<ul className="list-disc pl-6 text-muted-foreground space-y-1">
						<li>Vue d&apos;ensemble du marche et tendances majeures</li>
						<li>Analyse de la chaine de valeur (supply chain)</li>
						<li>Panorama concurrentiel et acteurs cles</li>
						<li>Perspectives et projections de croissance</li>
						<li>Impact des evenements recents sur le secteur</li>
					</ul>
					<p className="text-muted-foreground">
						Le workflow combine plusieurs sources de donnees et effectue une
						verification croisee (fact-checking) pour maximiser la fiabilite
						des informations.
					</p>
				</CardContent>
			</Card>

			{/* AI Warning */}
			<Alert variant="default" className="border-amber-500/50 bg-amber-500/10">
				<AlertTriangle className="h-4 w-4 text-amber-500" />
				<AlertTitle className="text-amber-600 dark:text-amber-400">
					Avertissement concernant l&apos;IA
				</AlertTitle>
				<AlertDescription className="text-amber-600/80 dark:text-amber-400/80">
					<p>
						Les etudes generees par l&apos;IA peuvent contenir des inexactitudes
						malgre nos efforts de verification. Nous utilisons plusieurs
						techniques pour minimiser les risques de &quot;hallucination&quot; :
					</p>
					<ul className="list-disc pl-6 mt-2 space-y-1">
						<li>
							Recherche web complementaire pour valider les donnees chiffrees
						</li>
						<li>Etape de fact-checking et d&apos;enrichissement automatique</li>
						<li>Temperature de generation basse pour plus de factualite</li>
					</ul>
					<p className="mt-2 font-medium">
						Neanmoins, nous recommandons de verifier les chiffres cles aupres
						de sources officielles avant toute prise de decision strategique.
					</p>
				</AlertDescription>
			</Alert>

			{/* Form */}
			<div className="grid gap-6 lg:grid-cols-2">
				<Card>
					<CardHeader>
						<CardTitle>Parametres de l&apos;etude</CardTitle>
						<CardDescription>
							Configurez les criteres de votre etude de marche
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						{/* Location */}
						<div className="space-y-2">
							<Label className="flex items-center gap-2">
								<Globe className="h-4 w-4" />
								Localisation *
							</Label>
							<Input
								placeholder="Ex: France, Allemagne, Europe..."
								value={formData.location}
								onChange={(e) => updateField("location", e.target.value)}
							/>
						</div>

						{/* Market */}
						<div className="space-y-2">
							<Label className="flex items-center gap-2">
								<Factory className="h-4 w-4" />
								Marche / Secteur *
							</Label>
							<Input
								placeholder="Ex: Pates alimentaires, Automobile, SaaS..."
								value={formData.market}
								onChange={(e) => updateField("market", e.target.value)}
							/>
						</div>

						{/* Subsegments */}
						<div className="space-y-2">
							<Label className="flex items-center gap-2">
								<Tag className="h-4 w-4" />
								Sous-segments
							</Label>
							<Input
								placeholder="Ex: Pates seches, Fraiches, Couscous..."
								value={formData.subsegments}
								onChange={(e) => updateField("subsegments", e.target.value)}
							/>
							<p className="text-xs text-muted-foreground">
								Separez les sous-segments par des virgules
							</p>
						</div>

						{/* Period */}
						<div className="space-y-2">
							<Label className="flex items-center gap-2">
								<Calendar className="h-4 w-4" />
								Periode d&apos;analyse
							</Label>
							<Input
								placeholder="Ex: 2020-2025"
								value={formData.period}
								onChange={(e) => updateField("period", e.target.value)}
							/>
						</div>

						{/* Years */}
						<div className="grid grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label className="flex items-center gap-2">
									<Calendar className="h-4 w-4" />
									Annee de base
								</Label>
								<Input
									placeholder="2023"
									value={formData.baseYear}
									onChange={(e) => updateField("baseYear", e.target.value)}
								/>
							</div>
							<div className="space-y-2">
								<Label className="flex items-center gap-2">
									<TrendingUp className="h-4 w-4" />
									Annee de projection
								</Label>
								<Input
									placeholder="2030"
									value={formData.projectionYear}
									onChange={(e) => updateField("projectionYear", e.target.value)}
								/>
							</div>
						</div>

						{/* Recent Event */}
						<div className="space-y-2">
							<Label className="flex items-center gap-2">
								<AlertTriangle className="h-4 w-4" />
								Evenement recent marquant
							</Label>
							<Input
								placeholder="Ex: Inflation des matieres premieres, Crise sanitaire..."
								value={formData.recentEvent}
								onChange={(e) => updateField("recentEvent", e.target.value)}
							/>
						</div>

						{/* Currency */}
						<div className="space-y-2">
							<Label className="flex items-center gap-2">
								<Coins className="h-4 w-4" />
								Devise
							</Label>
							<Input
								placeholder="EUR"
								value={formData.currency}
								onChange={(e) => updateField("currency", e.target.value)}
							/>
						</div>
					</CardContent>
				</Card>

				{/* Right column: Email + Submit */}
				<div className="space-y-6">
					{/* Email Option */}
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Mail className="h-5 w-5" />
								Recevoir par email
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="flex items-center space-x-2">
								<Checkbox
									id="wantsEmail"
									checked={formData.wantsEmail}
									onCheckedChange={(checked: boolean | "indeterminate") =>
										updateField("wantsEmail", checked === true)
									}
								/>
								<Label
									htmlFor="wantsEmail"
									className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
								>
									Je souhaite recevoir l&apos;etude par mail
								</Label>
							</div>

							{formData.wantsEmail && (
								<div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
									<Label htmlFor="email">Adresse email</Label>
									<Input
										id="email"
										type="email"
										placeholder="votre@email.com"
										value={formData.email}
										onChange={(e) => updateField("email", e.target.value)}
									/>
								</div>
							)}
						</CardContent>
					</Card>

					{/* Submit Card */}
					<Card>
						<CardHeader>
							<CardTitle>Lancer l&apos;etude</CardTitle>
							<CardDescription>
								L&apos;analyse sera generee automatiquement par notre systeme IA
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							{isSuccess ? (
								<Alert className="border-green-500/50 bg-green-500/10">
									<CheckCircle className="h-4 w-4 text-green-500" />
									<AlertTitle className="text-green-600 dark:text-green-400">
										Etude lancee avec succes
									</AlertTitle>
									<AlertDescription className="text-green-600/80 dark:text-green-400/80">
										{formData.wantsEmail ? (
											<>
												Vous recevrez l&apos;etude par email a{" "}
												<strong>{formData.email}</strong> une fois terminee.
												Elle sera egalement disponible dans Colab.
											</>
										) : (
											<>
												L&apos;etude sera disponible dans Colab une fois terminee.
												Vous serez notifie lorsqu&apos;elle sera prete.
											</>
										)}
									</AlertDescription>
								</Alert>
							) : (
								<div className="space-y-4">
									<div className="flex items-center gap-2 text-sm text-muted-foreground">
										<Badge variant="secondary">Marche</Badge>
										<span>{formData.market || "Non defini"}</span>
									</div>
									<div className="flex items-center gap-2 text-sm text-muted-foreground">
										<Badge variant="secondary">Localisation</Badge>
										<span>{formData.location || "Non defini"}</span>
									</div>
									<div className="flex items-center gap-2 text-sm text-muted-foreground">
										<Badge variant="secondary">Periode</Badge>
										<span>{formData.period || "Non defini"}</span>
									</div>
									{formData.wantsEmail && formData.email && (
										<div className="flex items-center gap-2 text-sm text-muted-foreground">
											<Badge variant="secondary">Email</Badge>
											<span>{formData.email}</span>
										</div>
									)}
								</div>
							)}

							<div className="flex gap-2">
								<Button
									onClick={handleSubmit}
									disabled={isSubmitting}
									className="flex-1"
								>
									{isSubmitting ? (
										<>
											<Loader2 className="h-4 w-4 animate-spin mr-2" />
											Generation en cours...
										</>
									) : (
										<>
											<Brain className="h-4 w-4 mr-2" />
											Lancer l&apos;etude
										</>
									)}
								</Button>
								{isSuccess && (
									<Button variant="outline" onClick={handleReset}>
										Nouvelle etude
									</Button>
								)}
							</div>
						</CardContent>
					</Card>

					{/* Info Card */}
					<Card className="bg-muted/30">
						<CardContent className="pt-6">
							<div className="flex items-start gap-3">
								<div className="rounded-full bg-primary/10 p-2">
									<Sparkles className="h-4 w-4 text-primary" />
								</div>
								<div className="space-y-1">
									<p className="text-sm font-medium">Temps de generation</p>
									<p className="text-xs text-muted-foreground">
										La generation d&apos;une etude complete prend generalement entre
										2 et 5 minutes selon la complexite du marche analyse.
									</p>
								</div>
							</div>
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	);
}
