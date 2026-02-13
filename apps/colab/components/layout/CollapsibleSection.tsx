"use client";

import { useState, useId } from "react";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronRight } from "lucide-react";

interface CollapsibleSectionProps {
	title: string;
	children: React.ReactNode;
	defaultOpen?: boolean;
	collapsible?: boolean;
}

export function CollapsibleSection({
	title,
	children,
	defaultOpen = true,
	collapsible = true,
}: CollapsibleSectionProps) {
	const [isOpen, setIsOpen] = useState(defaultOpen);
	const contentId = useId();

	return (
		<div className="space-y-1">
			{collapsible ? (
				<button
					type="button"
					onClick={() => setIsOpen(!isOpen)}
					aria-expanded={isOpen}
					aria-controls={contentId}
					className="flex items-center gap-2 w-full px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
				>
					{isOpen ? (
						<ChevronDown className="h-3 w-3" />
					) : (
						<ChevronRight className="h-3 w-3" />
					)}
					{title}
				</button>
			) : (
				<div className="px-3 py-2 text-xs font-medium text-muted-foreground">
					{title}
				</div>
			)}
			<div
				id={contentId}
				className={cn(
					"overflow-hidden transition-all duration-200",
					isOpen ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0",
				)}
			>
				{children}
			</div>
		</div>
	);
}
