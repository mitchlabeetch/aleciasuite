"use client";

/**
 * AI Matchmaker Dashboard
 *
 * Manages buyer criteria and finds matching deals/buyers using AI vector search.
 *
 * Features:
 * - List all buyers with their acquisition criteria
 * - Add/Edit buyer criteria
 * - Find matching deals for a buyer
 * - Find matching buyers for a deal
 * - Match score visualization
 */

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

// Type definitions for query results
interface BuyerCriteria {
	_id: string;
	sectors: string[];
	minRevenue?: number;
	maxRevenue?: number;
	minEbitda?: number;
	maxEbitda?: number;
	minValuation?: number;
	maxValuation?: number;
	geographies: string[];
	notes?: string;
}

interface Buyer {
	_id: string;
	fullName: string;
	email?: string;
	phone?: string;
	companyId?: string;
	companyName?: string;
	criteria: BuyerCriteria;
}

interface Deal {
	_id: string;
	title: string;
	stage: string;
	amount?: number;
	companyId?: string;
	companyName?: string;
	financials?: {
		revenue?: number;
		ebitda?: number;
	};
	tags?: string[];
	createdAt?: number;
}

interface ContactWithoutCriteria {
	_id: string;
	fullName: string;
	email?: string;
	companyName?: string;
}
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import {
	Users,
	Briefcase,
	Plus,
	Search,
	Target,
	TrendingUp,
	Building2,
	MapPin,
	DollarSign,
	Loader2,
	ChevronRight,
	CheckCircle2,
	XCircle,
	AlertCircle,
	Sparkles,
	Edit,
	Trash2,
} from "lucide-react";

// Common sectors for M&A
const SECTORS = [
	"Tech & SaaS",
	"Healthcare",
	"Industrie",
	"Distribution",
	"Services B2B",
	"Agroalimentaire",
	"Immobilier",
	"Transport & Logistique",
	"Énergie",
	"Finance",
];

// French regions
const GEOGRAPHIES = [
	"Île-de-France",
	"Bretagne",
	"Normandie",
	"Pays de la Loire",
	"Nouvelle-Aquitaine",
	"Occitanie",
	"PACA",
	"Auvergne-Rhône-Alpes",
	"Grand Est",
	"Hauts-de-France",
	"National",
	"Europe",
];

