"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import {
	BarChart3,
	Calendar,
	Car,
	FileText,
	Heart,
	Home,
	Moon,
	Plus,
	Presentation,
	Settings,
	Sun,
	Trash2,
} from "lucide-react";

import {
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
	CommandSeparator,
	CommandShortcut,
} from "@/components/tailwind/ui/command";

interface ActionSearchBarProps {
	setOpen?: (open: boolean) => void;
}

export function ActionSearchBar({ setOpen }: ActionSearchBarProps) {
	const router = useRouter();
	const { setTheme } = useTheme();

	const runCommand = React.useCallback(
		(command: () => unknown) => {
			if (setOpen) {
				setOpen(false);
			}
			command();
		},
		[setOpen],
	);

	return (
		<>
			<CommandInput placeholder="Tapez une commande ou cherchez..." />
			<CommandList>
				<CommandEmpty>Aucun résultat trouvé.</CommandEmpty>

				<CommandGroup heading="Navigation">
					<CommandItem
						onSelect={() => {
							runCommand(() => router.push("/"));
						}}
					>
						<Home className="mr-2 h-4 w-4" />
						<span>Accueil</span>
					</CommandItem>
					<CommandItem
						onSelect={() => {
							runCommand(() => router.push("/dashboard"));
						}}
					>
						<BarChart3 className="mr-2 h-4 w-4" />
						<span>Tableau de bord</span>
					</CommandItem>
					<CommandItem
						onSelect={() => {
							runCommand(() => router.push("/pipeline"));
						}}
					>
						<Car className="mr-2 h-4 w-4" />
						<span>Pipeline M&A</span>
					</CommandItem>
					<CommandItem
						onSelect={() => {
							runCommand(() => router.push("/documents"));
						}}
					>
						<FileText className="mr-2 h-4 w-4" />
						<span>Documents</span>
					</CommandItem>
					<CommandItem
						onSelect={() => {
							runCommand(() => router.push("/presentations"));
						}}
					>
						<Presentation className="mr-2 h-4 w-4" />
						<span>Présentations</span>
					</CommandItem>
					<CommandItem
						onSelect={() => {
							runCommand(() => router.push("/calendar"));
						}}
					>
						<Calendar className="mr-2 h-4 w-4" />
						<span>Calendrier</span>
					</CommandItem>
				</CommandGroup>

				<CommandSeparator />

				<CommandGroup heading="Création">
					<CommandItem
						onSelect={() => {
							runCommand(() => router.push("/documents/new"));
						}}
					>
						<Plus className="mr-2 h-4 w-4" />
						<span>Nouveau Document</span>
						<CommandShortcut>⌘N</CommandShortcut>
					</CommandItem>
				</CommandGroup>

				<CommandSeparator />

				<CommandGroup heading="Bibliothèque">
					<CommandItem
						onSelect={() => {
							runCommand(() => router.push("/favorites"));
						}}
					>
						<Heart className="mr-2 h-4 w-4" />
						<span>Favoris</span>
					</CommandItem>
					<CommandItem
						onSelect={() => {
							runCommand(() => router.push("/trash"));
						}}
					>
						<Trash2 className="mr-2 h-4 w-4" />
						<span>Corbeille</span>
					</CommandItem>
				</CommandGroup>

				<CommandSeparator />

				<CommandGroup heading="Paramètres">
					<CommandItem
						onSelect={() => {
							runCommand(() => setTheme("light"));
						}}
					>
						<Sun className="mr-2 h-4 w-4" />
						<span>Thème clair</span>
					</CommandItem>
					<CommandItem
						onSelect={() => {
							runCommand(() => setTheme("dark"));
						}}
					>
						<Moon className="mr-2 h-4 w-4" />
						<span>Thème sombre</span>
					</CommandItem>
					<CommandItem
						onSelect={() => {
							runCommand(() => router.push("/settings"));
						}}
					>
						<Settings className="mr-2 h-4 w-4" />
						<span>Paramètres</span>
					</CommandItem>
				</CommandGroup>
			</CommandList>
		</>
	);
}
