"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import {
	ArrowLeft,
	ArrowRight,
	Check,
	Target,
	Building2,
	User,
	Send,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { createLogger } from "@/lib/logger";

const log = createLogger("BuyWizard");

interface BuyerFormData {
	// Step 1 - Buyer Profile
	buyerType: string;
	companyName: string;
	investmentCapacity: string;

	// Step 2 - Acquisition Criteria
	targetSectors: string[];
	targetRegions: string[];
	revenueMin: number;
	revenueMax: number;
	ebeMin: number; // EBE instead of EBITDA

	// Step 3 - Contact Info
	firstName: string;
	lastName: string;
	email: string;
	phone: string;
	role: string;
	message: string;
}

interface FieldErrors {
	[key: string]: string;
}

const INITIAL_DATA: BuyerFormData = {
	buyerType: "",
	companyName: "",
	investmentCapacity: "",
	targetSectors: [],
	targetRegions: [],
	revenueMin: 1000, // In k€
	revenueMax: 20000, // In k€
	ebeMin: 0, // In k€
	firstName: "",
	lastName: "",
	email: "",
	phone: "",
	role: "",
	message: "",
};

// French business sectors
const SECTORS = [
	"Technologies & logiciels",
	"Distribution & services B2B",
	"Distribution & services B2C",
	"Santé",
	"Immobilier & construction",
	"Industries",
	"Services financiers & assurance",
	"Agroalimentaire",
	"Énergie & environnement",
	"Transports & logistique",
	"Médias & communication",
	"Textile & mode",
	"Commerce de détail",
	"Hôtellerie & restauration",
	"Services aux entreprises",
];

// French regions
const REGIONS = [
	"Île-de-France",
	"Auvergne-Rhône-Alpes",
	"Provence-Alpes-Côte d'Azur",
	"Occitanie",
	"Nouvelle-Aquitaine",
	"Grand Est",
	"Hauts-de-France",
	"Normandie",
	"Pays de la Loire",
	"Bretagne",
	"Bourgogne-Franche-Comté",
	"Centre-Val de Loire",
	"Corse",
	"International",
];

