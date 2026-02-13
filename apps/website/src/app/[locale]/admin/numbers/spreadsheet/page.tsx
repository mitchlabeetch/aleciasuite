"use client";

/**
 * Alecia Numbers - Spreadsheet Editor
 *
 * Full spreadsheet functionality powered by Fortune Sheet:
 * - Excel-like editing experience
 * - Formula support
 * - Cell formatting
 * - Multiple sheets
 * - Import/Export
 */

import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import dynamic from "next/dynamic";
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
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	FileSpreadsheet,
	ArrowLeft,
	Download,
	Save,
	Upload,
	Plus,
	FileText,
	Calculator,
	TrendingUp,
	ClipboardCheck,
	BarChart3,
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

// Dynamic import of Fortune Sheet to avoid SSR issues
const Workbook = dynamic(
	() => import("@fortune-sheet/react").then((mod) => mod.Workbook),
	{
		ssr: false,
		loading: () => (
			<div className="flex items-center justify-center h-[600px] bg-muted/30 rounded-lg">
				<div className="text-center">
					<FileSpreadsheet className="h-12 w-12 mx-auto text-muted-foreground animate-pulse" />
					<p className="mt-2 text-muted-foreground">Chargement du spreadsheet...</p>
				</div>
			</div>
		),
	}
);

interface Template {
	id: string;
	name: string;
	description: string;
	icon: React.ElementType;
	data: SheetData[];
}

interface CellData {
	r: number;
	c: number;
	v: {
		v?: string | number;
		m?: string;
		f?: string;
		ct?: { fa: string; t: string };
		bg?: string;
		fc?: string;
		ff?: string;
		fs?: number;
		bl?: number;
		it?: number;
	};
}

interface SheetData {
	name: string;
	color?: string;
	celldata?: CellData[];
	row?: number;
	column?: number;
}

