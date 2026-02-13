"use client";

/**
 * Teaser / IM Tracking
 *
 * Document distribution tracking:
 * - Buyer list management
 * - NDA status tracking
 * - Teaser/IM sent status
 * - IOI/Binding offer tracking
 */

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { numbersTools } from "@/actions";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import {
	FileText,
	ArrowLeft,
	Download,
	Save,
	Plus,
	Search,
	Filter,
	Send,
	FileCheck,
	Mail,
	CheckCircle2,
	XCircle,
	Clock,
	Building2,
	User,
	Phone,
	Eye,
	MoreHorizontal,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import { DealSelector } from "@/components/numbers/deal-selector";
import { CrossToolLinks } from "@/components/numbers/cross-tool-links";

type BuyerType = "strategic" | "financial" | "mbo";
type BuyerStatus = "active" | "passed" | "excluded";
type DocumentStatus = "not_sent" | "sent" | "viewed" | "signed" | "declined";

interface Buyer {
	id: string;
	name: string;
	type: BuyerType;
	status: BuyerStatus;
	country: string;
	sector: string;
	contactName: string;
	contactEmail: string;
	contactPhone: string;
	// Document tracking
	teaserSent: DocumentStatus;
	teaserSentDate: string;
	ndaStatus: DocumentStatus;
	ndaSignedDate: string;
	imSent: DocumentStatus;
	imSentDate: string;
	imViewed: boolean;
	ioiReceived: boolean;
	ioiAmount: number;
	ioiDate: string;
	bindingOffer: boolean;
	bindingAmount: number;
	bindingDate: string;
	notes: string;
	lastContact: string;
}

const buyerTypeConfig: Record<BuyerType, { label: string; color: string }> = {
	strategic: { label: "Strategique", color: "bg-blue-500" },
	financial: { label: "Financier", color: "bg-purple-500" },
	mbo: { label: "MBO", color: "bg-amber-500" },
};

const statusConfig: Record<DocumentStatus, { label: string; color: string; icon: typeof Clock }> = {
	not_sent: { label: "Non envoye", color: "text-gray-400", icon: Clock },
	sent: { label: "Envoye", color: "text-blue-500", icon: Send },
	viewed: { label: "Consulte", color: "text-amber-500", icon: Eye },
	signed: { label: "Signe", color: "text-emerald-500", icon: CheckCircle2 },
	declined: { label: "Decline", color: "text-red-500", icon: XCircle },
};

const defaultBuyers: Buyer[] = [
	{
		id: "b1",
		name: "Alpha Capital Partners",
		type: "financial",
		status: "active",
		country: "France",
		sector: "Multi-secteur",
		contactName: "Jean Martin",
		contactEmail: "jmartin@alphacapital.com",
		contactPhone: "+33 1 23 45 67 89",
		teaserSent: "sent",
		teaserSentDate: "2026-02-01",
		ndaStatus: "signed",
		ndaSignedDate: "2026-02-05",
		imSent: "sent",
		imSentDate: "2026-02-07",
		imViewed: true,
		ioiReceived: true,
		ioiAmount: 18000000,
		ioiDate: "2026-02-20",
		bindingOffer: false,
		bindingAmount: 0,
		bindingDate: "",
		notes: "Tres interesse, budget confirme",
		lastContact: "2026-02-03",
	},
	{
		id: "b2",
		name: "Beta Industries SA",
		type: "strategic",
		status: "active",
		country: "Allemagne",
		sector: "Industrie",
		contactName: "Hans Mueller",
		contactEmail: "h.mueller@betaind.de",
		contactPhone: "+49 89 123 456",
		teaserSent: "sent",
		teaserSentDate: "2026-02-01",
		ndaStatus: "signed",
		ndaSignedDate: "2026-02-04",
		imSent: "sent",
		imSentDate: "2026-02-07",
		imViewed: true,
		ioiReceived: true,
		ioiAmount: 22000000,
		ioiDate: "2026-02-19",
		bindingOffer: false,
		bindingAmount: 0,
		bindingDate: "",
		notes: "Synergies identifiees, interesse pour 100%",
		lastContact: "2026-02-02",
	},
	{
		id: "b3",
		name: "Gamma Equity",
		type: "financial",
		status: "active",
		country: "France",
		sector: "Services",
		contactName: "Marie Dupont",
		contactEmail: "m.dupont@gammaequity.fr",
		contactPhone: "+33 1 98 76 54 32",
		teaserSent: "sent",
		teaserSentDate: "2026-02-01",
		ndaStatus: "sent",
		ndaSignedDate: "",
		imSent: "not_sent",
		imSentDate: "",
		imViewed: false,
		ioiReceived: false,
		ioiAmount: 0,
		ioiDate: "",
		bindingOffer: false,
		bindingAmount: 0,
		bindingDate: "",
		notes: "En attente signature NDA",
		lastContact: "2026-02-01",
	},
	{
		id: "b4",
		name: "Delta Corp",
		type: "strategic",
		status: "passed",
		country: "UK",
		sector: "Technologie",
		contactName: "John Smith",
		contactEmail: "j.smith@deltacorp.uk",
		contactPhone: "+44 20 1234 5678",
		teaserSent: "sent",
		teaserSentDate: "2026-02-01",
		ndaStatus: "declined",
		ndaSignedDate: "",
		imSent: "not_sent",
		imSentDate: "",
		imViewed: false,
		ioiReceived: false,
		ioiAmount: 0,
		ioiDate: "",
		bindingOffer: false,
		bindingAmount: 0,
		bindingDate: "",
		notes: "Pas de fit strategique selon eux",
		lastContact: "2026-02-03",
	},
	{
		id: "b5",
		name: "Management Team",
		type: "mbo",
		status: "active",
		country: "France",
		sector: "-",
		contactName: "Pierre Leblanc",
		contactEmail: "p.leblanc@cible.fr",
		contactPhone: "+33 6 12 34 56 78",
		teaserSent: "signed",
		teaserSentDate: "2026-01-15",
		ndaStatus: "signed",
		ndaSignedDate: "2026-01-15",
		imSent: "sent",
		imSentDate: "2026-02-01",
		imViewed: true,
		ioiReceived: true,
		ioiAmount: 15000000,
		ioiDate: "2026-02-18",
		bindingOffer: false,
		bindingAmount: 0,
		bindingDate: "",
		notes: "Avec sponsor financier Epsilon PE",
		lastContact: "2026-02-04",
	},
];

function formatCurrency(value: number): string {
	if (value >= 1000000) {
		return `${(value / 1000000).toFixed(1)}M`;
	}
	if (value >= 1000) {
		return `${(value / 1000).toFixed(0)}K`;
	}
	return value.toString();
}

export default function TeaserTrackingPage() {
	const router = useRouter();
	const [buyers, setBuyers] = useState<Buyer[]>(defaultBuyers);
	const [searchQuery, setSearchQuery] = useState("");
	const [typeFilter, setTypeFilter] = useState<BuyerType | "all">("all");
	const [statusFilter, setStatusFilter] = useState<BuyerStatus | "all">("all");
	const [isAddOpen, setIsAddOpen] = useState(false);
	const [newBuyer, setNewBuyer] = useState<Partial<Buyer>>({
		type: "strategic",
		status: "active",
		teaserSent: "not_sent",
		ndaStatus: "not_sent",
		imSent: "not_sent",
	});
	const [isSaving, setIsSaving] = useState(false);

	const filteredBuyers = useMemo(() => {
		return buyers.filter((buyer) => {
			const matchesSearch =
				buyer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
				buyer.contactName.toLowerCase().includes(searchQuery.toLowerCase());
			const matchesType = typeFilter === "all" || buyer.type === typeFilter;
			const matchesStatus = statusFilter === "all" || buyer.status === statusFilter;
			return matchesSearch && matchesType && matchesStatus;
		});
	}, [buyers, searchQuery, typeFilter, statusFilter]);

	const stats = useMemo(() => {
		const active = buyers.filter((b) => b.status === "active").length;
		const teasersSent = buyers.filter((b) => b.teaserSent !== "not_sent").length;
		const ndasSigned = buyers.filter((b) => b.ndaStatus === "signed").length;
		const imsSent = buyers.filter((b) => b.imSent !== "not_sent").length;
		const ioisReceived = buyers.filter((b) => b.ioiReceived).length;
		const bindingOffers = buyers.filter((b) => b.bindingOffer).length;
		const totalIoiValue = buyers.reduce((sum, b) => sum + b.ioiAmount, 0);

		return { active, teasersSent, ndasSigned, imsSent, ioisReceived, bindingOffers, totalIoiValue };
	}, [buyers]);

	const updateBuyerField = (buyerId: string, field: keyof Buyer, value: unknown) => {
		setBuyers((prev) =>
			prev.map((b) =>
				b.id === buyerId ? { ...b, [field]: value } : b
			)
		);
	};

	const handleAddBuyer = () => {
		if (!newBuyer.name) return;

		const buyer: Buyer = {
			id: `b${Date.now()}`,
			name: newBuyer.name,
			type: newBuyer.type as BuyerType,
			status: newBuyer.status as BuyerStatus,
			country: newBuyer.country || "France",
			sector: newBuyer.sector || "",
			contactName: newBuyer.contactName || "",
			contactEmail: newBuyer.contactEmail || "",
			contactPhone: newBuyer.contactPhone || "",
			teaserSent: "not_sent",
			teaserSentDate: "",
			ndaStatus: "not_sent",
			ndaSignedDate: "",
			imSent: "not_sent",
			imSentDate: "",
			imViewed: false,
			ioiReceived: false,
			ioiAmount: 0,
			ioiDate: "",
			bindingOffer: false,
			bindingAmount: 0,
			bindingDate: "",
			notes: "",
			lastContact: new Date().toISOString().split("T")[0],
		};

		setBuyers((prev) => [...prev, buyer]);
		setNewBuyer({
			type: "strategic",
			status: "active",
			teaserSent: "not_sent",
			ndaStatus: "not_sent",
			imSent: "not_sent",
		});
		setIsAddOpen(false);
	};

	const handleSave = useCallback(async () => {
		if (isSaving) return;

		setIsSaving(true);
		try {
			// Save as spreadsheet data to preserve buyer list structure
			await numbersTools.saveSpreadsheet({
				title: "Suivi Teaser/IM",
				sheetData: {
					type: "teaser-tracking",
					name: "Suivi Teaser/IM",
					buyers: buyers.map(b => ({
						id: b.id,
						name: b.name,
						type: b.type,
						status: b.status,
						teaserSent: b.teaserSent,
						ndaStatus: b.ndaStatus,
						imSent: b.imSent,
						contactName: b.contactName,
					})),
				},
			});
			router.refresh();
			toast.success("Suivi sauvegarde", {
				description: `${buyers.length} acquereurs potentiels`,
			});
		} catch (error) {
			console.error("Error saving teaser tracking:", error);
			toast.error("Erreur de sauvegarde", {
				description: "Impossible de sauvegarder le suivi. Veuillez reessayer.",
			});
		} finally {
			setIsSaving(false);
		}
	}, [isSaving, router, buyers]);

	return (
		<div className="space-y-6 p-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-4">
					<Button variant="ghost" size="icon" asChild>
						<Link href="/admin/numbers">
							<ArrowLeft className="h-5 w-5" />
						</Link>
					</Button>
					<div>
						<h1 className="text-2xl font-bold flex items-center gap-2">
							<FileText className="h-6 w-6" />
							Suivi Teaser / IM
						</h1>
						<p className="text-muted-foreground">
							{buyers.length} acquereurs potentiels
						</p>
					</div>
				</div>
				<div className="flex items-center gap-3">
					<DealSelector toolId="teaser-tracking" compact />
					<CrossToolLinks currentTool="teaser-tracking" variant="compact" />
					<div className="flex gap-2">
						<Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
						<DialogTrigger asChild>
							<Button variant="outline">
								<Plus className="h-4 w-4 mr-2" />
								Ajouter Acquereur
							</Button>
						</DialogTrigger>
						<DialogContent className="max-w-lg">
							<DialogHeader>
								<DialogTitle>Nouvel acquereur</DialogTitle>
								<DialogDescription>Ajoutez un acquereur potentiel a la liste</DialogDescription>
							</DialogHeader>
							<div className="space-y-4">
								<div className="grid grid-cols-2 gap-4">
									<div className="space-y-2 col-span-2">
										<Label>Nom</Label>
										<Input
											value={newBuyer.name || ""}
											onChange={(e) =>
												setNewBuyer((prev) => ({ ...prev, name: e.target.value }))
											}
										/>
									</div>
									<div className="space-y-2">
										<Label>Type</Label>
										<Select
											value={newBuyer.type}
											onValueChange={(v) =>
												setNewBuyer((prev) => ({ ...prev, type: v as BuyerType }))
											}
										>
											<SelectTrigger>
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="strategic">Strategique</SelectItem>
												<SelectItem value="financial">Financier</SelectItem>
												<SelectItem value="mbo">MBO</SelectItem>
											</SelectContent>
										</Select>
									</div>
									<div className="space-y-2">
										<Label>Pays</Label>
										<Input
											value={newBuyer.country || ""}
											onChange={(e) =>
												setNewBuyer((prev) => ({ ...prev, country: e.target.value }))
											}
										/>
									</div>
								</div>
								<div className="grid grid-cols-2 gap-4">
									<div className="space-y-2">
										<Label>Contact</Label>
										<Input
											value={newBuyer.contactName || ""}
											onChange={(e) =>
												setNewBuyer((prev) => ({ ...prev, contactName: e.target.value }))
											}
										/>
									</div>
									<div className="space-y-2">
										<Label>Email</Label>
										<Input
											type="email"
											value={newBuyer.contactEmail || ""}
											onChange={(e) =>
												setNewBuyer((prev) => ({ ...prev, contactEmail: e.target.value }))
											}
										/>
									</div>
								</div>
								<Button onClick={handleAddBuyer} className="w-full">
									Ajouter
								</Button>
							</div>
						</DialogContent>
					</Dialog>
					<Button variant="outline" onClick={handleSave} disabled={isSaving}>
						{isSaving ? (
							<>
								<span className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent" />
								Sauvegarde...
							</>
						) : (
							<>
								<Save className="h-4 w-4 mr-2" />
								Sauvegarder
							</>
						)}
					</Button>
					<Button>
						<Download className="h-4 w-4 mr-2" />
						Exporter
					</Button>
					</div>
				</div>
			</div>

			{/* Stats */}
			<div className="grid grid-cols-2 md:grid-cols-7 gap-4">
				<Card>
					<CardContent className="pt-4">
						<div className="text-center">
							<p className="text-2xl font-bold">{stats.active}</p>
							<p className="text-xs text-muted-foreground">Actifs</p>
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="pt-4">
						<div className="text-center">
							<p className="text-2xl font-bold text-blue-600">{stats.teasersSent}</p>
							<p className="text-xs text-muted-foreground">Teasers</p>
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="pt-4">
						<div className="text-center">
							<p className="text-2xl font-bold text-purple-600">{stats.ndasSigned}</p>
							<p className="text-xs text-muted-foreground">NDA signes</p>
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="pt-4">
						<div className="text-center">
							<p className="text-2xl font-bold text-amber-600">{stats.imsSent}</p>
							<p className="text-xs text-muted-foreground">IM envoyes</p>
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="pt-4">
						<div className="text-center">
							<p className="text-2xl font-bold text-emerald-600">{stats.ioisReceived}</p>
							<p className="text-xs text-muted-foreground">IOI recus</p>
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="pt-4">
						<div className="text-center">
							<p className="text-2xl font-bold text-red-600">{stats.bindingOffers}</p>
							<p className="text-xs text-muted-foreground">Binding</p>
						</div>
					</CardContent>
				</Card>
				<Card className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10">
					<CardContent className="pt-4">
						<div className="text-center">
							<p className="text-2xl font-bold text-emerald-600">
								{formatCurrency(stats.totalIoiValue)}
							</p>
							<p className="text-xs text-muted-foreground">Total IOI</p>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Filters */}
			<Card>
				<CardContent className="pt-6">
					<div className="flex flex-col md:flex-row gap-4">
						<div className="relative flex-1">
							<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
							<Input
								placeholder="Rechercher..."
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								className="pl-9"
							/>
						</div>
						<Select
							value={typeFilter}
							onValueChange={(v) => setTypeFilter(v as BuyerType | "all")}
						>
							<SelectTrigger className="w-[150px]">
								<SelectValue placeholder="Type" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">Tous types</SelectItem>
								<SelectItem value="strategic">Strategique</SelectItem>
								<SelectItem value="financial">Financier</SelectItem>
								<SelectItem value="mbo">MBO</SelectItem>
							</SelectContent>
						</Select>
						<Select
							value={statusFilter}
							onValueChange={(v) => setStatusFilter(v as BuyerStatus | "all")}
						>
							<SelectTrigger className="w-[150px]">
								<SelectValue placeholder="Statut" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">Tous statuts</SelectItem>
								<SelectItem value="active">Actif</SelectItem>
								<SelectItem value="passed">Passe</SelectItem>
								<SelectItem value="excluded">Exclu</SelectItem>
							</SelectContent>
						</Select>
					</div>
				</CardContent>
			</Card>

			{/* Buyers Table */}
			<Card>
				<CardHeader>
					<CardTitle>Liste des Acquereurs</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="overflow-x-auto">
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead className="min-w-[200px]">Acquereur</TableHead>
									<TableHead>Type</TableHead>
									<TableHead>Contact</TableHead>
									<TableHead className="text-center">Teaser</TableHead>
									<TableHead className="text-center">NDA</TableHead>
									<TableHead className="text-center">IM</TableHead>
									<TableHead className="text-center">IOI</TableHead>
									<TableHead className="text-center">Binding</TableHead>
									<TableHead>Notes</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{filteredBuyers.map((buyer) => {
									const typeConf = buyerTypeConfig[buyer.type];

									return (
										<TableRow
											key={buyer.id}
											className={
												buyer.status === "passed"
													? "opacity-50"
													: buyer.status === "excluded"
													? "opacity-30 line-through"
													: ""
											}
										>
											<TableCell>
												<div>
													<div className="flex items-center gap-2">
														<Building2 className="h-4 w-4 text-muted-foreground" />
														<span className="font-medium">{buyer.name}</span>
													</div>
													<p className="text-xs text-muted-foreground">
														{buyer.country} | {buyer.sector}
													</p>
												</div>
											</TableCell>
											<TableCell>
												<Badge className={`${typeConf.color} text-white`}>
													{typeConf.label}
												</Badge>
											</TableCell>
											<TableCell>
												<div className="text-sm">
													<div className="flex items-center gap-1">
														<User className="h-3 w-3" />
														{buyer.contactName}
													</div>
													<div className="flex items-center gap-1 text-xs text-muted-foreground">
														<Mail className="h-3 w-3" />
														{buyer.contactEmail}
													</div>
												</div>
											</TableCell>
											<TableCell className="text-center">
												<Select
													value={buyer.teaserSent}
													onValueChange={(v) =>
														updateBuyerField(buyer.id, "teaserSent", v)
													}
												>
													<SelectTrigger className="w-[100px] h-8">
														<SelectValue />
													</SelectTrigger>
													<SelectContent>
														<SelectItem value="not_sent">Non envoye</SelectItem>
														<SelectItem value="sent">Envoye</SelectItem>
														<SelectItem value="viewed">Consulte</SelectItem>
													</SelectContent>
												</Select>
											</TableCell>
											<TableCell className="text-center">
												<Select
													value={buyer.ndaStatus}
													onValueChange={(v) =>
														updateBuyerField(buyer.id, "ndaStatus", v)
													}
												>
													<SelectTrigger className="w-[100px] h-8">
														<SelectValue />
													</SelectTrigger>
													<SelectContent>
														<SelectItem value="not_sent">Non envoye</SelectItem>
														<SelectItem value="sent">Envoye</SelectItem>
														<SelectItem value="signed">Signe</SelectItem>
														<SelectItem value="declined">Decline</SelectItem>
													</SelectContent>
												</Select>
											</TableCell>
											<TableCell className="text-center">
												<Select
													value={buyer.imSent}
													onValueChange={(v) =>
														updateBuyerField(buyer.id, "imSent", v)
													}
												>
													<SelectTrigger className="w-[100px] h-8">
														<SelectValue />
													</SelectTrigger>
													<SelectContent>
														<SelectItem value="not_sent">Non envoye</SelectItem>
														<SelectItem value="sent">Envoye</SelectItem>
														<SelectItem value="viewed">Consulte</SelectItem>
													</SelectContent>
												</Select>
											</TableCell>
											<TableCell className="text-center">
												{buyer.ioiReceived ? (
													<Badge variant="outline" className="bg-emerald-500/10 text-emerald-600">
														{formatCurrency(buyer.ioiAmount)}
													</Badge>
												) : (
													<Button
														variant="ghost"
														size="sm"
														className="h-8"
														onClick={() => {
															updateBuyerField(buyer.id, "ioiReceived", true);
															updateBuyerField(buyer.id, "ioiDate", new Date().toISOString().split("T")[0]);
														}}
													>
														<Plus className="h-3 w-3" />
													</Button>
												)}
											</TableCell>
											<TableCell className="text-center">
												{buyer.bindingOffer ? (
													<Badge variant="outline" className="bg-purple-500/10 text-purple-600">
														{formatCurrency(buyer.bindingAmount)}
													</Badge>
												) : buyer.ioiReceived ? (
													<Button
														variant="ghost"
														size="sm"
														className="h-8"
														onClick={() => {
															updateBuyerField(buyer.id, "bindingOffer", true);
															updateBuyerField(buyer.id, "bindingAmount", buyer.ioiAmount);
															updateBuyerField(buyer.id, "bindingDate", new Date().toISOString().split("T")[0]);
														}}
													>
														<Plus className="h-3 w-3" />
													</Button>
												) : (
													<span className="text-muted-foreground">-</span>
												)}
											</TableCell>
											<TableCell>
												<Input
													value={buyer.notes}
													onChange={(e) =>
														updateBuyerField(buyer.id, "notes", e.target.value)
													}
													className="h-8 text-xs w-[150px]"
													placeholder="Notes..."
												/>
											</TableCell>
										</TableRow>
									);
								})}
							</TableBody>
						</Table>
					</div>
				</CardContent>
			</Card>

			{/* Funnel Visualization */}
			<Card>
				<CardHeader>
					<CardTitle>Entonnoir de Conversion</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="space-y-3">
						{[
							{ label: "Teasers envoyes", count: stats.teasersSent, total: buyers.length, color: "bg-blue-500" },
							{ label: "NDA signes", count: stats.ndasSigned, total: stats.teasersSent, color: "bg-purple-500" },
							{ label: "IM envoyes", count: stats.imsSent, total: stats.ndasSigned, color: "bg-amber-500" },
							{ label: "IOI recus", count: stats.ioisReceived, total: stats.imsSent, color: "bg-emerald-500" },
							{ label: "Binding offers", count: stats.bindingOffers, total: stats.ioisReceived, color: "bg-red-500" },
						].map((stage, i) => {
							const percentage = stage.total > 0 ? (stage.count / stage.total) * 100 : 0;
							const overallPercentage = buyers.length > 0 ? (stage.count / buyers.length) * 100 : 0;

							return (
								<div key={i} className="space-y-1">
									<div className="flex items-center justify-between text-sm">
										<span>{stage.label}</span>
										<span className="text-muted-foreground">
											{stage.count} ({percentage.toFixed(0)}% conv. | {overallPercentage.toFixed(0)}% total)
										</span>
									</div>
									<div className="h-6 bg-muted rounded-lg overflow-hidden">
										<div
											className={`h-full ${stage.color} transition-all flex items-center justify-end pr-2`}
											style={{ width: `${overallPercentage}%` }}
										>
											{overallPercentage > 10 && (
												<span className="text-white text-xs font-medium">{stage.count}</span>
											)}
										</div>
									</div>
								</div>
							);
						})}
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
