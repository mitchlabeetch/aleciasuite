"use client";

/**
 * Excel Import Wizard - Import deals from Excel/OneDrive
 *
 * Multi-step wizard:
 * 1. Connect to Microsoft (if not connected)
 * 2. Browse OneDrive files
 * 3. Select worksheet and preview data
 * 4. Map columns to deal fields
 * 5. Confirm and import
 */

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import {
	ArrowLeft,
	ArrowRight,
	Check,
	FileSpreadsheet,
	Folder,
	FolderOpen,
	Loader2,
	RefreshCw,
	Upload,
	X,
	ChevronRight,
	Building2,
	DollarSign,
	User,
	Calendar,
	Tag,
} from "lucide-react";
import Link from "next/link";

// Types for the wizard
interface OneDriveFile {
	id: string;
	name: string;
	webUrl: string;
	size: number;
	lastModified: string;
	type: "folder" | "file";
	mimeType?: string;
	driveId?: string;
}

interface Worksheet {
	id: string;
	name: string;
	position: number;
	visibility: string;
}

interface ExcelData {
	values: (string | number | boolean | null)[][];
	address: string;
	rowCount: number;
	columnCount: number;
}

interface ColumnMapping {
	excelColumn: number;
	field: string;
	label: string;
}

// Available deal fields for mapping
const DEAL_FIELDS = [
	{ field: "title", label: "Nom du deal", icon: Tag, required: true },
	{
		field: "companyName",
		label: "Nom de l'entreprise",
		icon: Building2,
		required: true,
	},
	{ field: "amount", label: "Montant (€)", icon: DollarSign, required: false },
	{
		field: "revenue",
		label: "Chiffre d'affaires",
		icon: DollarSign,
		required: false,
	},
	{ field: "ebitda", label: "EBITDA", icon: DollarSign, required: false },
	{ field: "contact", label: "Contact", icon: User, required: false },
	{ field: "email", label: "Email", icon: User, required: false },
	{ field: "sector", label: "Secteur", icon: Tag, required: false },
	{
		field: "expectedCloseDate",
		label: "Date de closing",
		icon: Calendar,
		required: false,
	},
];

