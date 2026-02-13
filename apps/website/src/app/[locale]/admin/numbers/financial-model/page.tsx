"use client";

/**
 * Financial Model 3-Statement
 *
 * Interactive 3-statement financial model:
 * - Income Statement (P&L)
 * - Balance Sheet
 * - Cash Flow Statement
 * With projections and scenario analysis
 */

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { numbersTools } from "@/actions";
import { toast } from "sonner";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
	FileSpreadsheet,
	ArrowLeft,
	Download,
	Save,
	Plus,
	TrendingUp,
	TrendingDown,
	Calculator,
	RotateCcw,
	Copy,
	FileDown,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import { exportFinancialModelToExcel, exportToPDF } from "@/lib/numbers/export";
import { DealSelector } from "@/components/numbers/deal-selector";
import { CrossToolLinks } from "@/components/numbers/cross-tool-links";

interface FinancialYear {
	year: number;
	isProjection: boolean;
	// Income Statement
	revenue: number;
	revenueGrowth: number;
	cogs: number;
	grossMargin: number;
	opex: number;
	ebitda: number;
	ebitdaMargin: number;
	depreciation: number;
	ebit: number;
	interestExpense: number;
	ebt: number;
	taxes: number;
	taxRate: number;
	netIncome: number;
	netMargin: number;
	// Balance Sheet
	cash: number;
	receivables: number;
	inventory: number;
	otherCurrentAssets: number;
	totalCurrentAssets: number;
	ppe: number;
	intangibles: number;
	otherNonCurrentAssets: number;
	totalAssets: number;
	payables: number;
	shortTermDebt: number;
	otherCurrentLiabilities: number;
	totalCurrentLiabilities: number;
	longTermDebt: number;
	otherNonCurrentLiabilities: number;
	totalLiabilities: number;
	equity: number;
	retainedEarnings: number;
	totalEquity: number;
	// Cash Flow
	cfo: number;
	capex: number;
	cfi: number;
	debtChange: number;
	dividends: number;
	cff: number;
	netCashFlow: number;
}

const defaultYears: FinancialYear[] = [
	{
		year: 2023,
		isProjection: false,
		revenue: 10000000,
		revenueGrowth: 0,
		cogs: 6000000,
		grossMargin: 40,
		opex: 2500000,
		ebitda: 1500000,
		ebitdaMargin: 15,
		depreciation: 300000,
		ebit: 1200000,
		interestExpense: 150000,
		ebt: 1050000,
		taxes: 262500,
		taxRate: 25,
		netIncome: 787500,
		netMargin: 7.88,
		cash: 500000,
		receivables: 1200000,
		inventory: 800000,
		otherCurrentAssets: 100000,
		totalCurrentAssets: 2600000,
		ppe: 3000000,
		intangibles: 500000,
		otherNonCurrentAssets: 200000,
		totalAssets: 6300000,
		payables: 700000,
		shortTermDebt: 300000,
		otherCurrentLiabilities: 200000,
		totalCurrentLiabilities: 1200000,
		longTermDebt: 2000000,
		otherNonCurrentLiabilities: 100000,
		totalLiabilities: 3300000,
		equity: 2000000,
		retainedEarnings: 1000000,
		totalEquity: 3000000,
		cfo: 1000000,
		capex: -400000,
		cfi: -400000,
		debtChange: -200000,
		dividends: -300000,
		cff: -500000,
		netCashFlow: 100000,
	},
	{
		year: 2024,
		isProjection: false,
		revenue: 11500000,
		revenueGrowth: 15,
		cogs: 6900000,
		grossMargin: 40,
		opex: 2800000,
		ebitda: 1800000,
		ebitdaMargin: 15.65,
		depreciation: 350000,
		ebit: 1450000,
		interestExpense: 140000,
		ebt: 1310000,
		taxes: 327500,
		taxRate: 25,
		netIncome: 982500,
		netMargin: 8.54,
		cash: 600000,
		receivables: 1380000,
		inventory: 900000,
		otherCurrentAssets: 120000,
		totalCurrentAssets: 3000000,
		ppe: 3200000,
		intangibles: 480000,
		otherNonCurrentAssets: 220000,
		totalAssets: 6900000,
		payables: 800000,
		shortTermDebt: 250000,
		otherCurrentLiabilities: 220000,
		totalCurrentLiabilities: 1270000,
		longTermDebt: 1800000,
		otherNonCurrentLiabilities: 110000,
		totalLiabilities: 3180000,
		equity: 2000000,
		retainedEarnings: 1720000,
		totalEquity: 3720000,
		cfo: 1200000,
		capex: -550000,
		cfi: -550000,
		debtChange: -250000,
		dividends: -300000,
		cff: -550000,
		netCashFlow: 100000,
	},
];

