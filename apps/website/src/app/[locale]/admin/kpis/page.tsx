"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getAllMarketingKPIs, upsertMarketingKPI, deleteMarketingKPI } from "@/actions";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	SelectGroup,
	SelectLabel,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
	Loader2,
	Plus,
	Save,
	Trash2,
	// Default KPIs
	TrendingUp,
	Briefcase,
	Building2,
	MapPin,
	// Business & Finance
	BarChart3,
	DollarSign,
	Euro,
	Percent,
	PieChart,
	Activity,
	// People & Relationships
	Users,
	Handshake,
	Heart,
	// Achievement & Goals
	Award,
	Target,
	Star,
	Rocket,
	Zap,
	Shield,
	// Industry
	Factory,
	Landmark,
	Globe,
	// Time
	Calendar,
	Clock,
} from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

/**
 * KPI Management Admin Page
 *
 * Board Requirement: Pouvoir modifier les KPI et leurs icônes depuis l'admin panel
 *
 * Features:
 * - View all KPIs with current values
 * - Edit value, suffix, labels
 * - Change icon from 20+ options
 * - Toggle visibility
 * - Seed defaults if empty
 * - Real-time sync with Convex
 */

// Categorized icons for better UX in admin panel
const AVAILABLE_ICONS = [
	// Default KPIs
	{
		value: "TrendingUp",
		label: "Tendance",
		icon: TrendingUp,
		category: "Défaut",
	},
	{ value: "Briefcase", label: "Valise", icon: Briefcase, category: "Défaut" },
	{
		value: "Building2",
		label: "Immeuble",
		icon: Building2,
		category: "Défaut",
	},
	{ value: "MapPin", label: "Localisation", icon: MapPin, category: "Défaut" },
	// Business & Finance
	{
		value: "BarChart3",
		label: "Graphique",
		icon: BarChart3,
		category: "Finance",
	},
	{
		value: "DollarSign",
		label: "Dollar",
		icon: DollarSign,
		category: "Finance",
	},
	{ value: "Euro", label: "Euro", icon: Euro, category: "Finance" },
	{
		value: "Percent",
		label: "Pourcentage",
		icon: Percent,
		category: "Finance",
	},
	{
		value: "PieChart",
		label: "Camembert",
		icon: PieChart,
		category: "Finance",
	},
	{ value: "Activity", label: "Activité", icon: Activity, category: "Finance" },
	// People & Relationships
	{ value: "Users", label: "Équipe", icon: Users, category: "Personnes" },
	{
		value: "Handshake",
		label: "Partenariat",
		icon: Handshake,
		category: "Personnes",
	},
	{ value: "Heart", label: "Cœur", icon: Heart, category: "Personnes" },
	// Achievement & Goals
	{ value: "Award", label: "Récompense", icon: Award, category: "Succès" },
	{ value: "Target", label: "Cible", icon: Target, category: "Succès" },
	{ value: "Star", label: "Étoile", icon: Star, category: "Succès" },
	{ value: "Rocket", label: "Fusée", icon: Rocket, category: "Succès" },
	{ value: "Zap", label: "Éclair", icon: Zap, category: "Succès" },
	{ value: "Shield", label: "Bouclier", icon: Shield, category: "Succès" },
	// Industry
	{ value: "Factory", label: "Usine", icon: Factory, category: "Industrie" },
	{
		value: "Landmark",
		label: "Monument",
		icon: Landmark,
		category: "Industrie",
	},
	{ value: "Globe", label: "Globe", icon: Globe, category: "Industrie" },
	// Time
	{ value: "Calendar", label: "Calendrier", icon: Calendar, category: "Temps" },
	{ value: "Clock", label: "Horloge", icon: Clock, category: "Temps" },
];

// Group icons by category for the dropdown
const ICON_CATEGORIES = [...new Set(AVAILABLE_ICONS.map((i) => i.category))];

