"use client";

import useLocalStorage from "@/hooks/use-local-storage";
import { AnimationProvider } from "@/providers/AnimationProvider";
import { Analytics } from "@vercel/analytics/react";
import { ThemeProvider, useTheme } from "next-themes";
import {
	type Dispatch,
	type ReactNode,
	type SetStateAction,
	createContext,
} from "react";
import { Toaster } from "sonner";

export const AppContext = createContext<{
	font: string;
	setFont: (value: string) => void;
}>({
	font: "Default",
	setFont: () => {},
});

const ToasterProvider = () => {
	const { theme } = useTheme() as {
		theme: "light" | "dark" | "system";
	};
	return <Toaster theme={theme} />;
};

export default function Providers({ children }: { children: ReactNode }) {
	const [font, setFont] = useLocalStorage<string>("novel__font", "Default");

	return (
		<ThemeProvider
			attribute="class"
			enableSystem
			disableTransitionOnChange
			defaultTheme="system"
		>
			<AppContext.Provider
				value={{
					font,
					setFont,
				}}
			>
				<AnimationProvider>
					<ToasterProvider />
					{children}
					<Analytics />
				</AnimationProvider>
			</AppContext.Provider>
		</ThemeProvider>
	);
}
