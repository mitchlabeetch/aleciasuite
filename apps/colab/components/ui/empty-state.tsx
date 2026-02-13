import { Button } from "@/components/tailwind/ui/button";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface EmptyStateProps {
	icon: LucideIcon;
	title: string;
	description?: string;
	action?: {
		label: string;
		onClick?: () => void;
		href?: string;
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
				<Icon className="h-8 w-8 text-muted-foreground" />
			</div>
			<h3 className="text-lg font-semibold">{title}</h3>
			{description && (
				<p className="text-sm text-muted-foreground mt-1 max-w-sm">
					{description}
				</p>
			)}
			{action && (
				<Button
					className="mt-4"
					onClick={action.onClick}
					asChild={!!action.href}
				>
					{action.href ? (
						<a href={action.href}>{action.label}</a>
					) : (
						action.label
					)}
				</Button>
			)}
		</div>
	);
}
