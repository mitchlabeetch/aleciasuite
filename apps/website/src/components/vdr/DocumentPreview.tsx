"use client";

/**
 * Document Preview Component for Virtual Data Rooms
 *
 * Supports:
 * - PDF files (native browser preview or pdf.js)
 * - Office files (Word, Excel, PowerPoint) via Microsoft Office Online Viewer
 * - Images (native browser display)
 * - Text files (code preview with syntax highlighting)
 */

import { useState } from "react";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
	Download,
	ExternalLink,
	ZoomIn,
	ZoomOut,
	RotateCw,
	X,
	FileText,
	FileSpreadsheet,
	Presentation,
	File,
	Loader2,
	AlertCircle,
} from "lucide-react";

interface DocumentPreviewProps {
	/** Document URL from Convex storage */
	url: string;
	/** File name for display and type detection */
	fileName: string;
	/** File MIME type */
	fileType: string;
	/** Whether the dialog is open */
	isOpen: boolean;
	/** Callback to close the dialog */
	onClose: () => void;
	/** Optional callback when downloading */
	onDownload?: () => void;
	/** Whether downloads are restricted */
	downloadRestricted?: boolean;
	/** Watermark text to display */
	watermarkText?: string;
}

// Detect file category from name or MIME type
function getFileCategory(fileName: string, fileType: string): string {
	const ext = fileName.toLowerCase().split(".").pop() || "";

	// PDF
	if (ext === "pdf" || fileType === "application/pdf") {
		return "pdf";
	}

	// Word documents
	if (
		ext === "doc" ||
		ext === "docx" ||
		fileType.includes("word") ||
		fileType.includes("document")
	) {
		return "word";
	}

	// Excel spreadsheets
	if (
		ext === "xls" ||
		ext === "xlsx" ||
		fileType.includes("excel") ||
		fileType.includes("spreadsheet")
	) {
		return "excel";
	}

	// PowerPoint presentations
	if (
		ext === "ppt" ||
		ext === "pptx" ||
		fileType.includes("powerpoint") ||
		fileType.includes("presentation")
	) {
		return "powerpoint";
	}

	// Images
	if (fileType.startsWith("image/")) {
		return "image";
	}

	// Text/Code files
	if (
		fileType.startsWith("text/") ||
		["txt", "md", "json", "xml", "csv", "html", "css", "js", "ts"].includes(ext)
	) {
		return "text";
	}

	return "unknown";
}

// Get icon for file category
function getCategoryIcon(category: string) {
	switch (category) {
		case "pdf":
			return FileText;
		case "word":
			return FileText;
		case "excel":
			return FileSpreadsheet;
		case "powerpoint":
			return Presentation;
		default:
			return File;
	}
}

// Generate Microsoft Office Online viewer URL
function getOfficeViewerUrl(documentUrl: string): string {
	// Microsoft Office Online Viewer
	const encodedUrl = encodeURIComponent(documentUrl);
	return `https://view.officeapps.live.com/op/embed.aspx?src=${encodedUrl}`;
}

// Generate Google Docs viewer URL (fallback)
function getGoogleDocsViewerUrl(documentUrl: string): string {
	const encodedUrl = encodeURIComponent(documentUrl);
	return `https://docs.google.com/viewer?url=${encodedUrl}&embedded=true`;
}

/**
 * PDF Viewer Component
 * Uses native browser PDF rendering via iframe
 */
