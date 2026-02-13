"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	History,
	RotateCcw,
	User,
	Calendar,
	Loader2,
	CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { useSession } from "@alepanel/auth/client";
import { getPageVersions, rollbackToVersion, getPageContent } from "@/actions";

interface VersionHistoryProps {
	pageContentId: string;
}

/**
 * VersionHistory - Display version timeline with rollback capability
 */
export function VersionHistory({ pageContentId }: VersionHistoryProps) {
	const [showRollbackDialog, setShowRollbackDialog] = useState(false);
	const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);
	const [isRollingBack, setIsRollingBack] = useState(false);
	const [versions, setVersions] = useState<any>(null);
	const [currentPage, setCurrentPage] = useState<any>(null);

	const { data: session } = useSession();
	const userId = session?.user?.id;
	const router = useRouter();

	// Fetch versions
	useEffect(() => {
		getPageVersions(pageContentId).then(setVersions);
	}, [pageContentId]);

	// Fetch current page
	useEffect(() => {
		getPageContent("/", "fr").then(setCurrentPage); // TODO: Get from context
	}, []);

	const handleRollbackClick = (versionId: string) => {
		setSelectedVersionId(versionId);
		setShowRollbackDialog(true);
	};

	const handleRollback = async () => {
		if (!userId || !selectedVersionId) {
			toast.error("Paramètres manquants");
			return;
		}

		setIsRollingBack(true);
		try {
			await rollbackToVersion({
				versionId: selectedVersionId,
				publishedBy: userId as string,
				publishedByName: "User", // TODO: Get from user profile
			});

			toast.success("Version restaurée avec succès");
			setShowRollbackDialog(false);
			setSelectedVersionId(null);
			router.refresh();
			// Reload versions and current page
			const updatedVersions = await getPageVersions(pageContentId);
			setVersions(updatedVersions);
			const updatedPage = await getPageContent("/", "fr");
			setCurrentPage(updatedPage);
		} catch (error) {
			toast.error("Erreur lors de la restauration");
			console.error(error);
		} finally {
			setIsRollingBack(false);
		}
	};

	if (!versions) {
		return (
			<Card>
				<CardContent className="py-12 text-center">
					<Loader2 className="w-8 h-8 mx-auto animate-spin text-gray-400" />
					<p className="text-sm text-gray-500 mt-4">
						Chargement de l&apos;historique...
					</p>
				</CardContent>
			</Card>
		);
	}

	if (versions.length === 0) {
		return (
			<Card>
				<CardContent className="py-12 text-center text-gray-500">
					<History className="w-16 h-16 mx-auto mb-4 opacity-20" />
					<p className="text-lg font-medium">Aucune version</p>
					<p className="text-sm mt-2">
						Les versions seront créées après la première publication
					</p>
				</CardContent>
			</Card>
		);
	}

	return (
		<>
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<History className="w-5 h-5" />
						Historique des Versions
					</CardTitle>
					<CardDescription>
						{versions.length} version{versions.length > 1 ? "s" : ""} • Version
						actuelle: {currentPage?.version || "—"}
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="space-y-4">
						{versions.map((version: any, index: number) => {
							const isLatest = index === 0;
							const isCurrent = version.version === currentPage?.version;

							return (
								<div
									key={version._id}
									className={`relative pl-8 pb-4 ${
										index !== versions.length - 1
											? "border-l-2 border-gray-200 dark:border-gray-700"
											: ""
									}`}
								>
									{/* Timeline dot */}
									<div
										className={`absolute left-0 top-0 -translate-x-1/2 w-4 h-4 rounded-full ${
											isCurrent
												? "bg-green-500 ring-4 ring-green-100 dark:ring-green-900"
												: isLatest
													? "bg-blue-500"
													: "bg-gray-300 dark:bg-gray-600"
										}`}
									/>

									<div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
										<div className="flex items-start justify-between mb-2">
											<div className="flex-1">
												<div className="flex items-center gap-2 mb-1">
													<h4 className="font-semibold text-sm">
														Version {version.version}
													</h4>
													{isCurrent && (
														<Badge variant="default" className="text-xs">
															<CheckCircle2 className="w-3 h-3 mr-1" />
															Actuelle
														</Badge>
													)}
													{isLatest && !isCurrent && (
														<Badge variant="secondary" className="text-xs">
															Dernière
														</Badge>
													)}
												</div>
												<p className="text-sm text-gray-600 dark:text-gray-400">
													{version.changeDescription || "Aucune description"}
												</p>
											</div>
											{!isCurrent && (
												<Button
													variant="outline"
													size="sm"
													onClick={() => handleRollbackClick(version._id)}
													className="ml-4"
												>
													<RotateCcw className="w-4 h-4 mr-2" />
													Restaurer
												</Button>
											)}
										</div>

										<div className="flex items-center gap-4 text-xs text-gray-500 mt-3">
											<div className="flex items-center gap-1">
												<User className="w-3 h-3" />
												<span>{version.publishedByName}</span>
											</div>
											<div className="flex items-center gap-1">
												<Calendar className="w-3 h-3" />
												<span>
													{new Date(version.publishedAt).toLocaleDateString(
														"fr-FR",
														{
															year: "numeric",
															month: "long",
															day: "numeric",
															hour: "2-digit",
															minute: "2-digit",
														},
													)}
												</span>
											</div>
										</div>
									</div>
								</div>
							);
						})}
					</div>
				</CardContent>
			</Card>

			{/* Rollback Confirmation Dialog */}
			<Dialog open={showRollbackDialog} onOpenChange={setShowRollbackDialog}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2">
							<RotateCcw className="w-5 h-5" />
							Restaurer cette version
						</DialogTitle>
						<DialogDescription>
							Cette action va créer une nouvelle version avec le contenu de la
							version sélectionnée. La version actuelle sera préservée dans
							l&apos;historique.
						</DialogDescription>
					</DialogHeader>

					<div className="py-4">
						<div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
							<p className="text-sm text-amber-900 dark:text-amber-100">
								<strong>Attention:</strong> Cette action ne peut pas être
								annulée directement. Vous pourrez cependant restaurer une autre
								version ultérieurement.
							</p>
						</div>
					</div>

					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setShowRollbackDialog(false)}
							disabled={isRollingBack}
						>
							Annuler
						</Button>
						<Button onClick={handleRollback} disabled={isRollingBack}>
							{isRollingBack ? (
								<>
									<Loader2 className="w-4 h-4 mr-2 animate-spin" />
									Restauration...
								</>
							) : (
								<>
									<RotateCcw className="w-4 h-4 mr-2" />
									Confirmer
								</>
							)}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
}
