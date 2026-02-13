"use client";

/**
 * DealDocuments - Shows all related documents for a deal
 *
 * Displays:
 * - Colab documents
 * - Numbers tools (fee calcs, models, comparables, etc.)
 * - Quick links to open each document
 */

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
	FileText,
	Calculator,
	FileSpreadsheet,
	BarChart3,
	Calendar,
	CheckSquare,
	FileIcon,
	Loader2,
	ExternalLink,
	FolderOpen,
} from "lucide-react";

// Colab is an external app
const COLAB_URL =
	process.env.NEXT_PUBLIC_ALECIA_COLAB_URL || "https://colab.alecia.markets";

interface DealDocumentsProps {
	dealId: string;
	compact?: boolean;
}

const DOCUMENT_TYPE_CONFIG = {
	document: {
		icon: FileText,
		label: "Document Colab",
		color: "text-blue-500",
		basePath: "/admin/colab/documents",
	},
	"fee-calculator": {
		icon: Calculator,
		label: "Calculateur Fees",
		color: "text-emerald-500",
		basePath: "/admin/numbers/fee-calculator",
	},
	"financial-model": {
		icon: FileSpreadsheet,
		label: "Modele Financier",
		color: "text-indigo-500",
		basePath: "/admin/numbers/financial-model",
	},
	comparables: {
		icon: BarChart3,
		label: "Comparables",
		color: "text-purple-500",
		basePath: "/admin/numbers/comparables",
	},
	timeline: {
		icon: Calendar,
		label: "Timeline",
		color: "text-orange-500",
		basePath: "/admin/numbers/timeline",
	},
	"teaser-tracking": {
		icon: FileIcon,
		label: "Teaser",
		color: "text-pink-500",
		basePath: "/admin/numbers/teaser-tracking",
	},
	"post-deal": {
		icon: CheckSquare,
		label: "Post-Deal",
		color: "text-teal-500",
		basePath: "/admin/numbers/post-deal",
	},
} as const;

type DocumentType = keyof typeof DOCUMENT_TYPE_CONFIG;

interface DocumentItem {
	id: string;
	title: string;
	updatedAt: number;
	type: DocumentType;
}

export function DealDocuments({ dealId, compact = false }: DealDocumentsProps) {
	const router = useRouter();

	const [documents, setDocuments] = useState<any>(undefined);

	useEffect(() => {
		// TODO: Replace with actual getDealDocuments server action when available
		// Example: getDealDocuments({ dealId }).then(setDocuments);

		// For now, returning empty state to prevent errors
		setDocuments({
			colab: { documents: [] },
			numbers: {
				feeCalculations: [],
				financialModels: [],
				comparables: [],
				timelines: [],
				teaserTracking: [],
				postDeal: [],
			},
			counts: {
				total: 0,
				colabDocuments: 0,
				feeCalculations: 0,
				financialModels: 0,
				comparables: 0,
			},
		});
	}, [dealId]);

	if (documents === undefined) {
		return (
			<div className="flex items-center justify-center py-4">
				<Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
			</div>
		);
	}

	if (!documents) {
		return (
			<p className="text-sm text-muted-foreground text-center py-4">
				Deal non trouve
			</p>
		);
	}

	// Flatten all documents into a single list
	const allDocuments: DocumentItem[] = [
		...documents.colab.documents,
		...documents.numbers.feeCalculations,
		...documents.numbers.financialModels,
		...documents.numbers.comparables,
		...documents.numbers.timelines,
		...documents.numbers.teaserTracking,
		...documents.numbers.postDeal,
	].sort((a, b) => b.updatedAt - a.updatedAt);

	const handleOpenDocument = (doc: DocumentItem) => {
		const config = DOCUMENT_TYPE_CONFIG[doc.type];
		if (doc.type === "document") {
			// Colab documents open in external Colab app
			window.open(`${COLAB_URL}/documents/${doc.id}`, "_blank");
		} else {
			// Numbers tools open internally
			router.push(`${config.basePath}?id=${doc.id}`);
		}
	};

	if (documents.counts.total === 0) {
		return (
			<div className="text-center py-6">
				<FolderOpen className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
				<p className="text-sm text-muted-foreground">
					Aucun document lie a ce deal
				</p>
				<p className="text-xs text-muted-foreground mt-1">
					Creez des documents dans Colab ou Numbers pour les voir ici
				</p>
			</div>
		);
	}

	if (compact) {
		return (
			<div className="space-y-1">
				<div className="flex items-center justify-between px-2 py-1">
					<span className="text-xs font-medium text-muted-foreground">
						Documents ({documents.counts.total})
					</span>
				</div>
				{allDocuments.slice(0, 5).map((doc) => {
					const config = DOCUMENT_TYPE_CONFIG[doc.type];
					const Icon = config.icon;
					return (
						<button
							type="button"
							key={`${doc.type}-${doc.id}`}
							onClick={() => handleOpenDocument(doc)}
							className="w-full flex items-center gap-2 px-2 py-1.5 text-sm hover:bg-muted rounded-md transition-colors text-left"
						>
							<Icon className={`h-3.5 w-3.5 ${config.color}`} />
							<span className="truncate flex-1">{doc.title}</span>
							<ExternalLink className="h-3 w-3 text-muted-foreground" />
						</button>
					);
				})}
				{allDocuments.length > 5 && (
					<p className="text-xs text-muted-foreground text-center py-1">
						+{allDocuments.length - 5} autres documents
					</p>
				)}
			</div>
		);
	}

	return (
		<div className="space-y-4">
			{/* Summary badges */}
			<div className="flex flex-wrap gap-2">
				{documents.counts.colabDocuments > 0 && (
					<Badge variant="secondary" className="gap-1">
						<FileText className="h-3 w-3" />
						{documents.counts.colabDocuments} docs Colab
					</Badge>
				)}
				{documents.counts.feeCalculations > 0 && (
					<Badge variant="secondary" className="gap-1">
						<Calculator className="h-3 w-3" />
						{documents.counts.feeCalculations} calculs
					</Badge>
				)}
				{documents.counts.financialModels > 0 && (
					<Badge variant="secondary" className="gap-1">
						<FileSpreadsheet className="h-3 w-3" />
						{documents.counts.financialModels} modeles
					</Badge>
				)}
				{documents.counts.comparables > 0 && (
					<Badge variant="secondary" className="gap-1">
						<BarChart3 className="h-3 w-3" />
						{documents.counts.comparables} comparables
					</Badge>
				)}
			</div>

			{/* Document list */}
			<div className="space-y-2">
				{allDocuments.map((doc) => {
					const config = DOCUMENT_TYPE_CONFIG[doc.type];
					const Icon = config.icon;
					return (
						<div
							key={`${doc.type}-${doc.id}`}
							className="flex items-center justify-between p-2 border rounded-lg hover:bg-muted/50 transition-colors"
						>
							<div className="flex items-center gap-3 min-w-0">
								<div
									className={`p-2 rounded-md bg-muted ${config.color}`}
								>
									<Icon className="h-4 w-4" />
								</div>
								<div className="min-w-0">
									<p className="font-medium text-sm truncate">
										{doc.title}
									</p>
									<p className="text-xs text-muted-foreground">
										{config.label}
									</p>
								</div>
							</div>
							<Button
								variant="ghost"
								size="sm"
								onClick={() => handleOpenDocument(doc)}
							>
								<ExternalLink className="h-4 w-4" />
							</Button>
						</div>
					);
				})}
			</div>
		</div>
	);
}
