"use client";

import type { ReactNode } from "react";
import { CommandMenuProvider } from "@/components/command-menu-provider";
import { CommandPalette } from "@/components/ui/fancy/CommandPalette";

// BetterAuth uses cookies for session management — no provider wrapper needed.
// This component keeps CommandMenuProvider which is used by the Sidebar.
export function ClientProviders({ children }: { children: ReactNode }) {
	return (
		<CommandMenuProvider>
			{children}
			<CommandPalette />
		</CommandMenuProvider>
	);
}