// Template data
const templates: Template[] = [
	{
		id: "blank",
		name: "Feuille vierge",
		description: "Commencer avec une feuille vide",
		icon: FileText,
		data: [
			{
				name: "Feuille 1",
				celldata: [],
				row: 100,
				column: 26,
			},
		],
	},
	{
		id: "fee-calculator",
		name: "Calculateur Honoraires",
		description: "Template avec formule Lehman",
		icon: Calculator,
		data: [
			{
				name: "Honoraires",
				color: "#10b981",
				row: 40,
				column: 10,
				celldata: [
					// Title
					{ r: 0, c: 0, v: { v: "CALCULATEUR D'HONORAIRES M&A", m: "CALCULATEUR D'HONORAIRES M&A", bl: 1, fs: 14 } },
					// Headers
					{ r: 2, c: 0, v: { v: "VALEUR DE LA TRANSACTION", m: "VALEUR DE LA TRANSACTION", bl: 1, bg: "#f0fdf4" } },
					{ r: 3, c: 0, v: { v: "Poste", m: "Poste", bl: 1 } },
					{ r: 3, c: 1, v: { v: "Montant (k€)", m: "Montant (k€)", bl: 1 } },
					// Data
					{ r: 4, c: 0, v: { v: "Valorisation entreprise", m: "Valorisation entreprise" } },
					{ r: 4, c: 1, v: { v: 5000, m: "5000" } },
					{ r: 5, c: 0, v: { v: "Dette reprise", m: "Dette reprise" } },
					{ r: 5, c: 1, v: { v: 1000, m: "1000" } },
					{ r: 6, c: 0, v: { v: "Cash disponible", m: "Cash disponible" } },
					{ r: 6, c: 1, v: { v: -300, m: "-300" } },
					{ r: 7, c: 0, v: { v: "VALEUR TOTALE", m: "VALEUR TOTALE", bl: 1 } },
					{ r: 7, c: 1, v: { v: 5700, m: "5700", f: "=B5+B6+B7", bl: 1, bg: "#dcfce7" } },
					// Success Fee section
					{ r: 9, c: 0, v: { v: "SUCCESS FEE (Lehman)", m: "SUCCESS FEE (Lehman)", bl: 1, bg: "#f0fdf4" } },
					{ r: 10, c: 0, v: { v: "Tranche", m: "Tranche", bl: 1 } },
					{ r: 10, c: 1, v: { v: "Taux", m: "Taux", bl: 1 } },
					{ r: 10, c: 2, v: { v: "Base", m: "Base", bl: 1 } },
					{ r: 10, c: 3, v: { v: "Honoraires", m: "Honoraires", bl: 1 } },
					{ r: 11, c: 0, v: { v: "1er M€", m: "1er M€" } },
					{ r: 11, c: 1, v: { v: "5%", m: "5%" } },
					{ r: 11, c: 2, v: { v: 1000, m: "1000", f: "=MIN(B8,1000)" } },
					{ r: 11, c: 3, v: { v: 50, m: "50", f: "=C12*0.05" } },
					{ r: 12, c: 0, v: { v: "2ème M€", m: "2ème M€" } },
					{ r: 12, c: 1, v: { v: "4%", m: "4%" } },
					{ r: 12, c: 2, v: { v: 1000, m: "1000", f: "=IF(B8>1000,MIN(B8-1000,1000),0)" } },
					{ r: 12, c: 3, v: { v: 40, m: "40", f: "=C13*0.04" } },
					{ r: 13, c: 0, v: { v: "3ème M€", m: "3ème M€" } },
					{ r: 13, c: 1, v: { v: "3%", m: "3%" } },
					{ r: 13, c: 2, v: { v: 1000, m: "1000", f: "=IF(B8>2000,MIN(B8-2000,1000),0)" } },
					{ r: 13, c: 3, v: { v: 30, m: "30", f: "=C14*0.03" } },
					{ r: 14, c: 0, v: { v: "Au-delà", m: "Au-delà" } },
					{ r: 14, c: 1, v: { v: "2%", m: "2%" } },
					{ r: 14, c: 2, v: { v: 2700, m: "2700", f: "=IF(B8>3000,B8-3000,0)" } },
					{ r: 14, c: 3, v: { v: 54, m: "54", f: "=C15*0.02" } },
					{ r: 15, c: 0, v: { v: "TOTAL SUCCESS FEE", m: "TOTAL SUCCESS FEE", bl: 1 } },
					{ r: 15, c: 3, v: { v: 174, m: "174", f: "=SUM(D12:D15)", bl: 1, bg: "#dcfce7" } },
				],
			},
		],
	},
	{
		id: "valuation",
		name: "Multiples Valorisation",
		description: "Analyse par comparables",
		icon: TrendingUp,
		data: [
			{
				name: "Multiples",
				color: "#3b82f6",
				row: 40,
				column: 12,
				celldata: [
					{ r: 0, c: 0, v: { v: "ANALYSE DES MULTIPLES DE VALORISATION", m: "ANALYSE DES MULTIPLES DE VALORISATION", bl: 1, fs: 14 } },
					// Target section
					{ r: 2, c: 0, v: { v: "METRIQUES CIBLE", m: "METRIQUES CIBLE", bl: 1, bg: "#eff6ff" } },
					{ r: 3, c: 0, v: { v: "Chiffre d'affaires", m: "Chiffre d'affaires" } },
					{ r: 3, c: 1, v: { v: 5000, m: "5000" } },
					{ r: 3, c: 2, v: { v: "k€", m: "k€" } },
					{ r: 4, c: 0, v: { v: "EBITDA", m: "EBITDA" } },
					{ r: 4, c: 1, v: { v: 750, m: "750" } },
					{ r: 4, c: 2, v: { v: "k€", m: "k€" } },
					// Comparables
					{ r: 6, c: 0, v: { v: "PANEL COMPARABLES", m: "PANEL COMPARABLES", bl: 1, bg: "#eff6ff" } },
					{ r: 7, c: 0, v: { v: "Societe", m: "Societe", bl: 1 } },
					{ r: 7, c: 1, v: { v: "EV (k€)", m: "EV (k€)", bl: 1 } },
					{ r: 7, c: 2, v: { v: "CA (k€)", m: "CA (k€)", bl: 1 } },
					{ r: 7, c: 3, v: { v: "EBITDA (k€)", m: "EBITDA (k€)", bl: 1 } },
					{ r: 7, c: 4, v: { v: "EV/Sales", m: "EV/Sales", bl: 1 } },
					{ r: 7, c: 5, v: { v: "EV/EBITDA", m: "EV/EBITDA", bl: 1 } },
					// Sample data
					{ r: 8, c: 0, v: { v: "Société A", m: "Société A" } },
					{ r: 8, c: 1, v: { v: 150000, m: "150000" } },
					{ r: 8, c: 2, v: { v: 120000, m: "120000" } },
					{ r: 8, c: 3, v: { v: 25000, m: "25000" } },
					{ r: 8, c: 4, v: { v: 1.25, m: "1.25x", f: "=B9/C9" } },
					{ r: 8, c: 5, v: { v: 6.0, m: "6.0x", f: "=B9/D9" } },
					// Statistics
					{ r: 14, c: 0, v: { v: "STATISTIQUES", m: "STATISTIQUES", bl: 1, bg: "#eff6ff" } },
					{ r: 15, c: 0, v: { v: "Multiple", m: "Multiple", bl: 1 } },
					{ r: 15, c: 1, v: { v: "Médiane", m: "Médiane", bl: 1 } },
					{ r: 15, c: 2, v: { v: "Moyenne", m: "Moyenne", bl: 1 } },
					{ r: 16, c: 0, v: { v: "EV/Sales", m: "EV/Sales" } },
					{ r: 16, c: 1, v: { v: "1.25x", m: "1.25x" } },
					{ r: 17, c: 0, v: { v: "EV/EBITDA", m: "EV/EBITDA" } },
					{ r: 17, c: 1, v: { v: "6.0x", m: "6.0x" } },
					// Valuation
					{ r: 19, c: 0, v: { v: "VALORISATION IMPLICITE", m: "VALORISATION IMPLICITE", bl: 1, bg: "#dcfce7" } },
					{ r: 20, c: 0, v: { v: "Méthode", m: "Méthode", bl: 1 } },
					{ r: 20, c: 1, v: { v: "Multiple", m: "Multiple", bl: 1 } },
					{ r: 20, c: 2, v: { v: "Base", m: "Base", bl: 1 } },
					{ r: 20, c: 3, v: { v: "Valeur (k€)", m: "Valeur (k€)", bl: 1 } },
					{ r: 21, c: 0, v: { v: "EV/Sales", m: "EV/Sales" } },
					{ r: 21, c: 1, v: { v: "1.25x", m: "1.25x" } },
					{ r: 21, c: 2, v: { v: 5000, m: "5000" } },
					{ r: 21, c: 3, v: { v: 6250, m: "6250", f: "=B22*C22", bl: 1, bg: "#bbf7d0" } },
					{ r: 22, c: 0, v: { v: "EV/EBITDA", m: "EV/EBITDA" } },
					{ r: 22, c: 1, v: { v: "6.0x", m: "6.0x" } },
					{ r: 22, c: 2, v: { v: 750, m: "750" } },
					{ r: 22, c: 3, v: { v: 4500, m: "4500", f: "=B23*C23", bl: 1, bg: "#bbf7d0" } },
				],
			},
		],
	},
	{
		id: "pipeline",
		name: "Deal Pipeline",
		description: "Suivi du pipeline de transactions",
		icon: BarChart3,
		data: [
			{
				name: "Pipeline",
				color: "#8b5cf6",
				row: 30,
				column: 15,
				celldata: [
					{ r: 0, c: 0, v: { v: "DEAL PIPELINE", m: "DEAL PIPELINE", bl: 1, fs: 14 } },
					// KPIs
					{ r: 2, c: 0, v: { v: "KPIs", m: "KPIs", bl: 1, bg: "#f5f3ff" } },
					{ r: 3, c: 0, v: { v: "Nombre de deals", m: "Nombre de deals" } },
					{ r: 3, c: 1, v: { v: 12, m: "12", f: "=COUNTA(B9:B100)" } },
					{ r: 4, c: 0, v: { v: "Valeur pipeline (k€)", m: "Valeur pipeline (k€)" } },
					{ r: 4, c: 1, v: { v: 45000, m: "45000", f: "=SUM(F9:F100)" } },
					// Headers
					{ r: 6, c: 0, v: { v: "PIPELINE", m: "PIPELINE", bl: 1, bg: "#f5f3ff" } },
					{ r: 7, c: 0, v: { v: "#", m: "#", bl: 1 } },
					{ r: 7, c: 1, v: { v: "Nom du deal", m: "Nom du deal", bl: 1 } },
					{ r: 7, c: 2, v: { v: "Client", m: "Client", bl: 1 } },
					{ r: 7, c: 3, v: { v: "Type", m: "Type", bl: 1 } },
					{ r: 7, c: 4, v: { v: "Statut", m: "Statut", bl: 1 } },
					{ r: 7, c: 5, v: { v: "Valeur (k€)", m: "Valeur (k€)", bl: 1 } },
					{ r: 7, c: 6, v: { v: "Probabilité", m: "Probabilité", bl: 1 } },
					{ r: 7, c: 7, v: { v: "Valeur pondérée", m: "Valeur pondérée", bl: 1 } },
					// Sample deals
					{ r: 8, c: 0, v: { v: 1, m: "1" } },
					{ r: 8, c: 1, v: { v: "Projet Alpha", m: "Projet Alpha" } },
					{ r: 8, c: 2, v: { v: "Client A", m: "Client A" } },
					{ r: 8, c: 3, v: { v: "Cession", m: "Cession" } },
					{ r: 8, c: 4, v: { v: "Due Diligence", m: "Due Diligence" } },
					{ r: 8, c: 5, v: { v: 15000, m: "15000" } },
					{ r: 8, c: 6, v: { v: 0.6, m: "60%" } },
					{ r: 8, c: 7, v: { v: 9000, m: "9000", f: "=F9*G9" } },
				],
			},
		],
	},
];