export function BuyWizard() {
	const t = useTranslations("Wizards.buy");
	const [step, setStep] = useState(1);
	const [data, setData] = useState<BuyerFormData>(INITIAL_DATA);
	const [submitting, setSubmitting] = useState(false);
	const [submitted, setSubmitted] = useState(false);
	const [errors, setErrors] = useState<FieldErrors>({});

	const totalSteps = 3;
	const progress = (step / totalSteps) * 100;

	// Email validation
	const validateEmail = (email: string): boolean => {
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		return emailRegex.test(email);
	};

	// Field validation
	const validateField = (field: keyof BuyerFormData, value: any): string => {
		switch (field) {
			case "buyerType":
				return !value ? "Veuillez sélectionner un type d'acquéreur" : "";
			case "companyName":
				return !value ? "Le nom de la structure est requis" : "";
			case "investmentCapacity":
				return !value ? "La capacité d'investissement est requise" : "";
			case "targetSectors":
				return value.length === 0
					? "Veuillez sélectionner au moins un secteur cible"
					: "";
			case "firstName":
				return !value ? "Le prénom est requis" : "";
			case "lastName":
				return !value ? "Le nom est requis" : "";
			case "email":
				if (!value) return "L'email est requis";
				if (!validateEmail(value)) return "Veuillez saisir un email valide";
				return "";
			default:
				return "";
		}
	};

	const updateField = <K extends keyof BuyerFormData>(
		field: K,
		value: BuyerFormData[K],
	) => {
		setData((prev) => ({ ...prev, [field]: value }));
		// Clear error when field is updated
		if (errors[field as string]) {
			setErrors((prev) => {
				const newErrors = { ...prev };
				delete newErrors[field as string];
				return newErrors;
			});
		}
	};

	const toggleArray = (
		field: "targetSectors" | "targetRegions",
		value: string,
	) => {
		setData((prev) => ({
			...prev,
			[field]: prev[field].includes(value)
				? prev[field].filter((v) => v !== value)
				: [...prev[field], value],
		}));
	};

	const formatAleciaAmount = (amount: number): string => {
		if (amount >= 1000) {
			return `${(amount / 1000).toFixed(amount % 1000 === 0 ? 0 : 1)} m€`;
		}
		return `${amount} k€`;
	};

	const canProceed = () => {
		switch (step) {
			case 1:
				return data.buyerType && data.companyName && data.investmentCapacity;
			case 2:
				return data.targetSectors.length > 0;
			case 3:
				return data.firstName && data.lastName && data.email;
			default:
				return false;
		}
	};

	const handleSubmit = async () => {
		setSubmitting(true);
		try {
			// Submit to Convex Lead database
			const leadData = {
				type: "buy",
				buyerType: data.buyerType,
				companyName: data.companyName,
				firstName: data.firstName,
				lastName: data.lastName,
				email: data.email,
				phone: data.phone,
				role: data.role,
				investmentCapacity: data.investmentCapacity,
				targetSectors: data.targetSectors,
				targetRegions: data.targetRegions,
				revenueMin: data.revenueMin,
				revenueMax: data.revenueMax,
				ebeMin: data.ebeMin,
				message: data.message,
				source: "website_buy_wizard",
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
			setSubmitted(true);
		} catch (error: unknown) {
			log.error("Lead submission error:", error);
			toast.error(t("errorSubmit") || "Erreur lors de l'envoi");
		} finally {
			setSubmitting(false);
		}
	};

	if (submitted) {
		return (
			<Card className="bg-[var(--card)] border-[var(--border)]">
				<CardContent className="p-8 text-center">
					<div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
						<Check className="w-8 h-8 text-emerald-500" />
					</div>
					<h3 className="font-playfair text-2xl font-semibold mb-2 text-[var(--foreground)]">
						{t("successTitle")}
					</h3>
					<p className="text-muted-foreground">{t("successDesc")}</p>
				</CardContent>
			</Card>
		);
	}

	const BUYER_TYPES = [
		{
			value: "strategic",
			label: t("buyerTypeStrategic"),
			desc: t("buyerTypeStrategicDesc"),
		},
		{ value: "pe", label: t("buyerTypePE"), desc: t("buyerTypePEDesc") },
		{
			value: "family-office",
			label: t("buyerTypeFamilyOffice"),
			desc: t("buyerTypeFamilyOfficeDesc"),
		},
		{
			value: "individual",
			label: t("buyerTypeIndividual"),
			desc: t("buyerTypeIndividualDesc"),
		},
		{ value: "mbi", label: t("buyerTypeMBI"), desc: t("buyerTypeMBIDesc") },
	];

	const _INVESTMENT_CAPACITIES = [
		{ value: "500k-2m", label: t("capacity500kto2m") },
		{ value: "2m-10m", label: t("capacity2to10m") },
		{ value: "10m-30m", label: t("capacity10to30m") },
		{ value: "30m+", label: t("capacity30plus") },
	];

	return (
		<Card className="bg-[var(--card)] border-[var(--border)] max-w-2xl mx-auto">
			<CardHeader>
				<div className="flex items-center justify-between mb-4">
					<CardTitle className="text-[var(--foreground)]">
						{t("title")}
					</CardTitle>
					<span className="text-sm text-muted-foreground">
						{t("stepLabel")} {step}/{totalSteps}
					</span>
				</div>
				<Progress value={progress} className="h-2" />
			</CardHeader>
			<CardContent>
				<AnimatePresence mode="wait">
					{/* Step 1 - Buyer Profile */}
					{step === 1 && (
						<motion.div
							key="step1"
							initial={{ opacity: 0, x: 20 }}
							animate={{ opacity: 1, x: 0 }}
							exit={{ opacity: 0, x: -20 }}
							className="space-y-6"
						>
							<div className="flex items-center gap-3 mb-6">
								<div className="w-10 h-10 rounded-lg bg-[var(--accent)]/10 flex items-center justify-center">
									<Building2 className="w-5 h-5 text-[var(--accent)]" />
								</div>
								<div>
									<h4 className="font-semibold text-[var(--foreground)]">
										{t("step1Title")}
									</h4>
									<p className="text-sm text-muted-foreground">
										{t("step1Desc")}
									</p>
								</div>
							</div>

							<div className="space-y-4">
								<div className="space-y-2">
									<Label>{t("buyerType")} *</Label>
									<div className="space-y-2">
										{BUYER_TYPES.map((type) => (
											<button
												key={type.value}
												type="button"
												onClick={() => updateField("buyerType", type.value)}
												className={`w-full p-4 rounded-lg border text-left transition-colors ${
													data.buyerType === type.value
														? "border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--foreground)]"
														: "border-[var(--border)] hover:border-[var(--accent)]/50 text-muted-foreground"
												}`}
											>
												<div className="font-medium text-[var(--foreground)]">
													{type.label}
												</div>
												<div className="text-sm text-muted-foreground mt-1">
													{type.desc}
												</div>
											</button>
										))}
									</div>
								</div>

								<div className="space-y-2">
									<Label htmlFor="companyName">{t("companyName")} *</Label>
									<Input
										id="companyName"
										value={data.companyName}
										onChange={(e) => updateField("companyName", e.target.value)}
										placeholder={t("companyNamePlaceholder")}
									/>
								</div>

								<div className="space-y-2">
									<Label htmlFor="investmentCapacity">
										{t("investmentCapacity")} *
									</Label>
									<div className="relative">
										<Input
											id="investmentCapacity"
											type="number"
											value={data.investmentCapacity}
											onChange={(e) =>
												updateField("investmentCapacity", e.target.value)
											}
											placeholder={t("investmentCapacityPlaceholder")}
											className="pr-12"
										/>
										<span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
											k€
										</span>
									</div>
									<p className="text-xs text-muted-foreground">
										Montant disponible pour l&apos;investissement
									</p>
								</div>
							</div>
						</motion.div>
					)}

					{/* Step 2 - Acquisition Criteria */}
					{step === 2 && (
						<motion.div
							key="step2"
							initial={{ opacity: 0, x: 20 }}
							animate={{ opacity: 1, x: 0 }}
							exit={{ opacity: 0, x: -20 }}
							className="space-y-6"
						>
							<div className="flex items-center gap-3 mb-6">
								<div className="w-10 h-10 rounded-lg bg-[var(--accent)]/10 flex items-center justify-center">
									<Target className="w-5 h-5 text-[var(--accent)]" />
								</div>
								<div>
									<h4 className="font-semibold text-[var(--foreground)]">
										{t("step2Title")}
									</h4>
									<p className="text-sm text-muted-foreground">
										{t("step2Desc")}
									</p>
								</div>
							</div>

							<div className="space-y-6">
								<div className="space-y-2">
									<Label>{t("targetSectors")} *</Label>
									<p className="text-xs text-muted-foreground mb-3">
										{t("sectorsSelectedCount", {
											count: data.targetSectors.length,
										})}
									</p>
									<div className="grid md:grid-cols-2 gap-2 max-h-48 overflow-y-auto">
										{SECTORS.map((sector) => (
											<button
												key={sector}
												type="button"
												onClick={() => toggleArray("targetSectors", sector)}
												className={`p-2 rounded-lg border text-sm text-left transition-colors ${
													data.targetSectors.includes(sector)
														? "border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--foreground)]"
														: "border-[var(--border)] hover:border-[var(--accent)]/50 text-muted-foreground"
												}`}
											>
												{sector}
											</button>
										))}
									</div>
								</div>

								<div className="space-y-2">
									<Label>{t("targetRegions")}</Label>
									<div className="grid md:grid-cols-3 gap-2 max-h-32 overflow-y-auto">
										{REGIONS.map((region) => (
											<button
												key={region}
												type="button"
												onClick={() => toggleArray("targetRegions", region)}
												className={`p-2 rounded-lg border text-xs text-left transition-colors ${
													data.targetRegions.includes(region)
														? "border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--foreground)]"
														: "border-[var(--border)] hover:border-[var(--accent)]/50 text-muted-foreground"
												}`}
											>
												{region}
											</button>
										))}
									</div>
								</div>

								<div className="space-y-4">
									<div className="space-y-2">
										<div className="flex justify-between items-center">
											<Label>{t("revenueRangeTarget")}</Label>
											<span className="text-sm font-medium text-[var(--accent)]">
												{formatAleciaAmount(data.revenueMin)} -{" "}
												{formatAleciaAmount(data.revenueMax)}
											</span>
										</div>
										<div className="px-2">
											<Slider
												value={[data.revenueMin, data.revenueMax]}
												onValueChange={([min, max]) => {
													updateField("revenueMin", min);
													updateField("revenueMax", max);
												}}
												min={1000}
												max={50000}
												step={1000}
												className="w-full"
											/>
											<div className="flex justify-between text-xs text-muted-foreground mt-1">
												<span>1 m€</span>
												<span>50 m€+</span>
											</div>
										</div>
									</div>

									<div className="space-y-2">
										<Label>{t("ebeMin")}</Label>
										<Select
											value={String(data.ebeMin)}
											onValueChange={(value: string) =>
												updateField("ebeMin", parseInt(value))
											}
										>
											<SelectTrigger>
												<SelectValue placeholder="Sélectionnez l'EBE minimum" />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="0">0 €</SelectItem>
												<SelectItem value="500">500 k€</SelectItem>
												<SelectItem value="1000">1 m€</SelectItem>
												<SelectItem value="2000">2 m€</SelectItem>
												<SelectItem value="3000">3 m€</SelectItem>
												<SelectItem value="4000">4 m€</SelectItem>
												<SelectItem value="5000">5 m€+</SelectItem>
											</SelectContent>
										</Select>
									</div>
								</div>
							</div>
						</motion.div>
					)}

					{/* Step 3 - Contact Info */}
					{step === 3 && (
						<motion.div
							key="step3"
							initial={{ opacity: 0, x: 20 }}
							animate={{ opacity: 1, x: 0 }}
							exit={{ opacity: 0, x: -20 }}
							className="space-y-6"
						>
							<div className="flex items-center gap-3 mb-6">
								<div className="w-10 h-10 rounded-lg bg-[var(--accent)]/10 flex items-center justify-center">
									<User className="w-5 h-5 text-[var(--accent)]" />
								</div>
								<div>
									<h4 className="font-semibold text-[var(--foreground)]">
										{t("step3Title")}
									</h4>
									<p className="text-sm text-muted-foreground">
										{t("step3Desc")}
									</p>
								</div>
							</div>

							<div className="space-y-4">
								<div className="grid md:grid-cols-2 gap-4">
									<div className="space-y-2">
										<Label htmlFor="firstName">{t("firstName")} *</Label>
										<Input
											id="firstName"
											value={data.firstName}
											onChange={(e) => updateField("firstName", e.target.value)}
											placeholder={t("firstNamePlaceholder")}
										/>
									</div>
									<div className="space-y-2">
										<Label htmlFor="lastName">{t("lastName")} *</Label>
										<Input
											id="lastName"
											value={data.lastName}
											onChange={(e) => updateField("lastName", e.target.value)}
											placeholder={t("lastNamePlaceholder")}
										/>
									</div>
								</div>

								<div className="grid md:grid-cols-2 gap-4">
									<div className="space-y-2">
										<Label htmlFor="email">{t("email")} *</Label>
										<Input
											id="email"
											type="email"
											value={data.email}
											onChange={(e) => updateField("email", e.target.value)}
											onBlur={() => {
												const error = validateField("email", data.email);
												if (error)
													setErrors((prev) => ({ ...prev, email: error }));
											}}
											placeholder={t("emailPlaceholder")}
											aria-invalid={!!errors.email}
											aria-describedby={
												errors.email ? "email-error" : undefined
											}
											className={errors.email ? "border-red-500" : ""}
										/>
										{errors.email && (
											<p id="email-error" className="text-sm text-red-500">
												{errors.email}
											</p>
										)}
									</div>
									<div className="space-y-2">
										<Label htmlFor="phone">{t("phone")}</Label>
										<Input
											id="phone"
											type="tel"
											value={data.phone}
											onChange={(e) => updateField("phone", e.target.value)}
											placeholder={t("phonePlaceholder")}
										/>
									</div>
								</div>

								<div className="space-y-2">
									<Label htmlFor="role">{t("role")}</Label>
									<Input
										id="role"
										value={data.role}
										onChange={(e) => updateField("role", e.target.value)}
										placeholder={t("rolePlaceholder")}
									/>
								</div>

								<div className="space-y-2">
									<Label htmlFor="message">{t("message")}</Label>
									<Textarea
										id="message"
										value={data.message}
										onChange={(e) => updateField("message", e.target.value)}
										placeholder={t("messagePlaceholder")}
										rows={3}
									/>
								</div>
							</div>
						</motion.div>
					)}
				</AnimatePresence>

				{/* Navigation */}
				<div className="flex justify-between mt-8">
					<Button
						variant="outline"
						onClick={() => setStep(step - 1)}
						disabled={step === 1}
						className="flex items-center gap-2"
					>
						<ArrowLeft className="w-4 h-4" />
						{t("previousButton")}
					</Button>

					{step < totalSteps ? (
						<Button
							onClick={() => setStep(step + 1)}
							disabled={!canProceed()}
							className="flex items-center gap-2"
						>
							{t("nextButton")}
							<ArrowRight className="w-4 h-4" />
						</Button>
					) : (
						<Button
							onClick={handleSubmit}
							disabled={!canProceed() || submitting}
							className="flex items-center gap-2"
						>
							{submitting ? (
								<>
									<div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
									{t("submittingButton")}
								</>
							) : (
								<>
									<Send className="w-4 h-4" />
									{t("submitButton")}
								</>
							)}
						</Button>
					)}
				</div>
			</CardContent>
		</Card>
	);
}
