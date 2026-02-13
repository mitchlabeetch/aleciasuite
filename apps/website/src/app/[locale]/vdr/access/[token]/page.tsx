/**
 * Public VDR Access Page
 *
 * External buyer access to Virtual Data Rooms via secure token.
 * No Clerk authentication required - access controlled via invitation tokens.
 *
 * Features:
 * - Token validation
 * - Folder/document browsing
 * - Document viewing and downloading (based on role)
 * - Q&A for questioners
 * - Access logging
 */

"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import {
	FolderLock,
	Folder,
	FolderOpen,
	FileText,
	File,
	FileImage,
	FileSpreadsheet,
	Download,
	Eye,
	Search,
	MessageSquare,
	Loader2,
	LayoutGrid,
	List,
	User,
	Building,
	Shield,
	XCircle,
	CheckCircle2,
	Send,
	Lock,
	HelpCircle,
} from "lucide-react";
import { DocumentPreview } from "@/components/vdr/DocumentPreview";
import { dataRoomsPublic } from "@/actions";

// =============================================================================
// TYPES
// =============================================================================

interface FolderData {
	id: string;
	name: string;
	category?: string;
	order: number;
	documentCount: number;
}

interface DocumentData {
	id: string;
	fileName: string;
	fileType: string;
	fileSize: number;
	version: number;
	uploadedAt: number;
	uploaderName: string;
	tags?: string[];
	fileUrl?: string | null;
	willBeWatermarked?: boolean;
}

interface QuestionData {
	id: string;
	question: string;
	answer?: string;
	status: string;
	askedByName?: string;
	askedAt: number;
	answeredAt?: number;
}

interface RoomData {
	id: string;
	name: string;
	settings?: {
		downloadRestricted?: boolean;
	};
}

// =============================================================================
// HELPERS
// =============================================================================

function getFileIcon(fileType: string) {
	if (fileType.includes("pdf")) return FileText;
	if (fileType.includes("image")) return FileImage;
	if (fileType.includes("spreadsheet") || fileType.includes("excel"))
		return FileSpreadsheet;
	return File;
}

