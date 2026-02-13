"use client";

import { Button } from "@/components/tailwind/ui/button";
import { Skeleton } from "@/components/tailwind/ui/skeleton";
import { listDocuments } from "@/actions/colab/documents";
import { formatRelativeTime } from "@/lib/format-relative-time";
import { t } from "@/lib/i18n";
import { useSession } from "@alepanel/auth/client";
import { Clock, FileText, Plus } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

interface RecentFilesProps {
	limit?: number;
	showCreateButton?: boolean;
}

export function RecentFiles({
	limit = 5,
	showCreateButton = true,
}: RecentFilesProps) {
	const [_mounted, setMounted] = useState(false);
	const { data: session, isPending } = useSession();
	const [documents, setDocuments] = useState<any[]>([]);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		setMounted(true);
	}, []);

	useEffect(() => {
		if (!session?.user?.id) {
			setIsLoading(false);
			return;
		}

		async function loadDocuments() {
			try {
				const docs = await listDocuments();
				setDocuments(docs || []);
			} catch (err) {
				console.error("Failed to load documents:", err);
			} finally {
				setIsLoading(false);
			}
		}

		loadDocuments();
	}, [session?.user?.id]);

	const recentDocuments = documents
		.filter((doc) => !doc.isArchived)
		.map((doc) => ({
			id: doc.id,
			title: doc.title || t("editor.untitled"),
			href: `/documents/${doc.id}`,
			timestamp: doc.updatedAt ?? doc.createdAt ?? 0,
		}))
		.sort((a, b) => b.timestamp - a.timestamp)
		.slice(0, limit);

	if (isLoading && !isPending) {
		return <RecentFilesSkeleton count={limit} />;
	}

	if (recentDocuments.length === 0) {
		return <RecentFilesEmpty showCreateButton={showCreateButton} />;
	}

	return (
		<div className="space-y-3">
			<div className="flex items-center gap-2 text-muted-foreground">
				<Clock className="h-4 w-4" />
				<span className="text-sm font-medium">Recent Documents</span>
			</div>
			<div className="space-y-2">
				{recentDocuments.map((doc) => (
					<Link key={doc.id} href={doc.href}>
						<div className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent transition-colors">
							<FileText className="h-5 w-5 text-muted-foreground" />
							<div className="flex-1 min-w-0">
								<p className="text-sm font-medium truncate">{doc.title}</p>
								<p className="text-xs text-muted-foreground">
									{formatRelativeTime(doc.timestamp)}
								</p>
							</div>
						</div>
					</Link>
				))}
			</div>
			{showCreateButton && (
				<Button className="w-full" variant="outline" asChild>
					<Link href="/documents">
						<Plus className="h-4 w-4 mr-2" />
						New Document
					</Link>
				</Button>
			)}
		</div>
	);
}

function RecentFilesSkeleton({ count }: { count: number }) {
	return (
		<div className="space-y-3">
			<Skeleton className="h-5 w-40" />
			<div className="space-y-2">
				{Array.from({ length: count }).map((_, i) => (
					<div key={i} className="flex items-center gap-3 p-2">
						<Skeleton className="h-4 w-4" />
						<div className="flex-1 space-y-1">
							<Skeleton className="h-4 w-3/4" />
							<Skeleton className="h-3 w-1/4" />
						</div>
					</div>
				))}
			</div>
		</div>
	);
}

function RecentFilesEmpty({ showCreateButton }: { showCreateButton: boolean }) {
	return (
		<div className="flex flex-col items-center justify-center py-8 text-center">
			<div className="rounded-full bg-muted p-3 mb-3">
				<FileText className="h-6 w-6 text-muted-foreground" />
			</div>
			<h3 className="text-sm font-semibold">No recent documents</h3>
			<p className="text-xs text-muted-foreground mt-1">
				Your recently accessed documents will appear here
			</p>
			{showCreateButton && (
				<Button className="mt-4" size="sm" asChild>
					<Link href="/documents">
						<Plus className="h-4 w-4 mr-2" />
						Create Document
					</Link>
				</Button>
			)}
		</div>
	);
}

export { RecentFilesSkeleton, RecentFilesEmpty };
