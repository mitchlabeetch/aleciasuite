"use client";

import { useSession } from "@alepanel/auth/client";
import {
	Clock,
	FileText,
	MoreVertical,
	Plus,
	Search,
	Star,
	Trash,
} from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/tailwind/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/tailwind/ui/card";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/tailwind/ui/dropdown-menu";
import { Input } from "@/components/tailwind/ui/input";
import { Skeleton } from "@/components/tailwind/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { useDocuments } from "@/hooks/use-convex";
import { formatRelativeTime } from "@/lib/format-relative-time";
import { t } from "@/lib/i18n";

// Prevent static generation
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default function DocumentsPage() {
	const [searchQuery, setSearchQuery] = useState("");
	const router = useRouter();

	// Always call hooks unconditionally - but the provider handles missing config
	const { data: session } = useSession();
	const { documents, isLoading } = useDocuments();

	const filteredDocuments = documents
		.filter((doc) => !doc.isArchived)
		.filter(
			(doc) =>
				doc.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
				searchQuery === "",
		)
		.sort((a, b) => {
			const timestampA = a.updatedAt?.getTime() ?? a.createdAt?.getTime() ?? 0;
			const timestampB = b.updatedAt?.getTime() ?? b.createdAt?.getTime() ?? 0;
			return timestampB - timestampA;
		});

	const handleCreateDocument = () => {
		router.push("/documents/new");
	};

	return (
		<AppShell>
			<div className="space-y-6">
				{/* Header */}
				<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
					<div>
						<h1 className="text-3xl font-bold tracking-tight">
							{t("nav.documents")}
						</h1>
						<p className="text-muted-foreground">{t("nav.allDocuments")}</p>
					</div>
					<Button onClick={handleCreateDocument} size="default">
						<Plus className="h-4 w-4 mr-2" />
						{t("actions.newDocument")}
					</Button>
				</div>

				{/* Search */}
				<div className="relative">
					<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
					<Input
						placeholder={t("search.placeholder")}
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						className="pl-10"
					/>
				</div>

				{/* Documents Grid */}
				{isLoading ? (
					<DocumentListSkeleton />
				) : filteredDocuments.length === 0 ? (
					<EmptyState
						icon={FileText}
						title={
							searchQuery ? t("search.noResults") : t("nav.noRecentDocuments")
						}
						description={
							searchQuery
								? "Essayez une autre recherche"
								: "Créez votre premier document pour commencer"
						}
						action={{
							label: t("actions.newDocument"),
							onClick: handleCreateDocument,
						}}
					/>
				) : (
					<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
						{filteredDocuments.map((document) => (
							<DocumentCard key={document.id} document={document} />
						))}
					</div>
				)}
			</div>
		</AppShell>
	);
}

interface Document {
	id: string;
	title?: string;
	updatedAt?: Date | null;
	createdAt?: Date | null;
	isArchived?: boolean | null;
}

function DocumentCard({ document }: { document: Document }) {
	const timestamp =
		document.updatedAt?.getTime() ?? document.createdAt?.getTime() ?? Date.now();

	return (
		<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
			<Link href={`/documents/${document.id}`}>
				<Card className="hover:shadow-md transition-shadow cursor-pointer group">
					<CardHeader className="flex flex-row items-start justify-between space-y-0">
						<div className="space-y-1">
							<CardTitle className="text-base line-clamp-1">
								{document.title || t("editor.untitled")}
							</CardTitle>
							<CardDescription className="flex items-center gap-1">
								<Clock className="h-3 w-3" />
								{formatRelativeTime(timestamp)}
							</CardDescription>
						</div>
					</CardHeader>
					<CardContent>
						<div className="flex items-center gap-2">
							<FileText className="h-4 w-4 text-muted-foreground" />
							<span className="text-sm text-muted-foreground">Document</span>
						</div>
					</CardContent>
				</Card>
			</Link>
		</motion.div>
	);
}

function DocumentListSkeleton() {
	return (
		<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
			{Array.from({ length: 6 }).map((_, i) => (
				// biome-ignore lint/suspicious/noArrayIndexKey: Static skeleton components don't reorder
				<Card key={`skeleton-${i}`}>
					<CardHeader>
						<Skeleton className="h-5 w-3/4" />
						<Skeleton className="h-4 w-1/2 mt-2" />
					</CardHeader>
					<CardContent>
						<Skeleton className="h-4 w-1/4" />
					</CardContent>
				</Card>
			))}
		</div>
	);
}
