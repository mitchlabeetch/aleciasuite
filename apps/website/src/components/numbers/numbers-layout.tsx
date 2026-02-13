"use client";

/**
 * Numbers Layout Provider
 *
 * Wraps all Numbers tools with the DealContext provider
 * for cross-tool deal selection and linking.
 */

import { type ReactNode } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { DealProvider } from "@/lib/numbers/deal-context";

interface NumbersLayoutProps {
	children: ReactNode;
}

export function NumbersLayout({ children }: NumbersLayoutProps) {
	return (
		<DealProvider>
			<TooltipProvider>{children}</TooltipProvider>
		</DealProvider>
	);
}