function PDFViewer({
	url,
	watermarkText,
}: {
	url: string;
	watermarkText?: string;
}) {
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	return (
		<div className="relative w-full h-full min-h-150">
			{isLoading && (
				<div className="absolute inset-0 flex items-center justify-center bg-muted/50">
					<Loader2 className="h-8 w-8 animate-spin text-primary" />
				</div>
			)}
			{error && (
				<div className="absolute inset-0 flex flex-col items-center justify-center bg-muted/50">
					<AlertCircle className="h-8 w-8 text-destructive mb-2" />
					<p className="text-sm text-muted-foreground">{error}</p>
				</div>
			)}
			<iframe
				src={`${url}#toolbar=0&navpanes=0`}
				className="w-full h-full min-h-150 border-0"
				onLoad={() => setIsLoading(false)}
				onError={() => {
					setIsLoading(false);
					setError("Unable to load PDF");
				}}
				title="PDF Preview"
			/>
			{watermarkText && (
				<div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-10">
					<p
						className="text-4xl font-bold text-gray-500 transform -rotate-45 select-none"
						style={{ whiteSpace: "nowrap" }}
					>
						{watermarkText}
					</p>
				</div>
			)}
		</div>
	);
}

/**
 * Office Document Viewer Component
 * Uses Microsoft Office Online Viewer or Google Docs Viewer as fallback
 */
function OfficeViewer({
	url,
	category,
}: {
	url: string;
	category: "word" | "excel" | "powerpoint";
}) {
	const [viewerType, setViewerType] = useState<"microsoft" | "google">(
		"microsoft",
	);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const viewerUrl =
		viewerType === "microsoft"
			? getOfficeViewerUrl(url)
			: getGoogleDocsViewerUrl(url);

	const handleError = () => {
		if (viewerType === "microsoft") {
			// Try Google Docs viewer as fallback
			setViewerType("google");
			setIsLoading(true);
			setError(null);
		} else {
			setIsLoading(false);
			setError("Unable to preview this document. Please download it instead.");
		}
	};

	const CategoryIcon = getCategoryIcon(category);

	return (
		<div className="relative w-full h-full min-h-150">
			{isLoading && (
				<div className="absolute inset-0 flex flex-col items-center justify-center bg-muted/50">
					<Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
					<p className="text-sm text-muted-foreground">
						Loading document preview...
					</p>
				</div>
			)}
			{error && (
				<div className="absolute inset-0 flex flex-col items-center justify-center bg-muted/50">
					<CategoryIcon className="h-12 w-12 text-muted-foreground mb-4" />
					<p className="text-sm text-muted-foreground mb-4">{error}</p>
				</div>
			)}
			<iframe
				src={viewerUrl}
				className="w-full h-full min-h-150 border-0"
				onLoad={() => setIsLoading(false)}
				onError={handleError}
				title="Document Preview"
				sandbox="allow-scripts allow-same-origin allow-popups"
			/>
		</div>
	);
}

/**
 * Image Viewer Component
 * Native image display with zoom controls
 */
function ImageViewer({ url, _fileName }: { url: string; _fileName: string }) {
	const [zoom, setZoom] = useState(100);
	const [rotation, setRotation] = useState(0);

	return (
		<div className="relative w-full h-full min-h-150 flex flex-col">
			{/* Controls */}
			<div className="flex items-center justify-center gap-2 p-2 border-b bg-muted/30">
				<Button
					variant="ghost"
					size="icon"
					onClick={() => setZoom(Math.max(25, zoom - 25))}
					disabled={zoom <= 25}
				>
					<ZoomOut className="h-4 w-4" />
				</Button>
				<span className="text-sm w-16 text-center">{zoom}%</span>
				<Button
					variant="ghost"
					size="icon"
					onClick={() => setZoom(Math.min(200, zoom + 25))}
					disabled={zoom >= 200}
				>
					<ZoomIn className="h-4 w-4" />
				</Button>
				<div className="w-px h-4 bg-border mx-2" />
				<Button
					variant="ghost"
					size="icon"
					onClick={() => setRotation((rotation + 90) % 360)}
				>
					<RotateCw className="h-4 w-4" />
				</Button>
			</div>

			{/* Image display */}
			<div className="flex-1 overflow-auto flex items-center justify-center p-4 bg-muted/20">
				<img
					src={url}
					alt={_fileName}
					style={{
						transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
						transition: "transform 0.2s ease",
						maxWidth: "100%",
						maxHeight: "100%",
						objectFit: "contain",
					}}
				/>
			</div>
		</div>
	);
}