export default function SpreadsheetPage() {
	const router = useRouter();
	const [sheetData, setSheetData] = useState<SheetData[]>(templates[0].data);
	const [sheetName, setSheetName] = useState("Nouveau Spreadsheet");
	const [selectedTemplate, setSelectedTemplate] = useState("blank");
	const containerRef = useRef<HTMLDivElement>(null);
	const [containerHeight, setContainerHeight] = useState(600);
	const [selectedDealId, setSelectedDealId] = useState<string | null>(null);
	const [currentSpreadsheetId, setCurrentSpreadsheetId] = useState<string | null>(null);
	const [isSaving, setIsSaving] = useState(false);
	const [showLoadDialog, setShowLoadDialog] = useState(false);
	const [savedSpreadsheets, setSavedSpreadsheets] = useState<any[]>([]);

	// Load saved spreadsheets
	useEffect(() => {
		numbersTools.getUserSpreadsheets(20).then((data) => setSavedSpreadsheets(data || [])).catch(console.error);
	}, []);

	const handleSave = useCallback(async () => {
		const name = sheetName.trim() || `Spreadsheet - ${new Date().toLocaleDateString("fr-FR")}`;

		setIsSaving(true);
		try {
			// TODO: Replace with server action when available
			const id = await numbersTools.saveSpreadsheet({
				id: currentSpreadsheetId ?? undefined,
				dealId: selectedDealId ?? undefined,
				title: name,
				sheetData: sheetData as Record<string, any>,
			});
			setCurrentSpreadsheetId(id as unknown as string);
			setSheetName(name);
			router.refresh();
			toast.success("Spreadsheet sauvegardé");
		} catch (error) {
			console.error("Failed to save spreadsheet:", error);
			toast.error("Erreur lors de la sauvegarde");
		} finally {
			setIsSaving(false);
		}
	}, [router, currentSpreadsheetId, selectedDealId, sheetName, selectedTemplate, sheetData]);

	const handleLoad = useCallback((spreadsheet: any) => {
		try {
			const data = JSON.parse(spreadsheet.sheetData) as SheetData[];
			setSheetData(data);
			setCurrentSpreadsheetId(spreadsheet._id);
			setSheetName(spreadsheet.name);
			setSelectedDealId(spreadsheet.dealId ?? null);
			setSelectedTemplate(spreadsheet.templateId ?? "blank");
			setShowLoadDialog(false);
			toast.success(`Spreadsheet "${spreadsheet.name}" chargé`);
		} catch (error) {
			console.error("Failed to parse spreadsheet data:", error);
			toast.error("Erreur lors du chargement");
		}
	}, []);

	useEffect(() => {
		const updateHeight = () => {
			if (containerRef.current) {
				const rect = containerRef.current.getBoundingClientRect();
				const availableHeight = window.innerHeight - rect.top - 40;
				setContainerHeight(Math.max(500, availableHeight));
			}
		};

		updateHeight();
		window.addEventListener("resize", updateHeight);
		return () => window.removeEventListener("resize", updateHeight);
	}, []);

	const handleTemplateChange = (templateId: string) => {
		const template = templates.find((t) => t.id === templateId);
		if (template) {
			setSelectedTemplate(templateId);
			setSheetData(template.data);
			if (templateId !== "blank") {
				setSheetName(template.name);
			}
		}
	};

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const handleChange = useCallback((data: any) => {
		setSheetData(data as SheetData[]);
	}, []);

	return (
		<div className="flex flex-col h-screen">
			{/* Header */}
			<div className="flex items-center justify-between p-4 border-b bg-background">
				<div className="flex items-center gap-4">
					<Button variant="ghost" size="icon" asChild>
						<Link href="/admin/numbers">
							<ArrowLeft className="h-5 w-5" />
						</Link>
					</Button>
					<div className="flex items-center gap-3">
						<FileSpreadsheet className="h-6 w-6 text-emerald-500" />
						<Input
							value={sheetName}
							onChange={(e) => setSheetName(e.target.value)}
							className="text-lg font-semibold border-none shadow-none focus-visible:ring-0 w-64"
						/>
					</div>
				</div>
				<div className="flex items-center gap-3">
					<Select value={selectedTemplate} onValueChange={handleTemplateChange}>
						<SelectTrigger className="w-[200px]">
							<SelectValue placeholder="Choisir un template" />
						</SelectTrigger>
						<SelectContent>
							{templates.map((template) => {
								const Icon = template.icon;
								return (
									<SelectItem key={template.id} value={template.id}>
										<div className="flex items-center gap-2">
											<Icon className="h-4 w-4" />
											{template.name}
										</div>
									</SelectItem>
								);
							})}
						</SelectContent>
					</Select>
					<DealSelector
						toolId="spreadsheet"
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
								<DialogTitle>Charger un spreadsheet</DialogTitle>
								<DialogDescription>
									Sélectionnez un spreadsheet sauvegardé
								</DialogDescription>
							</DialogHeader>
							<div className="max-h-[400px] overflow-y-auto space-y-2">
								{savedSpreadsheets?.length === 0 && (
									<p className="text-muted-foreground text-center py-4">
										Aucun spreadsheet sauvegardé
									</p>
								)}
								{savedSpreadsheets?.map((s: any) => (
									<button
										key={s._id}
										type="button"
										onClick={() => handleLoad(s)}
										className="w-full p-3 text-left rounded-lg border hover:bg-muted/50 transition-colors"
									>
										<div className="font-medium">{s.name}</div>
										<div className="text-sm text-muted-foreground">
											Template: {s.templateId || "Vierge"}
										</div>
										<div className="text-xs text-muted-foreground">
											{new Date(s.updatedAt).toLocaleDateString("fr-FR")}
										</div>
									</button>
								))}
							</div>
						</DialogContent>
					</Dialog>
					<Button variant="outline" type="button">
						<Upload className="h-4 w-4 mr-2" />
						Importer
					</Button>
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
						Exporter Excel
					</Button>
				</div>
			</div>

			{/* Spreadsheet */}
			<div ref={containerRef} className="flex-1 overflow-hidden" style={{ height: containerHeight }}>
				<Workbook
					data={sheetData}
					onChange={handleChange}
					lang="fr"
					showSheetTabs
					showToolbar
					showFormulaBar
					allowEdit
					row={100}
					column={26}
				/>
			</div>
		</div>
	);
}
