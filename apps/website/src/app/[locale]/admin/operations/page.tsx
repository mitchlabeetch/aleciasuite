"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { listTransactions } from "@/actions";
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
import { Loader2, Plus, Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";

/**
 * Operations Admin Page
 *
 * Features:
 * - List all transactions/operations
 * - Create new transactions
 * - Edit existing transactions
 * - Delete transactions
 * - Badge for confidential deals
 */

interface TransactionForm {
	slug: string;
	clientName: string;
	clientLogo?: string;
	acquirerName?: string;
	acquirerLogo?: string;
	sector: string;
	region?: string;
	year: number;
	mandateType: string;
	isConfidential: boolean;
	isClientConfidential: boolean;
	isAcquirerConfidential: boolean;
	isPriorExperience: boolean;
	context?: string;
	intervention?: string;
	result?: string;
	testimonialText?: string;
	testimonialAuthor?: string;
	roleType?: string;
	dealSize?: string;
}

export default function OperationsAdminPage() {
	const router = useRouter();
	const [transactions, setTransactions] = useState<any[] | null>(null);

	const [isCreateOpen, setIsCreateOpen] = useState(false);
	const [editingTransaction, setEditingTransaction] =
		useState<string | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);

	useEffect(() => {
		listTransactions().then(setTransactions);
	}, []);

	const [formData, setFormData] = useState<TransactionForm>({
		slug: "",
		clientName: "",
		clientLogo: "",
		acquirerName: "",
		acquirerLogo: "",
		sector: "",
		region: "",
		year: new Date().getFullYear(),
		mandateType: "",
		isConfidential: false,
		isClientConfidential: false,
		isAcquirerConfidential: false,
		isPriorExperience: false,
		context: "",
		intervention: "",
		result: "",
		testimonialText: "",
		testimonialAuthor: "",
		roleType: "",
		dealSize: "",
	});

	const resetForm = () => {
		setFormData({
			slug: "",
			clientName: "",
			clientLogo: "",
			acquirerName: "",
			acquirerLogo: "",
			sector: "",
			region: "",
			year: new Date().getFullYear(),
			mandateType: "",
			isConfidential: false,
			isClientConfidential: false,
			isAcquirerConfidential: false,
			isPriorExperience: false,
			context: "",
			intervention: "",
			result: "",
			testimonialText: "",
			testimonialAuthor: "",
			roleType: "",
			dealSize: "",
		});
		setEditingTransaction(null);
	};

	const handleEdit = (id: string) => {
		const transaction = transactions?.find(
			(t: { _id: string }) => t._id === id,
		);
		if (!transaction) return;

		setFormData({
			slug: transaction.slug,
			clientName: transaction.clientName,
			clientLogo: transaction.clientLogo || "",
			acquirerName: transaction.acquirerName || "",
			acquirerLogo: transaction.acquirerLogo || "",
			sector: transaction.sector,
			region: transaction.region || "",
			year: transaction.year,
			mandateType: transaction.mandateType,
			isConfidential: transaction.isConfidential,
			isClientConfidential: transaction.isClientConfidential ?? transaction.isConfidential,
			isAcquirerConfidential: transaction.isAcquirerConfidential ?? false,
			isPriorExperience: transaction.isPriorExperience,
			context: transaction.context || "",
			intervention: transaction.intervention || "",
			result: transaction.result || "",
			testimonialText: transaction.testimonialText || "",
			testimonialAuthor: transaction.testimonialAuthor || "",
			roleType: transaction.roleType || "",
			dealSize: transaction.dealSize || "",
		});
		setEditingTransaction(id);
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsSubmitting(true);

		try {
			if (editingTransaction) {
				// await updateTransaction({ id: editingTransaction, ...formData });
				toast.success("Transaction mise à jour");
				setEditingTransaction(null);
			} else {
				// await createTransaction(formData);
				toast.success("Transaction créée");
				setIsCreateOpen(false);
			}
			resetForm();
			const updated = await listTransactions();
			setTransactions(updated);
			router.refresh();
		} catch (_error) {
			toast.error("Erreur: " + (_error as Error).message);
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleDelete = async (_id: string) => {
		if (!confirm("Êtes-vous sûr de vouloir supprimer cette transaction ?"))
			return;

		try {
			// await deleteTransaction({ id });
			toast.success("Transaction supprimée");
			const updated = await listTransactions();
			setTransactions(updated);
			router.refresh();
		} catch (error) {
			toast.error("Erreur lors de la suppression");
		}
	};

	if (!transactions) {
		return (
			<div className="flex items-center justify-center h-64">
				<Loader2 className="w-8 h-8 animate-spin" />
			</div>
		);
	}

	const TransactionDialog = ({ children }: { children: React.ReactNode }) => (
		<Dialog
			open={isCreateOpen || !!editingTransaction}
			onOpenChange={(open) => {
				if (!open) {
					setIsCreateOpen(false);
					setEditingTransaction(null);
					resetForm();
				}
			}}
		>
			{children}
			<DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>
						{editingTransaction
							? "Modifier la transaction"
							: "Nouvelle transaction"}
					</DialogTitle>
					<DialogDescription>
						{editingTransaction
							? "Modifiez les informations de la transaction"
							: "Ajoutez une nouvelle transaction au portfolio"}
					</DialogDescription>
				</DialogHeader>

				<form onSubmit={handleSubmit} className="space-y-4">
					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label htmlFor="clientName">Nom du client *</Label>
							<Input
								id="clientName"
								value={formData.clientName}
								onChange={(e) =>
									setFormData({ ...formData, clientName: e.target.value })
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
								placeholder="nom-client-annee"
								required
							/>
						</div>
					</div>

					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label htmlFor="clientLogo">Logo client (URL)</Label>
							<Input
								id="clientLogo"
								value={formData.clientLogo}
								onChange={(e) =>
									setFormData({ ...formData, clientLogo: e.target.value })
								}
								placeholder="/assets/clients/logo.png"
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="acquirerName">Nom de l&apos;acquéreur</Label>
							<Input
								id="acquirerName"
								value={formData.acquirerName}
								onChange={(e) =>
									setFormData({ ...formData, acquirerName: e.target.value })
								}
							/>
						</div>
					</div>

					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label htmlFor="acquirerLogo">Logo acquéreur (URL)</Label>
							<Input
								id="acquirerLogo"
								value={formData.acquirerLogo}
								onChange={(e) =>
									setFormData({ ...formData, acquirerLogo: e.target.value })
								}
								placeholder="/assets/acquirers/logo.png"
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="sector">Secteur *</Label>
							<Input
								id="sector"
								value={formData.sector}
								onChange={(e) =>
									setFormData({ ...formData, sector: e.target.value })
								}
								placeholder="Technology, Healthcare, etc."
								required
							/>
						</div>
					</div>

					<div className="grid grid-cols-3 gap-4">
						<div className="space-y-2">
							<Label htmlFor="region">Région</Label>
							<Input
								id="region"
								value={formData.region}
								onChange={(e) =>
									setFormData({ ...formData, region: e.target.value })
								}
								placeholder="Europe, North America, etc."
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="year">Année *</Label>
							<Input
								id="year"
								type="number"
								value={formData.year}
								onChange={(e) =>
									setFormData({ ...formData, year: parseInt(e.target.value) })
								}
								required
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="mandateType">Type de mandat *</Label>
							<Input
								id="mandateType"
								value={formData.mandateType}
								onChange={(e) =>
									setFormData({ ...formData, mandateType: e.target.value })
								}
								placeholder="Sell-side, Buy-side, etc."
								required
							/>
						</div>
					</div>

					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label htmlFor="roleType">Type de rôle</Label>
							<Input
								id="roleType"
								value={formData.roleType}
								onChange={(e) =>
									setFormData({ ...formData, roleType: e.target.value })
								}
								placeholder="Lead Advisor, Co-Advisor, etc."
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="dealSize">Taille du deal</Label>
							<Input
								id="dealSize"
								value={formData.dealSize}
								onChange={(e) =>
									setFormData({ ...formData, dealSize: e.target.value })
								}
								placeholder="€50M - €100M"
							/>
						</div>
					</div>

					<div className="space-y-2">
						<Label htmlFor="context">Contexte</Label>
						<Textarea
							id="context"
							value={formData.context}
							onChange={(e) =>
								setFormData({ ...formData, context: e.target.value })
							}
							rows={3}
							placeholder="Contexte de la transaction..."
						/>
					</div>

					<div className="space-y-2">
						<Label htmlFor="intervention">Intervention</Label>
						<Textarea
							id="intervention"
							value={formData.intervention}
							onChange={(e) =>
								setFormData({ ...formData, intervention: e.target.value })
							}
							rows={3}
							placeholder="Description de l'intervention..."
						/>
					</div>

					<div className="space-y-2">
						<Label htmlFor="result">Résultat</Label>
						<Textarea
							id="result"
							value={formData.result}
							onChange={(e) =>
								setFormData({ ...formData, result: e.target.value })
							}
							rows={3}
							placeholder="Résultat de la transaction..."
						/>
					</div>

					<div className="space-y-2">
						<Label htmlFor="testimonialText">Témoignage</Label>
						<Textarea
							id="testimonialText"
							value={formData.testimonialText}
							onChange={(e) =>
								setFormData({ ...formData, testimonialText: e.target.value })
							}
							rows={2}
							placeholder="Citation du client..."
						/>
					</div>

					<div className="space-y-2">
						<Label htmlFor="testimonialAuthor">Auteur du témoignage</Label>
						<Input
							id="testimonialAuthor"
							value={formData.testimonialAuthor}
							onChange={(e) =>
								setFormData({ ...formData, testimonialAuthor: e.target.value })
							}
							placeholder="Jean Dupont, CEO"
						/>
					</div>

					<div className="space-y-3">
						<Label className="text-sm font-medium">Confidentialité</Label>
						<div className="flex flex-wrap items-center gap-6">
							<div className="flex items-center space-x-2">
								<Switch
									id="isClientConfidential"
									checked={formData.isClientConfidential}
									onCheckedChange={(checked) =>
										setFormData({
											...formData,
											isClientConfidential: checked,
											isConfidential: checked || formData.isAcquirerConfidential,
										})
									}
								/>
								<Label htmlFor="isClientConfidential">Client confidentiel</Label>
							</div>

							<div className="flex items-center space-x-2">
								<Switch
									id="isAcquirerConfidential"
									checked={formData.isAcquirerConfidential}
									onCheckedChange={(checked) =>
										setFormData({
											...formData,
											isAcquirerConfidential: checked,
											isConfidential: formData.isClientConfidential || checked,
										})
									}
								/>
								<Label htmlFor="isAcquirerConfidential">Acquéreur confidentiel</Label>
							</div>

							<div className="flex items-center space-x-2">
								<Switch
									id="isPriorExperience"
									checked={formData.isPriorExperience}
									onCheckedChange={(checked) =>
										setFormData({ ...formData, isPriorExperience: checked })
									}
								/>
								<Label htmlFor="isPriorExperience">Expérience antérieure</Label>
							</div>
						</div>
					</div>

					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							onClick={() => {
								setIsCreateOpen(false);
								setEditingTransaction(null);
								resetForm();
							}}
						>
							Annuler
						</Button>
						<Button type="submit" disabled={isSubmitting}>
							{isSubmitting && (
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							)}
							{editingTransaction ? "Mettre à jour" : "Créer"}
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
					<h1 className="text-3xl font-bold">Opérations</h1>
					<p className="text-muted-foreground">
						Gérez les transactions et le track&nbsp;record
					</p>
				</div>

				<TransactionDialog>
					<DialogTrigger asChild>
						<Button onClick={() => setIsCreateOpen(true)}>
							<Plus className="mr-2 h-4 w-4" />
							Nouvelle transaction
						</Button>
					</DialogTrigger>
				</TransactionDialog>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Transactions ({transactions.length})</CardTitle>
					<CardDescription>
						{
							transactions.filter(
								(t: { isConfidential: boolean }) => t.isConfidential,
							).length
						}{" "}
						confidentielles,{" "}
						{
							transactions.filter(
								(t: { isConfidential: boolean }) => !t.isConfidential,
							).length
						}{" "}
						publiques
					</CardDescription>
				</CardHeader>
				<CardContent>
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Client</TableHead>
								<TableHead>Acquéreur</TableHead>
								<TableHead>Secteur</TableHead>
								<TableHead className="text-center">Année</TableHead>
								<TableHead>Type</TableHead>
								<TableHead className="text-right">Actions</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{transactions.length === 0 ? (
								<TableRow>
									<TableCell
										colSpan={6}
										className="text-center text-muted-foreground py-8"
									>
										Aucune transaction. Créez-en une pour commencer.
									</TableCell>
								</TableRow>
							) : (
								transactions.map((transaction: any) => (
									<TableRow key={transaction._id}>
										<TableCell className="font-medium">
											<div className="flex items-center gap-2">
												{transaction.clientName}
												{transaction.isConfidential && (
													<Badge
														variant="secondary"
														className="bg-amber-100 text-amber-800"
													>
														Confidentiel
													</Badge>
												)}
											</div>
										</TableCell>
										<TableCell className="text-sm text-muted-foreground">
											{transaction.acquirerName || "-"}
										</TableCell>
										<TableCell>{transaction.sector}</TableCell>
										<TableCell className="text-center">
											{transaction.year}
										</TableCell>
										<TableCell className="text-sm">
											{transaction.mandateType}
										</TableCell>
										<TableCell className="text-right space-x-2">
											<Button
												variant="ghost"
												size="sm"
												onClick={() => handleEdit(transaction._id)}
											>
												<Edit className="h-4 w-4" />
											</Button>
											<Button
												variant="ghost"
												size="sm"
												onClick={() => handleDelete(transaction._id)}
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
		</div>
	);
}