// Step indicator component
function StepIndicator({ currentStep }: { currentStep: number }) {
	const steps = ["Connexion", "Fichier", "Feuille", "Mapping", "Import"];

	return (
		<div className="flex items-center justify-center mb-8">
			{steps.map((step, index) => (
				<div key={step} className="flex items-center">
					<div
						className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-colors ${
							index < currentStep
								? "bg-primary text-primary-foreground"
								: index === currentStep
									? "bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2"
									: "bg-muted text-muted-foreground"
						}`}
					>
						{index < currentStep ? <Check className="h-4 w-4" /> : index + 1}
					</div>
					<span
						className={`ml-2 text-sm hidden sm:inline ${
							index === currentStep ? "font-medium" : "text-muted-foreground"
						}`}
					>
						{step}
					</span>
					{index < steps.length - 1 && (
						<ChevronRight className="h-4 w-4 mx-2 text-muted-foreground" />
					)}
				</div>
			))}
		</div>
	);
}

export default function ExcelImportPage() {
	const { toast } = useToast();
	const router = useRouter();

	// Wizard state
	const [currentStep, setCurrentStep] = useState(0);
	const [isLoading, setIsLoading] = useState(true);
	const [isConnected, setIsConnected] = useState(false);
	const [accessToken, setAccessToken] = useState<string | null>(null);

	// File browser state
	const [files, setFiles] = useState<OneDriveFile[]>([]);
	const [currentFolder, setCurrentFolder] = useState<string | null>(null);
	const [folderPath, setFolderPath] = useState<
		{ id: string | null; name: string }[]
	>([{ id: null, name: "OneDrive" }]);
	const [selectedFile, setSelectedFile] = useState<OneDriveFile | null>(null);

	// Worksheet state
	const [worksheets, setWorksheets] = useState<Worksheet[]>([]);
	const [selectedWorksheet, setSelectedWorksheet] = useState<string | null>(
		null,
	);
	const [excelData, setExcelData] = useState<ExcelData | null>(null);

	// Column mapping state
	const [columnMappings, setColumnMappings] = useState<ColumnMapping[]>([]);
	const [headerRow, setHeaderRow] = useState(0);

	// Import state
	const [isImporting, setIsImporting] = useState(false);
	const [importResults, setImportResults] = useState<{
		success: number;
		errors: string[];
	} | null>(null);

	// Check Microsoft connection on mount
	useEffect(() => {
		const checkConnection = async () => {
			try {
				// TODO: Convert Microsoft Graph API actions to server actions
				// const result = await checkMicrosoftConnection();
				// if (result.success && result.data.connected) {
				// 	setIsConnected(true);
				// 	const tokenResult = await getAccessToken();
				// 	if (tokenResult.success) {
				// 		setAccessToken(tokenResult.data);
				// 		setCurrentStep(1);
				// 	}
				// }
				console.warn("Microsoft Graph API not yet converted to server actions");
			} catch (_err) {
				console.error("Failed to check connection:", _err);
			} finally {
				setIsLoading(false);
			}
		};
		checkConnection();
	}, []);

	// Load OneDrive files when on step 1
	const loadFiles = useCallback(
		async (folderId?: string) => {
			if (!accessToken) return;
			setIsLoading(true);
			try {
				// TODO: Convert to server action
				// const result = await getOneDriveFiles({ accessToken, folderId });
				// const filtered = result.filter(...);
				// setFiles(filtered);
				console.warn("getOneDriveFiles not yet converted");
			} catch (_err) {
				toast({
					title: "Erreur",
					description: "Impossible de charger les fichiers OneDrive.",
					variant: "destructive",
				});
			} finally {
				setIsLoading(false);
			}
		},
		[accessToken, toast],
	);

	useEffect(() => {
		if (currentStep === 1 && accessToken) {
			loadFiles(currentFolder || undefined);
		}
	}, [currentStep, accessToken, currentFolder, loadFiles]);

	// Handle folder navigation
	const navigateToFolder = (folder: OneDriveFile) => {
		setCurrentFolder(folder.id);
		setFolderPath([...folderPath, { id: folder.id, name: folder.name }]);
	};

	const navigateToPath = (index: number) => {
		const newPath = folderPath.slice(0, index + 1);
		setFolderPath(newPath);
		setCurrentFolder(newPath[newPath.length - 1].id);
	};

	// Handle file selection
	const selectFile = async (file: OneDriveFile) => {
		if (file.type === "folder") {
			navigateToFolder(file);
			return;
		}
		setSelectedFile(file);
		setIsLoading(true);
		try {
			// TODO: Convert to server action
			// const sheets = await getExcelWorksheets({...});
			// setWorksheets(sheets);
			// setCurrentStep(2);
			console.warn("getExcelWorksheets not yet converted");
		} catch (_err) {
			toast({
				title: "Erreur",
				description: "Impossible de lire le fichier Excel.",
				variant: "destructive",
			});
		} finally {
			setIsLoading(false);
		}
	};

	// Load worksheet data
	const loadWorksheetData = async (sheetName: string) => {
		if (!selectedFile || !accessToken) return;
		setIsLoading(true);
		setSelectedWorksheet(sheetName);
		try {
			// TODO: Convert to server action
			// const data = await getExcelUsedRange({...});
			// setExcelData(data);
			// ... auto-mapping logic
			// setCurrentStep(3);
			console.warn("getExcelUsedRange not yet converted");
		} catch (_err) {
			toast({
				title: "Erreur",
				description: "Impossible de charger les données.",
				variant: "destructive",
			});
		} finally {
			setIsLoading(false);
		}
	};

	// Update column mapping
	const updateMapping = (excelColumn: number, field: string) => {
		const fieldInfo = DEAL_FIELDS.find((f) => f.field === field);
		if (!fieldInfo) return;

		setColumnMappings((prev) => {
			// Remove any existing mapping for this field
			const filtered = prev.filter(
				(m) => m.field !== field && m.excelColumn !== excelColumn,
			);
			if (field === "") return filtered;
			return [...filtered, { excelColumn, field, label: fieldInfo.label }];
		});
	};

	// Handle Microsoft connection
	const connectMicrosoft = async () => {
		setIsLoading(true);
		try {
			// TODO: Convert to server action
			// const result = await getMicrosoftAuthUrl();
			// if (result.success) window.location.href = result.data;
			console.warn("getMicrosoftAuthUrl not yet converted");
			toast({
				title: "Non implémenté",
				description: "Les actions Microsoft ne sont pas encore converties.",
				variant: "destructive",
			});
		} catch (_err) {
			toast({
				title: "Erreur",
				description: "Impossible de se connecter à Microsoft.",
				variant: "destructive",
			});
		} finally {
			setIsLoading(false);
		}
	};

	// Handle import
	const handleImport = async () => {
		if (!excelData || columnMappings.length === 0) return;

		setIsImporting(true);

		try {
			// Get data rows (skip header)
			const dataRows = excelData.values.slice(headerRow + 1);

			// Build deals array for bulk import
			const dealsToImport: Array<{
				title: string;
				companyName?: string;
				amount?: number;
				revenue?: number;
				ebitda?: number;
				contact?: string;
				email?: string;
				sector?: string;
				expectedCloseDate?: number;
			}> = [];

			const validationErrors: string[] = [];

			for (let i = 0; i < dataRows.length; i++) {
				const row = dataRows[i];
				const dealData: Record<string, unknown> = {};

				columnMappings.forEach((mapping) => {
					const value = row[mapping.excelColumn];
					if (value !== null && value !== undefined && value !== "") {
						// Convert numbers properly
						if (["amount", "revenue", "ebitda"].includes(mapping.field)) {
							dealData[mapping.field] =
								typeof value === "number"
									? value
									: parseFloat(String(value).replace(/[^\d.-]/g, "")) ||
										undefined;
						} else {
							dealData[mapping.field] = value;
						}
					}
				});

				// Validate required fields
				if (!dealData.title && !dealData.companyName) {
					validationErrors.push(
						`Ligne ${i + 2}: Nom du deal ou entreprise manquant`,
					);
					continue;
				}

				// Use company name as title if title is missing
				if (!dealData.title && dealData.companyName) {
					dealData.title = dealData.companyName as string;
				}

				dealsToImport.push({
					title: dealData.title as string,
					companyName: dealData.companyName as string | undefined,
					amount: dealData.amount as number | undefined,
					revenue: dealData.revenue as number | undefined,
					ebitda: dealData.ebitda as number | undefined,
					contact: dealData.contact as string | undefined,
					email: dealData.email as string | undefined,
					sector: dealData.sector as string | undefined,
					expectedCloseDate: dealData.expectedCloseDate as number | undefined,
				});
			}

			// TODO: Convert to server action
			// const result = await bulkImportDeals({...});
			// setImportResults({...});
			// setCurrentStep(4);
			console.warn("bulkImportDeals not yet converted to server action");
			toast({
				title: "Non implémenté",
				description: "L'import de deals n'est pas encore converti.",
				variant: "destructive",
			});
		} catch (err) {
			toast({
				title: "Erreur d'import",
				description:
					(err as Error).message || "Une erreur est survenue pendant l'import.",
				variant: "destructive",
			});
		} finally {
			setIsImporting(false);
		}
	};

	// Render step content
	const renderStepContent = () => {
		// Step 0: Microsoft Connection
		if (currentStep === 0) {
			return (
				<Card>
					<CardHeader>
						<CardTitle>Connexion à Microsoft 365</CardTitle>
						<CardDescription>
							Connectez votre compte Microsoft pour accéder à vos fichiers
							OneDrive.
						</CardDescription>
					</CardHeader>
					<CardContent className="flex flex-col items-center py-8">
						{isLoading ? (
							<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
						) : isConnected ? (
							<div className="text-center">
								<Check className="h-12 w-12 text-green-500 mx-auto mb-4" />
								<p className="text-lg font-medium">Connecté à Microsoft 365</p>
							</div>
						) : (
							<>
								<FileSpreadsheet className="h-16 w-16 text-muted-foreground mb-4" />
								<p className="text-center text-muted-foreground mb-6 max-w-md">
									Importez vos deals directement depuis vos fichiers Excel
									stockés sur OneDrive. Gagnez du temps en évitant la saisie
									manuelle.
								</p>
								<Button
									size="lg"
									onClick={connectMicrosoft}
									disabled={isLoading}
								>
									{isLoading ? (
										<Loader2 className="h-4 w-4 animate-spin mr-2" />
									) : (
										<svg
											className="h-5 w-5 mr-2"
											viewBox="0 0 23 23"
											fill="none"
										>
											<path d="M11 11H0V0H11V11Z" fill="#F25022" />
											<path d="M23 11H12V0H23V11Z" fill="#7FBA00" />
											<path d="M11 23H0V12H11V23Z" fill="#00A4EF" />
											<path d="M23 23H12V12H23V23Z" fill="#FFB900" />
										</svg>
									)}
									Connecter Microsoft 365
								</Button>
							</>
						)}
					</CardContent>
				</Card>
			);
		}

		// Step 1: File Browser
		if (currentStep === 1) {
			return (
				<Card>
					<CardHeader>
						<div className="flex items-center justify-between">
							<div>
								<CardTitle>Sélectionner un fichier Excel</CardTitle>
								<CardDescription>
									Parcourez vos fichiers OneDrive et sélectionnez un fichier
									Excel.
								</CardDescription>
							</div>
							<Button
								variant="outline"
								size="sm"
								onClick={() => loadFiles(currentFolder || undefined)}
							>
								<RefreshCw className="h-4 w-4 mr-2" />
								Actualiser
							</Button>
						</div>
					</CardHeader>
					<CardContent>
						{/* Breadcrumb */}
						<div className="flex items-center gap-1 mb-4 text-sm">
							{folderPath.map((folder, index) => (
								<div key={folder.id || "root"} className="flex items-center">
									{index > 0 && (
										<ChevronRight className="h-4 w-4 mx-1 text-muted-foreground" />
									)}
									<button
										onClick={() => navigateToPath(index)}
										className="hover:text-primary transition-colors"
									>
										{folder.name}
									</button>
								</div>
							))}
						</div>

						{/* File list */}
						{isLoading ? (
							<div className="flex items-center justify-center py-12">
								<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
							</div>
						) : files.length === 0 ? (
							<div className="text-center py-12 text-muted-foreground">
								<Folder className="h-12 w-12 mx-auto mb-4 opacity-50" />
								<p>Aucun fichier Excel trouvé dans ce dossier.</p>
							</div>
						) : (
							<div className="space-y-1 max-h-96 overflow-y-auto">
								{files.map((file) => (
									<button
										key={file.id}
										onClick={() => selectFile(file)}
										className={`w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors text-left ${
											selectedFile?.id === file.id ? "bg-muted" : ""
										}`}
									>
										{file.type === "folder" ? (
											<FolderOpen className="h-5 w-5 text-blue-500" />
										) : (
											<FileSpreadsheet className="h-5 w-5 text-green-600" />
										)}
										<div className="flex-1 min-w-0">
											<p className="font-medium truncate">{file.name}</p>
											<p className="text-xs text-muted-foreground">
												{file.type === "folder"
													? "Dossier"
													: `${(file.size / 1024).toFixed(1)} KB`}
											</p>
										</div>
										<ChevronRight className="h-4 w-4 text-muted-foreground" />
									</button>
								))}
							</div>
						)}
					</CardContent>
				</Card>
			);
		}

		// Step 2: Worksheet Selection
		if (currentStep === 2) {
			return (
				<Card>
					<CardHeader>
						<CardTitle>Sélectionner une feuille</CardTitle>
						<CardDescription>
							Fichier: <span className="font-medium">{selectedFile?.name}</span>
						</CardDescription>
					</CardHeader>
					<CardContent>
						{isLoading ? (
							<div className="flex items-center justify-center py-12">
								<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
							</div>
						) : (
							<div className="space-y-2">
								{worksheets.map((sheet) => (
									<button
										key={sheet.id}
										onClick={() => loadWorksheetData(sheet.name)}
										className={`w-full flex items-center gap-3 p-4 rounded-lg border hover:border-primary transition-colors text-left ${
											selectedWorksheet === sheet.name
												? "border-primary bg-primary/5"
												: ""
										}`}
									>
										<FileSpreadsheet className="h-5 w-5 text-green-600" />
										<span className="font-medium">{sheet.name}</span>
									</button>
								))}
							</div>
						)}
					</CardContent>
					<CardFooter>
						<Button variant="outline" onClick={() => setCurrentStep(1)}>
							<ArrowLeft className="h-4 w-4 mr-2" />
							Retour
						</Button>
					</CardFooter>
				</Card>
			);
		}

		// Step 3: Column Mapping
		if (currentStep === 3) {
			const headers = excelData?.values[headerRow] || [];
			const previewRows =
				excelData?.values.slice(headerRow + 1, headerRow + 4) || [];

			return (
				<Card>
					<CardHeader>
						<CardTitle>Mapper les colonnes</CardTitle>
						<CardDescription>
							Associez les colonnes Excel aux champs de deal. Les colonnes
							détectées automatiquement sont pré-remplies.
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-6">
						{/* Header row selector */}
						<div className="flex items-center gap-4">
							<label className="text-sm font-medium">
								Ligne d&apos;en-tête:
							</label>
							<Select
								value={String(headerRow)}
								onValueChange={(v) => setHeaderRow(Number(v))}
							>
								<SelectTrigger className="w-32">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{[0, 1, 2, 3, 4].map((i) => (
										<SelectItem key={i} value={String(i)}>
											Ligne {i + 1}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						{/* Column mappings */}
						<div className="space-y-3">
							<p className="text-sm font-medium">Colonnes Excel:</p>
							<div className="grid gap-3">
								{headers.map((header, index) => {
									const mapping = columnMappings.find(
										(m) => m.excelColumn === index,
									);
									return (
										<div
											key={index}
											className="flex items-center gap-4 p-3 rounded-lg bg-muted/50"
										>
											<div className="flex-1 min-w-0">
												<p className="font-medium truncate">
													{String(header) || `Colonne ${index + 1}`}
												</p>
												<p className="text-xs text-muted-foreground truncate">
													Ex: {previewRows[0]?.[index] ?? "-"}
												</p>
											</div>
											<ChevronRight className="h-4 w-4 text-muted-foreground" />
											<Select
												value={mapping?.field || ""}
												onValueChange={(v) => updateMapping(index, v)}
											>
												<SelectTrigger className="w-48">
													<SelectValue placeholder="Ignorer" />
												</SelectTrigger>
												<SelectContent>
													<SelectItem value="">Ignorer</SelectItem>
													{DEAL_FIELDS.map((field) => (
														<SelectItem key={field.field} value={field.field}>
															{field.label}
															{field.required && " *"}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
										</div>
									);
								})}
							</div>
						</div>

						{/* Mapping summary */}
						<div className="rounded-lg border p-4">
							<p className="text-sm font-medium mb-2">Mapping actuel:</p>
							<div className="flex flex-wrap gap-2">
								{columnMappings.length === 0 ? (
									<p className="text-sm text-muted-foreground">
										Aucune colonne mappée
									</p>
								) : (
									columnMappings.map((m) => (
										<Badge key={m.field} variant="secondary">
											{headers[m.excelColumn]} → {m.label}
										</Badge>
									))
								)}
							</div>
						</div>
					</CardContent>
					<CardFooter className="flex justify-between">
						<Button variant="outline" onClick={() => setCurrentStep(2)}>
							<ArrowLeft className="h-4 w-4 mr-2" />
							Retour
						</Button>
						<Button
							onClick={handleImport}
							disabled={columnMappings.length === 0 || isImporting}
						>
							{isImporting ? (
								<Loader2 className="h-4 w-4 animate-spin mr-2" />
							) : (
								<Upload className="h-4 w-4 mr-2" />
							)}
							Importer {excelData ? excelData.rowCount - headerRow - 1 : 0}{" "}
							lignes
						</Button>
					</CardFooter>
				</Card>
			);
		}

		// Step 4: Results
		if (currentStep === 4) {
			return (
				<Card>
					<CardHeader>
						<CardTitle>Import terminé</CardTitle>
						<CardDescription>
							Résumé de l&apos;import depuis {selectedFile?.name}
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-6">
						<div className="flex items-center justify-center py-8">
							<div className="text-center">
								<div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center mx-auto mb-4">
									<Check className="h-8 w-8 text-green-600" />
								</div>
								<p className="text-2xl font-bold">
									{importResults?.success || 0}
								</p>
								<p className="text-muted-foreground">
									deals importés avec succès
								</p>
							</div>
						</div>

						{importResults?.errors && importResults.errors.length > 0 && (
							<div className="rounded-lg border border-destructive/50 p-4">
								<p className="text-sm font-medium text-destructive mb-2">
									{importResults.errors.length} erreur(s):
								</p>
								<ul className="text-sm text-muted-foreground space-y-1">
									{importResults.errors.slice(0, 5).map((err, i) => (
										<li key={i} className="flex items-start gap-2">
											<X className="h-4 w-4 text-destructive mt-0.5" />
											{err}
										</li>
									))}
									{importResults.errors.length > 5 && (
										<li className="text-muted-foreground">
											... et {importResults.errors.length - 5} autres erreurs
										</li>
									)}
								</ul>
							</div>
						)}
					</CardContent>
					<CardFooter className="flex justify-between">
						<Button
							variant="outline"
							onClick={() => {
								setCurrentStep(1);
								setSelectedFile(null);
								setWorksheets([]);
								setExcelData(null);
								setColumnMappings([]);
								setImportResults(null);
							}}
						>
							<RefreshCw className="h-4 w-4 mr-2" />
							Nouvel import
						</Button>
						<Button asChild>
							<Link href="/admin/crm">
								Voir les deals
								<ArrowRight className="h-4 w-4 ml-2" />
							</Link>
						</Button>
					</CardFooter>
				</Card>
			);
		}

		return null;
	};

	return (
		<div className="space-y-6 p-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold">Import Excel</h1>
					<p className="text-muted-foreground">
						Importez vos deals depuis un fichier Excel ou OneDrive.
					</p>
				</div>
				<Button variant="outline" asChild>
					<Link href="/admin/crm">
						<X className="h-4 w-4 mr-2" />
						Annuler
					</Link>
				</Button>
			</div>

			{/* Step indicator */}
			<StepIndicator currentStep={currentStep} />

			{/* Step content */}
			{renderStepContent()}
		</div>
	);
}