function formatNumber(value: number, decimals = 0): string {
	if (Math.abs(value) >= 1000000) {
		return `${(value / 1000000).toFixed(1)}M`;
	}
	if (Math.abs(value) >= 1000) {
		return `${(value / 1000).toFixed(0)}K`;
	}
	return value.toFixed(decimals);
}

function formatPercent(value: number): string {
	return `${value.toFixed(1)}%`;
}

export default function FinancialModelPage() {
	const [years, setYears] = useState<FinancialYear[]>(defaultYears);
	const [companyName, setCompanyName] = useState("Societe Cible");
	const [projectionYears, setProjectionYears] = useState(3);
	const [growthRate, setGrowthRate] = useState(10);
	const [marginImprovement, setMarginImprovement] = useState(0.5);
	const [isSaving, setIsSaving] = useState(false);
	const router = useRouter();

	const generateProjections = () => {
		const historicalYears = years.filter((y) => !y.isProjection);
		const lastYear = historicalYears[historicalYears.length - 1];
		if (!lastYear) return;

		const newProjections: FinancialYear[] = [];

		for (let i = 1; i <= projectionYears; i++) {
			const prevYear = i === 1 ? lastYear : newProjections[i - 2];
			const projectedRevenue = prevYear.revenue * (1 + growthRate / 100);
			const projectedGrossMargin = Math.min(prevYear.grossMargin + marginImprovement, 60);
			const projectedCogs = projectedRevenue * (1 - projectedGrossMargin / 100);
			const projectedOpex = projectedRevenue * (prevYear.opex / prevYear.revenue) * 0.98;
			const projectedEbitda = projectedRevenue - projectedCogs - projectedOpex;
			const projectedEbitdaMargin = (projectedEbitda / projectedRevenue) * 100;
			const projectedDepreciation = prevYear.depreciation * 1.05;
			const projectedEbit = projectedEbitda - projectedDepreciation;
			const projectedInterest = prevYear.interestExpense * 0.95;
			const projectedEbt = projectedEbit - projectedInterest;
			const projectedTaxes = projectedEbt * (prevYear.taxRate / 100);
			const projectedNetIncome = projectedEbt - projectedTaxes;

			newProjections.push({
				year: lastYear.year + i,
				isProjection: true,
				revenue: projectedRevenue,
				revenueGrowth: growthRate,
				cogs: projectedCogs,
				grossMargin: projectedGrossMargin,
				opex: projectedOpex,
				ebitda: projectedEbitda,
				ebitdaMargin: projectedEbitdaMargin,
				depreciation: projectedDepreciation,
				ebit: projectedEbit,
				interestExpense: projectedInterest,
				ebt: projectedEbt,
				taxes: projectedTaxes,
				taxRate: prevYear.taxRate,
				netIncome: projectedNetIncome,
				netMargin: (projectedNetIncome / projectedRevenue) * 100,
				// Simplified balance sheet projections
				cash: prevYear.cash * 1.1,
				receivables: projectedRevenue * 0.12,
				inventory: projectedCogs * 0.13,
				otherCurrentAssets: prevYear.otherCurrentAssets * 1.05,
				totalCurrentAssets: 0,
				ppe: prevYear.ppe + 500000 - projectedDepreciation,
				intangibles: prevYear.intangibles * 0.95,
				otherNonCurrentAssets: prevYear.otherNonCurrentAssets,
				totalAssets: 0,
				payables: projectedCogs * 0.1,
				shortTermDebt: prevYear.shortTermDebt,
				otherCurrentLiabilities: prevYear.otherCurrentLiabilities * 1.05,
				totalCurrentLiabilities: 0,
				longTermDebt: prevYear.longTermDebt * 0.9,
				otherNonCurrentLiabilities: prevYear.otherNonCurrentLiabilities,
				totalLiabilities: 0,
				equity: prevYear.equity,
				retainedEarnings: prevYear.retainedEarnings + projectedNetIncome * 0.7,
				totalEquity: 0,
				cfo: projectedNetIncome + projectedDepreciation,
				capex: -500000,
				cfi: -500000,
				debtChange: prevYear.longTermDebt * -0.1,
				dividends: -projectedNetIncome * 0.3,
				cff: 0,
				netCashFlow: 0,
			});

			// Calculate totals
			const proj = newProjections[i - 1];
			proj.totalCurrentAssets = proj.cash + proj.receivables + proj.inventory + proj.otherCurrentAssets;
			proj.totalAssets = proj.totalCurrentAssets + proj.ppe + proj.intangibles + proj.otherNonCurrentAssets;
			proj.totalCurrentLiabilities = proj.payables + proj.shortTermDebt + proj.otherCurrentLiabilities;
			proj.totalLiabilities = proj.totalCurrentLiabilities + proj.longTermDebt + proj.otherNonCurrentLiabilities;
			proj.totalEquity = proj.equity + proj.retainedEarnings;
			proj.cff = proj.debtChange + proj.dividends;
			proj.netCashFlow = proj.cfo + proj.cfi + proj.cff;
		}

		setYears([...historicalYears, ...newProjections]);
	};

	const resetProjections = () => {
		setYears(years.filter((y) => !y.isProjection));
	};

	const handleExportExcel = () => {
		exportFinancialModelToExcel(years, companyName);
		toast.success("Export Excel", {
			description: `Modele financier ${companyName} exporte`,
		});
	};

	const handleExportPDF = () => {
		exportToPDF(`Modele_Financier_${companyName}`);
		toast.info("Export PDF en cours...");
	};

	const handleSave = useCallback(async () => {
		if (isSaving) return;

		setIsSaving(true);
		try {
			await numbersTools.saveFinancialModel({
				name: `Modele ${companyName}`,
				modelType: "dcf",
				results: {
					companyName,
					years: years.map(y => ({
						year: y.year,
						isProjection: y.isProjection,
						revenue: y.revenue,
						ebitda: y.ebitda,
						netIncome: y.netIncome,
						totalAssets: y.totalAssets,
						totalEquity: y.totalEquity,
						netCashFlow: y.netCashFlow,
					})),
				},
				assumptions: {
					projectionYears,
					growthRate,
					marginImprovement,
				},
			});
			router.refresh();
			toast.success("Modele sauvegarde", {
				description: `${companyName} - ${years.length} annees`,
			});
		} catch (error) {
			console.error("Error saving financial model:", error);
			toast.error("Erreur de sauvegarde", {
				description: "Impossible de sauvegarder le modele. Veuillez reessayer.",
			});
		} finally {
			setIsSaving(false);
		}
	}, [isSaving, companyName, years, projectionYears, growthRate, marginImprovement, router]);

	const allYears = years;

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
							<FileSpreadsheet className="h-6 w-6" />
							Modele Financier 3-Statement
						</h1>
						<p className="text-muted-foreground">
							P&L, Bilan et Flux de Tresorerie avec projections
						</p>
					</div>
				</div>
				<div className="flex items-center gap-3">
					<DealSelector toolId="financial-model" compact />
					<CrossToolLinks currentTool="financial-model" variant="compact" />
					<div className="flex gap-2">
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

			{/* Company Info & Projection Settings */}
			<div className="grid md:grid-cols-2 gap-6">
				<Card>
					<CardHeader>
						<CardTitle className="text-lg">Informations</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="space-y-2">
							<Label>Nom de la societe</Label>
							<Input
								value={companyName}
								onChange={(e) => setCompanyName(e.target.value)}
							/>
						</div>
						<div className="flex gap-4">
							<Badge variant="outline">
								{years.filter((y) => !y.isProjection).length} ans historiques
							</Badge>
							<Badge variant="secondary">
								{years.filter((y) => y.isProjection).length} ans projetes
							</Badge>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle className="text-lg">Hypotheses de Projection</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="grid grid-cols-3 gap-4">
							<div className="space-y-2">
								<Label>Annees</Label>
								<Select
									value={projectionYears.toString()}
									onValueChange={(v) => setProjectionYears(parseInt(v))}
								>
									<SelectTrigger>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										{[1, 2, 3, 4, 5].map((n) => (
											<SelectItem key={n} value={n.toString()}>
												{n} an{n > 1 ? "s" : ""}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
							<div className="space-y-2">
								<Label>Croissance CA (%)</Label>
								<Input
									type="number"
									value={growthRate}
									onChange={(e) => setGrowthRate(parseFloat(e.target.value) || 0)}
								/>
							</div>
							<div className="space-y-2">
								<Label>Amelioration marge (%/an)</Label>
								<Input
									type="number"
									step="0.1"
									value={marginImprovement}
									onChange={(e) => setMarginImprovement(parseFloat(e.target.value) || 0)}
								/>
							</div>
						</div>
						<div className="flex gap-2">
							<Button onClick={generateProjections} className="flex-1">
								<Calculator className="h-4 w-4 mr-2" />
								Generer Projections
							</Button>
							<Button variant="outline" onClick={resetProjections}>
								<RotateCcw className="h-4 w-4" />
							</Button>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Financial Statements */}
			<Tabs defaultValue="income" className="space-y-4">
				<TabsList className="grid w-full grid-cols-4">
					<TabsTrigger value="income">Compte de Resultat</TabsTrigger>
					<TabsTrigger value="balance">Bilan</TabsTrigger>
					<TabsTrigger value="cashflow">Flux de Tresorerie</TabsTrigger>
					<TabsTrigger value="ratios">Ratios Cles</TabsTrigger>
				</TabsList>

				{/* Income Statement */}
				<TabsContent value="income">
					<Card>
						<CardHeader>
							<CardTitle>Compte de Resultat</CardTitle>
							<CardDescription>En euros</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="overflow-x-auto">
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead className="w-[200px]">Ligne</TableHead>
											{allYears.map((y) => (
												<TableHead key={y.year} className={`text-right ${y.isProjection ? "bg-blue-50 dark:bg-blue-950" : ""}`}>
													{y.year}
													{y.isProjection && <Badge variant="secondary" className="ml-1 text-xs">P</Badge>}
												</TableHead>
											))}
										</TableRow>
									</TableHeader>
									<TableBody>
										<TableRow className="font-medium bg-muted/50">
											<TableCell>Chiffre d&apos;affaires</TableCell>
											{allYears.map((y) => (
												<TableCell key={y.year} className={`text-right ${y.isProjection ? "bg-blue-50 dark:bg-blue-950" : ""}`}>
													{formatNumber(y.revenue)}
												</TableCell>
											))}
										</TableRow>
										<TableRow className="text-xs text-muted-foreground">
											<TableCell className="pl-6">Croissance</TableCell>
											{allYears.map((y, i) => (
												<TableCell key={y.year} className={`text-right ${y.isProjection ? "bg-blue-50 dark:bg-blue-950" : ""}`}>
													{i === 0 ? "-" : formatPercent(y.revenueGrowth)}
												</TableCell>
											))}
										</TableRow>
										<TableRow>
											<TableCell>(-) Cout des ventes</TableCell>
											{allYears.map((y) => (
												<TableCell key={y.year} className={`text-right text-red-600 ${y.isProjection ? "bg-blue-50 dark:bg-blue-950" : ""}`}>
													({formatNumber(y.cogs)})
												</TableCell>
											))}
										</TableRow>
										<TableRow className="font-medium">
											<TableCell>Marge brute</TableCell>
											{allYears.map((y) => (
												<TableCell key={y.year} className={`text-right ${y.isProjection ? "bg-blue-50 dark:bg-blue-950" : ""}`}>
													{formatNumber(y.revenue - y.cogs)}
												</TableCell>
											))}
										</TableRow>
										<TableRow className="text-xs text-muted-foreground">
											<TableCell className="pl-6">Marge %</TableCell>
											{allYears.map((y) => (
												<TableCell key={y.year} className={`text-right ${y.isProjection ? "bg-blue-50 dark:bg-blue-950" : ""}`}>
													{formatPercent(y.grossMargin)}
												</TableCell>
											))}
										</TableRow>
										<TableRow>
											<TableCell>(-) Charges d&apos;exploitation</TableCell>
											{allYears.map((y) => (
												<TableCell key={y.year} className={`text-right text-red-600 ${y.isProjection ? "bg-blue-50 dark:bg-blue-950" : ""}`}>
													({formatNumber(y.opex)})
												</TableCell>
											))}
										</TableRow>
										<TableRow className="font-medium bg-emerald-50 dark:bg-emerald-950">
											<TableCell>EBITDA</TableCell>
											{allYears.map((y) => (
												<TableCell key={y.year} className={`text-right font-bold text-emerald-600 ${y.isProjection ? "bg-blue-50 dark:bg-blue-950" : ""}`}>
													{formatNumber(y.ebitda)}
												</TableCell>
											))}
										</TableRow>
										<TableRow className="text-xs text-muted-foreground">
											<TableCell className="pl-6">Marge EBITDA %</TableCell>
											{allYears.map((y) => (
												<TableCell key={y.year} className={`text-right ${y.isProjection ? "bg-blue-50 dark:bg-blue-950" : ""}`}>
													{formatPercent(y.ebitdaMargin)}
												</TableCell>
											))}
										</TableRow>
										<TableRow>
											<TableCell>(-) D&A</TableCell>
											{allYears.map((y) => (
												<TableCell key={y.year} className={`text-right text-red-600 ${y.isProjection ? "bg-blue-50 dark:bg-blue-950" : ""}`}>
													({formatNumber(y.depreciation)})
												</TableCell>
											))}
										</TableRow>
										<TableRow className="font-medium">
											<TableCell>EBIT</TableCell>
											{allYears.map((y) => (
												<TableCell key={y.year} className={`text-right ${y.isProjection ? "bg-blue-50 dark:bg-blue-950" : ""}`}>
													{formatNumber(y.ebit)}
												</TableCell>
											))}
										</TableRow>
										<TableRow>
											<TableCell>(-) Charges financieres</TableCell>
											{allYears.map((y) => (
												<TableCell key={y.year} className={`text-right text-red-600 ${y.isProjection ? "bg-blue-50 dark:bg-blue-950" : ""}`}>
													({formatNumber(y.interestExpense)})
												</TableCell>
											))}
										</TableRow>
										<TableRow>
											<TableCell>Resultat avant impot</TableCell>
											{allYears.map((y) => (
												<TableCell key={y.year} className={`text-right ${y.isProjection ? "bg-blue-50 dark:bg-blue-950" : ""}`}>
													{formatNumber(y.ebt)}
												</TableCell>
											))}
										</TableRow>
										<TableRow>
											<TableCell>(-) Impots ({allYears[0]?.taxRate || 25}%)</TableCell>
											{allYears.map((y) => (
												<TableCell key={y.year} className={`text-right text-red-600 ${y.isProjection ? "bg-blue-50 dark:bg-blue-950" : ""}`}>
													({formatNumber(y.taxes)})
												</TableCell>
											))}
										</TableRow>
										<TableRow className="font-bold bg-muted">
											<TableCell>Resultat net</TableCell>
											{allYears.map((y) => (
												<TableCell key={y.year} className={`text-right ${y.isProjection ? "bg-blue-100 dark:bg-blue-900" : ""}`}>
													{formatNumber(y.netIncome)}
												</TableCell>
											))}
										</TableRow>
										<TableRow className="text-xs text-muted-foreground">
											<TableCell className="pl-6">Marge nette %</TableCell>
											{allYears.map((y) => (
												<TableCell key={y.year} className={`text-right ${y.isProjection ? "bg-blue-50 dark:bg-blue-950" : ""}`}>
													{formatPercent(y.netMargin)}
												</TableCell>
											))}
										</TableRow>
									</TableBody>
								</Table>
							</div>
						</CardContent>
					</Card>
				</TabsContent>

				{/* Balance Sheet */}
				<TabsContent value="balance">
					<Card>
						<CardHeader>
							<CardTitle>Bilan</CardTitle>
							<CardDescription>En euros</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="overflow-x-auto">
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead className="w-[200px]">Ligne</TableHead>
											{allYears.map((y) => (
												<TableHead key={y.year} className={`text-right ${y.isProjection ? "bg-blue-50 dark:bg-blue-950" : ""}`}>
													{y.year}
													{y.isProjection && <Badge variant="secondary" className="ml-1 text-xs">P</Badge>}
												</TableHead>
											))}
										</TableRow>
									</TableHeader>
									<TableBody>
										{/* Assets */}
										<TableRow className="font-bold bg-muted/50">
											<TableCell colSpan={allYears.length + 1}>ACTIF</TableCell>
										</TableRow>
										<TableRow>
											<TableCell>Tresorerie</TableCell>
											{allYears.map((y) => (
												<TableCell key={y.year} className={`text-right ${y.isProjection ? "bg-blue-50 dark:bg-blue-950" : ""}`}>
													{formatNumber(y.cash)}
												</TableCell>
											))}
										</TableRow>
										<TableRow>
											<TableCell>Creances clients</TableCell>
											{allYears.map((y) => (
												<TableCell key={y.year} className={`text-right ${y.isProjection ? "bg-blue-50 dark:bg-blue-950" : ""}`}>
													{formatNumber(y.receivables)}
												</TableCell>
											))}
										</TableRow>
										<TableRow>
											<TableCell>Stocks</TableCell>
											{allYears.map((y) => (
												<TableCell key={y.year} className={`text-right ${y.isProjection ? "bg-blue-50 dark:bg-blue-950" : ""}`}>
													{formatNumber(y.inventory)}
												</TableCell>
											))}
										</TableRow>
										<TableRow className="font-medium">
											<TableCell>Total actif circulant</TableCell>
											{allYears.map((y) => (
												<TableCell key={y.year} className={`text-right ${y.isProjection ? "bg-blue-50 dark:bg-blue-950" : ""}`}>
													{formatNumber(y.totalCurrentAssets)}
												</TableCell>
											))}
										</TableRow>
										<TableRow>
											<TableCell>Immobilisations corporelles</TableCell>
											{allYears.map((y) => (
												<TableCell key={y.year} className={`text-right ${y.isProjection ? "bg-blue-50 dark:bg-blue-950" : ""}`}>
													{formatNumber(y.ppe)}
												</TableCell>
											))}
										</TableRow>
										<TableRow>
											<TableCell>Immobilisations incorporelles</TableCell>
											{allYears.map((y) => (
												<TableCell key={y.year} className={`text-right ${y.isProjection ? "bg-blue-50 dark:bg-blue-950" : ""}`}>
													{formatNumber(y.intangibles)}
												</TableCell>
											))}
										</TableRow>
										<TableRow className="font-bold bg-muted">
											<TableCell>Total Actif</TableCell>
											{allYears.map((y) => (
												<TableCell key={y.year} className={`text-right ${y.isProjection ? "bg-blue-100 dark:bg-blue-900" : ""}`}>
													{formatNumber(y.totalAssets)}
												</TableCell>
											))}
										</TableRow>

										{/* Liabilities & Equity */}
										<TableRow className="font-bold bg-muted/50">
											<TableCell colSpan={allYears.length + 1}>PASSIF</TableCell>
										</TableRow>
										<TableRow>
											<TableCell>Dettes fournisseurs</TableCell>
											{allYears.map((y) => (
												<TableCell key={y.year} className={`text-right ${y.isProjection ? "bg-blue-50 dark:bg-blue-950" : ""}`}>
													{formatNumber(y.payables)}
												</TableCell>
											))}
										</TableRow>
										<TableRow>
											<TableCell>Dette court terme</TableCell>
											{allYears.map((y) => (
												<TableCell key={y.year} className={`text-right ${y.isProjection ? "bg-blue-50 dark:bg-blue-950" : ""}`}>
													{formatNumber(y.shortTermDebt)}
												</TableCell>
											))}
										</TableRow>
										<TableRow className="font-medium">
											<TableCell>Total passif circulant</TableCell>
											{allYears.map((y) => (
												<TableCell key={y.year} className={`text-right ${y.isProjection ? "bg-blue-50 dark:bg-blue-950" : ""}`}>
													{formatNumber(y.totalCurrentLiabilities)}
												</TableCell>
											))}
										</TableRow>
										<TableRow>
											<TableCell>Dette long terme</TableCell>
											{allYears.map((y) => (
												<TableCell key={y.year} className={`text-right ${y.isProjection ? "bg-blue-50 dark:bg-blue-950" : ""}`}>
													{formatNumber(y.longTermDebt)}
												</TableCell>
											))}
										</TableRow>
										<TableRow className="font-medium">
											<TableCell>Total Passif</TableCell>
											{allYears.map((y) => (
												<TableCell key={y.year} className={`text-right ${y.isProjection ? "bg-blue-50 dark:bg-blue-950" : ""}`}>
													{formatNumber(y.totalLiabilities)}
												</TableCell>
											))}
										</TableRow>
										<TableRow>
											<TableCell>Capital</TableCell>
											{allYears.map((y) => (
												<TableCell key={y.year} className={`text-right ${y.isProjection ? "bg-blue-50 dark:bg-blue-950" : ""}`}>
													{formatNumber(y.equity)}
												</TableCell>
											))}
										</TableRow>
										<TableRow>
											<TableCell>Report a nouveau</TableCell>
											{allYears.map((y) => (
												<TableCell key={y.year} className={`text-right ${y.isProjection ? "bg-blue-50 dark:bg-blue-950" : ""}`}>
													{formatNumber(y.retainedEarnings)}
												</TableCell>
											))}
										</TableRow>
										<TableRow className="font-bold bg-emerald-50 dark:bg-emerald-950">
											<TableCell>Total Capitaux Propres</TableCell>
											{allYears.map((y) => (
												<TableCell key={y.year} className={`text-right text-emerald-600 ${y.isProjection ? "bg-blue-50 dark:bg-blue-950" : ""}`}>
													{formatNumber(y.totalEquity)}
												</TableCell>
											))}
										</TableRow>
									</TableBody>
								</Table>
							</div>
						</CardContent>
					</Card>
				</TabsContent>

				{/* Cash Flow */}
				<TabsContent value="cashflow">
					<Card>
						<CardHeader>
							<CardTitle>Tableau des Flux de Tresorerie</CardTitle>
							<CardDescription>En euros</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="overflow-x-auto">
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead className="w-[200px]">Ligne</TableHead>
											{allYears.map((y) => (
												<TableHead key={y.year} className={`text-right ${y.isProjection ? "bg-blue-50 dark:bg-blue-950" : ""}`}>
													{y.year}
													{y.isProjection && <Badge variant="secondary" className="ml-1 text-xs">P</Badge>}
												</TableHead>
											))}
										</TableRow>
									</TableHeader>
									<TableBody>
										<TableRow className="font-bold bg-muted/50">
											<TableCell>Flux operationnels (CFO)</TableCell>
											{allYears.map((y) => (
												<TableCell key={y.year} className={`text-right text-emerald-600 ${y.isProjection ? "bg-blue-50 dark:bg-blue-950" : ""}`}>
													{formatNumber(y.cfo)}
												</TableCell>
											))}
										</TableRow>
										<TableRow>
											<TableCell>Investissements (CAPEX)</TableCell>
											{allYears.map((y) => (
												<TableCell key={y.year} className={`text-right text-red-600 ${y.isProjection ? "bg-blue-50 dark:bg-blue-950" : ""}`}>
													({formatNumber(Math.abs(y.capex))})
												</TableCell>
											))}
										</TableRow>
										<TableRow className="font-medium">
											<TableCell>Flux d&apos;investissement (CFI)</TableCell>
											{allYears.map((y) => (
												<TableCell key={y.year} className={`text-right ${y.isProjection ? "bg-blue-50 dark:bg-blue-950" : ""}`}>
													{formatNumber(y.cfi)}
												</TableCell>
											))}
										</TableRow>
										<TableRow>
											<TableCell>Variation dette</TableCell>
											{allYears.map((y) => (
												<TableCell key={y.year} className={`text-right ${y.isProjection ? "bg-blue-50 dark:bg-blue-950" : ""}`}>
													{formatNumber(y.debtChange)}
												</TableCell>
											))}
										</TableRow>
										<TableRow>
											<TableCell>Dividendes</TableCell>
											{allYears.map((y) => (
												<TableCell key={y.year} className={`text-right text-red-600 ${y.isProjection ? "bg-blue-50 dark:bg-blue-950" : ""}`}>
													({formatNumber(Math.abs(y.dividends))})
												</TableCell>
											))}
										</TableRow>
										<TableRow className="font-medium">
											<TableCell>Flux de financement (CFF)</TableCell>
											{allYears.map((y) => (
												<TableCell key={y.year} className={`text-right ${y.isProjection ? "bg-blue-50 dark:bg-blue-950" : ""}`}>
													{formatNumber(y.cff)}
												</TableCell>
											))}
										</TableRow>
										<TableRow className="font-bold bg-muted">
											<TableCell>Variation nette de tresorerie</TableCell>
											{allYears.map((y) => (
												<TableCell key={y.year} className={`text-right ${y.netCashFlow >= 0 ? "text-emerald-600" : "text-red-600"} ${y.isProjection ? "bg-blue-100 dark:bg-blue-900" : ""}`}>
													{formatNumber(y.netCashFlow)}
												</TableCell>
											))}
										</TableRow>
									</TableBody>
								</Table>
							</div>
						</CardContent>
					</Card>
				</TabsContent>

				{/* Key Ratios */}
				<TabsContent value="ratios">
					<Card>
						<CardHeader>
							<CardTitle>Ratios Cles</CardTitle>
							<CardDescription>Indicateurs de performance</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="overflow-x-auto">
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead className="w-[200px]">Ratio</TableHead>
											{allYears.map((y) => (
												<TableHead key={y.year} className={`text-right ${y.isProjection ? "bg-blue-50 dark:bg-blue-950" : ""}`}>
													{y.year}
													{y.isProjection && <Badge variant="secondary" className="ml-1 text-xs">P</Badge>}
												</TableHead>
											))}
										</TableRow>
									</TableHeader>
									<TableBody>
										<TableRow className="font-bold bg-muted/50">
											<TableCell colSpan={allYears.length + 1}>Rentabilite</TableCell>
										</TableRow>
										<TableRow>
											<TableCell>Marge brute</TableCell>
											{allYears.map((y) => (
												<TableCell key={y.year} className={`text-right ${y.isProjection ? "bg-blue-50 dark:bg-blue-950" : ""}`}>
													{formatPercent(y.grossMargin)}
												</TableCell>
											))}
										</TableRow>
										<TableRow>
											<TableCell>Marge EBITDA</TableCell>
											{allYears.map((y) => (
												<TableCell key={y.year} className={`text-right ${y.isProjection ? "bg-blue-50 dark:bg-blue-950" : ""}`}>
													{formatPercent(y.ebitdaMargin)}
												</TableCell>
											))}
										</TableRow>
										<TableRow>
											<TableCell>Marge nette</TableCell>
											{allYears.map((y) => (
												<TableCell key={y.year} className={`text-right ${y.isProjection ? "bg-blue-50 dark:bg-blue-950" : ""}`}>
													{formatPercent(y.netMargin)}
												</TableCell>
											))}
										</TableRow>
										<TableRow>
											<TableCell>ROE (Resultat / Capitaux propres)</TableCell>
											{allYears.map((y) => (
												<TableCell key={y.year} className={`text-right ${y.isProjection ? "bg-blue-50 dark:bg-blue-950" : ""}`}>
													{formatPercent((y.netIncome / y.totalEquity) * 100)}
												</TableCell>
											))}
										</TableRow>
										<TableRow>
											<TableCell>ROA (Resultat / Actifs)</TableCell>
											{allYears.map((y) => (
												<TableCell key={y.year} className={`text-right ${y.isProjection ? "bg-blue-50 dark:bg-blue-950" : ""}`}>
													{formatPercent((y.netIncome / y.totalAssets) * 100)}
												</TableCell>
											))}
										</TableRow>

										<TableRow className="font-bold bg-muted/50">
											<TableCell colSpan={allYears.length + 1}>Structure</TableCell>
										</TableRow>
										<TableRow>
											<TableCell>Dette nette / EBITDA</TableCell>
											{allYears.map((y) => (
												<TableCell key={y.year} className={`text-right ${y.isProjection ? "bg-blue-50 dark:bg-blue-950" : ""}`}>
													{((y.longTermDebt + y.shortTermDebt - y.cash) / y.ebitda).toFixed(1)}x
												</TableCell>
											))}
										</TableRow>
										<TableRow>
											<TableCell>Ratio d&apos;endettement</TableCell>
											{allYears.map((y) => (
												<TableCell key={y.year} className={`text-right ${y.isProjection ? "bg-blue-50 dark:bg-blue-950" : ""}`}>
													{formatPercent((y.totalLiabilities / y.totalEquity) * 100)}
												</TableCell>
											))}
										</TableRow>
										<TableRow>
											<TableCell>Ratio de liquidite</TableCell>
											{allYears.map((y) => (
												<TableCell key={y.year} className={`text-right ${y.isProjection ? "bg-blue-50 dark:bg-blue-950" : ""}`}>
													{(y.totalCurrentAssets / y.totalCurrentLiabilities).toFixed(2)}x
												</TableCell>
											))}
										</TableRow>

										<TableRow className="font-bold bg-muted/50">
											<TableCell colSpan={allYears.length + 1}>BFR</TableCell>
										</TableRow>
										<TableRow>
											<TableCell>DSO (jours clients)</TableCell>
											{allYears.map((y) => (
												<TableCell key={y.year} className={`text-right ${y.isProjection ? "bg-blue-50 dark:bg-blue-950" : ""}`}>
													{Math.round((y.receivables / y.revenue) * 365)}j
												</TableCell>
											))}
										</TableRow>
										<TableRow>
											<TableCell>DIO (jours stocks)</TableCell>
											{allYears.map((y) => (
												<TableCell key={y.year} className={`text-right ${y.isProjection ? "bg-blue-50 dark:bg-blue-950" : ""}`}>
													{Math.round((y.inventory / y.cogs) * 365)}j
												</TableCell>
											))}
										</TableRow>
										<TableRow>
											<TableCell>DPO (jours fournisseurs)</TableCell>
											{allYears.map((y) => (
												<TableCell key={y.year} className={`text-right ${y.isProjection ? "bg-blue-50 dark:bg-blue-950" : ""}`}>
													{Math.round((y.payables / y.cogs) * 365)}j
												</TableCell>
											))}
										</TableRow>
									</TableBody>
								</Table>
							</div>
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>
		</div>
	);
}