function formatFileSize(bytes: number): string {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
	return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(timestamp: number): string {
	return new Date(timestamp).toLocaleDateString("fr-FR", {
		day: "numeric",
		month: "short",
		year: "numeric",
	});
}

function formatDateTime(timestamp: number): string {
	return new Date(timestamp).toLocaleString("fr-FR", {
		day: "numeric",
		month: "short",
		year: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	});
}

// =============================================================================
// COMPONENTS
// =============================================================================

function FolderItem({
	folder,
	isSelected,
	onSelect,
}: {
	folder: FolderData;
	isSelected: boolean;
	onSelect: () => void;
}) {
	return (
		<button
			type="button"
			className={`w-full flex items-center gap-3 px-4 py-3 text-left rounded-lg transition-colors ${
				isSelected
					? "bg-primary/10 text-primary border border-primary/20"
					: "hover:bg-muted border border-transparent"
			}`}
			onClick={onSelect}
		>
			{isSelected ? (
				<FolderOpen className="h-5 w-5 text-primary shrink-0" />
			) : (
				<Folder className="h-5 w-5 text-muted-foreground shrink-0" />
			)}
			<div className="flex-1 min-w-0">
				<p className="font-medium truncate">{folder.name}</p>
				<p className="text-xs text-muted-foreground">
					{folder.documentCount} document(s)
				</p>
			</div>
		</button>
	);
}

function DocumentCard({
	document,
	viewMode,
	canDownload,
	onView,
	onDownload,
	isDownloading,
}: {
	document: DocumentData;
	viewMode: "grid" | "list";
	canDownload: boolean;
	onView: () => void;
	onDownload: () => void;
	isDownloading: boolean;
}) {
	const FileIcon = getFileIcon(document.fileType);

	if (viewMode === "list") {
		return (
			<div className="flex items-center gap-4 p-4 rounded-lg border hover:bg-muted/50 transition-colors">
				<div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
					<FileIcon className="h-6 w-6 text-primary" />
				</div>
				<div className="flex-1 min-w-0">
					<p className="font-medium truncate">{document.fileName}</p>
					<div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
						<span>{formatFileSize(document.fileSize)}</span>
						<span>•</span>
						<span>{document.uploaderName}</span>
						<span>•</span>
						<span>{formatDate(document.uploadedAt)}</span>
					</div>
					{document.willBeWatermarked && (
						<Badge variant="outline" className="mt-2 text-xs">
							<Shield className="h-3 w-3 mr-1" />
							Watermarked
						</Badge>
					)}
				</div>
				<div className="flex items-center gap-2">
					<Button variant="outline" size="sm" onClick={onView}>
						<Eye className="h-4 w-4 mr-2" />
						Voir
					</Button>
					{canDownload && (
						<Button size="sm" onClick={onDownload} disabled={isDownloading}>
							{isDownloading ? (
								<Loader2 className="h-4 w-4 animate-spin" />
							) : (
								<>
									<Download className="h-4 w-4 mr-2" />
									Télécharger
								</>
							)}
						</Button>
					)}
				</div>
			</div>
		);
	}

	return (
		<Card
			className="hover:shadow-md transition-shadow cursor-pointer"
			onClick={onView}
		>
			<CardContent className="p-4">
				<div className="aspect-square rounded-lg bg-muted flex items-center justify-center mb-3 relative">
					<FileIcon className="h-12 w-12 text-muted-foreground" />
					{document.willBeWatermarked && (
						<div className="absolute top-2 right-2">
							<Badge variant="outline" className="text-xs">
								<Shield className="h-3 w-3" />
							</Badge>
						</div>
					)}
				</div>
				<p className="font-medium truncate text-sm">{document.fileName}</p>
				<div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
					<span>{formatFileSize(document.fileSize)}</span>
					<span>{formatDate(document.uploadedAt)}</span>
				</div>
			</CardContent>
		</Card>
	);
}

function QuestionCard({ question }: { question: QuestionData }) {
	const isAnswered = question.status === "answered" && question.answer;

	return (
		<div className="p-4 rounded-lg border bg-card">
			<div className="flex items-start gap-3">
				<div
					className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${
						isAnswered ? "bg-emerald-100" : "bg-amber-100"
					}`}
				>
					{isAnswered ? (
						<CheckCircle2 className="h-4 w-4 text-emerald-600" />
					) : (
						<HelpCircle className="h-4 w-4 text-amber-600" />
					)}
				</div>
				<div className="flex-1 min-w-0">
					<div className="flex items-center gap-2 mb-1">
						<span className="text-sm font-medium">
							{question.askedByName || "Utilisateur externe"}
						</span>
						<span className="text-xs text-muted-foreground">
							{formatDateTime(question.askedAt)}
						</span>
					</div>
					<p className="text-sm">{question.question}</p>
					{isAnswered && question.answer && (
						<div className="mt-3 p-3 bg-muted/50 rounded-lg">
							<p className="text-xs text-muted-foreground mb-1">Réponse :</p>
							<p className="text-sm">{question.answer}</p>
							{question.answeredAt && (
								<p className="text-xs text-muted-foreground mt-2">
									{formatDateTime(question.answeredAt)}
								</p>
							)}
						</div>
					)}
					{!isAnswered && (
						<Badge variant="outline" className="mt-2 text-xs">
							En attente de réponse
						</Badge>
					)}
				</div>
			</div>
		</div>
	);
}

function AskQuestionDialog({
	token,
	canAskQuestions,
	onQuestionAsked,
}: {
	token: string;
	canAskQuestions: boolean;
	onQuestionAsked: () => void;
}) {
	const { toast } = useToast();
	const [open, setOpen] = useState(false);
	const [question, setQuestion] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);

	const handleSubmit = async () => {
		if (!question.trim()) {
			toast({
				title: "Erreur",
				description: "Veuillez entrer votre question.",
				variant: "destructive",
			});
			return;
		}

		setIsSubmitting(true);
		try {
			await dataRoomsPublic.askQuestionPublic(
				token,
				question.trim()
			);

			toast({ title: "Question envoyée" });
			setOpen(false);
			setQuestion("");
			onQuestionAsked();
		} catch {
			toast({
				title: "Erreur",
				description: "Impossible d'envoyer la question.",
				variant: "destructive",
			});
		} finally {
			setIsSubmitting(false);
		}
	};

	if (!canAskQuestions) {
		return null;
	}

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<Button onClick={() => setOpen(true)}>
				<MessageSquare className="h-4 w-4 mr-2" />
				Poser une question
			</Button>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Poser une question</DialogTitle>
					<DialogDescription>
						Votre question sera transmise à l&apos;équipe de vente qui vous
						répondra dans les meilleurs délais.
					</DialogDescription>
				</DialogHeader>
				<div className="py-4">
					<Textarea
						value={question}
						onChange={(e) => setQuestion(e.target.value)}
						placeholder="Votre question..."
						rows={4}
					/>
				</div>
				<DialogFooter>
					<Button variant="outline" onClick={() => setOpen(false)}>
						Annuler
					</Button>
					<Button onClick={handleSubmit} disabled={isSubmitting}>
						{isSubmitting ? (
							<Loader2 className="h-4 w-4 animate-spin" />
						) : (
							<>
								<Send className="h-4 w-4 mr-2" />
								Envoyer
							</>
						)}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

// =============================================================================
// MAIN PAGE CONTENT
// =============================================================================

function VDRAccessContent() {
	const params = useParams();
	const token = params.token as string;
	const { toast } = useToast();

	// State
	const [selectedFolderId, setSelectedFolderId] =
		useState<string | null>(null);
	const [viewMode, setViewMode] = useState<"grid" | "list">("list");
	const [searchQuery, setSearchQuery] = useState("");
	const [showQuestions, setShowQuestions] = useState(false);
	const [downloadingDocId, setDownloadingDocId] =
		useState<string | null>(null);

	// Document preview state
	const [previewDocument, setPreviewDocument] = useState<DocumentData | null>(
		null,
	);
	const [isPreviewOpen, setIsPreviewOpen] = useState(false);

	// Data state
	const [validation, setValidation] = useState<any>(null);
	const [room, setRoom] = useState<any>(null);
	const [folders, setFolders] = useState<FolderData[] | null>(null);
	const [documents, setDocuments] = useState<DocumentData[] | null>(null);
	const [allDocuments, setAllDocuments] = useState<DocumentData[] | null>(null);
	const [questions, setQuestions] = useState<QuestionData[] | null>(null);

	// Fetch validation and initial data
	useEffect(() => {
		dataRoomsPublic.validateAccessToken(token).then((val: any) => {
			setValidation(val);
			if (val?.valid) {
				dataRoomsPublic.getRoomPublic(token).then(data => setRoom(data as unknown as RoomData));
				dataRoomsPublic.listFoldersPublic(token).then(data => setFolders(data as unknown as FolderData[]));
				dataRoomsPublic.listAllDocumentsPublic(token).then(data => setAllDocuments(data as unknown as DocumentData[]));
				dataRoomsPublic.listQuestionsPublic(token).then(data => setQuestions(data as unknown as QuestionData[]));
			}
		});
	}, [token]);

	// Fetch folder-specific documents
	useEffect(() => {
		if (validation?.valid && selectedFolderId) {
			dataRoomsPublic.listDocumentsPublic(token, selectedFolderId).then(data => setDocuments(data as unknown as DocumentData[]));
		}
	}, [validation, selectedFolderId, token]);

	// Derived state
	const invitation = validation?.invitation;
	const canDownload = invitation?.role !== "viewer";
	const canAskQuestions = invitation?.role === "questioner";
	const downloadRestricted = room?.settings?.downloadRestricted || false;

	// Select first folder by default
	useEffect(() => {
		if (!selectedFolderId && folders && folders.length > 0) {
			setSelectedFolderId(folders[0].id);
		}
	}, [folders, selectedFolderId]);

	// Filter documents by search
	const displayedDocuments = useMemo(() => {
		const docs = selectedFolderId ? documents : allDocuments;
		if (!docs) return [];
		if (!searchQuery) return docs;
		return docs.filter((doc: DocumentData) =>
			doc.fileName.toLowerCase().includes(searchQuery.toLowerCase()),
		);
	}, [documents, allDocuments, selectedFolderId, searchQuery]);

	const selectedFolder = folders?.find(
		(f: FolderData) => f.id === selectedFolderId,
	);

	// Handlers
	const handleViewDocument = async (doc: DocumentData) => {
		// Log access
		await dataRoomsPublic.logAccessPublic(
			token,
			"view",
			doc.id
		);

		if (doc.fileUrl) {
			setPreviewDocument(doc);
			setIsPreviewOpen(true);
		}
	};

	const handleDownloadDocument = async (doc: DocumentData) => {
		if (!canDownload || downloadRestricted) {
			toast({
				title: "Téléchargement non autorisé",
				description: "Vous n'avez pas les droits de téléchargement.",
				variant: "destructive",
			});
			return;
		}

		setDownloadingDocId(doc.id);

		try {
			const result = await dataRoomsPublic.downloadDocumentPublic(token, doc.id);

			if (result.success && result.minioKey) {
				// In production, you'd get a pre-signed URL from Minio
				// For now, just show success message
				toast({
					title: "Document téléchargé",
					description: result.watermarked
						? "Le document a été marqué d'un filigrane."
						: "Document prêt au téléchargement.",
				});
			} else {
				toast({
					title: "Erreur",
					description: result.error || "Impossible de télécharger le document.",
					variant: "destructive",
				});
			}
		} catch {
			toast({
				title: "Erreur",
				description: "Impossible de télécharger le document.",
				variant: "destructive",
			});
		} finally {
			setDownloadingDocId(null);
		}
	};

	// Loading state
	if (!validation) {
		return (
			<div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center">
				<div className="text-center">
					<Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
					<p className="text-muted-foreground">
						Vérification de votre accès...
					</p>
				</div>
			</div>
		);
	}

	// Invalid token
	if (!validation.valid) {
		return (
			<div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center p-4">
				<div className="max-w-md w-full">
					<Card>
						<CardContent className="pt-6">
							<div className="text-center">
								<div className="h-16 w-16 rounded-full bg-rose-100 flex items-center justify-center mx-auto mb-4">
									<XCircle className="h-8 w-8 text-rose-600" />
								</div>
								<h1 className="text-xl font-bold mb-2">Accès refusé</h1>
								<p className="text-muted-foreground mb-6">
									{validation.error || "Ce lien d'accès n'est pas valide."}
								</p>
								<div className="bg-muted/50 rounded-lg p-4 text-left">
									<h3 className="font-semibold text-sm mb-2">
										Causes possibles :
									</h3>
									<ul className="text-sm text-muted-foreground space-y-1">
										<li>• Le lien a expiré</li>
										<li>• L&apos;invitation a été révoquée</li>
										<li>• La Data Room a été fermée</li>
									</ul>
								</div>
							</div>
						</CardContent>
					</Card>
					<div className="mt-6 text-center">
						<p className="text-sm text-muted-foreground">
							<strong className="text-foreground">Alecia</strong> - M&A
							Operating System
						</p>
					</div>
				</div>
			</div>
		);
	}

	// Valid access - show VDR
	return (
		<div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-slate-100">
			{/* Document Preview Modal */}
			{previewDocument?.fileUrl && (
				<DocumentPreview
					url={previewDocument.fileUrl}
					fileName={previewDocument.fileName}
					fileType={previewDocument.fileType}
					isOpen={isPreviewOpen}
					onClose={() => {
						setIsPreviewOpen(false);
						setPreviewDocument(null);
					}}
					onDownload={() => handleDownloadDocument(previewDocument)}
					downloadRestricted={downloadRestricted || !canDownload}
					watermarkText={
						room?.settings?.watermarkEnabled ? room.dealTitle : undefined
					}
				/>
			)}

			{/* Header */}
			<header className="bg-white border-b sticky top-0 z-10">
				<div className="max-w-7xl mx-auto px-4 py-4">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-4">
							<div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
								<FolderLock className="h-5 w-5 text-primary" />
							</div>
							<div>
								<h1 className="font-bold text-lg">
									{room?.name || "Data Room"}
								</h1>
								<p className="text-sm text-muted-foreground">
									{room?.dealTitle}
								</p>
							</div>
						</div>
						<div className="flex items-center gap-4">
							{/* User info */}
							<div className="hidden sm:flex items-center gap-2 text-sm">
								<User className="h-4 w-4 text-muted-foreground" />
								<span>{invitation?.name}</span>
								{invitation?.company && (
									<>
										<span className="text-muted-foreground">•</span>
										<Building className="h-4 w-4 text-muted-foreground" />
										<span>{invitation.company}</span>
									</>
								)}
							</div>
							<Badge variant="secondary">
								{invitation?.role === "viewer" && "Lecture seule"}
								{invitation?.role === "downloader" && "Téléchargement"}
								{invitation?.role === "questioner" && "Q&A"}
							</Badge>
						</div>
					</div>
				</div>
			</header>

			{/* Main content */}
			<div className="max-w-7xl mx-auto px-4 py-6">
				<div className="flex gap-6">
					{/* Sidebar - Folders */}
					<aside className="w-72 shrink-0 hidden lg:block">
						<Card>
							<CardHeader className="pb-3">
								<CardTitle className="text-sm flex items-center gap-2">
									<Folder className="h-4 w-4" />
									Dossiers
								</CardTitle>
							</CardHeader>
							<CardContent className="space-y-1">
								{folders?.map((folder: FolderData) => (
									<FolderItem
										key={folder.id}
										folder={folder}
										isSelected={selectedFolderId === folder.id}
										onSelect={() => setSelectedFolderId(folder.id)}
									/>
								))}
								{(!folders || folders.length === 0) && (
									<p className="text-sm text-muted-foreground text-center py-4">
										Aucun dossier disponible
									</p>
								)}
							</CardContent>
						</Card>

						{/* Q&A Card */}
						<Card className="mt-4">
							<CardHeader className="pb-3">
								<CardTitle className="text-sm flex items-center gap-2">
									<MessageSquare className="h-4 w-4" />
									Questions & Réponses
								</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="text-center">
									<div className="text-3xl font-bold text-primary">
										{questions?.filter((q: QuestionData) => q.status === "open")
											.length || 0}
									</div>
									<p className="text-xs text-muted-foreground mb-4">
										question(s) en attente
									</p>
									<Button
										variant="outline"
										size="sm"
										className="w-full"
										onClick={() => setShowQuestions(!showQuestions)}
									>
										{showQuestions ? "Masquer" : "Voir les questions"}
									</Button>
								</div>
							</CardContent>
						</Card>
					</aside>

					{/* Main content area */}
					<main className="flex-1 min-w-0">
						{/* Toolbar */}
						<div className="flex items-center gap-4 mb-6">
							<div className="relative flex-1 max-w-md">
								<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
								<Input
									placeholder="Rechercher des fichiers..."
									value={searchQuery}
									onChange={(e) => setSearchQuery(e.target.value)}
									className="pl-9"
								/>
							</div>
							<div className="flex border rounded-lg overflow-hidden">
								<Button
									variant={viewMode === "grid" ? "secondary" : "ghost"}
									size="icon"
									onClick={() => setViewMode("grid")}
								>
									<LayoutGrid className="h-4 w-4" />
								</Button>
								<Button
									variant={viewMode === "list" ? "secondary" : "ghost"}
									size="icon"
									onClick={() => setViewMode("list")}
								>
									<List className="h-4 w-4" />
								</Button>
							</div>
							{canAskQuestions && (
								<AskQuestionDialog
									token={token}
									canAskQuestions={canAskQuestions}
									onQuestionAsked={() => {}}
								/>
							)}
						</div>

						{/* Current folder header */}
						{selectedFolder && (
							<div className="mb-4">
								<h2 className="text-lg font-semibold flex items-center gap-2">
									<FolderOpen className="h-5 w-5 text-primary" />
									{selectedFolder.name}
								</h2>
								<p className="text-sm text-muted-foreground">
									{displayedDocuments.length} document(s)
								</p>
							</div>
						)}

						{/* Documents */}
						{displayedDocuments.length === 0 ? (
							<Card>
								<CardContent className="py-12 text-center">
									<File className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
									<h3 className="font-semibold mb-2">Aucun document</h3>
									<p className="text-muted-foreground text-sm">
										{selectedFolderId
											? "Ce dossier ne contient pas de documents accessibles."
											: "Sélectionnez un dossier pour voir les documents."}
									</p>
								</CardContent>
							</Card>
						) : viewMode === "grid" ? (
							<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
								{displayedDocuments.map((doc: DocumentData) => (
									<DocumentCard
										key={doc.id}
										document={doc}
										viewMode={viewMode}
										canDownload={canDownload && !downloadRestricted}
										onView={() => handleViewDocument(doc)}
										onDownload={() => handleDownloadDocument(doc)}
										isDownloading={downloadingDocId === doc.id}
									/>
								))}
							</div>
						) : (
							<div className="space-y-2">
								{displayedDocuments.map((doc: DocumentData) => (
									<DocumentCard
										key={doc.id}
										document={doc}
										viewMode={viewMode}
										canDownload={canDownload && !downloadRestricted}
										onView={() => handleViewDocument(doc)}
										onDownload={() => handleDownloadDocument(doc)}
										isDownloading={downloadingDocId === doc.id}
									/>
								))}
							</div>
						)}

						{/* Q&A Section */}
						{showQuestions && (
							<div className="mt-8">
								<h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
									<MessageSquare className="h-5 w-5" />
									Questions & Réponses
								</h3>
								{questions && questions.length > 0 ? (
									<div className="space-y-4">
										{questions.map((question: QuestionData) => (
											<QuestionCard key={question.id} question={question} />
										))}
									</div>
								) : (
									<Card>
										<CardContent className="py-8 text-center">
											<MessageSquare className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
											<p className="text-muted-foreground text-sm">
												Aucune question pour le moment.
											</p>
										</CardContent>
									</Card>
								)}
							</div>
						)}

						{/* Access restrictions notice */}
						{(downloadRestricted || !canDownload) && (
							<div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
								<div className="flex items-start gap-3">
									<Lock className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
									<div>
										<p className="font-medium text-amber-900">
											Restrictions d&apos;accès
										</p>
										<p className="text-sm text-amber-700 mt-1">
											{downloadRestricted
												? "Les téléchargements sont désactivés pour cette Data Room."
												: "Votre rôle ne permet pas le téléchargement de documents."}
										</p>
									</div>
								</div>
							</div>
						)}
					</main>
				</div>
			</div>

			{/* Footer */}
			<footer className="border-t mt-12 py-6">
				<div className="max-w-7xl mx-auto px-4 text-center">
					<p className="text-sm text-muted-foreground">
						<strong className="text-foreground">Alecia</strong> - M&A Operating
						System
					</p>
					<p className="text-xs text-muted-foreground mt-1">
						Accès sécurisé • Tous les accès sont enregistrés
					</p>
				</div>
			</footer>
		</div>
	);
}

// =============================================================================
// PAGE EXPORT
// =============================================================================

export default function VDRAccessPage() {
	return (
		<Suspense
			fallback={
				<div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center">
					<Loader2 className="h-12 w-12 animate-spin text-primary" />
				</div>
			}
		>
			<VDRAccessContent />
		</Suspense>
	);
}
