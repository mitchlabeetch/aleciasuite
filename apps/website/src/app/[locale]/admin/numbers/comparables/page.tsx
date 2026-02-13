"use client";

/**
 * Comparable Companies Analysis
 *
 * Full comparables table with:
 * - Company data entry
 * - Multiple valuation multiples
 * - Statistical analysis
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
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import {
	Building2,
	ArrowLeft,
	Download,
	Save,
	Plus,
	Trash2,
	TrendingUp,
	BarChart3,
	Calculator,
	Target,
	Edit,
	FileDown,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import { exportToExcel, exportToPDF, type ExportColumn } from "@/lib/numbers/export";
import { DealSelector } from "@/components/numbers/deal-selector";
import { CrossToolLinks } from "@/components/numbers/cross-tool-links";

interface ComparableCompany {
	id: string;
	name: string;
	ticker: string;
	country: string;
	sector: string;
	marketCap: number;
	enterpriseValue: number;
	revenue: number;
	ebitda: number;
	ebit: number;
	netIncome: number;
	revenueGrowth: number;
	ebitdaMargin: number;
	netDebt: number;
}

interface TargetCompany {
	name: string;
	revenue: number;
	ebitda: number;
	ebit: number;
	netIncome: number;
}

const defaultComps: ComparableCompany[] = [
	{
		id: "c1",
		name: "Alpha Tech SA",
		ticker: "ALPH",
		country: "France",
		sector: "Technologie",
		marketCap: 150000000,
		enterpriseValue: 165000000,
		revenue: 45000000,
		ebitda: 9000000,
		ebit: 7500000,
		netIncome: 5500000,
		revenueGrowth: 18,
		ebitdaMargin: 20,
		netDebt: 15000000,
	},
	{
		id: "c2",
		name: "Beta Services",
		ticker: "BETA",
		country: "Allemagne",
		sector: "Services",
		marketCap: 220000000,
		enterpriseValue: 200000000,
		revenue: 55000000,
		ebitda: 11000000,
		ebit: 9000000,
		netIncome: 6600000,
		revenueGrowth: 12,
		ebitdaMargin: 20,
		netDebt: -20000000,
	},
	{
		id: "c3",
		name: "Gamma Industries",
		ticker: "GAMM",
		country: "France",
		sector: "Industrie",
		marketCap: 180000000,
		enterpriseValue: 210000000,
		revenue: 70000000,
		ebitda: 14000000,
		ebit: 11000000,
		netIncome: 8000000,
		revenueGrowth: 8,
		ebitdaMargin: 20,
		netDebt: 30000000,
	},
	{
		id: "c4",
		name: "Delta Solutions",
		ticker: "DELT",
		country: "Belgique",
		sector: "Technologie",
		marketCap: 95000000,
		enterpriseValue: 105000000,
		revenue: 28000000,
		ebitda: 5600000,
		ebit: 4500000,
		netIncome: 3200000,
		revenueGrowth: 22,
		ebitdaMargin: 20,
		netDebt: 10000000,
	},
	{
		id: "c5",
		name: "Epsilon Group",
		ticker: "EPSI",
		country: "France",
		sector: "Services",
		marketCap: 320000000,
		enterpriseValue: 350000000,
		revenue: 95000000,
		ebitda: 19000000,
		ebit: 15000000,
		netIncome: 11000000,
		revenueGrowth: 15,
		ebitdaMargin: 20,
		netDebt: 30000000,
	},
];

const defaultTarget: TargetCompany = {
	name: "Societe Cible",
	revenue: 25000000,
	ebitda: 5000000,
	ebit: 4000000,
	netIncome: 2800000,
};

function formatNumber(value: number): string {
	if (Math.abs(value) >= 1000000000) {
		return `${(value / 1000000000).toFixed(1)}Md`;
	}
	if (Math.abs(value) >= 1000000) {
		return `${(value / 1000000).toFixed(1)}M`;
	}
	if (Math.abs(value) >= 1000) {
		return `${(value / 1000).toFixed(0)}K`;
	}
	return value.toFixed(0);
}

function calculateStats(values: number[]): {
	min: number;
	max: number;
	mean: number;
	median: number;
} {
	if (values.length === 0) return { min: 0, max: 0, mean: 0, median: 0 };

	const sorted = [...values].sort((a, b) => a - b);
	const min = sorted[0];
	const max = sorted[sorted.length - 1];
	const mean = values.reduce((a, b) => a + b, 0) / values.length;
	const median =
		sorted.length % 2 === 0
			? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
			: sorted[Math.floor(sorted.length / 2)];

	return { min, max, mean, median };
}

export default function ComparablesPage() {
	const router = useRouter();
	const [comps, setComps] = useState<ComparableCompany[]>(defaultComps);
	const [target, setTarget] = useState<TargetCompany>(defaultTarget);
	const [isAddOpen, setIsAddOpen] = useState(false);
	const [editingComp, setEditingComp] = useState<ComparableCompany | null>(null);
	const [newComp, setNewComp] = useState<Partial<ComparableCompany>>({
		country: "France",
		sector: "Technologie",
	});
	const [isSaving, setIsSaving] = useState(false);

	// Calculate multiples for each comp
	const compsWithMultiples = useMemo(() => {
		return comps.map((comp) => ({
			...comp,
			evSales: comp.enterpriseValue / comp.revenue,
			evEbitda: comp.enterpriseValue / comp.ebitda,
			evEbit: comp.enterpriseValue / comp.ebit,
			peRatio: comp.marketCap / comp.netIncome,
		}));
	}, [comps]);

	// Calculate statistics
	const stats = useMemo(() => {
		const evSales = compsWithMultiples.map((c) => c.evSales);
		const evEbitda = compsWithMultiples.map((c) => c.evEbitda);
		const evEbit = compsWithMultiples.map((c) => c.evEbit);
		const pe = compsWithMultiples.map((c) => c.peRatio);

		return {
			evSales: calculateStats(evSales),
			evEbitda: calculateStats(evEbitda),
			evEbit: calculateStats(evEbit),
			pe: calculateStats(pe),
		};
	}, [compsWithMultiples]);

	// Calculate implied valuations for target
	const impliedValuations = useMemo(() => {
		return {
			evSales: {
				min: target.revenue * stats.evSales.min,
				max: target.revenue * stats.evSales.max,
				mean: target.revenue * stats.evSales.mean,
				median: target.revenue * stats.evSales.median,
			},
			evEbitda: {
				min: target.ebitda * stats.evEbitda.min,
				max: target.ebitda * stats.evEbitda.max,
				mean: target.ebitda * stats.evEbitda.mean,
				median: target.ebitda * stats.evEbitda.median,
			},
			evEbit: {
				min: target.ebit * stats.evEbit.min,
				max: target.ebit * stats.evEbit.max,
				mean: target.ebit * stats.evEbit.mean,
				median: target.ebit * stats.evEbit.median,
			},
			pe: {
				min: target.netIncome * stats.pe.min,
				max: target.netIncome * stats.pe.max,
				mean: target.netIncome * stats.pe.mean,
				median: target.netIncome * stats.pe.median,
			},
		};
	}, [target, stats]);

	const handleAddComp = () => {
		if (!newComp.name || !newComp.revenue) return;

		const comp: ComparableCompany = {
			id: `c${Date.now()}`,
			name: newComp.name || "",
			ticker: newComp.ticker || "",
			country: newComp.country || "France",
			sector: newComp.sector || "Technologie",
			marketCap: newComp.marketCap || 0,
			enterpriseValue: newComp.enterpriseValue || 0,
			revenue: newComp.revenue || 0,
			ebitda: newComp.ebitda || 0,
			ebit: newComp.ebit || 0,
			netIncome: newComp.netIncome || 0,
			revenueGrowth: newComp.revenueGrowth || 0,
			ebitdaMargin: newComp.ebitdaMargin || 0,
			netDebt: newComp.netDebt || 0,
		};

		setComps((prev) => [...prev, comp]);
		setNewComp({ country: "France", sector: "Technologie" });
		setIsAddOpen(false);
	};

	const handleDeleteComp = (id: string) => {
		setComps((prev) => prev.filter((c) => c.id !== id));
	};

	const handleExportExcel = () => {
		const exportColumns: ExportColumn[] = [
			{ key: "name", header: "Societe", width: 25 },
			{ key: "ticker", header: "Ticker", width: 10 },
			{ key: "country", header: "Pays", width: 12 },
			{ key: "marketCap", header: "Market Cap", width: 15, format: "currency" },
			{ key: "enterpriseValue", header: "EV", width: 15, format: "currency" },
			{ key: "revenue", header: "CA", width: 15, format: "currency" },
			{ key: "ebitda", header: "EBITDA", width: 15, format: "currency" },
			{ key: "evSales", header: "EV/CA", width: 10, format: "number" },
			{ key: "evEbitda", header: "EV/EBITDA", width: 10, format: "number" },
			{ key: "evEbit", header: "EV/EBIT", width: 10, format: "number" },
			{ key: "peRatio", header: "P/E", width: 10, format: "number" },
		];

		exportToExcel(compsWithMultiples, exportColumns, {
			filename: `Comparables_${target.name.replace(/\s+/g, "_")}`,
			sheetName: "Comparables",
			title: "Analyse des Comparables",
			subtitle: `Cible: ${target.name}`,
		});
	};

	const handleExportPDF = () => {
		exportToPDF(`Comparables_${target.name}`);
		toast.info("Export PDF en cours...");
	};

	const handleSave = useCallback(async () => {
		if (isSaving) return;

		setIsSaving(true);
		try {
			// TODO: Replace with server action when available
			await numbersTools.createComparableAnalysis({
				name: `Analyse ${target.name}`,
				targetName: target.name,
				targetMetrics: {
					revenue: target.revenue,
					ebitda: target.ebitda,
					ebit: target.ebit,
					netIncome: target.netIncome,
				},
				comparables: comps.map(c => ({
					name: c.name,
					ticker: c.ticker,
					country: c.country,
					sector: c.sector,
					marketCap: c.marketCap,
					enterpriseValue: c.enterpriseValue,
					revenue: c.revenue,
					ebitda: c.ebitda,
				})),
			});
			router.refresh();
			toast.success("Analyse sauvegardee", {
				description: `${comps.length} comparables pour ${target.name}`,
			});
		} catch (error) {
			console.error("Error saving comparables:", error);
			toast.error("Erreur de sauvegarde", {
				description: "Impossible de sauvegarder l'analyse. Veuillez reessayer.",
			});
		} finally {
			setIsSaving(false);
		}
	}, [isSaving, router, target, comps]);

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
							<Building2 className="h-6 w-6" />
							Analyse des Comparables
						</h1>
						<p className="text-muted-foreground">
							{comps.length} societes comparables
						</p>
					</div>
				</div>
				<div className="flex items-center gap-3">
					<DealSelector toolId="comparables" compact />
					<CrossToolLinks currentTool="comparables" variant="compact" />
					<div className="flex gap-2">
						<Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
						<DialogTrigger asChild>
							<Button variant="outline">
								<Plus className="h-4 w-4 mr-2" />
								Ajouter Comparable
							</Button>
						</DialogTrigger>
						<DialogContent className="max-w-2xl">
							<DialogHeader>
								<DialogTitle>Ajouter une societe comparable</DialogTitle>
								<DialogDescription>
									Entrez les donnees financieres de la societe
								</DialogDescription>
							</DialogHeader>
							<div className="grid gap-4">
								<div className="grid grid-cols-3 gap-4">
									<div className="space-y-2">
										<Label>Nom</Label>
										<Input
											value={newComp.name || ""}
											onChange={(e) =>
												setNewComp((prev) => ({ ...prev, name: e.target.value }))
											}
										/>
									</div>
									<div className="space-y-2">
										<Label>Ticker</Label>
										<Input
											value={newComp.ticker || ""}
											onChange={(e) =>
												setNewComp((prev) => ({ ...prev, ticker: e.target.value }))
											}
										/>
									</div>
									<div className="space-y-2">
										<Label>Pays</Label>
										<Select
											value={newComp.country}
											onValueChange={(v) =>
												setNewComp((prev) => ({ ...prev, country: v }))
											}
										>
											<SelectTrigger>
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="France">France</SelectItem>
												<SelectItem value="Allemagne">Allemagne</SelectItem>
												<SelectItem value="Belgique">Belgique</SelectItem>
												<SelectItem value="UK">Royaume-Uni</SelectItem>
												<SelectItem value="USA">Etats-Unis</SelectItem>
											</SelectContent>
										</Select>
									</div>
								</div>
								<div className="grid grid-cols-3 gap-4">
									<div className="space-y-2">
										<Label>Market Cap (EUR)</Label>
										<Input
											type="number"
											value={newComp.marketCap || ""}
											onChange={(e) =>
												setNewComp((prev) => ({
													...prev,
													marketCap: parseFloat(e.target.value) || 0,
												}))
											}
										/>
									</div>
									<div className="space-y-2">
										<Label>Enterprise Value (EUR)</Label>
										<Input
											type="number"
											value={newComp.enterpriseValue || ""}
											onChange={(e) =>
												setNewComp((prev) => ({
													...prev,
													enterpriseValue: parseFloat(e.target.value) || 0,
												}))
											}
										/>
									</div>
									<div className="space-y-2">
										<Label>Dette Nette (EUR)</Label>
										<Input
											type="number"
											value={newComp.netDebt || ""}
											onChange={(e) =>
												setNewComp((prev) => ({
													...prev,
													netDebt: parseFloat(e.target.value) || 0,
												}))
											}
										/>
									</div>
								</div>
								<div className="grid grid-cols-4 gap-4">
									<div className="space-y-2">
										<Label>CA (EUR)</Label>
										<Input
											type="number"
											value={newComp.revenue || ""}
											onChange={(e) =>
												setNewComp((prev) => ({
													...prev,
													revenue: parseFloat(e.target.value) || 0,
												}))
											}
										/>
									</div>
									<div className="space-y-2">
										<Label>EBITDA (EUR)</Label>
										<Input
											type="number"
											value={newComp.ebitda || ""}
											onChange={(e) =>
												setNewComp((prev) => ({
													...prev,
													ebitda: parseFloat(e.target.value) || 0,
												}))
											}
										/>
									</div>
									<div className="space-y-2">
										<Label>EBIT (EUR)</Label>
										<Input
											type="number"
											value={newComp.ebit || ""}
											onChange={(e) =>
												setNewComp((prev) => ({
													...prev,
													ebit: parseFloat(e.target.value) || 0,
												}))
											}
										/>
									</div>
									<div className="space-y-2">
										<Label>Resultat Net (EUR)</Label>
										<Input
											type="number"
											value={newComp.netIncome || ""}
											onChange={(e) =>
												setNewComp((prev) => ({
													...prev,
													netIncome: parseFloat(e.target.value) || 0,
												}))
											}
										/>
									</div>
								</div>
								<Button onClick={handleAddComp}>Ajouter</Button>
							</div>
						</DialogContent>
					</Dialog>
					<Button variant="outline" onClick={handleSave} disabled={isSaving}>
						{isSaving ? (
							<>
								<span className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent" />
								Sauvegarde...
							</>
						) : (
							<>
								<Save className="h-4 w-4 mr-2" />
								Sauvegarder
							</>
						)}
					</Button>
					<Button variant="outline" onClick={handleExportPDF}>
						<FileDown className="h-4 w-4 mr-2" />
						PDF
					</Button>
					<Button onClick={handleExportExcel}>
						<Download className="h-4 w-4 mr-2" />
						Exporter Excel
					</Button>
					</div>
				</div>
			</div>

			{/* Target Company */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Target className="h-5 w-5" />
						Societe Cible
					</CardTitle>
					<CardDescription>
						Donnees financieres de la cible pour calculer les valorisations implicites
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-5 gap-4">
						<div className="space-y-2">
							<Label>Nom</Label>
							<Input
								value={target.name}
								onChange={(e) =>
									setTarget((prev) => ({ ...prev, name: e.target.value }))
								}
							/>
						</div>
						<div className="space-y-2">
							<Label>CA (EUR)</Label>
							<Input
								type="number"
								value={target.revenue}
								onChange={(e) =>
									setTarget((prev) => ({
										...prev,
										revenue: parseFloat(e.target.value) || 0,
									}))
								}
							/>
						</div>
						<div className="space-y-2">
							<Label>EBITDA (EUR)</Label>
							<Input
								type="number"
								value={target.ebitda}
								onChange={(e) =>
									setTarget((prev) => ({
										...prev,
										ebitda: parseFloat(e.target.value) || 0,
									}))
								}
							/>
						</div>
						<div className="space-y-2">
							<Label>EBIT (EUR)</Label>
							<Input
								type="number"
								value={target.ebit}
								onChange={(e) =>
									setTarget((prev) => ({
										...prev,
										ebit: parseFloat(e.target.value) || 0,
									}))
								}
							/>
						</div>
						<div className="space-y-2">
							<Label>Resultat Net (EUR)</Label>
							<Input
								type="number"
								value={target.netIncome}
								onChange={(e) =>
									setTarget((prev) => ({
										...prev,
										netIncome: parseFloat(e.target.value) || 0,
									}))
								}
							/>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Comparables Table */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<BarChart3 className="h-5 w-5" />
						Tableau des Comparables
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="overflow-x-auto">
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead className="min-w-[150px]">Societe</TableHead>
									<TableHead className="text-right">Market Cap</TableHead>
									<TableHead className="text-right">EV</TableHead>
									<TableHead className="text-right">CA</TableHead>
									<TableHead className="text-right">EBITDA</TableHead>
									<TableHead className="text-right bg-blue-50 dark:bg-blue-950">EV/CA</TableHead>
									<TableHead className="text-right bg-blue-50 dark:bg-blue-950">EV/EBITDA</TableHead>
									<TableHead className="text-right bg-blue-50 dark:bg-blue-950">EV/EBIT</TableHead>
									<TableHead className="text-right bg-blue-50 dark:bg-blue-950">P/E</TableHead>
									<TableHead className="w-[50px]"></TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{compsWithMultiples.map((comp) => (
									<TableRow key={comp.id}>
										<TableCell>
											<div>
												<p className="font-medium">{comp.name}</p>
												<p className="text-xs text-muted-foreground">
													{comp.ticker} | {comp.country}
												</p>
											</div>
										</TableCell>
										<TableCell className="text-right">
											{formatNumber(comp.marketCap)}
										</TableCell>
										<TableCell className="text-right">
											{formatNumber(comp.enterpriseValue)}
										</TableCell>
										<TableCell className="text-right">
											{formatNumber(comp.revenue)}
										</TableCell>
										<TableCell className="text-right">
											{formatNumber(comp.ebitda)}
										</TableCell>
										<TableCell className="text-right font-medium bg-blue-50 dark:bg-blue-950">
											{comp.evSales.toFixed(2)}x
										</TableCell>
										<TableCell className="text-right font-medium bg-blue-50 dark:bg-blue-950">
											{comp.evEbitda.toFixed(1)}x
										</TableCell>
										<TableCell className="text-right font-medium bg-blue-50 dark:bg-blue-950">
											{comp.evEbit.toFixed(1)}x
										</TableCell>
										<TableCell className="text-right font-medium bg-blue-50 dark:bg-blue-950">
											{comp.peRatio.toFixed(1)}x
										</TableCell>
										<TableCell>
											<Button
												variant="ghost"
												size="icon"
												onClick={() => handleDeleteComp(comp.id)}
											>
												<Trash2 className="h-4 w-4 text-red-500" />
											</Button>
										</TableCell>
									</TableRow>
								))}

								{/* Statistics Rows */}
								<TableRow className="bg-muted/50 font-medium">
									<TableCell>Minimum</TableCell>
									<TableCell className="text-right">-</TableCell>
									<TableCell className="text-right">-</TableCell>
									<TableCell className="text-right">-</TableCell>
									<TableCell className="text-right">-</TableCell>
									<TableCell className="text-right bg-blue-100 dark:bg-blue-900">
										{stats.evSales.min.toFixed(2)}x
									</TableCell>
									<TableCell className="text-right bg-blue-100 dark:bg-blue-900">
										{stats.evEbitda.min.toFixed(1)}x
									</TableCell>
									<TableCell className="text-right bg-blue-100 dark:bg-blue-900">
										{stats.evEbit.min.toFixed(1)}x
									</TableCell>
									<TableCell className="text-right bg-blue-100 dark:bg-blue-900">
										{stats.pe.min.toFixed(1)}x
									</TableCell>
									<TableCell></TableCell>
								</TableRow>
								<TableRow className="bg-muted/50 font-medium">
									<TableCell>Maximum</TableCell>
									<TableCell className="text-right">-</TableCell>
									<TableCell className="text-right">-</TableCell>
									<TableCell className="text-right">-</TableCell>
									<TableCell className="text-right">-</TableCell>
									<TableCell className="text-right bg-blue-100 dark:bg-blue-900">
										{stats.evSales.max.toFixed(2)}x
									</TableCell>
									<TableCell className="text-right bg-blue-100 dark:bg-blue-900">
										{stats.evEbitda.max.toFixed(1)}x
									</TableCell>
									<TableCell className="text-right bg-blue-100 dark:bg-blue-900">
										{stats.evEbit.max.toFixed(1)}x
									</TableCell>
									<TableCell className="text-right bg-blue-100 dark:bg-blue-900">
										{stats.pe.max.toFixed(1)}x
									</TableCell>
									<TableCell></TableCell>
								</TableRow>
								<TableRow className="bg-muted/50 font-medium">
									<TableCell>Moyenne</TableCell>
									<TableCell className="text-right">-</TableCell>
									<TableCell className="text-right">-</TableCell>
									<TableCell className="text-right">-</TableCell>
									<TableCell className="text-right">-</TableCell>
									<TableCell className="text-right bg-blue-100 dark:bg-blue-900">
										{stats.evSales.mean.toFixed(2)}x
									</TableCell>
									<TableCell className="text-right bg-blue-100 dark:bg-blue-900">
										{stats.evEbitda.mean.toFixed(1)}x
									</TableCell>
									<TableCell className="text-right bg-blue-100 dark:bg-blue-900">
										{stats.evEbit.mean.toFixed(1)}x
									</TableCell>
									<TableCell className="text-right bg-blue-100 dark:bg-blue-900">
										{stats.pe.mean.toFixed(1)}x
									</TableCell>
									<TableCell></TableCell>
								</TableRow>
								<TableRow className="bg-emerald-50 dark:bg-emerald-950 font-bold">
									<TableCell>Mediane</TableCell>
									<TableCell className="text-right">-</TableCell>
									<TableCell className="text-right">-</TableCell>
									<TableCell className="text-right">-</TableCell>
									<TableCell className="text-right">-</TableCell>
									<TableCell className="text-right text-emerald-600 bg-emerald-100 dark:bg-emerald-900">
										{stats.evSales.median.toFixed(2)}x
									</TableCell>
									<TableCell className="text-right text-emerald-600 bg-emerald-100 dark:bg-emerald-900">
										{stats.evEbitda.median.toFixed(1)}x
									</TableCell>
									<TableCell className="text-right text-emerald-600 bg-emerald-100 dark:bg-emerald-900">
										{stats.evEbit.median.toFixed(1)}x
									</TableCell>
									<TableCell className="text-right text-emerald-600 bg-emerald-100 dark:bg-emerald-900">
										{stats.pe.median.toFixed(1)}x
									</TableCell>
									<TableCell></TableCell>
								</TableRow>
							</TableBody>
						</Table>
					</div>
				</CardContent>
			</Card>

			{/* Implied Valuations */}
			<Card className="border-emerald-500/50">
				<CardHeader>
					<CardTitle className="flex items-center gap-2 text-emerald-600">
						<Calculator className="h-5 w-5" />
						Valorisation Implicite - {target.name}
					</CardTitle>
					<CardDescription>
						Enterprise Value implicite basee sur les multiples des comparables
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="overflow-x-auto">
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Methode</TableHead>
									<TableHead className="text-right">Agregat Cible</TableHead>
									<TableHead className="text-right">Multiple Median</TableHead>
									<TableHead className="text-right">EV Min</TableHead>
									<TableHead className="text-right">EV Max</TableHead>
									<TableHead className="text-right bg-emerald-50 dark:bg-emerald-950">EV Mediane</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								<TableRow>
									<TableCell className="font-medium">EV / Chiffre d&apos;affaires</TableCell>
									<TableCell className="text-right">{formatNumber(target.revenue)}</TableCell>
									<TableCell className="text-right">{stats.evSales.median.toFixed(2)}x</TableCell>
									<TableCell className="text-right">{formatNumber(impliedValuations.evSales.min)}</TableCell>
									<TableCell className="text-right">{formatNumber(impliedValuations.evSales.max)}</TableCell>
									<TableCell className="text-right font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950">
										{formatNumber(impliedValuations.evSales.median)}
									</TableCell>
								</TableRow>
								<TableRow>
									<TableCell className="font-medium">EV / EBITDA</TableCell>
									<TableCell className="text-right">{formatNumber(target.ebitda)}</TableCell>
									<TableCell className="text-right">{stats.evEbitda.median.toFixed(1)}x</TableCell>
									<TableCell className="text-right">{formatNumber(impliedValuations.evEbitda.min)}</TableCell>
									<TableCell className="text-right">{formatNumber(impliedValuations.evEbitda.max)}</TableCell>
									<TableCell className="text-right font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950">
										{formatNumber(impliedValuations.evEbitda.median)}
									</TableCell>
								</TableRow>
								<TableRow>
									<TableCell className="font-medium">EV / EBIT</TableCell>
									<TableCell className="text-right">{formatNumber(target.ebit)}</TableCell>
									<TableCell className="text-right">{stats.evEbit.median.toFixed(1)}x</TableCell>
									<TableCell className="text-right">{formatNumber(impliedValuations.evEbit.min)}</TableCell>
									<TableCell className="text-right">{formatNumber(impliedValuations.evEbit.max)}</TableCell>
									<TableCell className="text-right font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950">
										{formatNumber(impliedValuations.evEbit.median)}
									</TableCell>
								</TableRow>
								<TableRow>
									<TableCell className="font-medium">Price / Earnings (Equity Value)</TableCell>
									<TableCell className="text-right">{formatNumber(target.netIncome)}</TableCell>
									<TableCell className="text-right">{stats.pe.median.toFixed(1)}x</TableCell>
									<TableCell className="text-right">{formatNumber(impliedValuations.pe.min)}</TableCell>
									<TableCell className="text-right">{formatNumber(impliedValuations.pe.max)}</TableCell>
									<TableCell className="text-right font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950">
										{formatNumber(impliedValuations.pe.median)}
									</TableCell>
								</TableRow>
							</TableBody>
						</Table>
					</div>

					{/* Summary */}
					<div className="mt-6 p-4 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 rounded-lg">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm text-muted-foreground">
									Fourchette de valorisation (EV basee sur EBITDA)
								</p>
								<p className="text-2xl font-bold text-emerald-600">
									{formatNumber(impliedValuations.evEbitda.min)} - {formatNumber(impliedValuations.evEbitda.max)} EUR
								</p>
							</div>
							<div className="text-right">
								<p className="text-sm text-muted-foreground">Valeur mediane</p>
								<p className="text-3xl font-bold text-emerald-600">
									{formatNumber(impliedValuations.evEbitda.median)} EUR
								</p>
							</div>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
