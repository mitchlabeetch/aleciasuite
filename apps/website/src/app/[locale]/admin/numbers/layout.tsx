"use client";

/**
 * Numbers Tools Layout
 *
 * Provides:
 * - Error boundary for graceful error handling
 * - DealProvider for cross-tool deal context
 * - TooltipProvider for consistent tooltips
 */

import { ReactNode } from "react";
import { NumbersLayout } from "@/components/numbers/numbers-layout";
import { NumbersErrorBoundary } from "@/components/numbers/error-boundary";

export default function Layout({ children }: { children: ReactNode }) {
	return (
		<NumbersErrorBoundary>
			<NumbersLayout>{children}</NumbersLayout>
		</NumbersErrorBoundary>
	);
}
