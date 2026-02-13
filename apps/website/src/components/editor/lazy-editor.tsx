"use client";

/**
 * LazyEditor - Dynamically loaded TipTap editor
 *
 * This reduces initial bundle size by ~150KB by only loading
 * the editor when it's actually needed (on document pages).
 *
 * @see Batch 11: Performance Optimization - Task 11.2
 */

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";
import { ComponentProps } from "react";

// Loading skeleton shown while editor loads
function EditorSkeleton() {
	return (
		<div className="space-y-4">
			{/* Toolbar skeleton */}
			<div className="flex items-center gap-2 p-2 border border-border rounded-lg">
				<Skeleton className="h-8 w-8" />
				<Skeleton className="h-8 w-8" />
				<Skeleton className="h-8 w-8" />
				<div className="w-px h-6 bg-border mx-2" />
				<Skeleton className="h-8 w-8" />
				<Skeleton className="h-8 w-8" />
				<Skeleton className="h-8 w-8" />
			</div>
			{/* Content area skeleton */}
			<div className="border border-border rounded-lg p-4 min-h-[300px]">
				<Skeleton className="h-6 w-3/4 mb-3" />
				<Skeleton className="h-4 w-full mb-2" />
				<Skeleton className="h-4 w-full mb-2" />
				<Skeleton className="h-4 w-2/3 mb-4" />
				<Skeleton className="h-4 w-full mb-2" />
				<Skeleton className="h-4 w-5/6" />
			</div>
		</div>
	);
}

// Dynamically import the editor - only loads when component renders
const DynamicEditor = dynamic(
	() => import("./Editor").then((mod) => mod.default || mod.Editor),
	{
		loading: () => <EditorSkeleton />,
		ssr: false, // Editor requires browser APIs
	},
);

// Re-export with same interface
export function LazyEditor(props: ComponentProps<typeof DynamicEditor>) {
	return <DynamicEditor {...props} />;
}

export { EditorSkeleton };
