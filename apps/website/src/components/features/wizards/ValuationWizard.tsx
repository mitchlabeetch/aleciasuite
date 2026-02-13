"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	CardDescription,
} from "@/components/ui/card";
import {
	Calculator,
	ArrowRight,
	CheckCircle2,
	Loader2,
	TrendingUp,
	AlertTriangle,
	Info as _Info,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { createLogger } from "@/lib/logger";

const log = createLogger("ValuationWizard");

type Step = "form" | "calculating" | "result" | "capture" | "submitted";

interface ValuationResult {
	low: number;
	mid: number;
	high: number;
	multiple: number;
}

// Simplified valuation multiples by sector (EBE-based) - using French terms
const sectorMultiples: Record<
	string,
	{ low: number; mid: number; high: number }
> = {
	"Technologies & logiciels": { low: 6, mid: 8, high: 12 },
	"Distribution & services B2B": { low: 4, mid: 5.5, high: 7 },
	"Distribution & services B2C": { low: 3.5, mid: 5, high: 6.5 },
	Santé: { low: 5, mid: 7, high: 10 },
	"Immobilier & construction": { low: 4, mid: 5.5, high: 7 },
	Industries: { low: 4, mid: 5, high: 6 },
	"Services financiers & assurance": { low: 5, mid: 7, high: 9 },
	Agroalimentaire: { low: 4, mid: 5.5, high: 7 },
	"Énergie & environnement": { low: 5, mid: 6.5, high: 8 },
	"Transports & logistique": { low: 4, mid: 5.5, high: 7 },
	"Médias & communication": { low: 5, mid: 6.5, high: 8 },
	"Textile & mode": { low: 3.5, mid: 4.5, high: 6 },
};

// Available sectors
const SECTORS = Object.keys(sectorMultiples);

export function ValuationWizard() {
	const t = useTranslations("Wizards.valuation");
	const _tc = useTranslations("Wizards.common");
	const [step, setStep] = useState<Step>("form");
	const [formData, setFormData] = useState({
		revenue: "",
		ebe: "", // EBE instead of EBITDA
		sector: "",
		email: "",
		company: "",
	});
	const [result, setResult] = useState<ValuationResult | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [errorMessage, setErrorMessage] = useState("");

	const formatAleciaAmount = (amount: number): string => {
		if (amount >= 1000000) {
			return `${(amount / 1000000).toFixed(1)} m€`;
		} else if (amount >= 1000) {
			return `${(amount / 1000).toFixed(0)} k€`;
		}
		return `${amount.toFixed(0)} €`;
	};

	const calculateValuation = (): ValuationResult => {
		const ebe = parseFloat(formData.ebe) * 1000; // Convert k€ to actual value
		const multiples = sectorMultiples[formData.sector] || {
			low: 4,
			mid: 5,
			high: 6,
		};

		return {
			low: ebe * multiples.low,
			mid: ebe * multiples.mid,
			high: ebe * multiples.high,
			multiple: multiples.mid,
		};
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!formData.revenue || !formData.sector) {
			toast.error(t("errorRequired"));
			return;
		}

		// If company is not profitable, skip calculation and go directly to capture
		if (formData.ebe === "not-profitable") {
			setStep("capture");
			return;
		}

		if (!formData.ebe) {
			toast.error(t("errorRequired"));
			return;
		}

		setStep("calculating");
		setErrorMessage("");

		// Simulate calculation delay for effect
		await new Promise((resolve) => setTimeout(resolve, 2000));

		const valuation = calculateValuation();
		setResult(valuation);
		setStep("result");
	};

	const handleCapture = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsSubmitting(true);
		setErrorMessage("");

		try {
			// Save lead to Convex with all wizard inputs + email
			const leadData = {
				type: "valuation",
				companyName: formData.company || "Non renseigné",
				email: formData.email,
				revenue: formData.revenue,
				ebe: formData.ebe,
				sector: formData.sector,
				valuation: result,
				source: "website_valuation_wizard",
				createdAt: new Date().toISOString(),
			};

			const response = await fetch("/api/leads", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(leadData),
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || "Erreur lors de la sauvegarde");
			}

			toast.success(t("successTitle"));
			setStep("submitted");
		} catch (error: unknown) {
			log.error("Lead submission error:", error);
			const message =
				error instanceof Error ? error.message : "Une erreur s'est produite";
			setErrorMessage(message);
			toast.error(t("errorSubmit"));
		} finally {
			setIsSubmitting(false);
		}
	};

	const resetWizard = () => {
		setStep("form");
		setFormData({
			revenue: "",
			ebe: "",
			sector: "",
			email: "",
			company: "",
		});
		setResult(null);
		setErrorMessage("");
	};

	if (step === "submitted") {
		return (
			<Card className="max-w-lg mx-auto">
				<CardContent className="p-8 text-center">
					<motion.div
						initial={{ scale: 0.8, opacity: 0 }}
						animate={{ scale: 1, opacity: 1 }}
						className="space-y-6"
					>
						<div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-900/20 flex items-center justify-center">
							<CheckCircle2 className="w-8 h-8 text-emerald-600" />
						</div>
						<div>
							<h3 className="text-xl font-semibold mb-2">
								{t("successTitle") || "Demande envoyée !"}
							</h3>
							<p className="text-muted-foreground">
								{formData.ebe === "not-profitable"
									? "Nos experts vont analyser votre projet et vous contacter rapidement pour discuter des options de valorisation adaptées."
									: t("successDesc") ||
										"Vous recevrez votre estimation détaillée par email sous quelques minutes."}
							</p>
						</div>
						<Button onClick={resetWizard} variant="outline">
							Nouvelle estimation
						</Button>
					</motion.div>
				</CardContent>
			</Card>
		);
	}

	if (step === "capture") {
		return (
			<Card className="max-w-lg mx-auto">
				<CardHeader className="text-center pb-4">
					<CardTitle className="flex items-center justify-center gap-2 text-xl">
						<Calculator className="w-5 h-5 text-[var(--accent)]" />
						{formData.ebe === "not-profitable"
							? "Entreprise non rentable"
							: t("title") || "Estimation de valorisation"}
					</CardTitle>
					<CardDescription>
						{formData.ebe === "not-profitable"
							? "Nos experts vont analyser votre projet et vous contacter pour une valorisation adaptée"
							: "Obtenez une première estimation de la valeur de votre entreprise"}
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-6">
					<motion.div
						initial={{ scale: 0.8, opacity: 0 }}
						animate={{ scale: 1, opacity: 1 }}
						className="space-y-6"
					>
						{formData.ebe === "not-profitable" && (
							<div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800/50 rounded-lg p-4">
								<div className="flex gap-3">
									<AlertTriangle className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
									<div className="text-sm">
										<p className="font-medium text-blue-800 dark:text-blue-300 mb-1">
											Valorisation spécialisée
										</p>
										<p className="text-blue-700 dark:text-blue-400 text-xs leading-relaxed">
											Pour les entreprises non rentables, nous utilisons des
											méthodes de valorisation alternatives (comparables, DCF
											ajusté, etc.). Laissez-nous vos coordonnées pour une
											analyse personnalisée.
										</p>
									</div>
								</div>
							</div>
						)}

						<form onSubmit={handleCapture} className="space-y-4">
							<div className="space-y-2">
								<Label htmlFor="company">
									{t("companyLabel")} {t("companyOptional")}
								</Label>
								<Input
									id="company"
									type="text"
									value={formData.company}
									onChange={(e) =>
										setFormData({ ...formData, company: e.target.value })
									}
									placeholder={t("companyPlaceholder")}
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="email">{t("emailLabel")}</Label>
								<Input
									id="email"
									type="email"
									value={formData.email}
									onChange={(e) =>
										setFormData({ ...formData, email: e.target.value })
									}
									placeholder={t("emailPlaceholder")}
									required
								/>
							</div>
							{errorMessage && (
								<p className="text-sm text-red-500">{errorMessage}</p>
							)}
							<div className="flex gap-3">
								<Button
									type="button"
									variant="outline"
									onClick={resetWizard}
									className="flex-1"
								>
									{t("newEstimationButton")}
								</Button>
								<Button
									type="submit"
									disabled={isSubmitting || !formData.email}
									className="flex-1"
								>
									{isSubmitting ? (
										<>
											<Loader2 className="w-4 h-4 animate-spin mr-2" />
											{t("sendingButton")}
										</>
									) : (
										"Être contacté"
									)}
								</Button>
							</div>
						</form>
					</motion.div>
				</CardContent>
			</Card>
		);
	}

	return (
		<Card className="max-w-lg mx-auto">
			<CardHeader className="text-center pb-4">
				<CardTitle className="flex items-center justify-center gap-2 text-xl">
					<Calculator className="w-5 h-5 text-[var(--accent)]" />
					{t("title") || "Estimation de valorisation"}
				</CardTitle>
				<CardDescription>
					{t("subtitle") ||
						"Obtenez une première estimation de la valeur de votre entreprise"}
				</CardDescription>
			</CardHeader>

			<CardContent className="space-y-6">
				<AnimatePresence mode="wait">
					{step === "form" && (
						<motion.form
							key="form"
							initial={{ opacity: 0, x: 20 }}
							animate={{ opacity: 1, x: 0 }}
							exit={{ opacity: 0, x: -20 }}
							onSubmit={handleSubmit}
							className="space-y-6"
						>
							<div className="space-y-2">
								<Label htmlFor="revenue">{t("revenueLabel")} *</Label>
								<div className="relative">
									<Input
										id="revenue"
										type="number"
										step="any"
										min="0"
										value={formData.revenue}
										onChange={(e) =>
											setFormData({ ...formData, revenue: e.target.value })
										}
										placeholder={t("revenuePlaceholder")}
										className="pr-8"
										required
									/>
									<span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
										k€
									</span>
								</div>
								<p className="text-xs text-muted-foreground">
									{t("revenueHelp")}
								</p>
							</div>

							<div className="space-y-2">
								<Label htmlFor="ebe">{t("ebeLabel")} *</Label>
								<div className="space-y-3">
									<div className="relative">
										<Input
											id="ebe"
											type="number"
											step="any"
											min="0"
											value={formData.ebe}
											onChange={(e) =>
												setFormData({ ...formData, ebe: e.target.value })
											}
											placeholder={t("ebePlaceholder")}
											className="pr-8"
											required
											disabled={formData.ebe === "not-profitable"}
										/>
										<span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
											k€
										</span>
									</div>

									<div className="flex items-center space-x-2">
										<input
											type="checkbox"
											id="not-profitable"
											checked={formData.ebe === "not-profitable"}
											onChange={(e) => {
												if (e.target.checked) {
													setFormData({ ...formData, ebe: "not-profitable" });
												} else {
													setFormData({ ...formData, ebe: "" });
												}
											}}
											className="rounded border-gray-300"
										/>
										<Label
											htmlFor="not-profitable"
											className="text-sm font-normal"
										>
											Je ne suis pas rentable
										</Label>
									</div>
								</div>
								<p className="text-xs text-muted-foreground">{t("ebeHint")}</p>
							</div>

							<div className="space-y-2">
								<Label htmlFor="sector">{t("sectorLabel")} *</Label>
								<Select
									value={formData.sector}
									onValueChange={(value: string) =>
										setFormData({ ...formData, sector: value })
									}
									required
								>
									<SelectTrigger>
										<SelectValue placeholder={t("sectorPlaceholder")} />
									</SelectTrigger>
									<SelectContent>
										{SECTORS.map((sector) => (
											<SelectItem key={sector} value={sector}>
												{sector}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>

							<Button type="submit" className="w-full" size="lg">
								{t("calculateButton")}
								<ArrowRight className="w-4 h-4 ml-2" />
							</Button>
						</motion.form>
					)}

					{step === "calculating" && (
						<motion.div
							key="calculating"
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							className="py-12 text-center"
						>
							<Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-[var(--accent)]" />
							<p className="text-muted-foreground">{t("calculating")}</p>
						</motion.div>
					)}

					{step === "result" && result && (
						<motion.div
							key="result"
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0, y: -20 }}
							className="space-y-6"
						>
							{/* Result Display */}
							<div className="bg-gradient-to-br from-[var(--accent)] to-[var(--accent)]/80 rounded-xl p-6 text-white text-center">
								<TrendingUp className="w-8 h-8 mx-auto mb-3 opacity-90" />
								<p className="text-sm opacity-90 mb-2">{t("resultTitle")}</p>
								<p className="text-3xl font-bold mb-1">
									{formatAleciaAmount(result.low)} -{" "}
									{formatAleciaAmount(result.high)}
								</p>
								<p className="text-sm opacity-80">
									{t("resultMedian")} : {formatAleciaAmount(result.mid)}
								</p>
							</div>

							{/* Calculation Details */}
							<div className="bg-secondary rounded-lg p-4 space-y-2 text-sm">
								<div className="flex justify-between">
									<span className="text-muted-foreground">
										{t("detailsRevenue")}
									</span>
									<span className="font-medium">{formData.revenue} k€</span>
								</div>
								<div className="flex justify-between">
									<span className="text-muted-foreground">
										{t("detailsEbe")}
									</span>
									<span className="font-medium">{formData.ebe} k€</span>
								</div>
								<div className="flex justify-between">
									<span className="text-muted-foreground">
										{t("detailsSector")}
									</span>
									<span className="font-medium">{formData.sector}</span>
								</div>
								<div className="flex justify-between border-t border-[var(--border)] pt-2">
									<span className="text-muted-foreground">
										{t("detailsMultiple")}
									</span>
									<span className="font-medium">{result.multiple}x</span>
								</div>
							</div>

							{/* Legal Disclaimer */}
							<div className="bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-800/50 rounded-lg p-4">
								<div className="flex gap-3">
									<AlertTriangle className="w-5 h-5 text-orange-600 dark:text-orange-400 shrink-0 mt-0.5" />
									<div className="text-sm">
										<p className="font-medium text-orange-800 dark:text-orange-300 mb-1">
											{t("disclaimerTitle")}
										</p>
										<p className="text-orange-700 dark:text-orange-400 text-xs leading-relaxed">
											{t("disclaimerText")}
										</p>
									</div>
								</div>
							</div>

							{/* Methodology Explanation */}
							<div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800/50 rounded-lg p-4">
								<div className="text-sm">
									<p className="font-medium text-blue-800 dark:text-blue-300 mb-2">
										Méthodologie de valorisation
									</p>
									<p className="text-blue-700 dark:text-blue-400 text-xs leading-relaxed mb-2">
										Notre estimation repose sur la méthode des multiples
										sectoriels d&apos;EBE. Cette approche compare votre
										entreprise à des transactions similaires dans votre secteur
										d&apos;activité.
									</p>
									<p className="text-blue-700 dark:text-blue-400 text-xs leading-relaxed">
										<strong>Facteurs pris en compte :</strong> Secteur
										d&apos;activité, rentabilité (EBE), tendances de marché.
										<strong> Non inclus dans cette estimation :</strong> Actifs
										immobiliers, trésorerie excédentaire, synergies
										potentielles, position concurrentielle détaillée.
									</p>
								</div>
							</div>

							{/* Next Steps */}
							<div className="bg-[var(--accent)]/5 border border-[var(--accent)]/20 rounded-lg p-4">
								<div className="text-sm">
									<p className="font-semibold text-[var(--foreground)] mb-3">
										Prochaines étapes recommandées
									</p>
									<ul className="space-y-2 text-muted-foreground">
										<li className="flex gap-2">
											<span className="text-[var(--accent)] font-bold">1.</span>
											<span>
												Consultation gratuite avec un de nos associés pour
												affiner la valorisation
											</span>
										</li>
										<li className="flex gap-2">
											<span className="text-[var(--accent)] font-bold">2.</span>
											<span>
												Analyse approfondie de vos actifs et de votre
												positionnement
											</span>
										</li>
										<li className="flex gap-2">
											<span className="text-[var(--accent)] font-bold">3.</span>
											<span>
												Élaboration d&apos;une stratégie de cession ou de levée
												de fonds sur-mesure
											</span>
										</li>
									</ul>
								</div>
							</div>

							{/* Email Capture */}
							<form onSubmit={handleCapture} className="space-y-4">
								<div className="space-y-2">
									<Label htmlFor="company">
										{t("companyLabel")} {t("companyOptional")}
									</Label>
									<Input
										id="company"
										type="text"
										value={formData.company}
										onChange={(e) =>
											setFormData({ ...formData, company: e.target.value })
										}
										placeholder={t("companyPlaceholder")}
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="email">{t("emailLabel")}</Label>
									<Input
										id="email"
										type="email"
										value={formData.email}
										onChange={(e) =>
											setFormData({ ...formData, email: e.target.value })
										}
										placeholder={t("emailPlaceholder")}
										required
									/>
								</div>
								{errorMessage && (
									<p className="text-sm text-red-500">{errorMessage}</p>
								)}
								<div className="flex gap-3">
									<Button
										type="button"
										variant="outline"
										onClick={resetWizard}
										className="flex-1"
									>
										{t("newEstimationButton")}
									</Button>
									<Button
										type="submit"
										disabled={isSubmitting || !formData.email}
										className="flex-1"
									>
										{isSubmitting ? (
											<>
												<Loader2 className="w-4 h-4 animate-spin mr-2" />
												{t("sendingButton")}
											</>
										) : (
											t("receiveEmailButton")
										)}
									</Button>
								</div>
							</form>
						</motion.div>
					)}
				</AnimatePresence>
			</CardContent>
		</Card>
	);
}
