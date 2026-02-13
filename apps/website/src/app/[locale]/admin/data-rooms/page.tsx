"use client";

/**
 * Virtual Data Rooms - List Page
 *
 * Displays all data rooms with:
 * - Grid view of rooms with stats
 * - Status filtering (setup, active, closed, archived)
 * - Quick actions (enter, settings, archive)
 * - Create new room from deal modal
 */

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";

import { useToast } from "@/components/ui/use-toast";
import {
	FolderLock,
	Plus,
	Settings,
	Archive,
	ArrowRight,
	Loader2,
	Search,
	LayoutGrid,
	List,
	Clock,
	Shield,
	Eye,
	Download,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import { getDealRoom, createDealRoom, getDeals } from "@/actions";

// Type definitions
interface DataRoom {
	id: string;
	createdAt: Date;
	dealId: string;
	name: string;
	status: "setup" | "active" | "closed" | "archived";
	settings: {
		watermarkEnabled: boolean;
		downloadRestricted: boolean;
		expiresAt?: number;
		allowedDomains?: string[];
	};
	createdBy: string;
	updatedAt: Date;
	dealTitle?: string;
	dealStage?: string;
	documentCount: number;
	folderCount: number;
	questionCount: number;
	invitationCount: number;
}

interface Deal {
	id: string;
	title: string;
	stage: string;
}

// Status badge styling
const STATUS_CONFIG: Record<
	string,
	{
		label: string;
		variant: "default" | "secondary" | "destructive" | "outline";
	}
> = {
	setup: { label: "Configuration", variant: "secondary" },
	active: { label: "Active", variant: "default" },
	closed: { label: "Fermée", variant: "outline" },
	archived: { label: "Archivée", variant: "destructive" },
};

// Format relative time
function formatRelativeTime(timestamp: number): string {
	const now = Date.now();
	const diff = now - timestamp;
	const minutes = Math.floor(diff / 60000);
	const hours = Math.floor(minutes / 60);
	const days = Math.floor(hours / 24);

	if (days > 0) return `il y a ${days}j`;
	if (hours > 0) return `il y a ${hours}h`;
	if (minutes > 0) return `il y a ${minutes}m`;
	return "à l'instant";
}

// Room card component
function RoomCard({ room }: { room: DataRoom }) {
	const statusConfig = STATUS_CONFIG[room.status] || STATUS_CONFIG.setup;

	return (
		<Card className="hover:shadow-lg transition-shadow">
			<CardHeader className="pb-3">
				<div className="flex items-start justify-between">
					<div className="flex items-center gap-3">
						<div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
							<FolderLock className="h-5 w-5 text-primary" />
						</div>
						<div>
							<CardTitle className="text-lg">{room.name}</CardTitle>
							<CardDescription>{room.dealTitle}</CardDescription>
						</div>
					</div>
					<Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
				</div>
			</CardHeader>
			<CardContent>
				{/* Stats */}
				<div className="grid grid-cols-4 gap-4 mb-4">
					<div className="text-center">
						<div className="text-2xl font-bold">{room.documentCount}</div>
						<div className="text-xs text-muted-foreground">Documents</div>
					</div>
					<div className="text-center">
						<div className="text-2xl font-bold">{room.folderCount}</div>
						<div className="text-xs text-muted-foreground">Dossiers</div>
					</div>
					<div className="text-center">
						<div className="text-2xl font-bold">{room.questionCount}</div>
						<div className="text-xs text-muted-foreground">Q&A</div>
					</div>
					<div className="text-center">
						<div className="text-2xl font-bold">{room.invitationCount}</div>
						<div className="text-xs text-muted-foreground">Invités</div>
					</div>
				</div>

				{/* Settings indicators */}
				<div className="flex items-center gap-2 mb-4 text-xs text-muted-foreground">
					{room.settings.watermarkEnabled && (
						<div className="flex items-center gap-1">
							<Shield className="h-3 w-3" />
							Watermark
						</div>
					)}
					{room.settings.downloadRestricted && (
						<div className="flex items-center gap-1">
							<Download className="h-3 w-3 line-through" />
							Téléchargement restreint
						</div>
					)}
				</div>

				{/* Last update */}
				<div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
					<div className="flex items-center gap-1">
						<Clock className="h-3 w-3" />
						Mise à jour {formatRelativeTime(room.updatedAt.getTime())}
					</div>
				</div>

				{/* Actions */}
				<div className="flex gap-2">
					<Link href={`/admin/data-rooms/${room.id}`} className="flex-1">
						<Button
							className="w-full"
							variant={room.status === "active" ? "default" : "secondary"}
						>
							<ArrowRight className="h-4 w-4 mr-2" />
							Entrer
						</Button>
					</Link>
					<Link href={`/admin/data-rooms/${room.id}/settings`}>
						<Button variant="outline" size="icon">
							<Settings className="h-4 w-4" />
						</Button>
					</Link>
				</div>
			</CardContent>
		</Card>
	);
}

// Create room dialog
function CreateRoomDialog({ onCreated }: { onCreated: () => void }) {
	const { toast } = useToast();
	const router = useRouter();
	const [open, setOpen] = useState(false);
	const [dealId, setDealId] = useState<string>("");
	const [name, setName] = useState("");
	const [watermarkEnabled, setWatermarkEnabled] = useState(false);
	const [downloadRestricted, setDownloadRestricted] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);

	const [deals, setDeals] = useState<Deal[]>([]);
	const [loading, setLoading] = useState(true);
	const [rooms, setRooms] = useState<DataRoom[]>([]);

	useEffect(() => {
		const loadDeals = async () => {
			setLoading(true);
			try {
				const dealsData = await getDeals({});
				setDeals(dealsData as any);
			} catch (error) {
				console.error("Failed to load deals:", error);
			} finally {
				setLoading(false);
			}
		};
		loadDeals();
	}, []);

	// Filter deals that don't have a room yet
	const dealsWithoutRoom = deals.filter(
		(deal: Deal) => !rooms.some((room: DataRoom) => room.dealId === deal.id),
	);

	const handleSubmit = async () => {
		if (!dealId || !name.trim()) {
			toast({
				title: "Erreur",
				description: "Veuillez sélectionner un deal et entrer un nom.",
				variant: "destructive",
			});
			return;
		}

		setIsSubmitting(true);
		try {
			await createDealRoom({
				dealId,
				name: name.trim(),
				watermarkEnabled,
			});

			toast({ title: "Data Room créée avec succès" });
			setOpen(false);
			setDealId("");
			setName("");
			setWatermarkEnabled(false);
			setDownloadRestricted(false);
			onCreated();
			router.refresh();
		} catch (_error) {
			toast({
				title: "Erreur",
				description: "Impossible de créer la Data Room.",
				variant: "destructive",
			});
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button>
					<Plus className="h-4 w-4 mr-2" />
					Nouvelle Data Room
				</Button>
			</DialogTrigger>
			<DialogContent className="sm:max-w-125">
				<DialogHeader>
					<DialogTitle>Créer une Data Room</DialogTitle>
					<DialogDescription>
						Créez une Data Room sécurisée pour un deal. Les dossiers standard
						seront créés automatiquement.
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-4 py-4">
					{/* Deal selection */}
					<div className="space-y-2">
						<label htmlFor="deal-select" className="text-sm font-medium">
							Deal
						</label>
						<Select value={dealId} onValueChange={setDealId}>
							<SelectTrigger id="deal-select">
								<SelectValue placeholder="Sélectionner un deal" />
							</SelectTrigger>
							<SelectContent>
								{dealsWithoutRoom?.map((deal: Deal) => (
									<SelectItem key={deal.id} value={deal.id}>
										{deal.title}
									</SelectItem>
								))}
								{(!dealsWithoutRoom || dealsWithoutRoom.length === 0) && (
									<SelectItem value="" disabled>
										Aucun deal disponible
									</SelectItem>
								)}
							</SelectContent>
						</Select>
					</div>

					{/* Room name */}
					<div className="space-y-2">
						<label htmlFor="room-name" className="text-sm font-medium">
							Nom de la Data Room
						</label>
						<Input
							id="room-name"
							value={name}
							onChange={(e) => setName(e.target.value)}
							placeholder="ex: Projet Alpha - VDR"
						/>
					</div>

					{/* Settings */}
					<div className="space-y-3">
						<div className="text-sm font-medium">Paramètres de sécurité</div>
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-2">
								<Shield className="h-4 w-4 text-muted-foreground" />
								<span className="text-sm">Activer le watermark</span>
							</div>
							<input
								type="checkbox"
								checked={watermarkEnabled}
								onChange={(e) => setWatermarkEnabled(e.target.checked)}
								className="h-4 w-4"
							/>
						</div>
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-2">
								<Download className="h-4 w-4 text-muted-foreground" />
								<span className="text-sm">Restreindre les téléchargements</span>
							</div>
							<input
								type="checkbox"
								checked={downloadRestricted}
								onChange={(e) => setDownloadRestricted(e.target.checked)}
								className="h-4 w-4"
							/>
						</div>
					</div>
				</div>

				<DialogFooter>
					<Button variant="outline" onClick={() => setOpen(false)}>
						Annuler
					</Button>
					<Button onClick={handleSubmit} disabled={isSubmitting}>
						{isSubmitting ? (
							<>
								<Loader2 className="h-4 w-4 mr-2 animate-spin" />
								Création...
							</>
						) : (
							<>
								<Plus className="h-4 w-4 mr-2" />
								Créer
							</>
						)}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

export default function DataRoomsPage() {
	const { toast: _toast } = useToast();
	const [statusFilter, setStatusFilter] = useState<string>("all");
	const [searchQuery, setSearchQuery] = useState("");
	const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

	// Data
	const [rooms, setRooms] = useState<DataRoom[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const loadRooms = async () => {
			setLoading(true);
			try {
				// TODO: Implement listDataRooms server action
				// const roomsData = await listDataRooms(
				// 	statusFilter !== "all"
				// 		? { status: statusFilter as "setup" | "active" | "closed" | "archived" }
				// 		: {},
				// );
				// setRooms(roomsData);
				setRooms([]);
			} catch (error) {
				console.error("Failed to load rooms:", error);
			} finally {
				setLoading(false);
			}
		};
		loadRooms();
	}, [statusFilter]);

	const isLoading = loading;

	// Filter rooms by search
	const filteredRooms = rooms?.filter(
		(room: DataRoom) =>
			room.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
			room.dealTitle?.toLowerCase().includes(searchQuery.toLowerCase()),
	);

	// Stats
	const stats = {
		total: rooms?.length || 0,
		active: rooms?.filter((r: DataRoom) => r.status === "active").length || 0,
		setup: rooms?.filter((r: DataRoom) => r.status === "setup").length || 0,
		closed: rooms?.filter((r: DataRoom) => r.status === "closed").length || 0,
	};

	return (
		<div className="space-y-6 p-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold flex items-center gap-2">
						<FolderLock className="h-8 w-8 text-primary" />
						Virtual Data Rooms
					</h1>
					<p className="text-muted-foreground">
						Gérez vos espaces de partage sécurisés pour les deals M&A.
					</p>
				</div>
				<CreateRoomDialog onCreated={() => {}} />
			</div>

			{/* Stats */}
			<div className="grid grid-cols-4 gap-4">
				<Card>
					<CardContent className="pt-4">
						<div className="flex items-center gap-2">
							<FolderLock className="h-5 w-5 text-muted-foreground" />
							<div>
								<p className="text-2xl font-bold">{stats.total}</p>
								<p className="text-xs text-muted-foreground">Total</p>
							</div>
						</div>
					</CardContent>
				</Card>
				<Card className="border-green-500/30 bg-green-500/5">
					<CardContent className="pt-4">
						<div className="flex items-center gap-2">
							<Eye className="h-5 w-5 text-green-600" />
							<div>
								<p className="text-2xl font-bold text-green-600">
									{stats.active}
								</p>
								<p className="text-xs text-muted-foreground">Actives</p>
							</div>
						</div>
					</CardContent>
				</Card>
				<Card className="border-orange-500/30 bg-orange-500/5">
					<CardContent className="pt-4">
						<div className="flex items-center gap-2">
							<Settings className="h-5 w-5 text-orange-600" />
							<div>
								<p className="text-2xl font-bold text-orange-600">
									{stats.setup}
								</p>
								<p className="text-xs text-muted-foreground">
									En configuration
								</p>
							</div>
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="pt-4">
						<div className="flex items-center gap-2">
							<Archive className="h-5 w-5 text-muted-foreground" />
							<div>
								<p className="text-2xl font-bold">{stats.closed}</p>
								<p className="text-xs text-muted-foreground">Fermées</p>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Filters */}
			<div className="flex items-center gap-4">
				<div className="relative flex-1 max-w-sm">
					<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
					<Input
						placeholder="Rechercher une Data Room..."
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						className="pl-9"
					/>
				</div>

				<Select value={statusFilter} onValueChange={setStatusFilter}>
					<SelectTrigger className="w-45">
						<SelectValue placeholder="Filtrer par statut" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">Tous les statuts</SelectItem>
						<SelectItem value="active">Actives</SelectItem>
						<SelectItem value="setup">En configuration</SelectItem>
						<SelectItem value="closed">Fermées</SelectItem>
						<SelectItem value="archived">Archivées</SelectItem>
					</SelectContent>
				</Select>

				<div className="flex border rounded-lg overflow-hidden">
					<Button
						variant={viewMode === "grid" ? "secondary" : "ghost"}
						size="icon"
						onClick={() => setViewMode("grid")}
					>
						<LayoutGrid className="h-4 w-4" />
					</Button>
					<Button
						variant={viewMode === "list" ? "secondary" : "ghost"}
						size="icon"
						onClick={() => setViewMode("list")}
					>
						<List className="h-4 w-4" />
					</Button>
				</div>
			</div>

			{/* Room list */}
			{isLoading ? (
				<div className="flex items-center justify-center py-12">
					<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
				</div>
			) : filteredRooms?.length === 0 ? (
				<Card className="py-12">
					<CardContent className="text-center">
						<FolderLock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
						<h3 className="text-lg font-semibold mb-2">Aucune Data Room</h3>
						<p className="text-muted-foreground mb-4">
							{searchQuery
								? "Aucune Data Room ne correspond à votre recherche."
								: "Créez votre première Data Room pour commencer."}
						</p>
						{!searchQuery && <CreateRoomDialog onCreated={() => {}} />}
					</CardContent>
				</Card>
			) : viewMode === "grid" ? (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					{filteredRooms?.map((room: DataRoom) => (
						<RoomCard key={room.id} room={room} />
					))}
				</div>
			) : (
				<Card>
					<CardContent className="p-0">
						<table className="w-full">
							<thead>
								<tr className="border-b">
									<th className="text-left p-4 font-medium">Nom</th>
									<th className="text-left p-4 font-medium">Deal</th>
									<th className="text-left p-4 font-medium">Statut</th>
									<th className="text-center p-4 font-medium">Documents</th>
									<th className="text-center p-4 font-medium">Q&A</th>
									<th className="text-center p-4 font-medium">Invités</th>
									<th className="text-left p-4 font-medium">Mise à jour</th>
									<th className="text-right p-4 font-medium">Actions</th>
								</tr>
							</thead>
							<tbody>
								{filteredRooms?.map((room: DataRoom) => {
									const statusConfig =
										STATUS_CONFIG[room.status] || STATUS_CONFIG.setup;
									return (
										<tr key={room.id} className="border-b hover:bg-muted/50">
											<td className="p-4">
												<div className="flex items-center gap-2">
													<FolderLock className="h-4 w-4 text-primary" />
													<span className="font-medium">{room.name}</span>
												</div>
											</td>
											<td className="p-4 text-muted-foreground">
												{room.dealTitle}
											</td>
											<td className="p-4">
												<Badge variant={statusConfig.variant}>
													{statusConfig.label}
												</Badge>
											</td>
											<td className="p-4 text-center">{room.documentCount}</td>
											<td className="p-4 text-center">{room.questionCount}</td>
											<td className="p-4 text-center">
												{room.invitationCount}
											</td>
											<td className="p-4 text-muted-foreground text-sm">
												{formatRelativeTime(room.updatedAt.getTime())}
											</td>
											<td className="p-4 text-right">
												<Link href={`/admin/data-rooms/${room.id}`}>
													<Button size="sm">
														Entrer
														<ArrowRight className="h-3 w-3 ml-1" />
													</Button>
												</Link>
											</td>
										</tr>
									);
								})}
							</tbody>
						</table>
					</CardContent>
				</Card>
			)}
		</div>
	);
}
