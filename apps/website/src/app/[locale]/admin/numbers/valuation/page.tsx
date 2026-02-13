"use client";

/**
 * Valuation Multiples Calculator
 *
 * Comparable company analysis with:
 * - Target company financials
 * - Comparable panel (up to 10 companies)
 * - Statistical analysis (median, average, min, max, stdev)
 * - Implied valuation ranges
 */

import { useState, useMemo, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { numbersTools } from "@/actions";
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
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
	TrendingUp,
	ArrowLeft,
	Download,
	Save,
	Plus,
	Trash2,
	BarChart3,
	Building2,
	Calculator,
	Loader2,
	FolderOpen,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import { DealSelector } from "@/components/numbers/deal-selector";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";

interface TargetCompany {
	name: string;
	sector: string;
	revenue: number;
	ebitda: number;
	ebit: number;
	netIncome: number;
	netDebt: number;
	cash: number;
	equity: number;
}

interface Comparable {
	id: string;
	name: string;
	country: string;
	ev: number;
	revenue: number;
	ebitda: number;
	evSales?: number;
	evEbitda?: number;
	peRatio?: number;
}

interface Statistics {
	evSales: { median: number; average: number; min: number; max: number; stdev: number };
	evEbitda: { median: number; average: number; min: number; max: number; stdev: number };
}

const defaultTarget: TargetCompany = {
	name: "",
	sector: "",
	revenue: 5000,
	ebitda: 750,
	ebit: 500,
	netIncome: 350,
	netDebt: 1000,
	cash: 300,
	equity: 2000,
};

const defaultComparables: Comparable[] = [
	{ id: "1", name: "Societe A", country: "FR", ev: 150000, revenue: 120000, ebitda: 25000 },
	{ id: "2", name: "Societe B", country: "DE", ev: 280000, revenue: 200000, ebitda: 45000 },
	{ id: "3", name: "Societe C", country: "UK", ev: 420000, revenue: 350000, ebitda: 70000 },
	{ id: "4", name: "Societe D", country: "FR", ev: 95000, revenue: 80000, ebitda: 12000 },
	{ id: "5", name: "Societe E", country: "NL", ev: 310000, revenue: 250000, ebitda: 55000 },
];

function calculateStats(values: number[]): { median: number; average: number; min: number; max: number; stdev: number } {
	if (values.length === 0) return { median: 0, average: 0, min: 0, max: 0, stdev: 0 };

	const sorted = [...values].sort((a, b) => a - b);
	const mid = Math.floor(sorted.length / 2);
	const median = sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
	const average = values.reduce((a, b) => a + b, 0) / values.length;
	const min = Math.min(...values);
	const max = Math.max(...values);
	const variance = values.reduce((sum, val) => sum + Math.pow(val - average, 2), 0) / values.length;
	const stdev = Math.sqrt(variance);

	return { median, average, min, max, stdev };
}

export default function ValuationPage() {
	const router = useRouter();
	const [target, setTarget] = useState<TargetCompany>(defaultTarget);
	const [comparables, setComparables] = useState<Comparable[]>(defaultComparables);
	const [selectedDealId, setSelectedDealId] = useState<string | null>(null);
	const [currentValuationId, setCurrentValuationId] = useState<string | null>(null);
	const [valuationName, setValuationName] = useState("");
	const [isSaving, setIsSaving] = useState(false);
	const [showLoadDialog, setShowLoadDialog] = useState(false);
	const [savedValuations, setSavedValuations] = useState<any[]>([]);

	// Load saved valuations
	useEffect(() => {
		numbersTools.getUserComparables(20).then((data) => setSavedValuations(data || [])).catch(console.error);
	}, []);

	const handleSave = useCallback(async () => {
		if (!valuationName.trim() && !target.name.trim()) {
			toast.error("Veuillez entrer un nom pour cette valorisation");
			return;
		}

		setIsSaving(true);
		try {
			const id = await numbersTools.createComparableAnalysis({
				name: valuationName.trim() || target.name.trim() || "Valorisation sans nom",
				dealId: selectedDealId || undefined,
				targetMetrics: target,
				comparables: comparables.map((c) => ({
					id: c.id,
					name: c.name,
					country: c.country,
					ev: c.ev,
					revenue: c.revenue,
					ebitda: c.ebitda,
				})),
			});
			setCurrentValuationId(id);
			router.refresh();
			toast.success("Valorisation sauvegardée");
		} catch (error) {
			console.error("Failed to save valuation:", error);
			toast.error("Erreur lors de la sauvegarde");
		} finally {
			setIsSaving(false);
		}
	}, [router, currentValuationId, selectedDealId, valuationName, target, comparables]);

	const handleLoad = useCallback((valuation: any) => {
		setTarget(valuation.targetCompany);
		setComparables(valuation.comparables.map((c: { id: string; name: string; country: string; ev: number; revenue: number; ebitda: number }) => ({
			...c,
			evSales: undefined,
			evEbitda: undefined,
			peRatio: undefined,
		})));
		setCurrentValuationId(valuation._id);
		setValuationName(valuation.name);
		setSelectedDealId(valuation.dealId ?? null);
		setShowLoadDialog(false);
		toast.success(`Valorisation "${valuation.name}" chargée`);
	}, []);

	const updateTarget = <K extends keyof TargetCompany>(key: K, value: TargetCompany[K]) => {
		setTarget((prev) => ({ ...prev, [key]: value }));
	};

	const updateComparable = (id: string, field: keyof Comparable, value: string | number) => {
		setComparables((prev) =>
			prev.map((c) => (c.id === id ? { ...c, [field]: value } : c))
		);
	};

	const addComparable = () => {
		const newId = String(Date.now());
		setComparables((prev) => [
			...prev,
			{ id: newId, name: "", country: "FR", ev: 0, revenue: 0, ebitda: 0 },
		]);
	};

	const removeComparable = (id: string) => {
		setComparables((prev) => prev.filter((c) => c.id !== id));
	};

	// Calculate multiples for each comparable
	const comparablesWithMultiples = useMemo(() => {
		return comparables.map((c) => ({
			...c,
			evSales: c.revenue > 0 ? c.ev / c.revenue : 0,
			evEbitda: c.ebitda > 0 ? c.ev / c.ebitda : 0,
		}));
	}, [comparables]);

	// Calculate statistics
	const statistics = useMemo((): Statistics => {
		const evSalesValues = comparablesWithMultiples
			.map((c) => c.evSales)
			.filter((v): v is number => v !== undefined && v > 0);
		const evEbitdaValues = comparablesWithMultiples
			.map((c) => c.evEbitda)
			.filter((v): v is number => v !== undefined && v > 0);

		return {
			evSales: calculateStats(evSalesValues),
			evEbitda: calculateStats(evEbitdaValues),
		};
	}, [comparablesWithMultiples]);

	// Calculate implied valuations
	const valuations = useMemo(() => {
		const evSalesValuation = statistics.evSales.median * target.revenue;
		const evEbitdaValuation = statistics.evEbitda.median * target.ebitda;

		const avgValuation = (evSalesValuation + evEbitdaValuation) / 2;
		const lowValuation = Math.min(
			statistics.evSales.min * target.revenue,
			statistics.evEbitda.min * target.ebitda
		);
		const highValuation = Math.max(
			statistics.evSales.max * target.revenue,
			statistics.evEbitda.max * target.ebitda
		);

		return {
			evSales: evSalesValuation,
			evEbitda: evEbitdaValuation,
			average: avgValuation,
			low: lowValuation,
			high: highValuation,
		};
	}, [statistics, target]);

	// Target metrics
	const targetMetrics = useMemo(() => {
		const ev = target.ebitda * statistics.evEbitda.median || 0;
		return {
			ev,
			ebitdaMargin: target.revenue > 0 ? (target.ebitda / target.revenue) * 100 : 0,
			ebitMargin: target.revenue > 0 ? (target.ebit / target.revenue) * 100 : 0,
			netMargin: target.revenue > 0 ? (target.netIncome / target.revenue) * 100 : 0,
			debtToEbitda: target.ebitda > 0 ? target.netDebt / target.ebitda : 0,
		};
	}, [target, statistics]);

	const formatCurrency = (value: number) => {
		if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M€`;
		if (value >= 1000) return `${(value / 1000).toFixed(0)}k€`;
		return `${value.toFixed(0)}€`;
	};

	const formatMultiple = (value: number) => {
		return value.toFixed(2) + "x";
	};

	const formatPercent = (value: number) => {
		return value.toFixed(1) + "%";
	};

	return (
		<div className="space-y-6 p-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-4">
					<Button variant="ghost" size="icon" asChild>
						<Link href="/admin/numbers">
							<ArrowLeft className="h-5 w-5" />
						</Link>
					</Button>
					<div>
						<h1 className="text-2xl font-bold flex items-center gap-2">
							<TrendingUp className="h-6 w-6" />
							Multiples de Valorisation
							{currentValuationId && (
								<Badge variant="secondary" className="ml-2">
									{valuationName || "Sauvegardé"}
								</Badge>
							)}
						</h1>
						<p className="text-muted-foreground">
							Analyse par comparables avec statistiques et valorisation implicite
						</p>
					</div>
				</div>
				<div className="flex items-center gap-2">
					<DealSelector
						toolId="valuation"
						onDealSelect={(deal) => setSelectedDealId(deal?.id as string | null ?? null)}
					/>
					<Dialog open={showLoadDialog} onOpenChange={setShowLoadDialog}>
						<DialogTrigger asChild>
							<Button variant="outline" type="button">
								<FolderOpen className="h-4 w-4 mr-2" />
								Charger
							</Button>
						</DialogTrigger>
						<DialogContent>
							<DialogHeader>
								<DialogTitle>Charger une valorisation</DialogTitle>
								<DialogDescription>
									Sélectionnez une valorisation sauvegardée
								</DialogDescription>
							</DialogHeader>
							<div className="max-h-[400px] overflow-y-auto space-y-2">
								{savedValuations?.length === 0 && (
									<p className="text-muted-foreground text-center py-4">
										Aucune valorisation sauvegardée
									</p>
								)}
								{savedValuations?.map((v: any) => (
									<button
										key={v._id}
										type="button"
										onClick={() => handleLoad(v)}
										className="w-full p-3 text-left rounded-lg border hover:bg-muted/50 transition-colors"
									>
										<div className="font-medium">{v.name}</div>
										<div className="text-sm text-muted-foreground">
											{v.targetCompany.name || "Cible non nommée"} - {v.comparables.length} comparables
										</div>
										<div className="text-xs text-muted-foreground">
											{new Date(v.updatedAt).toLocaleDateString("fr-FR")}
										</div>
									</button>
								))}
							</div>
						</DialogContent>
					</Dialog>
					<Button variant="outline" onClick={handleSave} disabled={isSaving} type="button">
						{isSaving ? (
							<Loader2 className="h-4 w-4 mr-2 animate-spin" />
						) : (
							<Save className="h-4 w-4 mr-2" />
						)}
						Sauvegarder
					</Button>
					<Button type="button">
						<Download className="h-4 w-4 mr-2" />
						Exporter
					</Button>
				</div>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				{/* Left Column - Target & Comparables */}
				<div className="lg:col-span-2 space-y-6">
					{/* Target Company */}
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Building2 className="h-5 w-5" />
								Entreprise Cible
							</CardTitle>
							<CardDescription>
								Metriques financieres LTM (Last Twelve Months)
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="grid grid-cols-2 gap-4">
								<div className="space-y-2">
									<Label>Nom de l&apos;entreprise</Label>
									<Input
										value={target.name}
										onChange={(e) => updateTarget("name", e.target.value)}
										placeholder="Nom de la cible"
									/>
								</div>
								<div className="space-y-2">
									<Label>Secteur</Label>
									<Input
										value={target.sector}
										onChange={(e) => updateTarget("sector", e.target.value)}
										placeholder="Ex: Industrie, Tech..."
									/>
								</div>
							</div>
							<Separator />
							<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
								{[
									{ key: "revenue" as const, label: "Chiffre d'affaires" },
									{ key: "ebitda" as const, label: "EBITDA" },
									{ key: "ebit" as const, label: "EBIT" },
									{ key: "netIncome" as const, label: "Resultat net" },
									{ key: "netDebt" as const, label: "Dette nette" },
									{ key: "cash" as const, label: "Tresorerie" },
									{ key: "equity" as const, label: "Capitaux propres" },
								].map((field) => (
									<div key={field.key} className="space-y-2">
										<Label className="text-xs">{field.label}</Label>
										<div className="relative">
											<Input
												type="number"
												value={target[field.key]}
												onChange={(e) =>
													updateTarget(field.key, Number(e.target.value))
												}
												className="pr-8"
											/>
											<span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
												k€
											</span>
										</div>
									</div>
								))}
							</div>
						</CardContent>
					</Card>

					{/* Comparables Panel */}
					<Card>
						<CardHeader>
							<div className="flex items-center justify-between">
								<div>
									<CardTitle className="flex items-center gap-2">
										<BarChart3 className="h-5 w-5" />
										Panel de Comparables
									</CardTitle>
									<CardDescription>
										{comparables.length} societes comparables
									</CardDescription>
								</div>
								<Button variant="outline" size="sm" onClick={addComparable}>
									<Plus className="h-4 w-4 mr-1" />
									Ajouter
								</Button>
							</div>
						</CardHeader>
						<CardContent>
							<div className="overflow-x-auto">
								<table className="w-full text-sm">
									<thead>
										<tr className="border-b">
											<th className="text-left py-2 px-2">Societe</th>
											<th className="text-left py-2 px-2">Pays</th>
											<th className="text-right py-2 px-2">EV (k€)</th>
											<th className="text-right py-2 px-2">CA (k€)</th>
											<th className="text-right py-2 px-2">EBITDA (k€)</th>
											<th className="text-right py-2 px-2">EV/Sales</th>
											<th className="text-right py-2 px-2">EV/EBITDA</th>
											<th className="py-2 px-2"></th>
										</tr>
									</thead>
									<tbody>
										{comparablesWithMultiples.map((comp) => (
											<tr key={comp.id} className="border-b hover:bg-muted/50">
												<td className="py-2 px-2">
													<Input
														value={comp.name}
														onChange={(e) =>
															updateComparable(comp.id, "name", e.target.value)
														}
														className="h-8 text-sm"
														placeholder="Nom"
													/>
												</td>
												<td className="py-2 px-2">
													<Input
														value={comp.country}
														onChange={(e) =>
															updateComparable(comp.id, "country", e.target.value)
														}
														className="h-8 w-16 text-sm"
														placeholder="FR"
													/>
												</td>
												<td className="py-2 px-2">
													<Input
														type="number"
														value={comp.ev}
														onChange={(e) =>
															updateComparable(comp.id, "ev", Number(e.target.value))
														}
														className="h-8 w-24 text-sm text-right"
													/>
												</td>
												<td className="py-2 px-2">
													<Input
														type="number"
														value={comp.revenue}
														onChange={(e) =>
															updateComparable(comp.id, "revenue", Number(e.target.value))
														}
														className="h-8 w-24 text-sm text-right"
													/>
												</td>
												<td className="py-2 px-2">
													<Input
														type="number"
														value={comp.ebitda}
														onChange={(e) =>
															updateComparable(comp.id, "ebitda", Number(e.target.value))
														}
														className="h-8 w-24 text-sm text-right"
													/>
												</td>
												<td className="py-2 px-2 text-right font-mono">
													{comp.evSales ? formatMultiple(comp.evSales) : "-"}
												</td>
												<td className="py-2 px-2 text-right font-mono">
													{comp.evEbitda ? formatMultiple(comp.evEbitda) : "-"}
												</td>
												<td className="py-2 px-2">
													<Button
														variant="ghost"
														size="icon"
														className="h-8 w-8"
														onClick={() => removeComparable(comp.id)}
													>
														<Trash2 className="h-4 w-4 text-muted-foreground" />
													</Button>
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						</CardContent>
					</Card>

					{/* Statistics */}
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Calculator className="h-5 w-5" />
								Statistiques des Multiples
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="overflow-x-auto">
								<table className="w-full text-sm">
									<thead>
										<tr className="border-b">
											<th className="text-left py-2 px-3">Multiple</th>
											<th className="text-right py-2 px-3">Mediane</th>
											<th className="text-right py-2 px-3">Moyenne</th>
											<th className="text-right py-2 px-3">Min</th>
											<th className="text-right py-2 px-3">Max</th>
											<th className="text-right py-2 px-3">Ecart-type</th>
										</tr>
									</thead>
									<tbody>
										<tr className="border-b hover:bg-muted/50">
											<td className="py-3 px-3 font-medium">EV / Sales</td>
											<td className="py-3 px-3 text-right font-mono text-emerald-600 font-bold">
												{formatMultiple(statistics.evSales.median)}
											</td>
											<td className="py-3 px-3 text-right font-mono">
												{formatMultiple(statistics.evSales.average)}
											</td>
											<td className="py-3 px-3 text-right font-mono text-muted-foreground">
												{formatMultiple(statistics.evSales.min)}
											</td>
											<td className="py-3 px-3 text-right font-mono text-muted-foreground">
												{formatMultiple(statistics.evSales.max)}
											</td>
											<td className="py-3 px-3 text-right font-mono text-muted-foreground">
												{statistics.evSales.stdev.toFixed(2)}
											</td>
										</tr>
										<tr className="hover:bg-muted/50">
											<td className="py-3 px-3 font-medium">EV / EBITDA</td>
											<td className="py-3 px-3 text-right font-mono text-emerald-600 font-bold">
												{formatMultiple(statistics.evEbitda.median)}
											</td>
											<td className="py-3 px-3 text-right font-mono">
												{formatMultiple(statistics.evEbitda.average)}
											</td>
											<td className="py-3 px-3 text-right font-mono text-muted-foreground">
												{formatMultiple(statistics.evEbitda.min)}
											</td>
											<td className="py-3 px-3 text-right font-mono text-muted-foreground">
												{formatMultiple(statistics.evEbitda.max)}
											</td>
											<td className="py-3 px-3 text-right font-mono text-muted-foreground">
												{statistics.evEbitda.stdev.toFixed(2)}
											</td>
										</tr>
									</tbody>
								</table>
							</div>
						</CardContent>
					</Card>
				</div>

				{/* Right Column - Results */}
				<div className="space-y-6">
					{/* Valuation Summary */}
					<Card className="border-emerald-500/50 bg-gradient-to-br from-emerald-500/5 to-teal-500/5">
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<TrendingUp className="h-5 w-5 text-emerald-500" />
								Valorisation Implicite
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-6">
							{/* Main valuation */}
							<div className="text-center p-6 bg-white dark:bg-gray-900 rounded-lg shadow-sm">
								<p className="text-sm text-muted-foreground mb-1">
									Valorisation moyenne
								</p>
								<p className="text-4xl font-bold text-emerald-600">
									{formatCurrency(valuations.average)}
								</p>
								<div className="mt-3 flex justify-center gap-2">
									<Badge variant="outline">
										{formatCurrency(valuations.low)} - {formatCurrency(valuations.high)}
									</Badge>
								</div>
							</div>

							<Separator />

							{/* By method */}
							<div className="space-y-3">
								<div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
									<div>
										<p className="text-sm font-medium">Methode EV/Sales</p>
										<p className="text-xs text-muted-foreground">
											{formatMultiple(statistics.evSales.median)} x {formatCurrency(target.revenue)}
										</p>
									</div>
									<span className="font-bold">
										{formatCurrency(valuations.evSales)}
									</span>
								</div>
								<div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
									<div>
										<p className="text-sm font-medium">Methode EV/EBITDA</p>
										<p className="text-xs text-muted-foreground">
											{formatMultiple(statistics.evEbitda.median)} x {formatCurrency(target.ebitda)}
										</p>
									</div>
									<span className="font-bold">
										{formatCurrency(valuations.evEbitda)}
									</span>
								</div>
							</div>
						</CardContent>
					</Card>

					{/* Target Metrics */}
					<Card>
						<CardHeader>
							<CardTitle className="text-lg">Metriques Cible</CardTitle>
						</CardHeader>
						<CardContent className="space-y-3">
							{[
								{ label: "Marge EBITDA", value: formatPercent(targetMetrics.ebitdaMargin) },
								{ label: "Marge EBIT", value: formatPercent(targetMetrics.ebitMargin) },
								{ label: "Marge nette", value: formatPercent(targetMetrics.netMargin) },
								{ label: "Dette / EBITDA", value: formatMultiple(targetMetrics.debtToEbitda) },
							].map((metric) => (
								<div
									key={metric.label}
									className="flex justify-between items-center py-2 border-b last:border-0"
								>
									<span className="text-sm text-muted-foreground">{metric.label}</span>
									<span className="font-medium font-mono">{metric.value}</span>
								</div>
							))}
						</CardContent>
					</Card>

					{/* Valuation Range Visual */}
					<Card>
						<CardHeader>
							<CardTitle className="text-lg">Fourchette de Valorisation</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="relative pt-8 pb-4">
								{/* Range bar */}
								<div className="h-3 bg-gradient-to-r from-amber-400 via-emerald-500 to-amber-400 rounded-full" />

								{/* Markers */}
								<div className="relative h-8">
									{/* Low */}
									<div className="absolute left-0 -top-10 text-center transform -translate-x-1/2">
										<div className="w-0.5 h-4 bg-amber-500 mx-auto" />
										<p className="text-xs font-medium mt-1">{formatCurrency(valuations.low)}</p>
										<p className="text-xs text-muted-foreground">Min</p>
									</div>

									{/* Average */}
									<div className="absolute left-1/2 -top-10 text-center transform -translate-x-1/2">
										<div className="w-1 h-6 bg-emerald-600 mx-auto rounded" />
										<p className="text-sm font-bold text-emerald-600 mt-1">
											{formatCurrency(valuations.average)}
										</p>
										<p className="text-xs text-muted-foreground">Moyenne</p>
									</div>

									{/* High */}
									<div className="absolute right-0 -top-10 text-center transform translate-x-1/2">
										<div className="w-0.5 h-4 bg-amber-500 mx-auto" />
										<p className="text-xs font-medium mt-1">{formatCurrency(valuations.high)}</p>
										<p className="text-xs text-muted-foreground">Max</p>
									</div>
								</div>
							</div>
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	);
}
