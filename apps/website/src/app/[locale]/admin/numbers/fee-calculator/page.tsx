"use client";

/**
 * Fee Calculator - Calculateur d'Honoraires M&A
 *
 * Implements the Double Lehman formula for M&A advisory fees:
 * - 5% on first €1M
 * - 4% on next €1M (€1-2M)
 * - 3% on next €1M (€2-3M)
 * - 2% on everything above €3M
 *
 * Plus retainer fees and expenses
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
import { Separator } from "@/components/ui/separator";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Calculator,
	ArrowLeft,
	Download,
	Save,
	RotateCcw,
	TrendingUp,
	Euro,
	Percent,
	Calendar,
	FileText,
	Info,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { DealSelector } from "@/components/numbers/deal-selector";
import { CrossToolLinks } from "@/components/numbers/cross-tool-links";
import { KeyboardShortcutsHelp } from "@/components/numbers/keyboard-shortcuts-help";
import { useKeyboardShortcuts, createNumbersShortcuts } from "@/lib/numbers/keyboard-shortcuts";

interface FeeInputs {
	clientName: string;
	missionType: string;
	date: string;
	// Transaction value components
	enterpriseValue: number;
	debtAssumed: number;
	cashAvailable: number;
	adjustments: number;
	// Retainer
	monthlyRetainer: number;
	retainerMonths: number;
	// Expenses
	estimatedExpenses: number;
	// Custom rates (optional)
	useCustomRates: boolean;
	rate1: number;
	rate2: number;
	rate3: number;
	rate4: number;
}

interface FeeBreakdown {
	transactionValue: number;
	// Lehman tranches
	tranche1Base: number;
	tranche1Fee: number;
	tranche2Base: number;
	tranche2Fee: number;
	tranche3Base: number;
	tranche3Fee: number;
	tranche4Base: number;
	tranche4Fee: number;
	totalSuccessFee: number;
	// Other fees
	totalRetainer: number;
	expenses: number;
	// Totals
	totalFees: number;
	feePercentage: number;
}

const defaultInputs: FeeInputs = {
	clientName: "",
	missionType: "cession",
	date: new Date().toISOString().split("T")[0],
	enterpriseValue: 5000,
	debtAssumed: 1000,
	cashAvailable: 300,
	adjustments: 0,
	monthlyRetainer: 10,
	retainerMonths: 6,
	estimatedExpenses: 15,
	useCustomRates: false,
	rate1: 5,
	rate2: 4,
	rate3: 3,
	rate4: 2,
};

const missionTypes = [
	{ value: "cession", label: "Cession" },
	{ value: "acquisition", label: "Acquisition" },
	{ value: "lbo", label: "LBO / MBO" },
	{ value: "levee", label: "Levee de fonds" },
	{ value: "restructuration", label: "Restructuration" },
	{ value: "autre", label: "Autre" },
];

export default function FeeCalculatorPage() {
	const [inputs, setInputs] = useState<FeeInputs>(defaultInputs);
	const [isSaving, setIsSaving] = useState(false);
	const router = useRouter();

	const updateInput = <K extends keyof FeeInputs>(
		key: K,
		value: FeeInputs[K],
	) => {
		setInputs((prev) => ({ ...prev, [key]: value }));
	};

	const breakdown = useMemo((): FeeBreakdown => {
		// Calculate transaction value
		const transactionValue =
			inputs.enterpriseValue +
			inputs.debtAssumed -
			inputs.cashAvailable +
			inputs.adjustments;

		// Get rates
		const r1 = inputs.useCustomRates ? inputs.rate1 / 100 : 0.05;
		const r2 = inputs.useCustomRates ? inputs.rate2 / 100 : 0.04;
		const r3 = inputs.useCustomRates ? inputs.rate3 / 100 : 0.03;
		const r4 = inputs.useCustomRates ? inputs.rate4 / 100 : 0.02;

		// Lehman formula - calculate each tranche
		const tranche1Base = Math.min(transactionValue, 1000);
		const tranche1Fee = tranche1Base * r1;

		const tranche2Base =
			transactionValue > 1000 ? Math.min(transactionValue - 1000, 1000) : 0;
		const tranche2Fee = tranche2Base * r2;

		const tranche3Base =
			transactionValue > 2000 ? Math.min(transactionValue - 2000, 1000) : 0;
		const tranche3Fee = tranche3Base * r3;

		const tranche4Base = transactionValue > 3000 ? transactionValue - 3000 : 0;
		const tranche4Fee = tranche4Base * r4;

		const totalSuccessFee =
			tranche1Fee + tranche2Fee + tranche3Fee + tranche4Fee;

		// Retainer
		const totalRetainer = inputs.monthlyRetainer * inputs.retainerMonths;

		// Total
		const totalFees = totalRetainer + totalSuccessFee + inputs.estimatedExpenses;
		const feePercentage =
			transactionValue > 0 ? (totalFees / transactionValue) * 100 : 0;

		return {
			transactionValue,
			tranche1Base,
			tranche1Fee,
			tranche2Base,
			tranche2Fee,
			tranche3Base,
			tranche3Fee,
			tranche4Base,
			tranche4Fee,
			totalSuccessFee,
			totalRetainer,
			expenses: inputs.estimatedExpenses,
			totalFees,
			feePercentage,
		};
	}, [inputs]);

	const formatCurrency = (value: number) => {
		return new Intl.NumberFormat("fr-FR", {
			minimumFractionDigits: 0,
			maximumFractionDigits: 0,
		}).format(value);
	};

	const formatPercent = (value: number) => {
		return new Intl.NumberFormat("fr-FR", {
			minimumFractionDigits: 2,
			maximumFractionDigits: 2,
		}).format(value);
	};

	const handleReset = () => {
		setInputs(defaultInputs);
	};

	const handleSave = useCallback(async () => {
		if (isSaving) return;

		setIsSaving(true);
		try {
			// Save as spreadsheet data to preserve all calculation fields
			await numbersTools.saveSpreadsheet({
				title: `Calcul Honoraires - ${inputs.clientName || "Sans nom"}`,
				sheetData: {
					type: "fee-calculation",
					clientName: inputs.clientName || "Sans nom",
					missionType: inputs.missionType,
					date: inputs.date,
					enterpriseValue: inputs.enterpriseValue,
					debtAssumed: inputs.debtAssumed,
					cashAvailable: inputs.cashAvailable,
					transactionValue: breakdown.transactionValue,
					successFee: breakdown.totalSuccessFee,
					retainerTotal: breakdown.totalRetainer,
					totalFees: breakdown.totalFees,
					customRates: inputs.useCustomRates ? {
						rate1: inputs.rate1,
						rate2: inputs.rate2,
						rate3: inputs.rate3,
						rate4: inputs.rate4,
					} : undefined,
				},
			});
			router.refresh();
			toast.success("Calcul sauvegarde", {
				description: `Honoraires de ${formatCurrency(breakdown.totalFees)} k€ pour ${inputs.clientName || "client sans nom"}`,
			});
		} catch (error) {
			console.error("Error saving fee calculation:", error);
			toast.error("Erreur de sauvegarde", {
				description: "Impossible de sauvegarder le calcul. Veuillez reessayer.",
			});
		} finally {
			setIsSaving(false);
		}
	}, [isSaving, inputs, breakdown, router]);

	const handleExportPDF = useCallback(() => {
		toast.info("Export en cours...", {
			description: "La fenetre d'impression va s'ouvrir",
		});
		window.print();
	}, []);

	// Keyboard shortcuts
	useKeyboardShortcuts({
		shortcuts: createNumbersShortcuts({
			onSave: handleSave,
			onExport: handleExportPDF,
		}),
	});

	return (
		<TooltipProvider>
			<KeyboardShortcutsHelp toolName="Calculateur d'Honoraires" />
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
								<Calculator className="h-6 w-6" />
								Calculateur d&apos;Honoraires M&amp;A
							</h1>
							<p className="text-muted-foreground">
								Formule Lehman avec retainer et frais
							</p>
						</div>
					</div>
					<div className="flex items-center gap-3">
						<DealSelector toolId="fee-calculator" compact />
						<CrossToolLinks currentTool="fee-calculator" variant="compact" />
						<div className="flex gap-2">
							<Button variant="outline" onClick={handleReset}>
								<RotateCcw className="h-4 w-4 mr-2" />
								Reinitialiser
							</Button>
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
							<Button onClick={handleExportPDF}>
								<Download className="h-4 w-4 mr-2" />
								Exporter PDF
							</Button>
						</div>
					</div>
				</div>

				<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
					{/* Left Column - Inputs */}
					<div className="lg:col-span-2 space-y-6">
						{/* Client Info */}
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<FileText className="h-5 w-5" />
									Informations Mission
								</CardTitle>
							</CardHeader>
							<CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
								<div className="space-y-2">
									<Label>Client</Label>
									<Input
										placeholder="Nom du client"
										value={inputs.clientName}
										onChange={(e) => updateInput("clientName", e.target.value)}
									/>
								</div>
								<div className="space-y-2">
									<Label>Type de mission</Label>
									<Select
										value={inputs.missionType}
										onValueChange={(v) => updateInput("missionType", v)}
									>
										<SelectTrigger>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											{missionTypes.map((type) => (
												<SelectItem key={type.value} value={type.value}>
													{type.label}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>
								<div className="space-y-2">
									<Label>Date</Label>
									<Input
										type="date"
										value={inputs.date}
										onChange={(e) => updateInput("date", e.target.value)}
									/>
								</div>
							</CardContent>
						</Card>

						{/* Transaction Value */}
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<Euro className="h-5 w-5" />
									Valeur de la Transaction
								</CardTitle>
								<CardDescription>
									Tous les montants en milliers d&apos;euros (k€)
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									<div className="space-y-2">
										<Label className="flex items-center gap-2">
											Valorisation entreprise
											<Tooltip>
												<TooltipTrigger>
													<Info className="h-3 w-3 text-muted-foreground" />
												</TooltipTrigger>
												<TooltipContent>
													Valeur d&apos;entreprise (EV) ou prix de cession
												</TooltipContent>
											</Tooltip>
										</Label>
										<div className="relative">
											<Input
												type="number"
												value={inputs.enterpriseValue}
												onChange={(e) =>
													updateInput("enterpriseValue", Number(e.target.value))
												}
												className="pr-12"
											/>
											<span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
												k€
											</span>
										</div>
									</div>
									<div className="space-y-2">
										<Label className="flex items-center gap-2">
											Dette reprise
											<Tooltip>
												<TooltipTrigger>
													<Info className="h-3 w-3 text-muted-foreground" />
												</TooltipTrigger>
												<TooltipContent>
													Dette nette reprise par l&apos;acquereur
												</TooltipContent>
											</Tooltip>
										</Label>
										<div className="relative">
											<Input
												type="number"
												value={inputs.debtAssumed}
												onChange={(e) =>
													updateInput("debtAssumed", Number(e.target.value))
												}
												className="pr-12"
											/>
											<span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
												k€
											</span>
										</div>
									</div>
									<div className="space-y-2">
										<Label className="flex items-center gap-2">
											Tresorerie disponible
											<Tooltip>
												<TooltipTrigger>
													<Info className="h-3 w-3 text-muted-foreground" />
												</TooltipTrigger>
												<TooltipContent>
													Cash disponible (deduit de la valeur)
												</TooltipContent>
											</Tooltip>
										</Label>
										<div className="relative">
											<Input
												type="number"
												value={inputs.cashAvailable}
												onChange={(e) =>
													updateInput("cashAvailable", Number(e.target.value))
												}
												className="pr-12"
											/>
											<span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
												k€
											</span>
										</div>
									</div>
									<div className="space-y-2">
										<Label>Ajustements</Label>
										<div className="relative">
											<Input
												type="number"
												value={inputs.adjustments}
												onChange={(e) =>
													updateInput("adjustments", Number(e.target.value))
												}
												className="pr-12"
											/>
											<span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
												k€
											</span>
										</div>
									</div>
								</div>
								<Separator />
								<div className="flex items-center justify-between bg-muted/50 p-4 rounded-lg">
									<span className="font-medium">
										Valeur totale de la transaction
									</span>
									<span className="text-2xl font-bold text-emerald-600">
										{formatCurrency(breakdown.transactionValue)} k€
									</span>
								</div>
							</CardContent>
						</Card>

						{/* Retainer */}
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<Calendar className="h-5 w-5" />
									Retainer
								</CardTitle>
							</CardHeader>
							<CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<div className="space-y-2">
									<Label>Retainer mensuel</Label>
									<div className="relative">
										<Input
											type="number"
											value={inputs.monthlyRetainer}
											onChange={(e) =>
												updateInput("monthlyRetainer", Number(e.target.value))
											}
											className="pr-12"
										/>
										<span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
											k€
										</span>
									</div>
								</div>
								<div className="space-y-2">
									<Label>Nombre de mois</Label>
									<Input
										type="number"
										value={inputs.retainerMonths}
										onChange={(e) =>
											updateInput("retainerMonths", Number(e.target.value))
										}
									/>
								</div>
							</CardContent>
						</Card>

						{/* Success Fee Rates */}
						<Card>
							<CardHeader>
								<div className="flex items-center justify-between">
									<CardTitle className="flex items-center gap-2">
										<Percent className="h-5 w-5" />
										Success Fee (Formule Lehman)
									</CardTitle>
									<div className="flex items-center gap-2">
										<Label htmlFor="customRates" className="text-sm">
											Taux personnalises
										</Label>
										<input
											id="customRates"
											type="checkbox"
											checked={inputs.useCustomRates}
											onChange={(e) =>
												updateInput("useCustomRates", e.target.checked)
											}
											className="h-4 w-4"
										/>
									</div>
								</div>
								<CardDescription>
									Double Lehman modifie : taux degressifs par tranche de 1M€
								</CardDescription>
							</CardHeader>
							<CardContent>
								<div className="grid grid-cols-4 gap-4">
									{[
										{ label: "1er M€", key: "rate1" as const, default: 5 },
										{ label: "2eme M€", key: "rate2" as const, default: 4 },
										{ label: "3eme M€", key: "rate3" as const, default: 3 },
										{ label: "Au-dela", key: "rate4" as const, default: 2 },
									].map((rate) => (
										<div key={rate.key} className="space-y-2">
											<Label className="text-center block">{rate.label}</Label>
											<div className="relative">
												<Input
													type="number"
													step="0.1"
													value={inputs[rate.key]}
													onChange={(e) =>
														updateInput(rate.key, Number(e.target.value))
													}
													disabled={!inputs.useCustomRates}
													className="pr-8 text-center"
												/>
												<span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
													%
												</span>
											</div>
										</div>
									))}
								</div>
							</CardContent>
						</Card>

						{/* Expenses */}
						<Card>
							<CardHeader>
								<CardTitle>Frais</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="space-y-2">
									<Label>Frais estimes (deplacements, experts, etc.)</Label>
									<div className="relative">
										<Input
											type="number"
											value={inputs.estimatedExpenses}
											onChange={(e) =>
												updateInput("estimatedExpenses", Number(e.target.value))
											}
											className="pr-12"
										/>
										<span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
											k€
										</span>
									</div>
								</div>
							</CardContent>
						</Card>
					</div>

					{/* Right Column - Results */}
					<div className="space-y-6">
						{/* Summary Card */}
						<Card className="border-emerald-500/50 bg-gradient-to-br from-emerald-500/5 to-teal-500/5">
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<TrendingUp className="h-5 w-5 text-emerald-500" />
									Synthese des Honoraires
								</CardTitle>
							</CardHeader>
							<CardContent className="space-y-6">
								{/* Total */}
								<div className="text-center p-6 bg-white dark:bg-gray-900 rounded-lg shadow-sm">
									<p className="text-sm text-muted-foreground mb-1">
										Total Honoraires
									</p>
									<p className="text-4xl font-bold text-emerald-600">
										{formatCurrency(breakdown.totalFees)} k€
									</p>
									<Badge variant="secondary" className="mt-2">
										{formatPercent(breakdown.feePercentage)}% de la transaction
									</Badge>
								</div>

								<Separator />

								{/* Breakdown */}
								<div className="space-y-3">
									<div className="flex justify-between">
										<span className="text-muted-foreground">Retainer</span>
										<span className="font-medium">
											{formatCurrency(breakdown.totalRetainer)} k€
										</span>
									</div>
									<div className="flex justify-between">
										<span className="text-muted-foreground">Success Fee</span>
										<span className="font-medium">
											{formatCurrency(breakdown.totalSuccessFee)} k€
										</span>
									</div>
									<div className="flex justify-between">
										<span className="text-muted-foreground">Frais</span>
										<span className="font-medium">
											{formatCurrency(breakdown.expenses)} k€
										</span>
									</div>
								</div>
							</CardContent>
						</Card>

						{/* Success Fee Detail */}
						<Card>
							<CardHeader>
								<CardTitle className="text-lg">Detail Success Fee</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="space-y-3">
									{[
										{
											label: "1er M€",
											rate: inputs.useCustomRates ? inputs.rate1 : 5,
											base: breakdown.tranche1Base,
											fee: breakdown.tranche1Fee,
										},
										{
											label: "2eme M€",
											rate: inputs.useCustomRates ? inputs.rate2 : 4,
											base: breakdown.tranche2Base,
											fee: breakdown.tranche2Fee,
										},
										{
											label: "3eme M€",
											rate: inputs.useCustomRates ? inputs.rate3 : 3,
											base: breakdown.tranche3Base,
											fee: breakdown.tranche3Fee,
										},
										{
											label: "Au-dela",
											rate: inputs.useCustomRates ? inputs.rate4 : 2,
											base: breakdown.tranche4Base,
											fee: breakdown.tranche4Fee,
										},
									].map((tranche) => (
										<div
											key={tranche.label}
											className={`flex items-center justify-between p-2 rounded ${
												tranche.base > 0 ? "bg-muted/50" : "opacity-50"
											}`}
										>
											<div className="flex items-center gap-2">
												<Badge variant="outline" className="text-xs">
													{tranche.rate}%
												</Badge>
												<span className="text-sm">{tranche.label}</span>
											</div>
											<div className="text-right">
												<p className="font-medium">
													{formatCurrency(tranche.fee)} k€
												</p>
												<p className="text-xs text-muted-foreground">
													sur {formatCurrency(tranche.base)} k€
												</p>
											</div>
										</div>
									))}
									<Separator />
									<div className="flex justify-between font-bold">
										<span>Total Success Fee</span>
										<span className="text-emerald-600">
											{formatCurrency(breakdown.totalSuccessFee)} k€
										</span>
									</div>
								</div>
							</CardContent>
						</Card>

						{/* Visual Chart */}
						<Card>
							<CardHeader>
								<CardTitle className="text-lg">Repartition</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="space-y-3">
									{[
										{
											label: "Retainer",
											value: breakdown.totalRetainer,
											color: "bg-blue-500",
										},
										{
											label: "Success Fee",
											value: breakdown.totalSuccessFee,
											color: "bg-emerald-500",
										},
										{
											label: "Frais",
											value: breakdown.expenses,
											color: "bg-amber-500",
										},
									].map((item) => {
										const percentage =
											breakdown.totalFees > 0
												? (item.value / breakdown.totalFees) * 100
												: 0;
										return (
											<div key={item.label} className="space-y-1">
												<div className="flex justify-between text-sm">
													<span>{item.label}</span>
													<span>{formatPercent(percentage)}%</span>
												</div>
												<div className="h-2 bg-muted rounded-full overflow-hidden">
													<div
														className={`h-full ${item.color} transition-all duration-500`}
														style={{ width: `${percentage}%` }}
													/>
												</div>
											</div>
										);
									})}
								</div>
							</CardContent>
						</Card>
					</div>
				</div>
			</div>
		</TooltipProvider>
	);
}
