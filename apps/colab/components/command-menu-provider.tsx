"use client";

import * as React from "react";

interface CommandMenuContextType {
	open: boolean;
	setOpen: (open: boolean) => void;
	toggle: () => void;
}

const CommandMenuContext = React.createContext<
	CommandMenuContextType | undefined
>(undefined);

export function useCommandMenu() {
	const context = React.useContext(CommandMenuContext);
	if (!context) {
		throw new Error("useCommandMenu must be used within a CommandMenuProvider");
	}
	return context;
}

export function CommandMenuProvider({
	children,
}: { children: React.ReactNode }) {
	const [open, setOpen] = React.useState(false);

	const toggle = React.useCallback(() => {
		setOpen((open) => !open);
	}, []);

	React.useEffect(() => {
		const down = (e: KeyboardEvent) => {
			if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
				e.preventDefault();
				setOpen((open) => !open);
			}
		};

		document.addEventListener("keydown", down);
		return () => document.removeEventListener("keydown", down);
	}, []);

	return (
		<CommandMenuContext.Provider value={{ open, setOpen, toggle }}>
			{children}
		</CommandMenuContext.Provider>
	);
}
