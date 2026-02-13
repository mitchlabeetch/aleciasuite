"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import { type ThemeProviderProps } from "next-themes";
import { Toaster } from "sonner";

/**
 * Unified Providers Component
 *
 * Wraps the entire app with:
 * - NextThemesProvider (theme management)
 * - Toaster (notifications)
 */
export function Providers({ children, ...props }: ThemeProviderProps) {
	return (
		<NextThemesProvider {...props} defaultTheme="light" enableSystem={false}>
			{children}
			<Toaster position="top-right" />
		</NextThemesProvider>
	);
}