// Interface for KPI data from Drizzle
interface ConvexKPI {
	id: string;
	createdAt: Date;
	key: string;
	icon: string;
	value: number;
	suffix?: string;
	prefix?: string;
	labelFr: string;
	labelEn: string;
	displayOrder: number;
	isActive: boolean;
}

interface KPIFormData {
	key: string;
	icon: string;
	value: number;
	suffix: string;
	prefix: string;
	labelFr: string;
	labelEn: string;
	displayOrder: number;
	isActive: boolean;
}

export default function KPIsAdminPage() {
	const _t = useTranslations("Admin");
	const router = useRouter();
	const [kpis, setKpis] = useState<ConvexKPI[] | null>(null);

	const [editingKPI, setEditingKPI] = useState<KPIFormData | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isSeeding, setIsSeeding] = useState(false);

	useEffect(() => {
		getAllMarketingKPIs().then(data => setKpis(data as unknown as ConvexKPI[]));
	}, []);

	const handleSeed = async () => {
		setIsSeeding(true);
		try {
			// Note: seedMarketingKPIs isn't in the mappings, so we skip this feature
			toast.success("Fonctionnalité non disponible");
		} catch (_error) {
			toast.error("Erreur lors de la création des KPIs");
		} finally {
			setIsSeeding(false);
		}
	};

	const handleEdit = (kpi: {
		key: string;
		icon: string;
		value: number;
		suffix?: string;
		prefix?: string;
		labelFr: string;
		labelEn: string;
		displayOrder: number;
		isActive: boolean;
	}) => {
		setEditingKPI({
			key: kpi.key,
			icon: kpi.icon,
			value: kpi.value,
			suffix: kpi.suffix || "",
			prefix: kpi.prefix || "",
			labelFr: kpi.labelFr,
			labelEn: kpi.labelEn,
			displayOrder: kpi.displayOrder,
			isActive: kpi.isActive,
		});
	};

	const handleSave = async () => {
		if (!editingKPI) return;

		setIsSubmitting(true);
		try {
			await upsertMarketingKPI({
				key: editingKPI.key,
				icon: editingKPI.icon,
				value: editingKPI.value,
				suffix: editingKPI.suffix || undefined,
				prefix: editingKPI.prefix || undefined,
				labelFr: editingKPI.labelFr,
				labelEn: editingKPI.labelEn,
				displayOrder: editingKPI.displayOrder,
				isActive: editingKPI.isActive,
			});
			toast.success("KPI mis à jour");
			setEditingKPI(null);
			// Refresh data
			getAllMarketingKPIs().then(data => setKpis(data as unknown as ConvexKPI[]));
			router.refresh();
		} catch (_error) {
			toast.error("Erreur lors de la mise à jour");
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleDelete = async (key: string) => {
		if (!confirm("Supprimer ce KPI ?")) return;

		try {
			await deleteMarketingKPI(key);
			toast.success("KPI supprimé");
			// Refresh data
			getAllMarketingKPIs().then(data => setKpis(data as unknown as ConvexKPI[]));
			router.refresh();
		} catch (_error) {
			toast.error("Erreur lors de la suppression");
		}
	};

	const handleNewKPI = () => {
		setEditingKPI({
			key: `kpi_${Date.now()}`,
			icon: "TrendingUp",
			value: 0,
			suffix: "",
			prefix: "",
			labelFr: "Nouveau KPI",
			labelEn: "New KPI",
			displayOrder: (kpis?.length || 0) + 1,
			isActive: true,
		});
	};

	if (kpis === null) {
		return (
			<div className="flex items-center justify-center min-h-100">
				<Loader2 className="w-8 h-8 animate-spin text-accent" />
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold text-foreground">
						Gestion des KPIs
					</h1>
					<p className="text-muted-foreground">
						Configurez les indicateurs affichés sur la page d&apos;accueil
					</p>
				</div>
				<div className="flex gap-2">
					{kpis.length === 0 && (
						<Button onClick={handleSeed} disabled={isSeeding} variant="outline">
							{isSeeding ? (
								<Loader2 className="w-4 h-4 animate-spin mr-2" />
							) : null}
							Créer les KPIs par défaut
						</Button>
					)}
					<Button onClick={handleNewKPI}>
						<Plus className="w-4 h-4 mr-2" />
						Nouveau KPI
					</Button>
				</div>
			</div>

			{/* KPIs Grid */}
			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
				{kpis.map((kpi: ConvexKPI) => {
					const IconComponent =
						AVAILABLE_ICONS.find((i) => i.value === kpi.icon)?.icon ||
						Building2;

					return (
						<Card
							key={kpi.key}
							className={`cursor-pointer transition-all hover:shadow-lg ${!kpi.isActive ? "opacity-50" : ""}`}
							onClick={() => handleEdit(kpi)}
						>
							<CardContent className="pt-6">
								<div className="flex items-start justify-between mb-4">
									<div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
										<IconComponent className="w-6 h-6 text-accent" />
									</div>
									{!kpi.isActive && (
										<span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded">
											Masqué
										</span>
									)}
								</div>
								<div className="text-3xl font-bold text-foreground mb-1">
									{kpi.prefix}
									{kpi.value}
									{kpi.suffix}
								</div>
								<p className="text-sm text-muted-foreground">{kpi.labelFr}</p>
								<p className="text-xs text-muted-foreground mt-1">
									Ordre: {kpi.displayOrder}
								</p>
							</CardContent>
						</Card>
					);
				})}
			</div>

			{/* Edit Modal */}
			{editingKPI && (
				<Card className="border-2 border-accent">
					<CardHeader>
						<CardTitle>
							{kpis.find((k: ConvexKPI) => k.key === editingKPI.key)
								? "Modifier le KPI"
								: "Nouveau KPI"}
						</CardTitle>
						<CardDescription>Clé: {editingKPI.key}</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="grid gap-4 md:grid-cols-2">
							{/* Icon Selection - Categorized */}
							<div className="space-y-2">
								<Label>Icône ({AVAILABLE_ICONS.length} disponibles)</Label>
								<Select
									value={editingKPI.icon}
									onValueChange={(v) =>
										setEditingKPI({ ...editingKPI, icon: v })
									}
								>
									<SelectTrigger>
										<SelectValue>
											{(() => {
												const selectedIcon = AVAILABLE_ICONS.find(
													(i) => i.value === editingKPI.icon,
												);
												if (selectedIcon) {
													const Icon = selectedIcon.icon;
													return (
														<div className="flex items-center gap-2">
															<Icon className="w-4 h-4" />
															{selectedIcon.label}
														</div>
													);
												}
												return editingKPI.icon;
											})()}
										</SelectValue>
									</SelectTrigger>
									<SelectContent className="max-h-75">
										{ICON_CATEGORIES.map((category) => (
											<SelectGroup key={category}>
												<SelectLabel className="text-xs font-semibold text-accent uppercase tracking-wider">
													{category}
												</SelectLabel>
												{AVAILABLE_ICONS.filter(
													(i) => i.category === category,
												).map((icon) => (
													<SelectItem key={icon.value} value={icon.value}>
														<div className="flex items-center gap-2">
															<icon.icon className="w-4 h-4" />
															{icon.label}
														</div>
													</SelectItem>
												))}
											</SelectGroup>
										))}
									</SelectContent>
								</Select>
							</div>

							{/* Value */}
							<div className="space-y-2">
								<Label>Valeur</Label>
								<Input
									type="number"
									value={editingKPI.value}
									onChange={(e) =>
										setEditingKPI({
											...editingKPI,
											value: parseInt(e.target.value) || 0,
										})
									}
								/>
							</div>

							{/* Prefix */}
							<div className="space-y-2">
								<Label>Préfixe (optionnel)</Label>
								<Input
									value={editingKPI.prefix}
									onChange={(e) =>
										setEditingKPI({ ...editingKPI, prefix: e.target.value })
									}
									placeholder="€"
								/>
							</div>

							{/* Suffix */}
							<div className="space-y-2">
								<Label>Suffixe (optionnel)</Label>
								<Input
									value={editingKPI.suffix}
									onChange={(e) =>
										setEditingKPI({ ...editingKPI, suffix: e.target.value })
									}
									placeholder=" m€+"
								/>
							</div>

							{/* Label FR */}
							<div className="space-y-2">
								<Label>Label (Français)</Label>
								<Input
									value={editingKPI.labelFr}
									onChange={(e) =>
										setEditingKPI({ ...editingKPI, labelFr: e.target.value })
									}
								/>
							</div>

							{/* Label EN */}
							<div className="space-y-2">
								<Label>Label (English)</Label>
								<Input
									value={editingKPI.labelEn}
									onChange={(e) =>
										setEditingKPI({ ...editingKPI, labelEn: e.target.value })
									}
								/>
							</div>

							{/* Display Order */}
							<div className="space-y-2">
								<Label>Ordre d&apos;affichage</Label>
								<Input
									type="number"
									value={editingKPI.displayOrder}
									onChange={(e) =>
										setEditingKPI({
											...editingKPI,
											displayOrder: parseInt(e.target.value) || 1,
										})
									}
								/>
							</div>

							{/* Active Toggle */}
							<div className="space-y-2">
								<Label>Visible</Label>
								<div className="flex items-center gap-2">
									<Switch
										checked={editingKPI.isActive}
										onCheckedChange={(checked) =>
											setEditingKPI({ ...editingKPI, isActive: checked })
										}
									/>
									<span className="text-sm text-muted-foreground">
										{editingKPI.isActive ? "Affiché" : "Masqué"}
									</span>
								</div>
							</div>
						</div>

						{/* Preview */}
						<div className="p-4 bg-linear-to-r from-[#061a40] to-[#19354e] rounded-lg">
							<p className="text-xs text-white/50 mb-2">Aperçu</p>
							<div className="text-center">
								<div className="text-3xl font-bold text-white">
									{editingKPI.prefix}
									{editingKPI.value}
									{editingKPI.suffix}
								</div>
								<p className="text-sm text-white/70 uppercase tracking-wider">
									{editingKPI.labelFr}
								</p>
							</div>
						</div>

						{/* Actions */}
						<div className="flex gap-2 justify-end">
							{kpis.find((k: ConvexKPI) => k.key === editingKPI.key) && (
								<Button
									variant="destructive"
									onClick={() => handleDelete(editingKPI.key)}
								>
									<Trash2 className="w-4 h-4 mr-2" />
									Supprimer
								</Button>
							)}
							<Button variant="outline" onClick={() => setEditingKPI(null)}>
								Annuler
							</Button>
							<Button onClick={handleSave} disabled={isSubmitting}>
								{isSubmitting ? (
									<Loader2 className="w-4 h-4 animate-spin mr-2" />
								) : (
									<Save className="w-4 h-4 mr-2" />
								)}
								Sauvegarder
							</Button>
						</div>
					</CardContent>
				</Card>
			)}

			{/* Instructions */}
			<Card>
				<CardHeader>
					<CardTitle className="text-lg">Instructions</CardTitle>
				</CardHeader>
				<CardContent className="text-sm text-muted-foreground space-y-2">
					<p>• Cliquez sur un KPI pour le modifier</p>
					<p>
						• Les KPIs sont affichés dans l&apos;ordre défini par &quot;Ordre
						d&apos;affichage&quot;
					</p>
					<p>• Les KPIs masqués ne s&apos;affichent pas sur le site</p>
					<p>
						• Le suffixe apparaît après le nombre (ex: &quot; m€+&quot;,
						&quot;+&quot;, &quot;%&quot;)
					</p>
					<p>
						• Le préfixe apparaît avant le nombre (ex: &quot;€&quot;,
						&quot;$&quot;)
					</p>
				</CardContent>
			</Card>
		</div>
	);
}
