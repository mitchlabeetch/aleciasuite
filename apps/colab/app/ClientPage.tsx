"use client";

/**
 * ClientPage - Composant client principal
 * Contient toute la logique client-side (BetterAuth session)
 */

import { Button } from "@/components/tailwind/ui/button";
import {
	Dialog,
	DialogContent,
	DialogTrigger,
} from "@/components/tailwind/ui/dialog";
import Menu from "@/components/tailwind/ui/menu";
import { ScrollArea } from "@/components/tailwind/ui/scroll-area";
import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "@/components/tailwind/ui/tabs";
import { fr } from "@/lib/i18n";
import { BookOpen, Briefcase, FileText, LogIn, User } from "lucide-react";
import nextDynamic from "next/dynamic";
import { useSession, signIn, signOut } from "@alepanel/auth/client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/tailwind/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/tailwind/ui/avatar";

// Dynamic imports to avoid SSR issues
const TailwindAdvancedEditor = nextDynamic(
	() => import("@/components/tailwind/advanced-editor"),
	{
		ssr: false,
		loading: () => <div className="animate-pulse h-96 bg-muted rounded-lg" />,
	},
);

const DealPipeline = nextDynamic(() => import("@/components/deal-pipeline"), {
	ssr: false,
	loading: () => <div className="animate-pulse h-96 bg-muted rounded-lg" />,
});

export default function ClientPage() {
	const { data: session, isPending } = useSession();
	const router = useRouter();
	const [isMounted, setIsMounted] = useState(false);

	useEffect(() => {
		setIsMounted(true);
	}, []);

	// Redirect to dashboard if authenticated
	useEffect(() => {
		if (session?.user && isMounted) {
			router.push("/dashboard");
		}
	}, [session, isMounted, router]);

	const handleSignIn = async () => {
		await signIn.social({
			provider: "google",
			callbackURL: "/dashboard",
		});
	};

	const handleSignOut = async () => {
		await signOut();
	};

	const getInitials = (name?: string | null) => {
		if (!name) return "U";
		const parts = name.split(" ");
		if (parts.length >= 2) {
			return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
		}
		return name.slice(0, 2).toUpperCase();
	};

	// Show loading state while checking session
	if (isPending || !isMounted) {
		return (
			<div className="flex min-h-screen items-center justify-center">
				<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
			</div>
		);
	}

	return (
		<div className="flex min-h-screen flex-col items-center gap-4 py-4 sm:px-5">
			<div className="flex w-full max-w-screen-lg items-center gap-2 px-4 sm:mb-[calc(10vh)]">
				<div className="flex items-center gap-2 mr-4">
					<Briefcase className="h-6 w-6 text-primary" />
					<h1 className="text-xl font-semibold">{fr.app.name}</h1>
				</div>
				<Dialog>
					<DialogTrigger asChild>
						<Button className="gap-2" variant="outline">
							<BookOpen className="h-4 w-4" />
							{fr.actions.quickNote}
						</Button>
					</DialogTrigger>
					<DialogContent className="flex max-w-3xl h-[calc(100vh-24px)]">
						<ScrollArea className="max-h-screen">
							<TailwindAdvancedEditor documentId="demo-document-v1" />
						</ScrollArea>
					</DialogContent>
				</Dialog>
				<Menu />
				<div className="ml-auto flex items-center gap-2">
					{!session?.user ? (
						<Button onClick={handleSignIn} variant="default">
							<LogIn className="mr-2 h-4 w-4" />
							{fr.profile.signIn}
						</Button>
					) : (
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button variant="ghost" className="relative h-10 w-10 rounded-full">
									<Avatar className="h-10 w-10">
										<AvatarImage src={session.user.image || ""} alt={session.user.name || ""} />
										<AvatarFallback>{getInitials(session.user.name)}</AvatarFallback>
									</Avatar>
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent className="w-56" align="end" forceMount>
								<DropdownMenuLabel className="font-normal">
									<div className="flex flex-col space-y-1">
										<p className="text-sm font-medium leading-none">{session.user.name}</p>
										<p className="text-xs leading-none text-muted-foreground">
											{session.user.email}
										</p>
									</div>
								</DropdownMenuLabel>
								<DropdownMenuSeparator />
								<DropdownMenuItem onClick={handleSignOut}>
									Se déconnecter
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					)}
				</div>
			</div>

			<div className="w-full max-w-screen-lg px-4">
				<Tabs defaultValue="editor" className="w-full">
					<TabsList className="grid w-full grid-cols-2 max-w-md">
						<TabsTrigger value="editor" className="gap-2">
							<FileText className="h-4 w-4" />
							{fr.tabs.editor}
						</TabsTrigger>
						<TabsTrigger value="pipeline" className="gap-2">
							<Briefcase className="h-4 w-4" />
							{fr.tabs.pipeline}
						</TabsTrigger>
					</TabsList>

					<TabsContent value="editor" className="mt-6">
						<TailwindAdvancedEditor documentId="demo-document-v1" />
					</TabsContent>

					<TabsContent value="pipeline" className="mt-6">
						<DealPipeline />
					</TabsContent>
				</Tabs>
			</div>
		</div>
	);
}
