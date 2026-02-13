"use client";

import { useState, useEffect } from "react";
import { blog } from "@/actions";
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
import { RichTextEditor } from "@/components/admin/RichTextEditor";
import { ImageUpload } from "@/components/admin/ImageUpload";
import {
	validateSlug,
	validateRequired,
	sanitizeHtml,
	sanitizeText,
	generateSlug,
} from "@/lib/validation";
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
import { useRouter } from "next/navigation";

/**
 * Blog Admin Page
 *
 * Features:
 * - List all blog posts
 * - Create new posts
 * - Edit existing posts
 * - Delete posts
 * - Status badges (draft/published/archived)
 */

interface BlogPostForm {
	title: string;
	slug: string;
	content: string;
	excerpt?: string;
	featuredImage?: string;
	status: "draft" | "published" | "archived";
	tags?: string;
	seoTitle?: string;
	seoDescription?: string;
}

export default function BlogAdminPage() {
	const router = useRouter();
	const [posts, setPosts] = useState<any[]>([]);
	const [loading, setLoading] = useState(true);

	const [isCreateOpen, setIsCreateOpen] = useState(false);
	const [editingPost, setEditingPost] = useState<string | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);

	const [formData, setFormData] = useState<BlogPostForm>({
		title: "",
		slug: "",
		content: "",
		excerpt: "",
		featuredImage: "",
		status: "draft",
		tags: "",
		seoTitle: "",
		seoDescription: "",
	});

	// Fetch posts on mount
	useEffect(() => {
		blog.getPosts()
			.then(setPosts)
			.finally(() => setLoading(false));
	}, []);

	const resetForm = () => {
		setFormData({
			title: "",
			slug: "",
			content: "",
			excerpt: "",
			featuredImage: "",
			status: "draft",
			tags: "",
			seoTitle: "",
			seoDescription: "",
		});
		setEditingPost(null);
	};

	const handleEdit = (id: string) => {
		const post = posts?.find((p: { _id: string }) => p._id === id);
		if (!post) return;

		setFormData({
			title: post.title,
			slug: post.slug,
			content: post.content,
			excerpt: post.excerpt || "",
			featuredImage: post.featuredImage || "",
			status: post.status,
			tags: post.tags?.join(", ") || "",
			seoTitle: post.seo?.metaTitle || "",
			seoDescription: post.seo?.metaDescription || "",
		});
		setEditingPost(id);
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsSubmitting(true);

		try {
			// Validate required fields
			const titleValidation = validateRequired(formData.title, "Le titre");
			if (!titleValidation.valid) {
				toast.error(titleValidation.error);
				setIsSubmitting(false);
				return;
			}

			// Validate and sanitize slug
			const slugValidation = validateSlug(formData.slug);
			if (!slugValidation.valid) {
				toast.error(slugValidation.error);
				setIsSubmitting(false);
				return;
			}

			// Validate content
			const contentValidation = validateRequired(
				formData.content,
				"Le contenu",
			);
			if (!contentValidation.valid) {
				toast.error(contentValidation.error);
				setIsSubmitting(false);
				return;
			}

			// Sanitize inputs
			const sanitizedTitle = sanitizeText(formData.title);
			const sanitizedSlug = slugValidation.sanitized;
			const sanitizedContent = sanitizeHtml(formData.content);
			const sanitizedExcerpt = formData.excerpt
				? sanitizeText(formData.excerpt)
				: undefined;

			const tagsArray = formData.tags
				? formData.tags
						.split(",")
						.map((t) => sanitizeText(t))
						.filter(Boolean)
				: undefined;

			const seoData =
				formData.seoTitle || formData.seoDescription
					? {
							metaTitle: formData.seoTitle
								? sanitizeText(formData.seoTitle)
								: undefined,
							metaDescription: formData.seoDescription
								? sanitizeText(formData.seoDescription)
								: undefined,
						}
					: undefined;

			if (editingPost) {
				await blog.updatePost(editingPost, {
					title: sanitizedTitle,
					slug: sanitizedSlug,
					content: sanitizedContent,
					excerpt: sanitizedExcerpt,
					featuredImage: formData.featuredImage || undefined,
					status: formData.status as "draft" | "published",
					tags: tagsArray,
					seo: seoData,
				});
				toast.success("Article mis à jour");
				setEditingPost(null);
			} else {
				await blog.createPost({
					title: sanitizedTitle,
					slug: sanitizedSlug,
					content: sanitizedContent,
					excerpt: sanitizedExcerpt,
					featuredImage: formData.featuredImage || undefined,
					status: formData.status as "draft" | "published",
					tags: tagsArray,
					seo: seoData,
				});
				toast.success("Article créé");
				setIsCreateOpen(false);
			}
			resetForm();

			// Re-fetch posts
			const updatedPosts = await blog.getPosts();
			setPosts(updatedPosts);
		} catch (_error) {
			toast.error("Erreur: " + (_error as Error).message);
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleDelete = async (id: string) => {
		if (!confirm("Êtes-vous sûr de vouloir supprimer cet article ?")) return;

		try {
			await blog.deletePost(id);
			toast.success("Article supprimé");

			// Re-fetch posts
			const updatedPosts = await blog.getPosts();
			setPosts(updatedPosts);
		} catch (error) {
			toast.error("Erreur lors de la suppression");
		}
	};

	const getStatusBadge = (status: "draft" | "published" | "archived") => {
		switch (status) {
			case "published":
				return <Badge className="bg-green-600">Publié</Badge>;
			case "draft":
				return (
					<Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
						Brouillon
					</Badge>
				);
			case "archived":
				return <Badge variant="secondary">Archivé</Badge>;
		}
	};

	const formatDate = (timestamp?: number) => {
		if (!timestamp) return "-";
		return new Date(timestamp).toLocaleDateString("fr-FR", {
			year: "numeric",
			month: "short",
			day: "numeric",
		});
	};

	if (loading) {
		return (
			<div className="flex items-center justify-center h-64">
				<Loader2 className="w-8 h-8 animate-spin" />
			</div>
		);
	}

	const PostDialog = ({ children }: { children: React.ReactNode }) => (
		<Dialog
			open={isCreateOpen || !!editingPost}
			onOpenChange={(open) => {
				if (!open) {
					setIsCreateOpen(false);
					setEditingPost(null);
					resetForm();
				}
			}}
		>
			{children}
			<DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>
						{editingPost ? "Modifier l'article" : "Nouvel article"}
					</DialogTitle>
					<DialogDescription>
						{editingPost
							? "Modifiez les informations de l'article"
							: "Ajoutez un nouvel article au blog"}
					</DialogDescription>
				</DialogHeader>

				<form onSubmit={handleSubmit} className="space-y-4">
					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label htmlFor="title">Titre *</Label>
							<Input
								id="title"
								value={formData.title}
								onChange={(e) => {
									const newTitle = e.target.value;
									setFormData({
										...formData,
										title: newTitle,
										// Auto-generate slug if it's empty or hasn't been manually edited
										slug:
											!formData.slug ||
											formData.slug === generateSlug(formData.title)
												? generateSlug(newTitle)
												: formData.slug,
									});
								}}
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
								placeholder="mon-article-de-blog"
								required
							/>
							<p className="text-xs text-muted-foreground">
								Généré automatiquement depuis le titre
							</p>
						</div>
					</div>

					<div className="space-y-2">
						<Label htmlFor="excerpt">Extrait</Label>
						<Textarea
							id="excerpt"
							value={formData.excerpt}
							onChange={(e) =>
								setFormData({ ...formData, excerpt: e.target.value })
							}
							rows={2}
							placeholder="Courte description de l'article..."
						/>
					</div>

					<div className="space-y-2">
						<Label htmlFor="content">Contenu *</Label>
						<RichTextEditor
							content={formData.content}
							onChange={(content) => setFormData({ ...formData, content })}
							placeholder="Rédigez le contenu de votre article..."
						/>
					</div>

					<div className="space-y-2">
						<Label>Image de couverture</Label>
						<ImageUpload
							value={formData.featuredImage}
							onChange={(url) =>
								setFormData({ ...formData, featuredImage: url })
							}
							onClear={() => setFormData({ ...formData, featuredImage: "" })}
							label="Télécharger l'image de couverture"
						/>
					</div>

					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label htmlFor="status">Statut *</Label>
							<Select
								value={formData.status}
								onValueChange={(value: "draft" | "published" | "archived") =>
									setFormData({ ...formData, status: value })
								}
							>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="draft">Brouillon</SelectItem>
									<SelectItem value="published">Publié</SelectItem>
									<SelectItem value="archived">Archivé</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</div>

					<div className="space-y-2">
						<Label htmlFor="tags">Tags (séparés par des virgules)</Label>
						<Input
							id="tags"
							value={formData.tags}
							onChange={(e) =>
								setFormData({ ...formData, tags: e.target.value })
							}
							placeholder="M&A, Technology, Finance"
						/>
					</div>

					<div className="border-t pt-4">
						<h3 className="font-semibold mb-3">SEO</h3>
						<div className="space-y-4">
							<div className="space-y-2">
								<Label htmlFor="seoTitle">Titre SEO</Label>
								<Input
									id="seoTitle"
									value={formData.seoTitle}
									onChange={(e) =>
										setFormData({ ...formData, seoTitle: e.target.value })
									}
									placeholder="Titre optimisé pour les moteurs de recherche"
								/>
							</div>

							<div className="space-y-2">
								<Label htmlFor="seoDescription">Description SEO</Label>
								<Textarea
									id="seoDescription"
									value={formData.seoDescription}
									onChange={(e) =>
										setFormData({ ...formData, seoDescription: e.target.value })
									}
									rows={2}
									placeholder="Description optimisée pour les moteurs de recherche"
								/>
							</div>
						</div>
					</div>

					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							onClick={() => {
								setIsCreateOpen(false);
								setEditingPost(null);
								resetForm();
							}}
						>
							Annuler
						</Button>
						<Button type="submit" disabled={isSubmitting}>
							{isSubmitting && (
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							)}
							{editingPost ? "Mettre à jour" : "Créer"}
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
					<h1 className="text-3xl font-bold">Blog</h1>
					<p className="text-muted-foreground">Gérez les articles de blog</p>
				</div>

				<PostDialog>
					<DialogTrigger asChild>
						<Button onClick={() => setIsCreateOpen(true)}>
							<Plus className="mr-2 h-4 w-4" />
							Nouvel article
						</Button>
					</DialogTrigger>
				</PostDialog>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Articles ({posts.length})</CardTitle>
					<CardDescription>
						{
							posts.filter((p: { status: string }) => p.status === "published")
								.length
						}{" "}
						publiés,{" "}
						{
							posts.filter((p: { status: string }) => p.status === "draft")
								.length
						}{" "}
						brouillons,{" "}
						{
							posts.filter((p: { status: string }) => p.status === "archived")
								.length
						}{" "}
						archivés
					</CardDescription>
				</CardHeader>
				<CardContent>
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Titre</TableHead>
								<TableHead>Auteur</TableHead>
								<TableHead className="text-center">Statut</TableHead>
								<TableHead>Date de publication</TableHead>
								<TableHead className="text-right">Actions</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{posts.length === 0 ? (
								<TableRow>
									<TableCell
										colSpan={5}
										className="text-center text-muted-foreground py-8"
									>
										Aucun article. Créez-en un pour commencer.
									</TableCell>
								</TableRow>
							) : (
								posts.map((post: any) => (
									<TableRow key={post._id}>
										<TableCell className="font-medium">{post.title}</TableCell>
										<TableCell className="text-sm text-muted-foreground">
											{post.authorName}
										</TableCell>
										<TableCell className="text-center">
											{getStatusBadge(post.status)}
										</TableCell>
										<TableCell className="text-sm">
											{formatDate(post.publishedAt)}
										</TableCell>
										<TableCell className="text-right space-x-2">
											<Button
												variant="ghost"
												size="sm"
												onClick={() => handleEdit(post._id)}
											>
												<Edit className="h-4 w-4" />
											</Button>
											<Button
												variant="ghost"
												size="sm"
												onClick={() => handleDelete(post._id)}
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
