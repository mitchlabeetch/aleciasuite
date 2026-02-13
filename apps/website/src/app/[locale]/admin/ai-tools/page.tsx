"use client";

/**
 * AI Tools Page - Admin Panel
 *
 * Provides access to AI-powered features for M&A workflows:
 * - Deal Risk Scoring
 * - Document Summarization
 * - Teaser Generation
 * - Valuation Suggestions
 * - Key Terms Extraction
 * - Document Translation
 *
 * @see Phase 2.4: AI Features
 */

import { useState, useEffect } from "react";
import {
	generateSummary,
	scoreDealRisk,
	summarizeDocument,
	generateTeaser,
	suggestValuation,
	extractKeyTerms,
	translateDocument,
} from "@/actions";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
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
	Sparkles,
	FileText,
	AlertTriangle,
	TrendingUp,
	Languages,
	FileSearch,
	Loader2,
	CheckCircle,
	XCircle,
	Copy,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

export default function AIToolsPage() {
	const { toast } = useToast();
	const [activeTab, setActiveTab] = useState("summarize");

	// Get deals for risk scoring
	const [deals, setDeals] = useState<any[] | null>(null);

	useEffect(() => {
		// Note: Would need a getDeals server action
		// For now, set empty array
		setDeals([]);
	}, []);

	// Form states
	const [summarizeForm, setSummarizeForm] = useState({
		content: "",
		style: "brief" as "brief" | "detailed" | "bullets",
		language: "fr" as "fr" | "en",
	});
	const [summarizeResult, setSummarizeResult] = useState<string | null>(null);
	const [isSummarizing, setIsSummarizing] = useState(false);

	const [teaserForm, setTeaserForm] = useState({
		companyName: "",
		sector: "",
		description: "",
		revenue: "",
		ebitda: "",
		employees: "",
		location: "",
		dealType: "cession" as "cession" | "acquisition" | "levee",
	});
	const [teaserResult, setTeaserResult] = useState<string | null>(null);
	const [isGeneratingTeaser, setIsGeneratingTeaser] = useState(false);

	const [valuationForm, setValuationForm] = useState({
		companyName: "",
		sector: "",
		revenue: "",
		ebitda: "",
		growth: "",
	});
	const [valuationResult, setValuationResult] = useState<{
		lowRange: number;
		midRange: number;
		highRange: number;
		methodology: string;
		considerations: string[];
	} | null>(null);
	const [isValuating, setIsValuating] = useState(false);

	const [extractForm, setExtractForm] = useState({
		content: "",
		documentType: "other" as "loi" | "nda" | "spa" | "contract" | "other",
	});
	const [extractResult, setExtractResult] = useState<{
		terms: Array<{
			term: string;
			value: string;
			category: string;
			importance: "high" | "medium" | "low";
		}>;
		summary: string;
		risks: string[];
	} | null>(null);
	const [isExtracting, setIsExtracting] = useState(false);

	const [translateForm, setTranslateForm] = useState({
		content: "",
		targetLanguage: "en" as "fr" | "en",
		style: "formal" as "formal" | "casual" | "legal",
	});
	const [translateResult, setTranslateResult] = useState<string | null>(null);
	const [isTranslating, setIsTranslating] = useState(false);

	const [selectedDeal, setSelectedDeal] = useState<string>("");
	const [riskResult, setRiskResult] = useState<{
		score: number;
		level: "low" | "medium" | "high" | "critical";
		summary: string;
		factors: Array<{
			category: string;
			severity: "blocker" | "major" | "minor" | "none";
			description: string;
		}>;
	} | null>(null);
	const [isScoringRisk, setIsScoringRisk] = useState(false);

	// Handlers
	const handleSummarize = async () => {
		if (!summarizeForm.content.trim()) {
			toast({
				title: "Contenu requis",
				description: "Veuillez coller le texte a resumer.",
				variant: "destructive",
			});
			return;
		}

		setIsSummarizing(true);
		try {
			const result = await summarizeDocument(
				summarizeForm.content,
				summarizeForm.style,
				summarizeForm.language,
			);

			setSummarizeResult(result);
			toast({ title: "Resume genere avec succes" });
		} catch (err) {
			toast({
				title: "Erreur",
				description: err instanceof Error ? err.message : "Une erreur est survenue.",
				variant: "destructive",
			});
		} finally {
			setIsSummarizing(false);
		}
	};

	const handleGenerateTeaser = async () => {
		if (!teaserForm.companyName.trim()) {
			toast({
				title: "Nom requis",
				description: "Veuillez entrer le nom de l'entreprise.",
				variant: "destructive",
			});
			return;
		}

		setIsGeneratingTeaser(true);
		try {
			const result = await generateTeaser({
				companyName: teaserForm.companyName,
				sector: teaserForm.sector || undefined,
				description: teaserForm.description || undefined,
				revenue: teaserForm.revenue
					? parseFloat(teaserForm.revenue) * 1_000_000
					: undefined,
				ebitda: teaserForm.ebitda
					? parseFloat(teaserForm.ebitda) * 1_000_000
					: undefined,
				employees: teaserForm.employees
					? parseInt(teaserForm.employees)
					: undefined,
				location: teaserForm.location || undefined,
				dealType: teaserForm.dealType,
			});

			setTeaserResult(result.teaser);
			toast({ title: "Teaser genere avec succes" });
		} catch (err) {
			toast({
				title: "Erreur",
				description: err instanceof Error ? err.message : "Une erreur est survenue.",
				variant: "destructive",
			});
		} finally {
			setIsGeneratingTeaser(false);
		}
	};

	const handleValuation = async () => {
		if (!valuationForm.companyName.trim()) {
			toast({
				title: "Nom requis",
				description: "Veuillez entrer le nom de l'entreprise.",
				variant: "destructive",
			});
			return;
		}

		if (!valuationForm.revenue && !valuationForm.ebitda) {
			toast({
				title: "Donnees financieres requises",
				description: "Veuillez entrer le CA ou l'EBITDA.",
				variant: "destructive",
			});
			return;
		}

		setIsValuating(true);
		try {
			const result = await suggestValuation({
				companyName: valuationForm.companyName,
				sector: valuationForm.sector || undefined,
				revenue: valuationForm.revenue
					? parseFloat(valuationForm.revenue) * 1_000_000
					: undefined,
				ebitda: valuationForm.ebitda
					? parseFloat(valuationForm.ebitda) * 1_000_000
					: undefined,
				growth: valuationForm.growth
					? parseFloat(valuationForm.growth)
					: undefined,
			});

			setValuationResult(result);
			toast({ title: "Valorisation estimee avec succes" });
		} catch (err) {
			toast({
				title: "Erreur",
				description: err instanceof Error ? err.message : "Une erreur est survenue.",
				variant: "destructive",
			});
		} finally {
			setIsValuating(false);
		}
	};

	const handleExtract = async () => {
		if (!extractForm.content.trim()) {
			toast({
				title: "Contenu requis",
				description: "Veuillez coller le texte du document.",
				variant: "destructive",
			});
			return;
		}

		setIsExtracting(true);
		try {
			const result = await extractKeyTerms(
				extractForm.content,
				extractForm.documentType,
			);

			setExtractResult(result);
			toast({ title: "Termes extraits avec succes" });
		} catch (err) {
			toast({
				title: "Erreur",
				description: err instanceof Error ? err.message : "Une erreur est survenue.",
				variant: "destructive",
			});
		} finally {
			setIsExtracting(false);
		}
	};

	const handleTranslate = async () => {
		if (!translateForm.content.trim()) {
			toast({
				title: "Contenu requis",
				description: "Veuillez coller le texte a traduire.",
				variant: "destructive",
			});
			return;
		}

		setIsTranslating(true);
		try {
			const result = await translateDocument(
				translateForm.content,
				translateForm.targetLanguage,
				translateForm.style,
			);

			setTranslateResult(result);
			toast({ title: "Traduction terminee" });
		} catch (err) {
			toast({
				title: "Erreur",
				description: err instanceof Error ? err.message : "Une erreur est survenue.",
				variant: "destructive",
			});
		} finally {
			setIsTranslating(false);
		}
	};

	const handleScoreRisk = async () => {
		if (!selectedDeal) {
			toast({
				title: "Deal requis",
				description: "Veuillez selectionner un deal.",
				variant: "destructive",
			});
			return;
		}

		setIsScoringRisk(true);
		try {
			const result = await scoreDealRisk(selectedDeal);

			setRiskResult(result);
			toast({ title: "Analyse de risque terminee" });
		} catch (err) {
			toast({
				title: "Erreur",
				description: err instanceof Error ? err.message : "Une erreur est survenue.",
				variant: "destructive",
			});
		} finally {
			setIsScoringRisk(false);
		}
	};

	const copyToClipboard = (text: string) => {
		navigator.clipboard.writeText(text);
		toast({ title: "Copie dans le presse-papiers" });
	};

	const formatCurrency = (value: number) => {
		if (value >= 1_000_000) {
			return `${(value / 1_000_000).toFixed(1)}M`;
		}
		return `${(value / 1_000).toFixed(0)}K`;
	};

	const getRiskColor = (level: string) => {
		switch (level) {
			case "low":
				return "bg-green-500/10 text-green-500";
			case "medium":
				return "bg-yellow-500/10 text-yellow-500";
			case "high":
				return "bg-orange-500/10 text-orange-500";
			case "critical":
				return "bg-red-500/10 text-red-500";
			default:
				return "bg-gray-500/10 text-gray-500";
		}
	};

	return (
		<div className="space-y-6 p-6">
			{/* Header */}
			<div>
				<h1 className="text-3xl font-bold flex items-center gap-2">
					<Sparkles className="h-8 w-8" />
					Outils IA
				</h1>
				<p className="text-muted-foreground mt-1">
					Intelligence artificielle pour accelerer vos workflows M&amp;A
				</p>
			</div>

			{/* Tools Tabs */}
			<Tabs
				value={activeTab}
				onValueChange={setActiveTab}
				className="space-y-4"
			>
				<TabsList className="grid grid-cols-6 lg:w-auto">
					<TabsTrigger value="summarize" className="flex items-center gap-2">
						<FileText className="h-4 w-4" />
						<span className="hidden sm:inline">Resume</span>
					</TabsTrigger>
					<TabsTrigger value="teaser" className="flex items-center gap-2">
						<Sparkles className="h-4 w-4" />
						<span className="hidden sm:inline">Teaser</span>
					</TabsTrigger>
					<TabsTrigger value="valuation" className="flex items-center gap-2">
						<TrendingUp className="h-4 w-4" />
						<span className="hidden sm:inline">Valori.</span>
					</TabsTrigger>
					<TabsTrigger value="extract" className="flex items-center gap-2">
						<FileSearch className="h-4 w-4" />
						<span className="hidden sm:inline">Termes</span>
					</TabsTrigger>
					<TabsTrigger value="translate" className="flex items-center gap-2">
						<Languages className="h-4 w-4" />
						<span className="hidden sm:inline">Traduc.</span>
					</TabsTrigger>
					<TabsTrigger value="risk" className="flex items-center gap-2">
						<AlertTriangle className="h-4 w-4" />
						<span className="hidden sm:inline">Risque</span>
					</TabsTrigger>
				</TabsList>

				{/* Summarize Tab */}
				<TabsContent value="summarize">
					<div className="grid gap-6 md:grid-cols-2">
						<Card>
							<CardHeader>
								<CardTitle>Resumer un document</CardTitle>
								<CardDescription>
									Collez le texte du document a resumer
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-4">
								<Textarea
									placeholder="Collez le texte ici..."
									className="min-h-[200px]"
									value={summarizeForm.content}
									onChange={(e) =>
										setSummarizeForm({
											...summarizeForm,
											content: e.target.value,
										})
									}
								/>
								<div className="grid grid-cols-2 gap-4">
									<div className="space-y-2">
										<Label>Style</Label>
										<Select
											value={summarizeForm.style}
											onValueChange={(v: "brief" | "detailed" | "bullets") =>
												setSummarizeForm({ ...summarizeForm, style: v })
											}
										>
											<SelectTrigger>
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="brief">Concis</SelectItem>
												<SelectItem value="detailed">Detaille</SelectItem>
												<SelectItem value="bullets">Liste a puces</SelectItem>
											</SelectContent>
										</Select>
									</div>
									<div className="space-y-2">
										<Label>Langue</Label>
										<Select
											value={summarizeForm.language}
											onValueChange={(v: "fr" | "en") =>
												setSummarizeForm({ ...summarizeForm, language: v })
											}
										>
											<SelectTrigger>
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="fr">Francais</SelectItem>
												<SelectItem value="en">English</SelectItem>
											</SelectContent>
										</Select>
									</div>
								</div>
								<Button
									onClick={handleSummarize}
									disabled={isSummarizing}
									className="w-full"
								>
									{isSummarizing ? (
										<Loader2 className="h-4 w-4 animate-spin mr-2" />
									) : (
										<Sparkles className="h-4 w-4 mr-2" />
									)}
									Generer le resume
								</Button>
							</CardContent>
						</Card>

						<Card>
							<CardHeader>
								<CardTitle>Resume</CardTitle>
							</CardHeader>
							<CardContent>
								{summarizeResult ? (
									<div className="space-y-4">
										<div className="prose prose-sm max-w-none dark:prose-invert whitespace-pre-wrap">
											{summarizeResult}
										</div>
										<Button
											variant="outline"
											size="sm"
											onClick={() => copyToClipboard(summarizeResult)}
										>
											<Copy className="h-4 w-4 mr-2" />
											Copier
										</Button>
									</div>
								) : (
									<p className="text-muted-foreground text-center py-8">
										Le resume apparaitra ici
									</p>
								)}
							</CardContent>
						</Card>
					</div>
				</TabsContent>

				{/* Teaser Tab */}
				<TabsContent value="teaser">
					<div className="grid gap-6 md:grid-cols-2">
						<Card>
							<CardHeader>
								<CardTitle>Generer un teaser</CardTitle>
								<CardDescription>
									Informations sur l&apos;entreprise
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="space-y-2">
									<Label>Nom de l&apos;entreprise *</Label>
									<Input
										placeholder="Ex: TechCorp SAS"
										value={teaserForm.companyName}
										onChange={(e) =>
											setTeaserForm({
												...teaserForm,
												companyName: e.target.value,
											})
										}
									/>
								</div>
								<div className="grid grid-cols-2 gap-4">
									<div className="space-y-2">
										<Label>Secteur</Label>
										<Input
											placeholder="Ex: SaaS / Logiciel"
											value={teaserForm.sector}
											onChange={(e) =>
												setTeaserForm({ ...teaserForm, sector: e.target.value })
											}
										/>
									</div>
									<div className="space-y-2">
										<Label>Localisation</Label>
										<Input
											placeholder="Ex: Paris, France"
											value={teaserForm.location}
											onChange={(e) =>
												setTeaserForm({
													...teaserForm,
													location: e.target.value,
												})
											}
										/>
									</div>
								</div>
								<div className="space-y-2">
									<Label>Description</Label>
									<Textarea
										placeholder="Description de l&apos;activite..."
										value={teaserForm.description}
										onChange={(e) =>
											setTeaserForm({
												...teaserForm,
												description: e.target.value,
											})
										}
									/>
								</div>
								<div className="grid grid-cols-3 gap-4">
									<div className="space-y-2">
										<Label>CA (M)</Label>
										<Input
											type="number"
											placeholder="15"
											value={teaserForm.revenue}
											onChange={(e) =>
												setTeaserForm({
													...teaserForm,
													revenue: e.target.value,
												})
											}
										/>
									</div>
									<div className="space-y-2">
										<Label>EBITDA (M)</Label>
										<Input
											type="number"
											placeholder="2.5"
											value={teaserForm.ebitda}
											onChange={(e) =>
												setTeaserForm({ ...teaserForm, ebitda: e.target.value })
											}
										/>
									</div>
									<div className="space-y-2">
										<Label>Effectifs</Label>
										<Input
											type="number"
											placeholder="50"
											value={teaserForm.employees}
											onChange={(e) =>
												setTeaserForm({
													...teaserForm,
													employees: e.target.value,
												})
											}
										/>
									</div>
								</div>
								<div className="space-y-2">
									<Label>Type d&apos;operation</Label>
									<Select
										value={teaserForm.dealType}
										onValueChange={(v: "cession" | "acquisition" | "levee") =>
											setTeaserForm({ ...teaserForm, dealType: v })
										}
									>
										<SelectTrigger>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="cession">Cession</SelectItem>
											<SelectItem value="acquisition">Acquisition</SelectItem>
											<SelectItem value="levee">Levee de fonds</SelectItem>
										</SelectContent>
									</Select>
								</div>
								<Button
									onClick={handleGenerateTeaser}
									disabled={isGeneratingTeaser}
									className="w-full"
								>
									{isGeneratingTeaser ? (
										<Loader2 className="h-4 w-4 animate-spin mr-2" />
									) : (
										<Sparkles className="h-4 w-4 mr-2" />
									)}
									Generer le teaser
								</Button>
							</CardContent>
						</Card>

						<Card>
							<CardHeader>
								<CardTitle>Teaser genere</CardTitle>
							</CardHeader>
							<CardContent>
								{teaserResult ? (
									<div className="space-y-4">
										<div className="prose prose-sm max-w-none dark:prose-invert whitespace-pre-wrap max-h-[500px] overflow-auto">
											{teaserResult}
										</div>
										<div className="flex gap-2">
											<Button
												variant="outline"
												size="sm"
												onClick={() => copyToClipboard(teaserResult)}
											>
												<Copy className="h-4 w-4 mr-2" />
												Copier
											</Button>
										</div>
									</div>
								) : (
									<p className="text-muted-foreground text-center py-8">
										Le teaser apparaitra ici
									</p>
								)}
							</CardContent>
						</Card>
					</div>
				</TabsContent>

				{/* Valuation Tab */}
				<TabsContent value="valuation">
					<div className="grid gap-6 md:grid-cols-2">
						<Card>
							<CardHeader>
								<CardTitle>Estimation de valorisation</CardTitle>
								<CardDescription>
									Suggeree par IA basee sur les multiples du marche
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="space-y-2">
									<Label>Nom de l&apos;entreprise *</Label>
									<Input
										placeholder="Ex: TechCorp SAS"
										value={valuationForm.companyName}
										onChange={(e) =>
											setValuationForm({
												...valuationForm,
												companyName: e.target.value,
											})
										}
									/>
								</div>
								<div className="space-y-2">
									<Label>Secteur</Label>
									<Input
										placeholder="Ex: SaaS / Logiciel"
										value={valuationForm.sector}
										onChange={(e) =>
											setValuationForm({
												...valuationForm,
												sector: e.target.value,
											})
										}
									/>
								</div>
								<div className="grid grid-cols-3 gap-4">
									<div className="space-y-2">
										<Label>CA (M) *</Label>
										<Input
											type="number"
											placeholder="15"
											value={valuationForm.revenue}
											onChange={(e) =>
												setValuationForm({
													...valuationForm,
													revenue: e.target.value,
												})
											}
										/>
									</div>
									<div className="space-y-2">
										<Label>EBITDA (M) *</Label>
										<Input
											type="number"
											placeholder="2.5"
											value={valuationForm.ebitda}
											onChange={(e) =>
												setValuationForm({
													...valuationForm,
													ebitda: e.target.value,
												})
											}
										/>
									</div>
									<div className="space-y-2">
										<Label>Croissance (%)</Label>
										<Input
											type="number"
											placeholder="15"
											value={valuationForm.growth}
											onChange={(e) =>
												setValuationForm({
													...valuationForm,
													growth: e.target.value,
												})
											}
										/>
									</div>
								</div>
								<Button
									onClick={handleValuation}
									disabled={isValuating}
									className="w-full"
								>
									{isValuating ? (
										<Loader2 className="h-4 w-4 animate-spin mr-2" />
									) : (
										<TrendingUp className="h-4 w-4 mr-2" />
									)}
									Estimer la valorisation
								</Button>
							</CardContent>
						</Card>

						<Card>
							<CardHeader>
								<CardTitle>Estimation</CardTitle>
							</CardHeader>
							<CardContent>
								{valuationResult ? (
									<div className="space-y-6">
										<div className="grid grid-cols-3 gap-4 text-center">
											<div className="p-4 rounded-lg bg-muted/50">
												<p className="text-sm text-muted-foreground">Basse</p>
												<p className="text-2xl font-bold text-orange-500">
													{formatCurrency(valuationResult.lowRange)}
												</p>
											</div>
											<div className="p-4 rounded-lg bg-primary/10">
												<p className="text-sm text-muted-foreground">Mediane</p>
												<p className="text-2xl font-bold text-primary">
													{formatCurrency(valuationResult.midRange)}
												</p>
											</div>
											<div className="p-4 rounded-lg bg-muted/50">
												<p className="text-sm text-muted-foreground">Haute</p>
												<p className="text-2xl font-bold text-green-500">
													{formatCurrency(valuationResult.highRange)}
												</p>
											</div>
										</div>
										<div className="space-y-2">
											<h4 className="font-medium">Methodologie</h4>
											<p className="text-sm text-muted-foreground">
												{valuationResult.methodology}
											</p>
										</div>
										{valuationResult.considerations.length > 0 && (
											<div className="space-y-2">
												<h4 className="font-medium">Points d&apos;attention</h4>
												<ul className="text-sm text-muted-foreground list-disc pl-4">
													{valuationResult.considerations.map((c, i) => (
														<li key={i}>{c}</li>
													))}
												</ul>
											</div>
										)}
									</div>
								) : (
									<p className="text-muted-foreground text-center py-8">
										L&apos;estimation apparaitra ici
									</p>
								)}
							</CardContent>
						</Card>
					</div>
				</TabsContent>

				{/* Extract Tab */}
				<TabsContent value="extract">
					<div className="grid gap-6 md:grid-cols-2">
						<Card>
							<CardHeader>
								<CardTitle>Extraire les termes cles</CardTitle>
								<CardDescription>
									Analyse de contrats et documents juridiques
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="space-y-2">
									<Label>Type de document</Label>
									<Select
										value={extractForm.documentType}
										onValueChange={(
											v: "loi" | "nda" | "spa" | "contract" | "other",
										) => setExtractForm({ ...extractForm, documentType: v })}
									>
										<SelectTrigger>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="loi">LOI</SelectItem>
											<SelectItem value="nda">NDA</SelectItem>
											<SelectItem value="spa">SPA</SelectItem>
											<SelectItem value="contract">Contrat</SelectItem>
											<SelectItem value="other">Autre</SelectItem>
										</SelectContent>
									</Select>
								</div>
								<Textarea
									placeholder="Collez le texte du document..."
									className="min-h-[250px]"
									value={extractForm.content}
									onChange={(e) =>
										setExtractForm({ ...extractForm, content: e.target.value })
									}
								/>
								<Button
									onClick={handleExtract}
									disabled={isExtracting}
									className="w-full"
								>
									{isExtracting ? (
										<Loader2 className="h-4 w-4 animate-spin mr-2" />
									) : (
										<FileSearch className="h-4 w-4 mr-2" />
									)}
									Extraire les termes
								</Button>
							</CardContent>
						</Card>

						<Card>
							<CardHeader>
								<CardTitle>Termes extraits</CardTitle>
							</CardHeader>
							<CardContent>
								{extractResult ? (
									<div className="space-y-6 max-h-[500px] overflow-auto">
										<div className="space-y-2">
											<h4 className="font-medium">Resume</h4>
											<p className="text-sm text-muted-foreground">
												{extractResult.summary}
											</p>
										</div>
										<div className="space-y-2">
											<h4 className="font-medium">Termes cles</h4>
											<div className="space-y-2">
												{extractResult.terms.map((term, i) => (
													<div
														key={i}
														className="p-2 rounded bg-muted/50 flex items-start justify-between gap-2"
													>
														<div>
															<p className="font-medium text-sm">{term.term}</p>
															<p className="text-sm text-muted-foreground">
																{term.value}
															</p>
														</div>
														<Badge
															variant={
																term.importance === "high"
																	? "default"
																	: "outline"
															}
														>
															{term.importance}
														</Badge>
													</div>
												))}
											</div>
										</div>
										{extractResult.risks.length > 0 && (
											<div className="space-y-2">
												<h4 className="font-medium flex items-center gap-2">
													<AlertTriangle className="h-4 w-4 text-orange-500" />
													Points d&apos;attention
												</h4>
												<ul className="text-sm text-muted-foreground list-disc pl-4">
													{extractResult.risks.map((r, i) => (
														<li key={i}>{r}</li>
													))}
												</ul>
											</div>
										)}
									</div>
								) : (
									<p className="text-muted-foreground text-center py-8">
										Les termes apparaitront ici
									</p>
								)}
							</CardContent>
						</Card>
					</div>
				</TabsContent>

				{/* Translate Tab */}
				<TabsContent value="translate">
					<div className="grid gap-6 md:grid-cols-2">
						<Card>
							<CardHeader>
								<CardTitle>Traduire un document</CardTitle>
								<CardDescription>
									Traduction professionnelle FR/EN
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-4">
								<Textarea
									placeholder="Collez le texte a traduire..."
									className="min-h-[200px]"
									value={translateForm.content}
									onChange={(e) =>
										setTranslateForm({
											...translateForm,
											content: e.target.value,
										})
									}
								/>
								<div className="grid grid-cols-2 gap-4">
									<div className="space-y-2">
										<Label>Langue cible</Label>
										<Select
											value={translateForm.targetLanguage}
											onValueChange={(v: "fr" | "en") =>
												setTranslateForm({
													...translateForm,
													targetLanguage: v,
												})
											}
										>
											<SelectTrigger>
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="en">English</SelectItem>
												<SelectItem value="fr">Francais</SelectItem>
											</SelectContent>
										</Select>
									</div>
									<div className="space-y-2">
										<Label>Style</Label>
										<Select
											value={translateForm.style}
											onValueChange={(v: "formal" | "casual" | "legal") =>
												setTranslateForm({ ...translateForm, style: v })
											}
										>
											<SelectTrigger>
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="formal">Formel</SelectItem>
												<SelectItem value="casual">Courant</SelectItem>
												<SelectItem value="legal">Juridique</SelectItem>
											</SelectContent>
										</Select>
									</div>
								</div>
								<Button
									onClick={handleTranslate}
									disabled={isTranslating}
									className="w-full"
								>
									{isTranslating ? (
										<Loader2 className="h-4 w-4 animate-spin mr-2" />
									) : (
										<Languages className="h-4 w-4 mr-2" />
									)}
									Traduire
								</Button>
							</CardContent>
						</Card>

						<Card>
							<CardHeader>
								<CardTitle>Traduction</CardTitle>
							</CardHeader>
							<CardContent>
								{translateResult ? (
									<div className="space-y-4">
										<div className="prose prose-sm max-w-none dark:prose-invert whitespace-pre-wrap max-h-[350px] overflow-auto">
											{translateResult}
										</div>
										<Button
											variant="outline"
											size="sm"
											onClick={() => copyToClipboard(translateResult)}
										>
											<Copy className="h-4 w-4 mr-2" />
											Copier
										</Button>
									</div>
								) : (
									<p className="text-muted-foreground text-center py-8">
										La traduction apparaitra ici
									</p>
								)}
							</CardContent>
						</Card>
					</div>
				</TabsContent>

				{/* Risk Tab */}
				<TabsContent value="risk">
					<div className="grid gap-6 md:grid-cols-2">
						<Card>
							<CardHeader>
								<CardTitle>Analyse de risque</CardTitle>
								<CardDescription>
									Scoring base sur les elements DD du deal
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="space-y-2">
									<Label>Selectionner un deal</Label>
									<Select value={selectedDeal} onValueChange={setSelectedDeal}>
										<SelectTrigger>
											<SelectValue placeholder="Choisir un deal..." />
										</SelectTrigger>
										<SelectContent>
											{deals?.map((deal: { _id: string; title: string }) => (
												<SelectItem key={deal._id} value={deal._id}>
													{deal.title}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>
								<Button
									onClick={handleScoreRisk}
									disabled={isScoringRisk || !selectedDeal}
									className="w-full"
								>
									{isScoringRisk ? (
										<Loader2 className="h-4 w-4 animate-spin mr-2" />
									) : (
										<AlertTriangle className="h-4 w-4 mr-2" />
									)}
									Analyser les risques
								</Button>
							</CardContent>
						</Card>

						<Card>
							<CardHeader>
								<CardTitle>Score de risque</CardTitle>
							</CardHeader>
							<CardContent>
								{riskResult ? (
									<div className="space-y-6">
										<div className="flex items-center justify-center gap-4">
											<div
												className={`text-6xl font-bold ${
													riskResult.level === "critical"
														? "text-red-500"
														: riskResult.level === "high"
															? "text-orange-500"
															: riskResult.level === "medium"
																? "text-yellow-500"
																: "text-green-500"
												}`}
											>
												{riskResult.score}
											</div>
											<Badge className={getRiskColor(riskResult.level)}>
												{riskResult.level === "critical"
													? "Critique"
													: riskResult.level === "high"
														? "Eleve"
														: riskResult.level === "medium"
															? "Moyen"
															: "Faible"}
											</Badge>
										</div>
										<div className="space-y-2">
											<h4 className="font-medium">Resume</h4>
											<p className="text-sm text-muted-foreground">
												{riskResult.summary}
											</p>
										</div>
										{riskResult.factors.length > 0 && (
											<div className="space-y-2">
												<h4 className="font-medium">Facteurs de risque</h4>
												<div className="space-y-2">
													{riskResult.factors.map((factor, i) => (
														<div
															key={i}
															className="p-2 rounded bg-muted/50 flex items-start gap-2"
														>
															{factor.severity === "blocker" ? (
																<XCircle className="h-4 w-4 text-red-500 mt-0.5" />
															) : factor.severity === "major" ? (
																<AlertTriangle className="h-4 w-4 text-orange-500 mt-0.5" />
															) : (
																<CheckCircle className="h-4 w-4 text-yellow-500 mt-0.5" />
															)}
															<div>
																<p className="font-medium text-sm">
																	{factor.category}
																</p>
																<p className="text-sm text-muted-foreground">
																	{factor.description}
																</p>
															</div>
														</div>
													))}
												</div>
											</div>
										)}
									</div>
								) : (
									<p className="text-muted-foreground text-center py-8">
										L&apos;analyse apparaitra ici
									</p>
								)}
							</CardContent>
						</Card>
					</div>
				</TabsContent>
			</Tabs>
		</div>
	);
}
