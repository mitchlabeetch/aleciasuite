"use client";

/**
 * Integrations Page - Admin Settings
 *
 * Allows users to connect and manage external service integrations:
 * - Microsoft 365 (Calendar, Contacts, OneDrive)
 * - Google (Calendar)
 * - Pipedrive (CRM, Deals)
 *
 * Uses Convex OAuth flow with token storage.
 * @see Batch 4: Authentication & Data Sync
 * @see Phase 2.3: Calendar Sync
 */

import { useMicrosoftSync } from "@/hooks/use-microsoft-sync";
import { usePipedriveSync } from "@/hooks/use-pipedrive-sync";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import {
	CheckCircle2,
	XCircle,
	RefreshCw,
	Calendar,
	Users,
	Building,
	Briefcase,
	ExternalLink,
	Clock,
	AlertCircle,
	Loader2,
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { useSession } from "@alepanel/auth/client";
import { useSearchParams, useRouter, useParams } from "next/navigation";
import { integrations } from "@/actions";
import { getLocaleFromParams } from "@/lib/constants";

export default function IntegrationsPage() {
	const { data: authSession, isPending: userLoading } = useSession();
	const user = authSession?.user;
	const userLoaded = !userLoading;
	const { toast } = useToast();
	const searchParams = useSearchParams();
	const router = useRouter();
	const params = useParams();
	const locale = getLocaleFromParams(params);

	// Microsoft Sync
	const {
		fetchCalendarEvents,
		fetchContacts,
		fetchProfile,
		isLoading: msLoading,
		error: msError,
		lastSyncTime: msLastSync,
		isReady: msReady,
	} = useMicrosoftSync();

	// Pipedrive Sync
	const {
		fetchDeals,
		fetchPersons,
		fetchOrganizations,
		isLoading: pdLoading,
		error: pdError,
		lastSyncTime: pdLastSync,
		isReady: _pdReady,
	} = usePipedriveSync();

	// Connection states
	const [isMicrosoftConnected, setIsMicrosoftConnected] = useState(false);
	const [isPipedriveConnected, setIsPipedriveConnected] = useState(false);
	const [isGoogleConnected, setIsGoogleConnected] = useState(false);
	const [googleEmail, setGoogleEmail] = useState<string | null>(null);
	const [googleSyncState, setGoogleSyncState] = useState<{
		lastSyncedAt: string | null;
	} | null>(null);
	const [msProfile, setMsProfile] = useState<{
		displayName: string;
		mail: string;
	} | null>(null);
	const [isConnecting, setIsConnecting] = useState<
		"microsoft" | "pipedrive" | "google" | null
	>(null);
	const [isCheckingConnections, setIsCheckingConnections] = useState(true);
	const [isSyncingCalendar, setIsSyncingCalendar] = useState<
		"microsoft" | "google" | null
	>(null);

	// Sync results
	const [syncResults, setSyncResults] = useState<{
		calendars?: number;
		contacts?: number;
		deals?: number;
		persons?: number;
		organizations?: number;
	}>({});

	// Handle OAuth callback URL parameters
	useEffect(() => {
		const success = searchParams.get("success");
		const error = searchParams.get("error");
		const provider = searchParams.get("provider");

		if (success === "true" && provider) {
			toast({
				title: "Connexion réussie",
				description: `${provider === "microsoft" ? "Microsoft 365" : "Pipedrive"} a été connecté avec succès.`,
			});
			// Clean URL parameters
			router.replace(`/${locale}/admin/settings/integrations`);
		} else if (error) {
			toast({
				title: "Erreur de connexion",
				description: decodeURIComponent(error),
				variant: "destructive",
			});
			// Clean URL parameters
			router.replace(`/${locale}/admin/settings/integrations`);
		}
	}, [searchParams, toast, router, locale]);

	// Check connection status on mount
	const checkConnections = useCallback(async () => {
		setIsCheckingConnections(true);
		try {
			// Check Microsoft connection
			const msConnected = await integrations.isMicrosoftConnected();
			if (msConnected) {
				setIsMicrosoftConnected(true);
				// Fetch profile if connected and msReady
				if (msReady) {
					const { data: profile } = await fetchProfile();
					if (profile) {
						setMsProfile({
							displayName: profile.displayName,
							mail: profile.mail,
						});
					}
				}
			}

			// Check Pipedrive connection
			const pdConnected = await integrations.isPipedriveConnected();
			setIsPipedriveConnected(pdConnected);

			// Check Google connection
			const googleResult = await integrations.isGoogleConnected();
			setIsGoogleConnected(googleResult.connected);
		} catch (err) {
			console.error("Failed to check connections:", err);
		} finally {
			setIsCheckingConnections(false);
		}
	}, [msReady, fetchProfile]);

	useEffect(() => {
		if (userLoaded && user) {
			checkConnections();
		}
	}, [userLoaded, user, checkConnections]);

	// Handle OAuth connect
	const handleConnect = async (
		provider: "microsoft" | "pipedrive" | "google",
	) => {
		setIsConnecting(provider);
		try {
			let authUrl: string;
			if (provider === "microsoft") {
				authUrl = await integrations.getMicrosoftAuthUrl();
			} else if (provider === "pipedrive") {
				authUrl = await integrations.getPipedriveAuthUrl();
			} else {
				authUrl = await integrations.getGoogleAuthUrl();
			}

			// Redirect to OAuth provider
			window.location.href = authUrl;
		} catch (err) {
			const providerName =
				provider === "microsoft"
					? "Microsoft 365"
					: provider === "pipedrive"
						? "Pipedrive"
						: "Google";
			toast({
				title: "Erreur",
				description: `Impossible de se connecter à ${providerName}.`,
				variant: "destructive",
			});
		} finally {
			setIsConnecting(null);
		}
	};

	// Handle Microsoft calendar sync
	const handleMicrosoftCalendarSync = async () => {
		const now = new Date();
		const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

		const { data: events, error } = await fetchCalendarEvents(
			now,
			thirtyDaysLater,
		);

		if (error) {
			toast({
				title: "Erreur de synchronisation",
				description: error,
				variant: "destructive",
			});
		} else if (events.length > 0) {
			setSyncResults((prev) => ({ ...prev, calendars: events.length }));
			toast({
				title: "Calendrier synchronisé",
				description: `${events.length} événements récupérés des 30 prochains jours.`,
			});
		}
	};

	// Handle Microsoft contacts sync
	const handleMicrosoftContactsSync = async () => {
		const { data: contacts, error } = await fetchContacts();

		if (error) {
			toast({
				title: "Erreur de synchronisation",
				description: error,
				variant: "destructive",
			});
		} else if (contacts.length > 0) {
			setSyncResults((prev) => ({ ...prev, contacts: contacts.length }));
			toast({
				title: "Contacts synchronisés",
				description: `${contacts.length} contacts récupérés depuis Outlook.`,
			});
		}
	};

	// Handle Pipedrive deals sync
	const handlePipedriveDealsSync = async () => {
		const { data: deals, error } = await fetchDeals("all");

		if (error) {
			toast({
				title: "Erreur de synchronisation",
				description: error,
				variant: "destructive",
			});
		} else if (deals.length > 0) {
			setSyncResults((prev) => ({ ...prev, deals: deals.length }));
			toast({
				title: "Deals synchronisés",
				description: `${deals.length} deals récupérés depuis Pipedrive.`,
			});
		}
	};

	// Handle Pipedrive contacts sync
	const handlePipedriveContactsSync = async () => {
		const { data: persons, error: personsError } = await fetchPersons();
		const { data: orgs, error: orgsError } = await fetchOrganizations();

		const error = personsError || orgsError;

		if (error) {
			toast({
				title: "Erreur de synchronisation",
				description: error,
				variant: "destructive",
			});
		}

		setSyncResults((prev) => ({
			...prev,
			persons: persons.length,
			organizations: orgs.length,
		}));

		if (persons.length > 0 || orgs.length > 0) {
			toast({
				title: "Contacts synchronisés",
				description: `${persons.length} contacts et ${orgs.length} entreprises récupérés.`,
			});
		}
	};

	// Handle Microsoft Calendar sync to database (Phase 2.3)
	const _handleMicrosoftCalendarSyncToDb = async () => {
		setIsSyncingCalendar("microsoft");
		try {
			const now = new Date();
			const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
			const result = await integrations.fetchMicrosoftCalendarEvents({
				startDate: now.getTime(),
				endDate: thirtyDaysLater.getTime()
			});
			if (result.success) {
				toast({
					title: "Calendrier Microsoft synchronisé",
					description: `${result.events?.length || 0} événements synchronisés avec la base de données.`,
				});
			} else {
				toast({
					title: "Erreur de synchronisation",
					description: "Impossible de synchroniser le calendrier.",
					variant: "destructive",
				});
			}
		} catch (_err) {
			toast({
				title: "Erreur",
				description: "Une erreur est survenue lors de la synchronisation.",
				variant: "destructive",
			});
		} finally {
			setIsSyncingCalendar(null);
		}
	};

	// Handle Google Calendar sync to database (Phase 2.3)
	const handleGoogleCalendarSync = async () => {
		setIsSyncingCalendar("google");
		try {
			const now = new Date();
			const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
			const result = await integrations.fetchGoogleCalendarEvents({
				startDate: now.getTime(),
				endDate: thirtyDaysLater.getTime()
			});
			if (result.success) {
				toast({
					title: "Calendrier Google synchronisé",
					description: `${result.events?.length || 0} événements synchronisés avec la base de données.`,
				});
			} else {
				toast({
					title: "Erreur de synchronisation",
					description: "Impossible de synchroniser le calendrier.",
					variant: "destructive",
				});
			}
		} catch (_err) {
			toast({
				title: "Erreur",
				description: "Une erreur est survenue lors de la synchronisation.",
				variant: "destructive",
			});
		} finally {
			setIsSyncingCalendar(null);
		}
	};

	const formatLastSync = (date: Date | null) => {
		if (!date) return "Jamais";
		return date.toLocaleString("fr-FR", {
			dateStyle: "short",
			timeStyle: "short",
		});
	};

	return (
		<div className="space-y-8 p-6">
			{/* Header */}
			<div>
				<h1 className="text-3xl font-bold">Intégrations</h1>
				<p className="text-muted-foreground mt-2">
					Connectez vos outils pour synchroniser automatiquement vos données.
				</p>
			</div>

			{/* Integration Cards */}
			<div className="grid gap-6 md:grid-cols-2">
				{/* Microsoft 365 Card */}
				<Card className="border-2 transition-colors hover:border-primary/50">
					<CardHeader className="pb-4">
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-3">
								<div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#0078d4]/10">
									<svg
										className="h-7 w-7"
										viewBox="0 0 23 23"
										fill="none"
										xmlns="http://www.w3.org/2000/svg"
									>
										<path d="M11 11H0V0H11V11Z" fill="#F25022" />
										<path d="M23 11H12V0H23V11Z" fill="#7FBA00" />
										<path d="M11 23H0V12H11V23Z" fill="#00A4EF" />
										<path d="M23 23H12V12H23V23Z" fill="#FFB900" />
									</svg>
								</div>
								<div>
									<CardTitle className="text-lg">Microsoft 365</CardTitle>
									<CardDescription>Outlook, Calendar, Contacts</CardDescription>
								</div>
							</div>
							<Badge
								variant={isMicrosoftConnected ? "default" : "secondary"}
								className={
									isMicrosoftConnected
										? "bg-green-500/10 text-green-500 hover:bg-green-500/20"
										: ""
								}
							>
								{isMicrosoftConnected ? (
									<>
										<CheckCircle2 className="mr-1 h-3 w-3" />
										Connecté
									</>
								) : (
									<>
										<XCircle className="mr-1 h-3 w-3" />
										Non connecté
									</>
								)}
							</Badge>
						</div>
					</CardHeader>

					<CardContent className="space-y-4">
						{isMicrosoftConnected && msProfile && (
							<div className="rounded-lg bg-muted/50 p-3 text-sm">
								<p className="font-medium">{msProfile.displayName}</p>
								<p className="text-muted-foreground">{msProfile.mail}</p>
							</div>
						)}

						{msError && (
							<div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
								<AlertCircle className="h-4 w-4" />
								{msError}
							</div>
						)}

						<Separator />

						{isMicrosoftConnected ? (
							<div className="space-y-3">
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-2">
										<Calendar className="h-4 w-4 text-muted-foreground" />
										<span className="text-sm">Calendrier</span>
										{syncResults.calendars !== undefined && (
											<Badge variant="outline" className="ml-2">
												{syncResults.calendars} événements
											</Badge>
										)}
									</div>
									<Button
										size="sm"
										variant="outline"
										onClick={handleMicrosoftCalendarSync}
										disabled={msLoading}
									>
										{msLoading ? (
											<RefreshCw className="h-4 w-4 animate-spin" />
										) : (
											<RefreshCw className="h-4 w-4" />
										)}
										<span className="ml-2">Sync</span>
									</Button>
								</div>

								<div className="flex items-center justify-between">
									<div className="flex items-center gap-2">
										<Users className="h-4 w-4 text-muted-foreground" />
										<span className="text-sm">Contacts</span>
										{syncResults.contacts !== undefined && (
											<Badge variant="outline" className="ml-2">
												{syncResults.contacts} contacts
											</Badge>
										)}
									</div>
									<Button
										size="sm"
										variant="outline"
										onClick={handleMicrosoftContactsSync}
										disabled={msLoading}
									>
										{msLoading ? (
											<RefreshCw className="h-4 w-4 animate-spin" />
										) : (
											<RefreshCw className="h-4 w-4" />
										)}
										<span className="ml-2">Sync</span>
									</Button>
								</div>

								{msLastSync && (
									<div className="flex items-center gap-2 pt-2 text-xs text-muted-foreground">
										<Clock className="h-3 w-3" />
										Dernière sync: {formatLastSync(msLastSync)}
									</div>
								)}
							</div>
						) : (
							<div className="space-y-3">
								<p className="text-sm text-muted-foreground">
									Synchronisez votre calendrier et vos contacts Outlook pour un
									suivi optimisé de vos deals M&A.
								</p>
								<Button
									className="w-full"
									onClick={() => handleConnect("microsoft")}
									disabled={
										isConnecting === "microsoft" || isCheckingConnections
									}
								>
									{isConnecting === "microsoft" ? (
										<>
											<Loader2 className="mr-2 h-4 w-4 animate-spin" />
											Connexion en cours...
										</>
									) : (
										<>
											Connecter Microsoft 365
											<ExternalLink className="ml-2 h-4 w-4" />
										</>
									)}
								</Button>
							</div>
						)}
					</CardContent>
				</Card>

				{/* Pipedrive Card */}
				<Card className="border-2 transition-colors hover:border-primary/50">
					<CardHeader className="pb-4">
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-3">
								<div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#017737]/10">
									<svg
										className="h-7 w-7"
										viewBox="0 0 24 24"
										fill="none"
										xmlns="http://www.w3.org/2000/svg"
									>
										<path
											d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"
											fill="#017737"
										/>
										<path
											d="M12 6c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm0 10c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z"
											fill="#017737"
										/>
										<circle cx="12" cy="12" r="2" fill="#017737" />
									</svg>
								</div>
								<div>
									<CardTitle className="text-lg">Pipedrive</CardTitle>
									<CardDescription>CRM, Deals, Contacts</CardDescription>
								</div>
							</div>
							<Badge
								variant={isPipedriveConnected ? "default" : "secondary"}
								className={
									isPipedriveConnected
										? "bg-green-500/10 text-green-500 hover:bg-green-500/20"
										: ""
								}
							>
								{isPipedriveConnected ? (
									<>
										<CheckCircle2 className="mr-1 h-3 w-3" />
										Connecté
									</>
								) : (
									<>
										<XCircle className="mr-1 h-3 w-3" />
										Non connecté
									</>
								)}
							</Badge>
						</div>
					</CardHeader>

					<CardContent className="space-y-4">
						{pdError && (
							<div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
								<AlertCircle className="h-4 w-4" />
								{pdError}
							</div>
						)}

						<Separator />

						{isPipedriveConnected ? (
							<div className="space-y-3">
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-2">
										<Briefcase className="h-4 w-4 text-muted-foreground" />
										<span className="text-sm">Deals</span>
										{syncResults.deals !== undefined && (
											<Badge variant="outline" className="ml-2">
												{syncResults.deals} deals
											</Badge>
										)}
									</div>
									<Button
										size="sm"
										variant="outline"
										onClick={handlePipedriveDealsSync}
										disabled={pdLoading}
									>
										{pdLoading ? (
											<RefreshCw className="h-4 w-4 animate-spin" />
										) : (
											<RefreshCw className="h-4 w-4" />
										)}
										<span className="ml-2">Sync</span>
									</Button>
								</div>

								<div className="flex items-center justify-between">
									<div className="flex items-center gap-2">
										<Building className="h-4 w-4 text-muted-foreground" />
										<span className="text-sm">Contacts & Entreprises</span>
										{(syncResults.persons !== undefined ||
											syncResults.organizations !== undefined) && (
											<Badge variant="outline" className="ml-2">
												{(syncResults.persons || 0) +
													(syncResults.organizations || 0)}
											</Badge>
										)}
									</div>
									<Button
										size="sm"
										variant="outline"
										onClick={handlePipedriveContactsSync}
										disabled={pdLoading}
									>
										{pdLoading ? (
											<RefreshCw className="h-4 w-4 animate-spin" />
										) : (
											<RefreshCw className="h-4 w-4" />
										)}
										<span className="ml-2">Sync</span>
									</Button>
								</div>

								{pdLastSync && (
									<div className="flex items-center gap-2 pt-2 text-xs text-muted-foreground">
										<Clock className="h-3 w-3" />
										Dernière sync: {formatLastSync(pdLastSync)}
									</div>
								)}
							</div>
						) : (
							<div className="space-y-3">
								<p className="text-sm text-muted-foreground">
									Importez vos deals et contacts depuis Pipedrive pour
									centraliser votre pipeline M&A.
								</p>
								<Button
									variant="outline"
									className="w-full"
									onClick={() => handleConnect("pipedrive")}
									disabled={
										isConnecting === "pipedrive" || isCheckingConnections
									}
								>
									{isConnecting === "pipedrive" ? (
										<>
											<Loader2 className="mr-2 h-4 w-4 animate-spin" />
											Connexion en cours...
										</>
									) : (
										<>
											Connecter Pipedrive
											<ExternalLink className="ml-2 h-4 w-4" />
										</>
									)}
								</Button>
							</div>
						)}
					</CardContent>
				</Card>

				{/* Google Calendar Card */}
				<Card className="border-2 transition-colors hover:border-primary/50">
					<CardHeader className="pb-4">
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-3">
								<div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#4285F4]/10">
									<svg
										className="h-7 w-7"
										viewBox="0 0 24 24"
										fill="none"
										xmlns="http://www.w3.org/2000/svg"
									>
										<path
											d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
											fill="#4285F4"
										/>
										<path
											d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
											fill="#34A853"
										/>
										<path
											d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
											fill="#FBBC05"
										/>
										<path
											d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
											fill="#EA4335"
										/>
									</svg>
								</div>
								<div>
									<CardTitle className="text-lg">Google Calendar</CardTitle>
									<CardDescription>Calendrier Google</CardDescription>
								</div>
							</div>
							<Badge
								variant={isGoogleConnected ? "default" : "secondary"}
								className={
									isGoogleConnected
										? "bg-green-500/10 text-green-500 hover:bg-green-500/20"
										: ""
								}
							>
								{isGoogleConnected ? (
									<>
										<CheckCircle2 className="mr-1 h-3 w-3" />
										Connecté
									</>
								) : (
									<>
										<XCircle className="mr-1 h-3 w-3" />
										Non connecté
									</>
								)}
							</Badge>
						</div>
					</CardHeader>

					<CardContent className="space-y-4">
						{isGoogleConnected && googleEmail && (
							<div className="rounded-lg bg-muted/50 p-3 text-sm">
								<p className="font-medium">Google Calendar</p>
								<p className="text-muted-foreground">{googleEmail}</p>
							</div>
						)}

						<Separator />

						{isGoogleConnected ? (
							<div className="space-y-3">
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-2">
										<Calendar className="h-4 w-4 text-muted-foreground" />
										<span className="text-sm">Calendrier</span>
										{googleSyncState?.lastSyncedAt && (
											<Badge variant="outline" className="ml-2">
												Synced
											</Badge>
										)}
									</div>
									<Button
										size="sm"
										variant="outline"
										onClick={handleGoogleCalendarSync}
										disabled={isSyncingCalendar === "google"}
									>
										{isSyncingCalendar === "google" ? (
											<RefreshCw className="h-4 w-4 animate-spin" />
										) : (
											<RefreshCw className="h-4 w-4" />
										)}
										<span className="ml-2">Sync</span>
									</Button>
								</div>

								{googleSyncState?.lastSyncedAt && (
									<div className="flex items-center gap-2 pt-2 text-xs text-muted-foreground">
										<Clock className="h-3 w-3" />
										Dernière sync:{" "}
										{new Date(googleSyncState.lastSyncedAt).toLocaleString(
											"fr-FR",
											{
												dateStyle: "short",
												timeStyle: "short",
											},
										)}
									</div>
								)}
							</div>
						) : (
							<div className="space-y-3">
								<p className="text-sm text-muted-foreground">
									Synchronisez votre calendrier Google pour voir tous vos
									événements au même endroit.
								</p>
								<Button
									variant="outline"
									className="w-full"
									onClick={() => handleConnect("google")}
									disabled={isConnecting === "google" || isCheckingConnections}
								>
									{isConnecting === "google" ? (
										<>
											<Loader2 className="mr-2 h-4 w-4 animate-spin" />
											Connexion en cours...
										</>
									) : (
										<>
											Connecter Google Calendar
											<ExternalLink className="ml-2 h-4 w-4" />
										</>
									)}
								</Button>
							</div>
						)}
					</CardContent>
				</Card>
			</div>

			{/* Configuration Info */}
			<Card className="border-dashed">
				<CardHeader>
					<CardTitle className="text-sm font-medium">
						Configuration requise
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="grid gap-4 text-sm md:grid-cols-3">
						<div>
							<h4 className="font-medium mb-2">Microsoft 365</h4>
							<ul className="list-disc list-inside text-muted-foreground space-y-1">
								<li>Azure AD App Registration</li>
								<li>MICROSOFT_CLIENT_ID dans Convex</li>
								<li>MICROSOFT_CLIENT_SECRET dans Convex</li>
								<li>MICROSOFT_TENANT_ID (optionnel)</li>
							</ul>
						</div>
						<div>
							<h4 className="font-medium mb-2">Pipedrive</h4>
							<ul className="list-disc list-inside text-muted-foreground space-y-1">
								<li>Pipedrive OAuth App</li>
								<li>PIPEDRIVE_CLIENT_ID dans Convex</li>
								<li>PIPEDRIVE_CLIENT_SECRET dans Convex</li>
							</ul>
						</div>
						<div>
							<h4 className="font-medium mb-2">Google Calendar</h4>
							<ul className="list-disc list-inside text-muted-foreground space-y-1">
								<li>Google Cloud Console Project</li>
								<li>GOOGLE_CLIENT_ID dans Convex</li>
								<li>GOOGLE_CLIENT_SECRET dans Convex</li>
								<li>OAuth Consent Screen configuré</li>
							</ul>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
