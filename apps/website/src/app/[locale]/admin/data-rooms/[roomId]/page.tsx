"use client";

/**
 * Data Room Detail View
 *
 * Three-panel layout for navigating and managing a data room:
 * - Left: Folder tree navigation
 * - Center: Document list/grid with preview
 * - Right: Activity feed + Q&A panel (collapsible)
 */

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/components/ui/use-toast";
import {
	FolderLock,
	Folder,
	FolderOpen,
	FileText,
	File,
	FileImage,
	FileSpreadsheet,
	Upload,
	Plus,
	Search,
	MoreHorizontal,
	Trash2,
	Download,
	Eye,
	ChevronRight,
	ChevronDown,
	MessageSquare,
	Activity,
	Settings,
	ArrowLeft,
	Loader2,
	LayoutGrid,
	List,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import { DocumentPreview } from "@/components/vdr/DocumentPreview";
import { getDealRoom, getFolders, getDocuments, createFolder, uploadDocument, deleteDocument, logAccess, getAccessLog, getQuestions } from "@/actions";

// Type definitions
interface FolderWithChildren {
	id: string;
	roomId: string;
	parentId: string | null;
	name: string;
	sortOrder: number;
	category?: string;
	documentCount: number;
	children?: FolderWithChildren[];
	createdAt: Date | null;
}

interface Document {
	id: string;
	folderId: string;
	filename: string;
	mimeType: string | null;
	fileSize: number | null;
	minioKey: string;
	version: number;
	uploadedBy: string;
	isConfidential: boolean | null;
	createdAt: Date | null;
	updatedAt: Date | null;
	uploaderName?: string;
	fileUrl?: string | null;
}

interface _Room {
	id: string;
	dealId: string;
	name: string;
	description: string | null;
	isActive: boolean | null;
	watermarkEnabled: boolean | null;
	createdBy: string;
	createdAt: Date | null;
	updatedAt: Date | null;
	status?: string;
	dealTitle?: string;
	settings?: {
		downloadRestricted?: boolean;
		watermarkEnabled?: boolean;
	};
}

// File type icon mapping
function getFileIcon(fileType: string) {
	if (fileType.includes("pdf")) return FileText;
	if (fileType.includes("image")) return FileImage;
	if (fileType.includes("spreadsheet") || fileType.includes("excel"))
		return FileSpreadsheet;
	return File;
}

// Format file size
function formatFileSize(bytes: number): string {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
	return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// Format date
function formatDate(timestamp: number): string {
	return new Date(timestamp).toLocaleDateString("fr-FR", {
		day: "numeric",
		month: "short",
		year: "numeric",
	});
}

// Folder tree item component
function FolderTreeItem({
	folder,
	selectedFolderId,
	onSelect,
	level = 0,
}: {
	folder: FolderWithChildren;
	selectedFolderId: string | null;
	onSelect: (folderId: string) => void;
	level?: number;
}) {
	const [isExpanded, setIsExpanded] = useState(level === 0);
	const hasChildren = folder.children && folder.children.length > 0;
	const isSelected = selectedFolderId === folder.id;

	return (
		<div>
			<button
				type="button"
				className={`w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded-lg transition-colors ${
					isSelected
						? "bg-primary/10 text-primary font-medium"
						: "hover:bg-muted"
				}`}
				style={{ paddingLeft: `${level * 16 + 8}px` }}
				onClick={() => onSelect(folder.id)}
			>
				{hasChildren ? (
					<button
						type="button"
						onClick={(e) => {
							e.stopPropagation();
							setIsExpanded(!isExpanded);
						}}
						className="p-0.5 hover:bg-muted rounded"
					>
						{isExpanded ? (
							<ChevronDown className="h-3 w-3" />
						) : (
							<ChevronRight className="h-3 w-3" />
						)}
					</button>
				) : (
					<span className="w-4" />
				)}
				{isSelected ? (
					<FolderOpen className="h-4 w-4 text-primary" />
				) : (
					<Folder className="h-4 w-4 text-muted-foreground" />
				)}
				<span className="truncate flex-1 text-left">{folder.name}</span>
				{folder.documentCount > 0 && (
					<Badge variant="secondary" className="text-xs h-5 px-1.5">
						{folder.documentCount}
					</Badge>
				)}
			</button>
			{hasChildren && isExpanded && (
				<div>
					{folder.children!.map((child) => (
						<FolderTreeItem
							key={child.id}
							folder={child}
							selectedFolderId={selectedFolderId}
							onSelect={onSelect}
							level={level + 1}
						/>
					))}
				</div>
			)}
		</div>
	);
}

// Document card component
function DocumentCard({
	document,
	viewMode,
	onView,
	onDownload,
	onDelete,
}: {
	document: Document;
	viewMode: "grid" | "list";
	onView: () => void;
	onDownload: () => void;
	onDelete: () => void;
}) {
	const FileIcon = getFileIcon(document.mimeType || "");

	if (viewMode === "list") {
		return (
			<div className="flex items-center gap-4 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
				<div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
					<FileIcon className="h-5 w-5 text-primary" />
				</div>
				<div className="flex-1 min-w-0">
					<p className="font-medium truncate">{document.filename}</p>
					<div className="flex items-center gap-2 text-xs text-muted-foreground">
						<span>{formatFileSize(document.fileSize || 0)}</span>
						<span>•</span>
						<span>{document.uploaderName}</span>
						<span>•</span>
						<span>{formatDate(document.createdAt?.getTime() || Date.now())}</span>
					</div>
				</div>
				<div className="flex items-center gap-1">
					<Button variant="ghost" size="icon" onClick={onView}>
						<Eye className="h-4 w-4" />
					</Button>
					<Button variant="ghost" size="icon" onClick={onDownload}>
						<Download className="h-4 w-4" />
					</Button>
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant="ghost" size="icon">
								<MoreHorizontal className="h-4 w-4" />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end">
							<DropdownMenuItem onClick={onView}>
								<Eye className="h-4 w-4 mr-2" />
								Aperçu
							</DropdownMenuItem>
							<DropdownMenuItem onClick={onDownload}>
								<Download className="h-4 w-4 mr-2" />
								Télécharger
							</DropdownMenuItem>
							<DropdownMenuItem onClick={onDelete} className="text-destructive">
								<Trash2 className="h-4 w-4 mr-2" />
								Supprimer
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
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
				<div className="aspect-square rounded-lg bg-muted flex items-center justify-center mb-3">
					<FileIcon className="h-12 w-12 text-muted-foreground" />
				</div>
				<p className="font-medium truncate text-sm">{document.filename}</p>
				<div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
					<span>{formatFileSize(document.fileSize || 0)}</span>
					<span>{formatDate(document.createdAt?.getTime() || Date.now())}</span>
				</div>
			</CardContent>
		</Card>
	);
}

// Create folder dialog
function CreateFolderDialog({
	roomId,
	parentId,
	onCreated,
}: {
	roomId: string;
	parentId?: string;
	onCreated: () => void;
}) {
	const { toast } = useToast();
	const [open, setOpen] = useState(false);
	const [name, setName] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const router = useRouter();

	const handleSubmit = async () => {
		if (!name.trim()) {
			toast({
				title: "Erreur",
				description: "Veuillez entrer un nom de dossier.",
				variant: "destructive",
			});
			return;
		}

		setIsSubmitting(true);
		try {
			await createFolder({
				roomId,
				name: name.trim(),
				parentId,
				sortOrder: 999,
			});

			toast({ title: "Dossier créé" });
			setOpen(false);
			setName("");
			onCreated();
			router.refresh();
		} catch {
			toast({
				title: "Erreur",
				description: "Impossible de créer le dossier.",
				variant: "destructive",
			});
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button variant="outline" size="sm">
					<Plus className="h-4 w-4 mr-2" />
					Nouveau dossier
				</Button>
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Créer un dossier</DialogTitle>
					<DialogDescription>
						Créez un nouveau dossier dans cette Data Room.
					</DialogDescription>
				</DialogHeader>
				<div className="py-4">
					<Input
						value={name}
						onChange={(e) => setName(e.target.value)}
						placeholder="Nom du dossier"
						onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
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
							"Créer"
						)}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

// Upload documents component
function UploadDocuments({
	_roomId,
	folderId,
	onUploaded,
}: {
	_roomId: string;
	folderId: string;
	onUploaded: () => void;
}) {
	const { toast } = useToast();
	const [isUploading, setIsUploading] = useState(false);
	const router = useRouter();

	const handleUpload = async (files: FileList | null) => {
		if (!files || files.length === 0) return;

		setIsUploading(true);
		let successCount = 0;

		try {
			for (const file of Array.from(files)) {
				// TODO: First upload file to Minio to get minioKey
				// const minioKey = await uploadToMinio(file);

				// Then record in database
				await uploadDocument({
					folderId,
					filename: file.name,
					mimeType: file.type,
					fileSize: file.size,
					minioKey: `temp/${Date.now()}-${file.name}`, // TODO: Replace with actual Minio upload
					isConfidential: false,
				});

				successCount++;
			}

			toast({
				title: "Upload terminé",
				description: `${successCount} fichier(s) uploadé(s) avec succès.`,
			});
			onUploaded();
			router.refresh();
		} catch {
			toast({
				title: "Erreur",
				description: "Erreur lors de l'upload des fichiers.",
				variant: "destructive",
			});
		} finally {
			setIsUploading(false);
		}
	};

	return (
		<div className="relative">
			<input
				type="file"
				multiple
				className="absolute inset-0 opacity-0 cursor-pointer"
				onChange={(e) => handleUpload(e.target.files)}
				disabled={isUploading}
			/>
			<Button disabled={isUploading}>
				{isUploading ? (
					<>
						<Loader2 className="h-4 w-4 mr-2 animate-spin" />
						Upload...
					</>
				) : (
					<>
						<Upload className="h-4 w-4 mr-2" />
						Upload
					</>
				)}
			</Button>
		</div>
	);
}

export default function DataRoomDetailPage() {
	const params = useParams();
	const roomId = params.roomId as string;
	const { toast } = useToast();
	const router = useRouter();

	const [selectedFolderId, setSelectedFolderId] =
		useState<string | null>(null);
	const [viewMode, setViewMode] = useState<"grid" | "list">("list");
	const [searchQuery, setSearchQuery] = useState("");
	const [showRightPanel, setShowRightPanel] = useState(true);

	// Document preview state
	const [previewDocument, setPreviewDocument] = useState<Document | null>(null);
	const [isPreviewOpen, setIsPreviewOpen] = useState(false);

	// Data state
	const [room, setRoom] = useState<_Room | null>(null);
	const [folders, setFolders] = useState<FolderWithChildren[] | null>(null);
	const [folderTree, setFolderTree] = useState<FolderWithChildren[] | null>(null);
	const [documents, setDocuments] = useState<Document[] | null>(null);
	const [allDocuments, setAllDocuments] = useState<Document[] | null>(null);
	const [questions, setQuestions] = useState<any[] | null>(null);
	const [accessLog, setAccessLog] = useState<any[] | null>(null);

	// Fetch data with useEffect
	useEffect(() => {
		getDealRoom(roomId).then(data => setRoom((data ?? null) as any));
		getFolders(roomId).then(data => {
			setFolders((data ?? null) as any);
			setFolderTree((data ?? null) as any);
		});
		getDocuments(roomId).then(data => setAllDocuments((data ?? null) as any));
		getQuestions(roomId).then(data => setQuestions((data ?? null) as any));
		getAccessLog(roomId, 20).then(data => setAccessLog((data ?? null) as any));
	}, [roomId]);

	useEffect(() => {
		if (selectedFolderId) {
			getDocuments(roomId, selectedFolderId).then(data => setDocuments((data ?? null) as any));
		}
	}, [selectedFolderId, roomId]);

	// Select first folder by default
	useEffect(() => {
		if (!selectedFolderId && folders && folders.length > 0) {
			setSelectedFolderId(folders[0].id);
		}
	}, [folders, selectedFolderId]);

	const selectedFolder = folders?.find(
		(f: FolderWithChildren) => f.id === selectedFolderId,
	);

	// Filter documents by search
	const displayedDocuments = selectedFolderId
		? documents?.filter((doc: Document) =>
				doc.filename.toLowerCase().includes(searchQuery.toLowerCase()),
			)
		: allDocuments?.filter((doc: Document) =>
				doc.filename.toLowerCase().includes(searchQuery.toLowerCase()),
			);

	const handleViewDocument = async (doc: Document) => {
		if (doc.fileUrl) {
			// Log access
			await logAccess({
				roomId,
				documentId: doc.id,
				action: "view",
			});
			// Open preview modal instead of new tab
			setPreviewDocument(doc);
			setIsPreviewOpen(true);
		}
	};

	const handleDownloadDocument = async (doc: Document) => {
		if (doc.fileUrl) {
			// Log access
			await logAccess({
				roomId,
				documentId: doc.id,
				action: "download",
			});

			const link = document.createElement("a");
			link.href = doc.fileUrl;
			link.download = doc.filename;
			link.click();
		}
	};

	const handleDeleteDocument = async (doc: Document) => {
		try {
			await deleteDocument(doc.id);
			toast({ title: "Document supprimé" });
			router.refresh();
		} catch {
			toast({
				title: "Erreur",
				description: "Impossible de supprimer le document.",
				variant: "destructive",
			});
		}
	};

	if (!room) {
		return (
			<div className="flex items-center justify-center min-h-screen">
				<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
			</div>
		);
	}

	// Check if downloads are restricted
	const downloadRestricted = room.settings?.downloadRestricted ?? false;

	return (
		<div className="h-[calc(100vh-8rem)] flex flex-col">
			{/* Document Preview Modal */}
			{previewDocument && previewDocument.fileUrl && (
				<DocumentPreview
					url={previewDocument.fileUrl}
					fileName={previewDocument.filename}
					fileType={previewDocument.mimeType || ""}
					isOpen={isPreviewOpen}
					onClose={() => {
						setIsPreviewOpen(false);
						setPreviewDocument(null);
					}}
					onDownload={() => handleDownloadDocument(previewDocument)}
					downloadRestricted={downloadRestricted}
					watermarkText={
						room.settings?.watermarkEnabled ? room.dealTitle : undefined
					}
				/>
			)}
			{/* Header */}
			<div className="flex items-center justify-between p-4 border-b">
				<div className="flex items-center gap-4">
					<Link href="/admin/data-rooms">
						<Button variant="ghost" size="icon">
							<ArrowLeft className="h-4 w-4" />
						</Button>
					</Link>
					<div>
						<div className="flex items-center gap-2">
							<FolderLock className="h-5 w-5 text-primary" />
							<h1 className="text-xl font-bold">{room.name}</h1>
							<Badge
								variant={room.status === "active" ? "default" : "secondary"}
							>
								{room.status}
							</Badge>
						</div>
						<p className="text-sm text-muted-foreground">{room.dealTitle}</p>
					</div>
				</div>
				<div className="flex items-center gap-2">
					<Link href={`/admin/data-rooms/${roomId}/analytics`}>
						<Button variant="outline">
							<Activity className="h-4 w-4 mr-2" />
							Analytics
						</Button>
					</Link>
					<Link href={`/admin/data-rooms/${roomId}/settings`}>
						<Button variant="outline" size="icon">
							<Settings className="h-4 w-4" />
						</Button>
					</Link>
				</div>
			</div>

			{/* Main content */}
			<div className="flex-1 flex overflow-hidden">
				{/* Left panel - Folder tree */}
				<div className="w-64 border-r bg-muted/30 flex flex-col">
					<div className="p-3 border-b">
						<CreateFolderDialog
							roomId={roomId}
							parentId={selectedFolderId || undefined}
							onCreated={() => {}}
						/>
					</div>
					<div className="flex-1 p-2 overflow-y-auto">
						{folderTree?.map((folder: FolderWithChildren) => (
							<FolderTreeItem
								key={folder.id}
								folder={folder}
								selectedFolderId={selectedFolderId}
								onSelect={setSelectedFolderId}
							/>
						))}
					</div>
				</div>

				{/* Center panel - Document list */}
				<div className="flex-1 flex flex-col overflow-hidden">
					{/* Toolbar */}
					<div className="flex items-center gap-4 p-4 border-b">
						<div className="relative flex-1 max-w-sm">
							<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
							<Input
								placeholder="Rechercher des fichiers..."
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								className="pl-9"
							/>
						</div>
						<div className="flex-1" />
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
						{selectedFolderId && (
							<UploadDocuments
								_roomId={roomId}
								folderId={selectedFolderId}
								onUploaded={() => {}}
							/>
						)}
					</div>

					{/* Document list */}
					<div className="flex-1 p-4 overflow-y-auto">
						{selectedFolder && (
							<div className="mb-4">
								<h2 className="text-lg font-semibold flex items-center gap-2">
									<FolderOpen className="h-5 w-5 text-primary" />
									{selectedFolder.name}
								</h2>
								<p className="text-sm text-muted-foreground">
									{displayedDocuments?.length || 0} document(s)
								</p>
							</div>
						)}

						{!displayedDocuments || displayedDocuments.length === 0 ? (
							<div className="flex flex-col items-center justify-center py-12 text-center">
								<File className="h-12 w-12 text-muted-foreground mb-4" />
								<h3 className="font-semibold mb-2">Aucun document</h3>
								<p className="text-muted-foreground text-sm mb-4">
									{selectedFolderId
										? "Uploadez des fichiers dans ce dossier."
										: "Sélectionnez un dossier pour voir les documents."}
								</p>
							</div>
						) : viewMode === "grid" ? (
							<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
								{displayedDocuments.map((doc: Document) => (
									<DocumentCard
										key={doc.id}
										document={doc}
										viewMode={viewMode}
										onView={() => handleViewDocument(doc)}
										onDownload={() => handleDownloadDocument(doc)}
										onDelete={() => handleDeleteDocument(doc)}
									/>
								))}
							</div>
						) : (
							<div className="space-y-2">
								{displayedDocuments.map((doc: Document) => (
									<DocumentCard
										key={doc.id}
										document={doc}
										viewMode={viewMode}
										onView={() => handleViewDocument(doc)}
										onDownload={() => handleDownloadDocument(doc)}
										onDelete={() => handleDeleteDocument(doc)}
									/>
								))}
							</div>
						)}
					</div>
				</div>

				{/* Right panel - Activity & Q&A */}
				{showRightPanel && (
					<div className="w-80 border-l bg-muted/30 flex flex-col">
						<div className="p-3 border-b flex items-center justify-between">
							<h3 className="font-semibold">Activité</h3>
							<Button
								variant="ghost"
								size="icon"
								onClick={() => setShowRightPanel(false)}
							>
								<ChevronRight className="h-4 w-4" />
							</Button>
						</div>
						<div className="flex-1 overflow-y-auto">
							<div className="p-3 space-y-4">
								{/* Q&A Summary */}
								<Card>
									<CardHeader className="py-3">
										<CardTitle className="text-sm flex items-center gap-2">
											<MessageSquare className="h-4 w-4" />
											Questions & Réponses
										</CardTitle>
									</CardHeader>
									<CardContent className="py-2">
										<div className="text-2xl font-bold">
											{questions?.filter(
												(q: { status: string }) => q.status === "open",
											).length || 0}
										</div>
										<p className="text-xs text-muted-foreground">
											question(s) en attente
										</p>
									</CardContent>
								</Card>

								{/* Recent Activity */}
								<div>
									<h4 className="text-sm font-medium mb-2">Activité récente</h4>
									<div className="space-y-2">
										{accessLog?.slice(0, 10).map(
											(log: {
												id: string;
												action: string;
												userEmail: string;
												documentName?: string;
												timestamp: number;
											}) => (
												<div
													key={log.id}
													className="flex items-start gap-2 text-xs p-2 rounded-lg bg-background"
												>
													<div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
														{log.action === "view" ? (
															<Eye className="h-3 w-3 text-primary" />
														) : (
															<Download className="h-3 w-3 text-primary" />
														)}
													</div>
													<div>
														<p className="font-medium">{log.userEmail}</p>
														<p className="text-muted-foreground">
															{log.action === "view"
																? "A consulté"
																: "A téléchargé"}{" "}
															{log.documentName || "un document"}
														</p>
														<p className="text-muted-foreground">
															{formatDate(log.timestamp)}
														</p>
													</div>
												</div>
											),
										)}
										{(!accessLog || accessLog.length === 0) && (
											<p className="text-xs text-muted-foreground text-center py-4">
												Aucune activité récente
											</p>
										)}
									</div>
								</div>
							</div>
						</div>
					</div>
				)}

				{/* Toggle right panel button */}
				{!showRightPanel && (
					<Button
						variant="ghost"
						size="icon"
						className="absolute right-2 top-1/2 -translate-y-1/2"
						onClick={() => setShowRightPanel(true)}
					>
						<ChevronRight className="h-4 w-4 rotate-180" />
					</Button>
				)}
			</div>
		</div>
	);
}
