"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
	Briefcase,
	Building,
	Calendar,
	FileText,
	History,
	LayoutGrid,
	Loader2,
	Presentation,
	PlusCircle,
	Search,
	Settings,
	User,
	Users,
} from "lucide-react";

import {
	CommandDialog,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
	CommandSeparator,
	CommandShortcut,
} from "@/components/tailwind/ui/command";
import { useCommandMenu } from "./command-menu-provider";

// Search result type
interface SearchResult {
	id: string;
	type: string;
	title: string;
	subtitle?: string;
}

// Icon mapping for search result types
const typeIcons: Record<string, React.ReactNode> = {
	deal: <Briefcase className="mr-2 h-4 w-4 text-orange-500" />,
	company: <Building className="mr-2 h-4 w-4 text-indigo-500" />,
	contact: <User className="mr-2 h-4 w-4 text-pink-500" />,
	document: <FileText className="mr-2 h-4 w-4 text-green-500" />,
	presentation: <Presentation className="mr-2 h-4 w-4 text-purple-500" />,
	calendar_event: <Calendar className="mr-2 h-4 w-4 text-blue-500" />,
	blog_post: <FileText className="mr-2 h-4 w-4 text-gray-500" />,
};

// URL mapping for search result types
const getResultUrl = (type: string, id: string): string => {
	switch (type) {
		case "deal":
			return `/pipeline?deal=${id}`;
		case "company":
			return `/companies/${id}`;
		case "contact":
			return `/contacts/${id}`;
		case "document":
			return `/colab/documents/${id}`;
		case "presentation":
			return `/colab/presentations/${id}`;
		case "calendar_event":
			return `/calendar`;
		case "blog_post":
			return `/blog`;
		default:
			return "/";
	}
};

export function CommandMenu() {
	const router = useRouter();
	const { open, setOpen } = useCommandMenu();
	const [searchQuery, setSearchQuery] = React.useState("");
	const [searchResults, setSearchResults] = React.useState<SearchResult[]>([]);
	const [isSearching, setIsSearching] = React.useState(false);

	// Search with server action
	React.useEffect(() => {
		if (searchQuery.length < 2) {
			setSearchResults([]);
			return;
		}

		let cancelled = false;
		setIsSearching(true);

		async function performSearch() {
			try {
				// TODO: Create a search server action
				// For now, return empty results
				if (!cancelled) {
					setSearchResults([]);
					setIsSearching(false);
				}
			} catch (err) {
				console.error("Search error:", err);
				if (!cancelled) {
					setSearchResults([]);
					setIsSearching(false);
				}
			}
		}

		const debounce = setTimeout(performSearch, 300);
		return () => {
			cancelled = true;
			clearTimeout(debounce);
		};
	}, [searchQuery]);

	const runCommand = React.useCallback(
		(command: () => unknown) => {
			setOpen(false);
			setSearchQuery("");
			command();
		},
		[setOpen],
	);

	// Reset search when dialog closes
	React.useEffect(() => {
		if (!open) {
			setSearchQuery("");
		}
	}, [open]);

	return (
		<CommandDialog open={open} onOpenChange={setOpen}>
			<CommandInput
				placeholder="Rechercher..."
				value={searchQuery}
				onValueChange={setSearchQuery}
			/>
			<CommandList>
				{isSearching && (
					<div className="flex items-center justify-center py-6">
						<Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
					</div>
				)}

				{/* Search Results */}
				{searchResults && searchResults.length > 0 && (
					<>
						<CommandGroup heading="Résultats">
							{searchResults.map((result: SearchResult) => (
								<CommandItem
									key={`${result.type}-${result.id}`}
									onSelect={() => {
										runCommand(() =>
											router.push(getResultUrl(result.type, result.id)),
										);
									}}
								>
									{typeIcons[result.type] || (
										<Search className="mr-2 h-4 w-4" />
									)}
									<div className="flex flex-col">
										<span>{result.title}</span>
										{result.subtitle && (
											<span className="text-xs text-muted-foreground">
												{result.subtitle}
											</span>
										)}
									</div>
								</CommandItem>
							))}
						</CommandGroup>
						<CommandSeparator />
					</>
				)}

				{searchQuery.length >= 2 &&
					searchResults?.length === 0 &&
					!isSearching && <CommandEmpty>Aucun résultat trouvé.</CommandEmpty>}

				{/* Show default menu when not searching */}
				{searchQuery.length < 2 && (
					<>
						<CommandGroup heading="Actions">
							<CommandItem
								onSelect={() => {
									runCommand(() => router.push("/pipeline"));
								}}
							>
								<PlusCircle className="mr-2 h-4 w-4 text-blue-500" />
								<span>Nouveau Deal</span>
								<CommandShortcut>⌘N</CommandShortcut>
							</CommandItem>
							<CommandItem
								onSelect={() => {
									runCommand(() => router.push("/colab/documents/new"));
								}}
							>
								<FileText className="mr-2 h-4 w-4 text-green-500" />
								<span>Nouveau Document</span>
								<CommandShortcut>⌘⇧N</CommandShortcut>
							</CommandItem>
						</CommandGroup>
						<CommandSeparator />
						<CommandGroup heading="Navigation">
							<CommandItem
								onSelect={() => {
									runCommand(() => router.push("/pipeline"));
								}}
							>
								<LayoutGrid className="mr-2 h-4 w-4 text-purple-500" />
								<span>Pipeline</span>
								<CommandShortcut>⌘P</CommandShortcut>
							</CommandItem>
							<CommandItem
								onSelect={() => {
									runCommand(() => router.push("/pipeline"));
								}}
							>
								<Briefcase className="mr-2 h-4 w-4 text-orange-500" />
								<span>Deals</span>
							</CommandItem>
							<CommandItem
								onSelect={() => {
									runCommand(() => router.push("/companies"));
								}}
							>
								<Building className="mr-2 h-4 w-4 text-indigo-500" />
								<span>Entreprises</span>
							</CommandItem>
							<CommandItem
								onSelect={() => {
									runCommand(() => router.push("/calendar"));
								}}
							>
								<Calendar className="mr-2 h-4 w-4 text-blue-500" />
								<span>Calendrier</span>
							</CommandItem>
							<CommandItem
								onSelect={() => {
									runCommand(() => router.push("/team"));
								}}
							>
								<Users className="mr-2 h-4 w-4 text-pink-500" />
								<span>Équipe</span>
							</CommandItem>
							<CommandItem
								onSelect={() => {
									runCommand(() => router.push("/recent"));
								}}
							>
								<History className="mr-2 h-4 w-4 text-gray-500" />
								<span>Récents</span>
							</CommandItem>
						</CommandGroup>
						<CommandSeparator />
						<CommandGroup heading="Système">
							<CommandItem
								onSelect={() => {
									runCommand(() => router.push("/settings"));
								}}
							>
								<Settings className="mr-2 h-4 w-4 text-gray-500" />
								<span>Paramètres</span>
								<CommandShortcut>⌘,</CommandShortcut>
							</CommandItem>
						</CommandGroup>
					</>
				)}
			</CommandList>
		</CommandDialog>
	);
}