/**
 * Unsupported File Type Component
 */
function UnsupportedViewer({
	fileName,
	fileType,
	onDownload,
}: {
	fileName: string;
	fileType: string;
	onDownload?: () => void;
}) {
	return (
		<div className="flex flex-col items-center justify-center h-full min-h-100 p-8">
			<File className="h-16 w-16 text-muted-foreground mb-4" />
			<h3 className="text-lg font-semibold mb-2">Preview not available</h3>
			<p className="text-sm text-muted-foreground text-center mb-6">
				This file type ({fileType || "unknown"}) cannot be previewed in the
				browser.
			</p>
			{onDownload && (
				<Button onClick={onDownload}>
					<Download className="h-4 w-4 mr-2" />
					Download to view
				</Button>
			)}
		</div>
	);
}

/**
 * Main Document Preview Modal
 */
export function DocumentPreview({
	url,
	fileName,
	fileType,
	isOpen,
	onClose,
	onDownload,
	downloadRestricted = false,
	watermarkText,
}: DocumentPreviewProps) {
	const category = getFileCategory(fileName, fileType);
	const CategoryIcon = getCategoryIcon(category);

	const handleDownload = () => {
		if (downloadRestricted) return;

		if (onDownload) {
			onDownload();
		}

		// Trigger download
		const link = document.createElement("a");
		link.href = url;
		link.download = fileName;
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	};

	const handleOpenExternal = () => {
		window.open(url, "_blank");
	};

	return (
		<Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
			<DialogContent className="max-w-5xl w-[95vw] h-[90vh] flex flex-col p-0">
				{/* Header */}
				<DialogHeader className="flex flex-row items-center justify-between p-4 border-b space-y-0">
					<div className="flex items-center gap-3">
						<div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
							<CategoryIcon className="h-5 w-5 text-primary" />
						</div>
						<div>
							<DialogTitle className="text-base font-medium">
								{fileName}
							</DialogTitle>
							<div className="flex items-center gap-2 mt-0.5">
								<Badge variant="secondary" className="text-xs">
									{category.toUpperCase()}
								</Badge>
								{watermarkText && (
									<Badge variant="outline" className="text-xs">
										Watermarked
									</Badge>
								)}
							</div>
						</div>
					</div>
					<div className="flex items-center gap-2">
						<Button variant="outline" size="sm" onClick={handleOpenExternal}>
							<ExternalLink className="h-4 w-4 mr-2" />
							Open in new tab
						</Button>
						{!downloadRestricted && (
							<Button size="sm" onClick={handleDownload}>
								<Download className="h-4 w-4 mr-2" />
								Download
							</Button>
						)}
						<Button variant="ghost" size="icon" onClick={onClose}>
							<X className="h-4 w-4" />
						</Button>
					</div>
				</DialogHeader>

				{/* Preview content */}
				<div className="flex-1 overflow-hidden">
					{category === "pdf" && (
						<PDFViewer url={url} watermarkText={watermarkText} />
					)}
					{(category === "word" ||
						category === "excel" ||
						category === "powerpoint") && (
						<OfficeViewer
							url={url}
							category={category as "word" | "excel" | "powerpoint"}
						/>
					)}
					{category === "image" && (
						<ImageViewer url={url} _fileName={fileName} />
					)}
					{(category === "unknown" || category === "text") && (
						<UnsupportedViewer
							fileName={fileName}
							fileType={fileType}
							onDownload={downloadRestricted ? undefined : handleDownload}
						/>
					)}
				</div>

				{/* Download restricted notice */}
				{downloadRestricted && (
					<div className="p-3 border-t bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 text-sm text-center">
						Downloads are restricted for this data room. View only.
					</div>
				)}
			</DialogContent>
		</Dialog>
	);
}

export default DocumentPreview;