// Format currency
function formatCurrency(value: number | undefined): string {
	if (value === undefined) return "-";
	if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M€`;
	if (value >= 1000) return `${(value / 1000).toFixed(0)}K€`;
	return `${value}€`;
}

// Score badge component
function ScoreBadge({ score }: { score: number }) {
	let variant: "default" | "secondary" | "destructive" = "secondary";
	let icon = AlertCircle;

	if (score >= 80) {
		variant = "default";
		icon = CheckCircle2;
	} else if (score >= 60) {
		variant = "secondary";
		icon = TrendingUp;
	} else if (score < 40) {
		variant = "destructive";
		icon = XCircle;
	}

	const Icon = icon;

	return (
		<Badge variant={variant} className="gap-1">
			<Icon className="h-3 w-3" />
			{score}%
		</Badge>
	);
}

// Buyer criteria form component
function BuyerCriteriaForm({
	_contactId,
	existingCriteria,
	onSuccess,
	onCancel,
}: {
	contactId: string;
	existingCriteria?: {
		sectors: string[];
		minRevenue?: number;
		maxRevenue?: number;
		minEbitda?: number;
		maxEbitda?: number;
		minValuation?: number;
		maxValuation?: number;
		geographies?: string[];
		notes?: string;
	};
	onSuccess: () => void;
	onCancel: () => void;
}) {
	const { toast } = useToast();
	const [isSubmitting, setIsSubmitting] = useState(false);

	const [formData, setFormData] = useState({
		sectors: existingCriteria?.sectors || [],
		minRevenue: existingCriteria?.minRevenue?.toString() || "",
		maxRevenue: existingCriteria?.maxRevenue?.toString() || "",
		minEbitda: existingCriteria?.minEbitda?.toString() || "",
		maxEbitda: existingCriteria?.maxEbitda?.toString() || "",
		minValuation: existingCriteria?.minValuation?.toString() || "",
		maxValuation: existingCriteria?.maxValuation?.toString() || "",
		geographies: existingCriteria?.geographies || [],
		notes: existingCriteria?.notes || "",
	});

	const toggleSector = (sector: string) => {
		setFormData((prev) => ({
			...prev,
			sectors: prev.sectors.includes(sector)
				? prev.sectors.filter((s) => s !== sector)
				: [...prev.sectors, sector],
		}));
	};

	const toggleGeography = (geo: string) => {
		setFormData((prev) => ({
			...prev,
			geographies: prev.geographies.includes(geo)
				? prev.geographies.filter((g) => g !== geo)
				: [...prev.geographies, geo],
		}));
	};

	const handleSubmit = async () => {
		if (formData.sectors.length === 0) {
			toast({
				title: "Erreur",
				description: "Sélectionnez au moins un secteur.",
				variant: "destructive",
			});
			return;
		}

		setIsSubmitting(true);
		try {
			// TODO: Implement upsertBuyerCriteria server action
			// await upsertBuyerCriteria({
			// 	contactId,
			// 	sectors: formData.sectors,
			// 	minRevenue: formData.minRevenue ? parseFloat(formData.minRevenue) : undefined,
			// 	maxRevenue: formData.maxRevenue ? parseFloat(formData.maxRevenue) : undefined,
			// 	minEbitda: formData.minEbitda ? parseFloat(formData.minEbitda) : undefined,
			// 	maxEbitda: formData.maxEbitda ? parseFloat(formData.maxEbitda) : undefined,
			// 	minValuation: formData.minValuation ? parseFloat(formData.minValuation) : undefined,
			// 	maxValuation: formData.maxValuation ? parseFloat(formData.maxValuation) : undefined,
			// 	geographies: formData.geographies.length > 0 ? formData.geographies : undefined,
			// 	notes: formData.notes || undefined,
			// });

			toast({
				title: "Critères enregistrés",
				description: "Les critères d'acquisition ont été mis à jour.",
			});
			onSuccess();
		} catch (_err) {
			toast({
				title: "Erreur",
				description: "Impossible d'enregistrer les critères.",
				variant: "destructive",
			});
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<div className="space-y-6">
			{/* Sectors */}
			<div>
				<label className="text-sm font-medium mb-2 block">
					Secteurs cibles <span className="text-destructive">*</span>
				</label>
				<div className="flex flex-wrap gap-2">
					{SECTORS.map((sector) => (
						<Badge
							key={sector}
							variant={
								formData.sectors.includes(sector) ? "default" : "outline"
							}
							className="cursor-pointer"
							onClick={() => toggleSector(sector)}
						>
							{sector}
						</Badge>
					))}
				</div>
			</div>

			{/* Revenue range */}
			<div className="grid grid-cols-2 gap-4">
				<div>
					<label className="text-sm font-medium mb-2 block">
						CA minimum (€)
					</label>
					<Input
						type="number"
						placeholder="Ex: 1000000"
						value={formData.minRevenue}
						onChange={(e) =>
							setFormData((prev) => ({ ...prev, minRevenue: e.target.value }))
						}
					/>
				</div>
				<div>
					<label className="text-sm font-medium mb-2 block">
						CA maximum (€)
					</label>
					<Input
						type="number"
						placeholder="Ex: 10000000"
						value={formData.maxRevenue}
						onChange={(e) =>
							setFormData((prev) => ({ ...prev, maxRevenue: e.target.value }))
						}
					/>
				</div>
			</div>

			{/* EBITDA range */}
			<div className="grid grid-cols-2 gap-4">
				<div>
					<label className="text-sm font-medium mb-2 block">
						EBITDA minimum (€)
					</label>
					<Input
						type="number"
						placeholder="Ex: 100000"
						value={formData.minEbitda}
						onChange={(e) =>
							setFormData((prev) => ({ ...prev, minEbitda: e.target.value }))
						}
					/>
				</div>
				<div>
					<label className="text-sm font-medium mb-2 block">
						EBITDA maximum (€)
					</label>
					<Input
						type="number"
						placeholder="Ex: 2000000"
						value={formData.maxEbitda}
						onChange={(e) =>
							setFormData((prev) => ({ ...prev, maxEbitda: e.target.value }))
						}
					/>
				</div>
			</div>

			{/* Geographies */}
			<div>
				<label className="text-sm font-medium mb-2 block">
					Zones géographiques
				</label>
				<div className="flex flex-wrap gap-2">
					{GEOGRAPHIES.map((geo) => (
						<Badge
							key={geo}
							variant={
								formData.geographies.includes(geo) ? "default" : "outline"
							}
							className="cursor-pointer"
							onClick={() => toggleGeography(geo)}
						>
							<MapPin className="h-3 w-3 mr-1" />
							{geo}
						</Badge>
					))}
				</div>
			</div>

			{/* Notes */}
			<div>
				<label className="text-sm font-medium mb-2 block">Notes</label>
				<Input
					placeholder="Critères additionnels, préférences..."
					value={formData.notes}
					onChange={(e) =>
						setFormData((prev) => ({ ...prev, notes: e.target.value }))
					}
				/>
			</div>

			{/* Actions */}
			<div className="flex justify-end gap-3">
				<Button variant="outline" onClick={onCancel}>
					Annuler
				</Button>
				<Button onClick={handleSubmit} disabled={isSubmitting}>
					{isSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
					Enregistrer
				</Button>
			</div>
		</div>
	);
}

// Match results component
function MatchResults({
	dealId,
	onClose,
}: {
	dealId: string;
	onClose: () => void;
}) {
	const { toast } = useToast();
	const [isLoading, setIsLoading] = useState(true);
	const [matches, setMatches] = useState<
		Array<{
			contact: Record<string, unknown>;
			score: number;
			details?: {
				overallScore: number;
				criteriaMatches: Array<{
					criterion: string;
					match: boolean;
					weight: number;
				}>;
				recommendation: string;
			};
		}>
	>([]);

	// Load matches on mount
	useEffect(() => {
		const loadMatches = async () => {
			try {
				// TODO: Implement findMatchingBuyers and calculateMatchScore server actions
				// const results = await findMatchingBuyers({ dealId });
				// const detailedMatches = await Promise.all(
				// 	results.slice(0, 5).map(async (match) => {
				// 		try {
				// 			const details = await calculateMatchScore({
				// 				dealId,
				// 				contactId: match.contact._id,
				// 			});
				// 			return { ...match, details };
				// 		} catch {
				// 			return match;
				// 		}
				// 	})
				// );
				// setMatches(detailedMatches);
				setMatches([]);
			} catch (_err) {
				toast({
					title: "Erreur",
					description: "Impossible de charger les correspondances.",
					variant: "destructive",
				});
			} finally {
				setIsLoading(false);
			}
		};
		loadMatches();
	}, [dealId, toast]);

	if (isLoading) {
		return (
			<div className="flex flex-col items-center justify-center py-12">
				<Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
				<p className="text-muted-foreground">
					Recherche des acquéreurs potentiels...
				</p>
			</div>
		);
	}

	if (matches.length === 0) {
		return (
			<div className="text-center py-12">
				<Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
				<p className="text-lg font-medium">Aucun acquéreur trouvé</p>
				<p className="text-muted-foreground">
					Ajoutez des critères d&apos;acquisition aux contacts pour utiliser le
					matchmaker.
				</p>
				<Button variant="outline" onClick={onClose} className="mt-4">
					Fermer
				</Button>
			</div>
		);
	}

	return (
		<div className="space-y-4">
			<p className="text-sm text-muted-foreground">
				{matches.length} acquéreur(s) potentiel(s) trouvé(s)
			</p>

			{matches.map((match, index) => (
				<Card key={index}>
					<CardContent className="pt-4">
						<div className="flex items-start justify-between">
							<div className="flex items-center gap-3">
								<div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
									<Users className="h-5 w-5 text-primary" />
								</div>
								<div>
									<p className="font-medium">
										{(match.contact as { fullName?: string }).fullName ||
											"Contact inconnu"}
									</p>
									<p className="text-sm text-muted-foreground">
										{(match.contact as { companyName?: string }).companyName ||
											""}
									</p>
								</div>
							</div>
							{match.details && (
								<ScoreBadge score={match.details.overallScore} />
							)}
						</div>

						{match.details && (
							<div className="mt-4 space-y-2">
								<div className="flex flex-wrap gap-2">
									{match.details.criteriaMatches.map((criteria, i) => (
										<Badge
											key={i}
											variant={criteria.match ? "default" : "outline"}
											className="gap-1"
										>
											{criteria.match ? (
												<CheckCircle2 className="h-3 w-3" />
											) : (
												<XCircle className="h-3 w-3" />
											)}
											{criteria.criterion}
										</Badge>
									))}
								</div>
								<p className="text-sm text-muted-foreground italic">
									{match.details.recommendation}
								</p>
							</div>
						)}
					</CardContent>
				</Card>
			))}

			<div className="flex justify-end">
				<Button variant="outline" onClick={onClose}>
					Fermer
				</Button>
			</div>
		</div>
	);
}

export default function MatchmakerPage() {
	const { toast } = useToast();

	// Data - migrated to server actions
	const [buyers, setBuyers] = useState<Buyer[]>([]);
	const [deals, setDeals] = useState<Deal[]>([]);
	const [contactsWithoutCriteria, setContactsWithoutCriteria] = useState<ContactWithoutCriteria[]>([]);
	const [loading, setLoading] = useState(true);

	// Load data on mount
	useEffect(() => {
		const loadData = async () => {
			try {
				// TODO: Implement getAllBuyers, getDealsForMatching, getContactsWithoutCriteria server actions
				// const [buyersData, dealsData, contactsData] = await Promise.all([
				// 	getAllBuyers(),
				// 	getDealsForMatching(),
				// 	getContactsWithoutCriteria(),
				// ]);
				// setBuyers(buyersData);
				// setDeals(dealsData);
				// setContactsWithoutCriteria(contactsData);
				setBuyers([]);
				setDeals([]);
				setContactsWithoutCriteria([]);
			} catch (error) {
				console.error("Failed to load data:", error);
			} finally {
				setLoading(false);
			}
		};
		loadData();
	}, []);

	// State
	const [selectedTab, setSelectedTab] = useState("buyers");
	const [isAddingBuyer, setIsAddingBuyer] = useState(false);
	const [editingBuyer, setEditingBuyer] = useState<string | null>(null);
	const [selectedContactForAdd, setSelectedContactForAdd] =
		useState<string | null>(null);
	const [matchingDealId, setMatchingDealId] = useState<string | null>(
		null,
	);

	const handleDeleteCriteria = async (_contactId: string) => {
		try {
			// TODO: Implement deleteBuyerCriteria server action
			// await deleteBuyerCriteria({ contactId });
			toast({
				title: "Critères supprimés",
				description: "Les critères d'acquisition ont été supprimés.",
			});
		} catch {
			toast({
				title: "Erreur",
				description: "Impossible de supprimer les critères.",
				variant: "destructive",
			});
		}
	};

	if (loading) {
		return (
			<div className="flex items-center justify-center h-64">
				<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
			</div>
		);
	}

	return (
		<div className="space-y-6 p-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold flex items-center gap-2">
						<Sparkles className="h-8 w-8 text-primary" />
						AI Matchmaker
					</h1>
					<p className="text-muted-foreground">
						Trouvez les acquéreurs parfaits pour vos deals grâce à l&apos;IA.
					</p>
				</div>
			</div>

			{/* Stats */}
			<div className="grid grid-cols-3 gap-4">
				<Card>
					<CardContent className="pt-4">
						<div className="flex items-center gap-3">
							<div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
								<Users className="h-5 w-5 text-blue-500" />
							</div>
							<div>
								<p className="text-2xl font-bold">{buyers?.length || 0}</p>
								<p className="text-sm text-muted-foreground">
									Acquéreurs qualifiés
								</p>
							</div>
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="pt-4">
						<div className="flex items-center gap-3">
							<div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
								<Briefcase className="h-5 w-5 text-green-500" />
							</div>
							<div>
								<p className="text-2xl font-bold">{deals?.length || 0}</p>
								<p className="text-sm text-muted-foreground">Deals actifs</p>
							</div>
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="pt-4">
						<div className="flex items-center gap-3">
							<div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
								<Target className="h-5 w-5 text-purple-500" />
							</div>
							<div>
								<p className="text-2xl font-bold">
									{contactsWithoutCriteria?.length || 0}
								</p>
								<p className="text-sm text-muted-foreground">
									Contacts à qualifier
								</p>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Main content */}
			<Tabs value={selectedTab} onValueChange={setSelectedTab}>
				<TabsList>
					<TabsTrigger value="buyers" className="gap-2">
						<Users className="h-4 w-4" />
						Acquéreurs
					</TabsTrigger>
					<TabsTrigger value="deals" className="gap-2">
						<Briefcase className="h-4 w-4" />
						Deals
					</TabsTrigger>
				</TabsList>

				{/* Buyers tab */}
				<TabsContent value="buyers" className="space-y-4">
					<div className="flex justify-between items-center">
						<p className="text-sm text-muted-foreground">
							Gérez les critères d&apos;acquisition de vos acquéreurs
							potentiels.
						</p>
						<Dialog open={isAddingBuyer} onOpenChange={setIsAddingBuyer}>
							<DialogTrigger asChild>
								<Button>
									<Plus className="h-4 w-4 mr-2" />
									Ajouter un acquéreur
								</Button>
							</DialogTrigger>
							<DialogContent className="max-w-2xl">
								<DialogHeader>
									<DialogTitle>Ajouter un acquéreur</DialogTitle>
									<DialogDescription>
										Sélectionnez un contact et définissez ses critères
										d&apos;acquisition.
									</DialogDescription>
								</DialogHeader>

								{!selectedContactForAdd ? (
									<div className="space-y-4">
										<p className="text-sm font-medium">
											Sélectionnez un contact:
										</p>
										{contactsWithoutCriteria?.length === 0 ? (
											<p className="text-sm text-muted-foreground">
												Tous les contacts ont déjà des critères définis.
											</p>
										) : (
											<div className="max-h-64 overflow-y-auto space-y-2">
												{contactsWithoutCriteria?.map(
													(contact: ContactWithoutCriteria) => (
														<button
															key={contact._id}
															onClick={() =>
																setSelectedContactForAdd(contact._id)
															}
															className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors text-left"
														>
															<Users className="h-4 w-4 text-muted-foreground" />
															<div>
																<p className="font-medium">
																	{contact.fullName}
																</p>
																<p className="text-sm text-muted-foreground">
																	{contact.companyName || contact.email}
																</p>
															</div>
															<ChevronRight className="h-4 w-4 ml-auto text-muted-foreground" />
														</button>
													),
												)}
											</div>
										)}
									</div>
								) : (
									<BuyerCriteriaForm
										contactId={selectedContactForAdd}
										onSuccess={() => {
											setIsAddingBuyer(false);
											setSelectedContactForAdd(null);
										}}
										onCancel={() => setSelectedContactForAdd(null)}
									/>
								)}
							</DialogContent>
						</Dialog>
					</div>

					{/* Buyers list */}
					{buyers.length === 0 ? (
						<Card>
							<CardContent className="py-12 text-center">
								<Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
								<p className="text-lg font-medium">Aucun acquéreur qualifié</p>
								<p className="text-muted-foreground mb-4">
									Ajoutez des critères d&apos;acquisition à vos contacts pour
									commencer.
								</p>
								<Button onClick={() => setIsAddingBuyer(true)}>
									<Plus className="h-4 w-4 mr-2" />
									Ajouter un acquéreur
								</Button>
							</CardContent>
						</Card>
					) : (
						<div className="grid gap-4">
							{buyers.map((buyer: Buyer) => (
								<Card key={buyer._id}>
									<CardContent className="pt-4">
										<div className="flex items-start justify-between">
											<div className="flex items-center gap-3">
												<div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
													<Users className="h-5 w-5 text-primary" />
												</div>
												<div>
													<p className="font-medium">{buyer.fullName}</p>
													<p className="text-sm text-muted-foreground">
														{buyer.companyName || buyer.email}
													</p>
												</div>
											</div>
											<div className="flex gap-2">
												<Button
													variant="ghost"
													size="icon"
													onClick={() => setEditingBuyer(buyer._id)}
												>
													<Edit className="h-4 w-4" />
												</Button>
												<Button
													variant="ghost"
													size="icon"
													onClick={() => handleDeleteCriteria(buyer._id)}
												>
													<Trash2 className="h-4 w-4 text-destructive" />
												</Button>
											</div>
										</div>

										<div className="mt-4 space-y-3">
											{/* Sectors */}
											<div className="flex flex-wrap gap-2">
												{buyer.criteria.sectors.map((sector: string) => (
													<Badge key={sector} variant="secondary">
														{sector}
													</Badge>
												))}
											</div>

											{/* Financial criteria */}
											<div className="flex gap-4 text-sm">
												{(buyer.criteria.minRevenue ||
													buyer.criteria.maxRevenue) && (
													<div className="flex items-center gap-1 text-muted-foreground">
														<DollarSign className="h-3 w-3" />
														CA: {formatCurrency(buyer.criteria.minRevenue)} -{" "}
														{formatCurrency(buyer.criteria.maxRevenue)}
													</div>
												)}
												{(buyer.criteria.minEbitda ||
													buyer.criteria.maxEbitda) && (
													<div className="flex items-center gap-1 text-muted-foreground">
														<TrendingUp className="h-3 w-3" />
														EBITDA: {formatCurrency(buyer.criteria.minEbitda)} -{" "}
														{formatCurrency(buyer.criteria.maxEbitda)}
													</div>
												)}
											</div>

											{/* Geographies */}
											{buyer.criteria.geographies.length > 0 && (
												<div className="flex flex-wrap gap-2">
													{buyer.criteria.geographies.map((geo: string) => (
														<Badge
															key={geo}
															variant="outline"
															className="gap-1"
														>
															<MapPin className="h-3 w-3" />
															{geo}
														</Badge>
													))}
												</div>
											)}
										</div>
									</CardContent>
								</Card>
							))}
						</div>
					)}
				</TabsContent>

				{/* Deals tab */}
				<TabsContent value="deals" className="space-y-4">
					<p className="text-sm text-muted-foreground">
						Trouvez des acquéreurs potentiels pour vos deals actifs.
					</p>

					{deals.length === 0 ? (
						<Card>
							<CardContent className="py-12 text-center">
								<Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
								<p className="text-lg font-medium">Aucun deal actif</p>
								<p className="text-muted-foreground">
									Créez des deals pour utiliser le matchmaker.
								</p>
							</CardContent>
						</Card>
					) : (
						<div className="grid gap-4">
							{deals.map((deal: Deal) => (
								<Card key={deal._id}>
									<CardContent className="pt-4">
										<div className="flex items-start justify-between">
											<div className="flex items-center gap-3">
												<div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
													<Briefcase className="h-5 w-5 text-green-500" />
												</div>
												<div>
													<p className="font-medium">{deal.title}</p>
													<p className="text-sm text-muted-foreground">
														{deal.companyName || "Entreprise non liée"}
													</p>
												</div>
											</div>
											<Dialog
												open={matchingDealId === deal._id}
												onOpenChange={(open) =>
													setMatchingDealId(open ? deal._id : null)
												}
											>
												<DialogTrigger asChild>
													<Button>
														<Search className="h-4 w-4 mr-2" />
														Trouver des acquéreurs
													</Button>
												</DialogTrigger>
												<DialogContent className="max-w-2xl">
													<DialogHeader>
														<DialogTitle>
															Acquéreurs potentiels pour {deal.title}
														</DialogTitle>
														<DialogDescription>
															Résultats basés sur les critères
															d&apos;acquisition et la similarité.
														</DialogDescription>
													</DialogHeader>
													<MatchResults
														dealId={deal._id}
														onClose={() => setMatchingDealId(null)}
													/>
												</DialogContent>
											</Dialog>
										</div>

										<div className="mt-4 flex gap-4 text-sm">
											<Badge variant="outline">{deal.stage}</Badge>
											{deal.amount && (
												<span className="text-muted-foreground">
													{formatCurrency(deal.amount)}
												</span>
											)}
											{deal.financials?.revenue && (
												<span className="text-muted-foreground flex items-center gap-1">
													<Building2 className="h-3 w-3" />
													CA: {formatCurrency(deal.financials.revenue)}
												</span>
											)}
										</div>
									</CardContent>
								</Card>
							))}
						</div>
					)}
				</TabsContent>
			</Tabs>

			{/* Edit buyer dialog */}
			<Dialog
				open={!!editingBuyer}
				onOpenChange={(open) => !open && setEditingBuyer(null)}
			>
				<DialogContent className="max-w-2xl">
					<DialogHeader>
						<DialogTitle>Modifier les critères</DialogTitle>
						<DialogDescription>
							Mettez à jour les critères d&apos;acquisition de cet acquéreur.
						</DialogDescription>
					</DialogHeader>
					{editingBuyer && (
						<BuyerCriteriaForm
							contactId={editingBuyer}
							existingCriteria={
								buyers?.find((b: Buyer) => b._id === editingBuyer)?.criteria
							}
							onSuccess={() => setEditingBuyer(null)}
							onCancel={() => setEditingBuyer(null)}
						/>
					)}
				</DialogContent>
			</Dialog>
		</div>
	);
}
