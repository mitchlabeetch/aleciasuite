"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { listTeamMembers, updateTeamMember, createTeamMember, deleteTeamMember, toggleTeamMemberActive } from "@/actions";
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
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
	Loader2,
	Plus,
	Edit,
	Trash2,
	Eye,
	EyeOff,
	GripVertical,
} from "lucide-react";
import { toast } from "sonner";

/**
 * Team Members Admin Page
 *
 * Features:
 * - List all team members with active/inactive status
 * - Create new team members
 * - Edit existing team members
 * - Toggle active/inactive
 * - Delete team members
 * - Drag to reorder (TODO)
 */

interface TeamMemberForm {
	slug: string;
	name: string;
	role: string;
	photo?: string;
	bioFr?: string;
	bioEn?: string;
	linkedinUrl?: string;
	email?: string;
	isActive: boolean;
}

export default function TeamAdminPage() {
	const router = useRouter();
	const [members, setMembers] = useState<any[] | null>(null);

	const [isCreateOpen, setIsCreateOpen] = useState(false);
	const [editingMember, setEditingMember] = useState<string | null>(
		null,
	);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
	const [memberToDelete, setMemberToDelete] =
		useState<string | null>(null);

	const [formData, setFormData] = useState<TeamMemberForm>({
		slug: "",
		name: "",
		role: "",
		photo: "",
		bioFr: "",
		bioEn: "",
		linkedinUrl: "",
		email: "",
		isActive: true,
	});

	// Load team members on mount
	useEffect(() => {
		listTeamMembers(true).then(setMembers);
	}, []);

	const resetForm = () => {
		setFormData({
			slug: "",
			name: "",
			role: "",
			photo: "",
			bioFr: "",
			bioEn: "",
			linkedinUrl: "",
			email: "",
			isActive: true,
		});
		setEditingMember(null);
	};

	const handleEdit = (id: string) => {
		const member = members?.find(
			(m: { _id: string }) => m._id === id,
		);
		if (!member) return;

		setFormData({
			slug: member.slug,
			name: member.name,
			role: member.role,
			photo: member.photo || "",
			bioFr: member.bioFr || "",
			bioEn: member.bioEn || "",
			linkedinUrl: member.linkedinUrl || "",
			email: member.email || "",
			isActive: member.isActive,
		});
		setEditingMember(id);
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsSubmitting(true);

		try {
			if (editingMember) {
				await updateTeamMember({
					id: editingMember,
					...formData,
					sectorsExpertise: [],
					transactionSlugs: [],
				});
				toast.success("Membre mis à jour");
				setEditingMember(null);
			} else {
				await createTeamMember({
					...formData,
					sectorsExpertise: [],
					transactionSlugs: [],
				});
				toast.success("Membre créé");
				setIsCreateOpen(false);
			}
			resetForm();
			// Refresh data
			listTeamMembers(true).then(setMembers);
			router.refresh();
		} catch (_error) {
			toast.error("Erreur: " + (_error as Error).message);
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleDelete = async (id: string) => {
		setMemberToDelete(id);
		setDeleteConfirmOpen(true);
	};

	const confirmDelete = async () => {
		if (!memberToDelete) return;

		try {
			await deleteTeamMember(memberToDelete);
			toast.success("Membre supprimé");
			// Refresh data
			listTeamMembers(true).then(setMembers);
			router.refresh();
		} catch (_error) {
			toast.error("Erreur lors de la suppression");
		} finally {
			setMemberToDelete(null);
		}
	};

	const handleToggleActive = async (id: string) => {
		try {
			await toggleTeamMemberActive(id);
			toast.success("Statut mis à jour");
			// Refresh data
			listTeamMembers(true).then(setMembers);
			router.refresh();
		} catch (error) {
			toast.error("Erreur lors du changement de statut");
		}
	};

	if (!members) {
		return (
			<div className="flex items-center justify-center h-64">
				<Loader2 className="w-8 h-8 animate-spin" />
			</div>
		);
	}

	const MemberDialog = ({ children }: { children: React.ReactNode }) => (
		<Dialog
			open={isCreateOpen || !!editingMember}
			onOpenChange={(open) => {
				if (!open) {
					setIsCreateOpen(false);
					setEditingMember(null);
					resetForm();
				}
			}}
		>
			{children}
			<DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>
						{editingMember ? "Modifier le membre" : "Nouveau membre"}
					</DialogTitle>
					<DialogDescription>
						{editingMember
							? `Modifiez les informations du membre de l'équipe`
							: `Ajoutez un nouveau membre à l'équipe`}
					</DialogDescription>
				</DialogHeader>

				<form onSubmit={handleSubmit} className="space-y-4">
					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label htmlFor="name">Nom complet *</Label>
							<Input
								id="name"
								value={formData.name}
								onChange={(e) =>
									setFormData({ ...formData, name: e.target.value })
								}
								required
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="slug">Slug (URL) *</Label>
							<Input
								id="slug"
								value={formData.slug}
								onChange={(e) =>
									setFormData({ ...formData, slug: e.target.value })
								}
								placeholder="prenom-nom"
								required
							/>
						</div>
					</div>

					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label htmlFor="role">Rôle *</Label>
							<Input
								id="role"
								value={formData.role}
								onChange={(e) =>
									setFormData({ ...formData, role: e.target.value })
								}
								placeholder="Associé fondateur"
								required
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="email">Email</Label>
							<Input
								id="email"
								type="email"
								value={formData.email}
								onChange={(e) =>
									setFormData({ ...formData, email: e.target.value })
								}
							/>
						</div>
					</div>

					<div className="space-y-2">
						<Label htmlFor="photo">Photo URL</Label>
						<Input
							id="photo"
							value={formData.photo}
							onChange={(e) =>
								setFormData({ ...formData, photo: e.target.value })
							}
							placeholder="/assets/team/photo.jpg"
						/>
					</div>

					<div className="space-y-2">
						<Label htmlFor="linkedinUrl">LinkedIn URL</Label>
						<Input
							id="linkedinUrl"
							value={formData.linkedinUrl}
							onChange={(e) =>
								setFormData({ ...formData, linkedinUrl: e.target.value })
							}
							placeholder="https://www.linkedin.com/in/..."
						/>
					</div>

					<div className="space-y-2">
						<Label htmlFor="bioFr">Bio (Français)</Label>
						<Textarea
							id="bioFr"
							value={formData.bioFr}
							onChange={(e) =>
								setFormData({ ...formData, bioFr: e.target.value })
							}
							rows={4}
							placeholder="Biographie en français..."
						/>
					</div>

					<div className="space-y-2">
						<Label htmlFor="bioEn">Bio (Anglais)</Label>
						<Textarea
							id="bioEn"
							value={formData.bioEn}
							onChange={(e) =>
								setFormData({ ...formData, bioEn: e.target.value })
							}
							rows={4}
							placeholder="English biography..."
						/>
					</div>

					<div className="flex items-center space-x-2">
						<Switch
							id="isActive"
							checked={formData.isActive}
							onCheckedChange={(checked) =>
								setFormData({ ...formData, isActive: checked })
							}
						/>
						<Label htmlFor="isActive">Actif (visible sur le site)</Label>
					</div>

					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							onClick={() => {
								setIsCreateOpen(false);
								setEditingMember(null);
								resetForm();
							}}
						>
							Annuler
						</Button>
						<Button type="submit" disabled={isSubmitting}>
							{isSubmitting && (
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							)}
							{editingMember ? "Mettre à jour" : "Créer"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);

	return (
		<div className="space-y-6">
			<div className="flex justify-between items-center">
				<div>
					<h1 className="text-3xl font-bold">Équipe</h1>
					<p className="text-muted-foreground">
						Gérez les membres de l&apos;équipe affichés sur le site
					</p>
				</div>

				<MemberDialog>
					<DialogTrigger asChild>
						<Button onClick={() => setIsCreateOpen(true)}>
							<Plus className="mr-2 h-4 w-4" />
							Nouveau membre
						</Button>
					</DialogTrigger>
				</MemberDialog>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Membres de l&apos;équipe ({members.length})</CardTitle>
					<CardDescription>
						{members.filter((m: { isActive: boolean }) => m.isActive).length}{" "}
						actifs,{" "}
						{members.filter((m: { isActive: boolean }) => !m.isActive).length}{" "}
						inactifs
					</CardDescription>
				</CardHeader>
				<CardContent>
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead className="w-12">#</TableHead>
								<TableHead>Nom</TableHead>
								<TableHead>Rôle</TableHead>
								<TableHead>Email</TableHead>
								<TableHead className="text-center">Statut</TableHead>
								<TableHead className="text-right">Actions</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{members.length === 0 ? (
								<TableRow>
									<TableCell
										colSpan={6}
										className="text-center text-muted-foreground py-8"
									>
										Aucun membre. Créez-en un pour commencer.
									</TableCell>
								</TableRow>
							) : (
								members.map((member: any, _index: number) => (
									<TableRow key={member._id}>
										<TableCell>
											<GripVertical className="h-4 w-4 text-muted-foreground" />
										</TableCell>
										<TableCell className="font-medium">{member.name}</TableCell>
										<TableCell>{member.role}</TableCell>
										<TableCell className="text-sm text-muted-foreground">
											{member.email || "-"}
										</TableCell>
										<TableCell className="text-center">
											{member.isActive ? (
												<Badge variant="default" className="bg-green-600">
													Actif
												</Badge>
											) : (
												<Badge variant="secondary">Inactif</Badge>
											)}
										</TableCell>
										<TableCell className="text-right space-x-2">
											<Button
												variant="ghost"
												size="sm"
												onClick={() => handleToggleActive(member._id)}
												title={member.isActive ? "Désactiver" : "Activer"}
											>
												{member.isActive ? (
													<EyeOff className="h-4 w-4" />
												) : (
													<Eye className="h-4 w-4" />
												)}
											</Button>
											<Button
												variant="ghost"
												size="sm"
												onClick={() => handleEdit(member._id)}
											>
												<Edit className="h-4 w-4" />
											</Button>
											<Button
												variant="ghost"
												size="sm"
												onClick={() => handleDelete(member._id)}
											>
												<Trash2 className="h-4 w-4 text-destructive" />
											</Button>
										</TableCell>
									</TableRow>
								))
							)}
						</TableBody>
					</Table>
				</CardContent>
			</Card>

			<ConfirmDialog
				open={deleteConfirmOpen}
				onOpenChange={setDeleteConfirmOpen}
				onConfirm={confirmDelete}
				title="Supprimer le membre"
				description="Êtes-vous sûr de vouloir supprimer ce membre de l'équipe ? Cette action est irréversible."
				confirmText="Supprimer"
				cancelText="Annuler"
				variant="destructive"
			/>
		</div>
	);
}
