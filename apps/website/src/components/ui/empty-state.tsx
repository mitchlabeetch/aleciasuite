import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

/**
 * EmptyState - Consistent empty state display
 *
 * Shows a centered icon, title, description and optional action button
 * when a list or collection has no items.
 *
 * @see Batch 10: UI/UX Refinement - Task 10.5
 */

interface EmptyStateProps {
	icon: React.ComponentType<{ className?: string }>;
	title: string;
	description: string;
	action?: {
		label: string;
		onClick: () => void;
	};
	className?: string;
}

export function EmptyState({
	icon: Icon,
	title,
	description,
	action,
	className,
}: EmptyStateProps) {
	return (
		<div
			className={cn(
				"flex flex-col items-center justify-center py-12 text-center",
				className,
			)}
		>
			<div className="rounded-full bg-muted p-4 mb-4">
				<Icon className="w-8 h-8 text-muted-foreground" />
			</div>
			<h3 className="font-semibold text-lg text-foreground mb-2">{title}</h3>
			<p className="text-muted-foreground max-w-sm mb-4">{description}</p>
			{action && <Button onClick={action.onClick}>{action.label}</Button>}
		</div>
	);
}

/**
 * Smaller variant for inline/sidebar use
 */
export function EmptyStateCompact({
	icon: Icon,
	message,
	className,
}: {
	icon: React.ComponentType<{ className?: string }>;
	message: string;
	className?: string;
}) {
	return (
		<div
			className={cn(
				"flex flex-col items-center justify-center py-6 text-center",
				className,
			)}
		>
			<Icon className="w-6 h-6 text-muted-foreground mb-2" />
			<p className="text-sm text-muted-foreground">{message}</p>
		</div>
	);
}
