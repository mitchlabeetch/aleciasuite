"use client";

import { useSession, signOut } from "@alepanel/auth/client";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LogOut, Mail, User, Shield } from "lucide-react";

/**
 * Account Page - User Profile Management
 *
 * Displays user information from BetterAuth session.
 * Full profile editing will be available via custom forms.
 */
export default function AccountPage() {
	const { data: session, isPending } = useSession();
	const router = useRouter();
	const params = useParams();
	const locale = params?.locale || 'fr';

	if (isPending) {
		return (
			<div className="py-8 flex justify-center">
				<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--alecia-mid-blue)]" />
			</div>
		);
	}

	if (!session) {
		router.push(`/${locale}/admin-sign-in`);
		return null;
	}

	const user = session.user;
	const initials = (user.name || user.email || "?")
		.split(" ")
		.map((n: string) => n.charAt(0))
		.join("")
		.slice(0, 2)
		.toUpperCase();

	return (
		<div className="py-8 max-w-2xl mx-auto">
			<div className="mb-6">
				<h1 className="text-2xl font-bold text-[var(--alecia-midnight)] dark:text-white">
					Mon Compte
				</h1>
				<p className="text-sm text-muted-foreground mt-1">
					Gérez vos informations personnelles et vos paramètres de sécurité
				</p>
			</div>

			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-3">
						<Avatar className="h-12 w-12">
							<AvatarImage src={user.image || undefined} alt={user.name || "User"} />
							<AvatarFallback className="bg-[var(--alecia-light-blue)] text-white">
								{initials}
							</AvatarFallback>
						</Avatar>
						<div>
							<p className="text-lg font-semibold">{user.name || "Utilisateur"}</p>
							<p className="text-sm text-muted-foreground">{user.email}</p>
						</div>
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="flex items-center gap-2 text-sm">
						<User className="w-4 h-4 text-muted-foreground" />
						<span className="text-muted-foreground">ID:</span>
						<span className="font-mono text-xs">{user.id}</span>
					</div>
					<div className="flex items-center gap-2 text-sm">
						<Mail className="w-4 h-4 text-muted-foreground" />
						<span className="text-muted-foreground">Email:</span>
						<span>{user.email}</span>
					</div>
					<div className="flex items-center gap-2 text-sm">
						<Shield className="w-4 h-4 text-muted-foreground" />
						<span className="text-muted-foreground">Session:</span>
						<span className="font-mono text-xs">{session.session.id}</span>
					</div>

					<div className="pt-4 border-t">
						<Button
							variant="destructive"
							onClick={async () => {
								await signOut();
								router.push(`/${locale}/admin-sign-in`);
							}}
							className="gap-2"
						>
							<LogOut className="w-4 h-4" />
							Se déconnecter
						</Button>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
