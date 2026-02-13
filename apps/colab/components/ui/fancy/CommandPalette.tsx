"use client";

import { useCommandMenu } from "@/components/command-menu-provider";
import { CommandDialog } from "@/components/tailwind/ui/command";
import { ActionSearchBar } from "./action-search-bar";

export function CommandPalette() {
	const { open, setOpen } = useCommandMenu();

	return (
		<CommandDialog open={open} onOpenChange={setOpen}>
			<ActionSearchBar setOpen={setOpen} />
		</CommandDialog>
	);
}
