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
import {
	ArrowLeft,
	ArrowRight,
	Check,
	Building2,
	User,
	FileText,
	Send,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { createLogger } from "@/lib/logger";

const log = createLogger("SellWizard");

interface FormData {
	// Step 1 - Company Info
	companyName: string;
	sector: string;
	region: string;
	revenue: string;
	ebe: string; // EBE instead of EBITDA
	employees: string;

	// Step 2 - Project Info
	motivations: string[];
	timeline: string;
	hasAdvisor: string;

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

const INITIAL_DATA: FormData = {
	companyName: "",
	sector: "",
	region: "",
	revenue: "",
	ebe: "",
	employees: "",
	motivations: [],
	timeline: "",
	hasAdvisor: "",
	firstName: "",
	lastName: "",
	email: "",
	phone: "",
	role: "",
	message: "",
};

// Sectors with French business terminology
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

export function SellWizard() {
	const t = useTranslations("Wizards.sell");
	const [step, setStep] = useState(1);
	const [data, setData] = useState<FormData>(INITIAL_DATA);
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
	const validateField = (field: keyof FormData, value: any): string => {
		switch (field) {
			case "companyName":
				return !value ? "Le nom de l'entreprise est requis" : "";
			case "sector":
				return !value ? "Veuillez sélectionner un secteur" : "";
			case "region":
				return !value ? "Veuillez sélectionner une région" : "";
			case "motivations":
				return value.length === 0
					? "Veuillez sélectionner au moins une motivation"
					: "";
			case "timeline":
				return !value ? "Veuillez sélectionner un calendrier" : "";
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

	const updateField = <K extends keyof FormData>(
		field: K,
		value: FormData[K],
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
		// Validate on blur for immediate feedback
		const error = validateField(field, value);
		if (error && value) {
			setErrors((prev) => ({ ...prev, [field as string]: error }));
		}
	};

	const toggleMotivation = (value: string) => {
		setData((prev) => ({
			...prev,
			motivations: prev.motivations.includes(value)
				? prev.motivations.filter((m) => m !== value)
				: [...prev.motivations, value],
		}));
	};

	const canProceed = () => {
		switch (step) {
			case 1:
				return data.companyName && data.sector && data.region;
			case 2:
				return data.motivations.length > 0 && data.timeline;
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
				type: "sell",
				companyName: data.companyName,
				firstName: data.firstName,
				lastName: data.lastName,
				email: data.email,
				phone: data.phone,
				sector: data.sector,
				region: data.region,
				revenue: data.revenue,
				ebe: data.ebe,
				employees: data.employees,
				motivations: data.motivations,
				timeline: data.timeline,
				hasAdvisor: data.hasAdvisor,
				role: data.role,
				message: data.message,
				source: "website_sell_wizard",
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

	const MOTIVATIONS = [
		{ value: "retirement", label: t("motivationRetirement") },
		{ value: "new-project", label: t("motivationNewProject") },
		{ value: "capital", label: t("motivationCapital") },
		{ value: "growth", label: t("motivationGrowth") },
		{ value: "health", label: t("motivationHealth") },
		{ value: "other", label: t("motivationOther") },
	];

	const TIMELINES = [
		{ value: "6months", label: t("timeline6months") },
		{ value: "1year", label: t("timeline1year") },
		{ value: "2years", label: t("timeline2years") },
		{ value: "exploring", label: t("timelineExploring") },
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
					{/* Step 1 - Company Info */}
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
									<Label htmlFor="companyName">{t("companyName")} *</Label>
									<Input
										id="companyName"
										value={data.companyName}
										onChange={(e) => updateField("companyName", e.target.value)}
										onBlur={() => {
											const error = validateField(
												"companyName",
												data.companyName,
											);
											if (error)
												setErrors((prev) => ({ ...prev, companyName: error }));
										}}
										placeholder={t("companyNamePlaceholder")}
										aria-invalid={!!errors.companyName}
										aria-describedby={
											errors.companyName ? "companyName-error" : undefined
										}
										className={errors.companyName ? "border-red-500" : ""}
									/>
									{errors.companyName && (
										<p id="companyName-error" className="text-sm text-red-500">
											{errors.companyName}
										</p>
									)}
								</div>

								<div className="grid md:grid-cols-2 gap-4">
									<div className="space-y-2">
										<Label>{t("sector")} *</Label>
										<Select
											value={data.sector}
											onValueChange={(v: string) => updateField("sector", v)}
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
									<div className="space-y-2">
										<Label>{t("region")} *</Label>
										<Select
											value={data.region}
											onValueChange={(v: string) => updateField("region", v)}
										>
											<SelectTrigger>
												<SelectValue placeholder={t("regionPlaceholder")} />
											</SelectTrigger>
											<SelectContent>
												{REGIONS.map((region) => (
													<SelectItem key={region} value={region}>
														{region}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</div>
								</div>

								<div className="grid md:grid-cols-3 gap-4">
									<div className="space-y-2">
										<Label htmlFor="revenue">{t("revenue")}</Label>
										<div className="relative">
											<Input
												id="revenue"
												value={data.revenue}
												onChange={(e) => updateField("revenue", e.target.value)}
												placeholder={t("revenuePlaceholder")}
												className="pr-8"
											/>
											<span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
												k€
											</span>
										</div>
									</div>
									<div className="space-y-2">
										<Label htmlFor="ebe">{t("ebe")}</Label>
										<div className="relative">
											<Input
												id="ebe"
												value={data.ebe}
												onChange={(e) => updateField("ebe", e.target.value)}
												placeholder={t("ebePlaceholder")}
												className="pr-8"
											/>
											<span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
												k€
											</span>
										</div>
									</div>
									<div className="space-y-2">
										<Label htmlFor="employees">{t("employees")}</Label>
										<Input
											id="employees"
											value={data.employees}
											onChange={(e) => updateField("employees", e.target.value)}
											placeholder={t("employeesPlaceholder")}
										/>
									</div>
								</div>
							</div>
						</motion.div>
					)}

					{/* Step 2 - Project Info */}
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
									<FileText className="w-5 h-5 text-[var(--accent)]" />
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

							<div className="space-y-4">
								<div className="space-y-2">
									<Label>{t("motivations")} *</Label>
									<div className="grid md:grid-cols-2 gap-2">
										{MOTIVATIONS.map((m) => (
											<button
												key={m.value}
												type="button"
												onClick={() => toggleMotivation(m.value)}
												className={`p-3 rounded-lg border text-left transition-colors ${
													data.motivations.includes(m.value)
														? "border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--foreground)]"
														: "border-[var(--border)] hover:border-[var(--accent)]/50 text-muted-foreground"
												}`}
											>
												{m.label}
											</button>
										))}
									</div>
								</div>

								<div className="space-y-2">
									<Label>{t("timeline")} *</Label>
									<Select
										value={data.timeline}
										onValueChange={(v: string) => updateField("timeline", v)}
									>
										<SelectTrigger>
											<SelectValue placeholder={t("timelinePlaceholder")} />
										</SelectTrigger>
										<SelectContent>
											{TIMELINES.map((timeline) => (
												<SelectItem key={timeline.value} value={timeline.value}>
													{timeline.label}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>

								<div className="space-y-2">
									<Label>{t("hasAdvisor")}</Label>
									<Select
										value={data.hasAdvisor}
										onValueChange={(v: string) => updateField("hasAdvisor", v)}
									>
										<SelectTrigger>
											<SelectValue placeholder={t("advisorPlaceholder")} />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="no">{t("advisorNo")}</SelectItem>
											<SelectItem value="yes-lawyer">
												{t("advisorLawyer")}
											</SelectItem>
											<SelectItem value="yes-accountant">
												{t("advisorAccountant")}
											</SelectItem>
											<SelectItem value="yes-bank">
												{t("advisorBank")}
											</SelectItem>
										</SelectContent>
									</Select>
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
