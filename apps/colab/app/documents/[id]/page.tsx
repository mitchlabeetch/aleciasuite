"use client";

import { AppShell } from "@/components/layout/AppShell";
import { Skeleton } from "@/components/tailwind/ui/skeleton";
import dynamic from "next/dynamic";
import { useParams } from "next/navigation";

const TailwindAdvancedEditor = dynamic(
	() => import("@/components/tailwind/advanced-editor"),
	{
		ssr: false,
		loading: () => (
			<div className="space-y-4 p-8">
				<Skeleton className="h-8 w-1/2" />
				<Skeleton className="h-64 w-full" />
				<Skeleton className="h-32 w-full" />
			</div>
		),
	},
);

// Prevent static generation
export const dynamicParams = false;
export const revalidate = 0;

export default function DocumentEditorPage() {
	const params = useParams();
	const _documentId = params.id as string;

	return (
		<AppShell>
			<TailwindAdvancedEditor documentId={_documentId} />
		</AppShell>
	);
}
