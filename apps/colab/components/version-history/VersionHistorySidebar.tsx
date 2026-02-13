"use client";

import {
	ChevronRight,
	Clock,
	Eye,
	History,
	Loader2,
	RotateCcw,
	User,
	X,
} from "lucide-react";
import { useState, useEffect } from "react";
import { listVersions, restoreVersion } from "@/actions/colab/document-versions";
import { Badge } from "../tailwind/ui/badge";
import { Button } from "../tailwind/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "../tailwind/ui/dialog";
import { ScrollArea } from "../tailwind/ui/scroll-area";

interface VersionHistorySidebarProps {
	documentId: string;
	isOpen: boolean;
	onClose: () => void;
	onPreviewVersion?: (content: string) => void;
}

export function VersionHistorySidebar({
	documentId,
	isOpen,
	onClose,
	onPreviewVersion,
}: VersionHistorySidebarProps) {
	const [selectedVersion, setSelectedVersion] = useState<number | null>(null);
	const [isRestoreDialogOpen, setIsRestoreDialogOpen] = useState(false);
	const [isRestoring, setIsRestoring] = useState(false);
	const [versions, setVersions] = useState<any[]>([]);
	const [isLoadingVersions, setIsLoadingVersions] = useState(false);

	const isConvexConfigured = !!process.env.NEXT_PUBLIC_CONVEX_URL;

	useEffect(() => {
		if (!isConvexConfigured || !documentId) return;

		async function loadVersions() {
			setIsLoadingVersions(true);
			try {
				const versionsList = await listVersions(documentId);
				setVersions(versionsList || []);
			} catch (err) {
				console.error("Failed to load versions:", err);
			} finally {
				setIsLoadingVersions(false);
			}
		}

		loadVersions();
	}, [isConvexConfigured, documentId]);

	const handlePreview = (content: string, versionNumber: number) => {
		setSelectedVersion(versionNumber);
		onPreviewVersion?.(content);
	};

	const handleRestore = async () => {
		if (!selectedVersion) return;

		setIsRestoring(true);
		try {
			await restoreVersion({
				documentId,
				versionNumber: selectedVersion,
			});
			setIsRestoreDialogOpen(false);
			setSelectedVersion(null);
			// Reload versions
			const versionsList = await listVersions(documentId);
			setVersions(versionsList || []);
		} catch (error) {
			console.error("Failed to restore version:", error);
		} finally {
			setIsRestoring(false);
		}
	};

	const formatDate = (timestamp: number) => {
		const date = new Date(timestamp);
		const now = new Date();
		const diffMs = now.getTime() - date.getTime();
		const diffMins = Math.floor(diffMs / 60000);
		const diffHours = Math.floor(diffMs / 3600000);
		const diffDays = Math.floor(diffMs / 86400000);

		if (diffMins < 1) return "Just now";
		if (diffMins < 60) return `${diffMins}m ago`;
		if (diffHours < 24) return `${diffHours}h ago`;
		if (diffDays < 7) return `${diffDays}d ago`;
		return date.toLocaleDateString();
	};

	if (!isOpen) return null;

	return (
		<>
			<div className="fixed right-0 top-0 h-full w-80 bg-background border-l shadow-lg z-50 flex flex-col">
				{/* Header */}
				<div className="flex items-center justify-between p-4 border-b">
					<div className="flex items-center gap-2">
						<History className="h-5 w-5" />
						<h2 className="font-semibold">Version History</h2>
					</div>
					<Button variant="ghost" size="icon" onClick={onClose}>
						<X className="h-4 w-4" />
					</Button>
				</div>

				{/* Version list */}
				<ScrollArea className="flex-1 p-4">
					{!isConvexConfigured ? (
						<div className="text-center text-muted-foreground py-8">
							<History className="h-8 w-8 mx-auto mb-2 opacity-50" />
							<p className="text-sm">
								Configure Convex to enable version history
							</p>
						</div>
					) : isLoadingVersions ? (
						<div className="flex items-center justify-center py-8">
							<Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
						</div>
					) : versions.length === 0 ? (
						<div className="text-center text-muted-foreground py-8">
							<History className="h-8 w-8 mx-auto mb-2 opacity-50" />
							<p className="text-sm">No versions saved yet</p>
							<p className="text-xs mt-1">
								Versions are created automatically as you edit
							</p>
						</div>
					) : (
						<div className="space-y-3">
							{versions.map(
								(
									version: {
										id: string;
										versionNumber: number;
										content: string;
										createdAt: number;
										createdBy?: string;
										changeDescription?: string;
									},
									index: number,
								) => (
									<div
										key={version.id}
										className={`
                    p-3 rounded-lg border cursor-pointer transition-all
                    ${
											selectedVersion === version.versionNumber
												? "border-primary bg-primary/5"
												: "hover:border-primary/50"
										}
                  `}
										onClick={() =>
											handlePreview(version.content, version.versionNumber)
										}
									>
										<div className="flex items-start justify-between gap-2">
											<div className="flex-1 min-w-0">
												<div className="flex items-center gap-2">
													<Badge variant="outline" className="text-xs">
														v{version.versionNumber}
													</Badge>
													{index === 0 && (
														<Badge className="text-xs bg-green-100 text-green-800">
															Latest
														</Badge>
													)}
												</div>

												<div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
													<Clock className="h-3 w-3" />
													<span>{formatDate(version.createdAt)}</span>
												</div>

												{version.createdBy && (
													<div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
														<User className="h-3 w-3" />
														<span className="truncate">
															{version.createdBy}
														</span>
													</div>
												)}

												{version.changeDescription && (
													<p className="text-xs text-muted-foreground mt-2 line-clamp-2">
														{version.changeDescription}
													</p>
												)}
											</div>

											<ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
										</div>
									</div>
								),
							)}
						</div>
					)}
				</ScrollArea>

				{/* Footer with actions */}
				{selectedVersion && (
					<div className="p-4 border-t flex gap-2">
						<Button
							variant="outline"
							size="sm"
							className="flex-1"
							onClick={() => setSelectedVersion(null)}
						>
							<Eye className="h-4 w-4 mr-1" />
							Clear Preview
						</Button>
						<Button
							size="sm"
							className="flex-1"
							onClick={() => setIsRestoreDialogOpen(true)}
						>
							<RotateCcw className="h-4 w-4 mr-1" />
							Restore v{selectedVersion}
						</Button>
					</div>
				)}
			</div>

			{/* Restore confirmation dialog */}
			<Dialog open={isRestoreDialogOpen} onOpenChange={setIsRestoreDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Restore Version {selectedVersion}?</DialogTitle>
						<DialogDescription>
							This will replace the current document content with version{" "}
							{selectedVersion}. A new version will be created to preserve the
							current state.
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setIsRestoreDialogOpen(false)}
							disabled={isRestoring}
						>
							Cancel
						</Button>
						<Button onClick={handleRestore} disabled={isRestoring}>
							{isRestoring ? (
								<Loader2 className="h-4 w-4 animate-spin mr-1" />
							) : (
								<RotateCcw className="h-4 w-4 mr-1" />
							)}
							Restore
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
}
