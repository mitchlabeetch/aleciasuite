"use client";

import { cn } from "@/lib/utils";
import { ChevronRight, File, Folder } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { listDocuments } from "@/actions/colab/documents";
import { useSession } from "@alepanel/auth/client";

interface FileNode {
	id: string;
	name: string;
	type: "file" | "folder";
	children?: FileNode[];
	href?: string;
}

// Transform flat documents into a tree structure
// Since we don't have real folders yet in the data model (based on memory),
// we will simulate a structure or use a flat list for now, but structured as a tree component.
function buildTree(documents: any[]): FileNode[] {
	// Mock folder structure for demonstration
	const recentDocs = documents.slice(0, 3).map((doc: any) => ({
		id: doc.id,
		name: doc.title || "Sans titre",
		type: "file" as const,
		href: `/documents/${doc.id}`,
	}));

	const allDocs = documents.map((doc: any) => ({
		id: `all-${doc.id}`,
		name: doc.title || "Sans titre",
		type: "file" as const,
		href: `/documents/${doc.id}`,
	}));

	return [
		{
			id: "recent",
			name: "Récents",
			type: "folder",
			children: recentDocs,
		},
		{
			id: "projects",
			name: "Projets",
			type: "folder",
			children: [
				{
					id: "project-a",
					name: "Projet Alpha",
					type: "folder",
					children: [],
				},
				{
					id: "project-b",
					name: "Acquisition Beta",
					type: "folder",
					children: [],
				},
			],
		},
		{
			id: "all",
			name: "Tous les documents",
			type: "folder",
			children: allDocs,
		},
	];
}

function TreeNode({ node, depth = 0 }: { node: FileNode; depth?: number }) {
	const [isOpen, setIsOpen] = useState(depth === 0); // Open root folders by default
	const hasChildren = node.children && node.children.length > 0;

	return (
		<div>
			<div
				className={cn(
					"flex items-center gap-2 px-2 py-1 hover:bg-accent rounded-sm cursor-pointer text-sm select-none",
					depth > 0 && "ml-4",
				)}
				onClick={() => hasChildren && setIsOpen(!isOpen)}
			>
				{node.type === "folder" && (
					<div
						className={cn(
							"transition-transform duration-200",
							isOpen && "rotate-90",
						)}
					>
						<ChevronRight className="h-3 w-3 text-muted-foreground" />
					</div>
				)}

				{node.type === "folder" ? (
					<Folder className="h-4 w-4 text-blue-500/80" />
				) : (
					<File className="h-4 w-4 text-muted-foreground" />
				)}

				{node.type === "file" && node.href ? (
					<Link href={node.href} className="flex-1 truncate">
						{node.name}
					</Link>
				) : (
					<span className="flex-1 truncate">{node.name}</span>
				)}
			</div>

			{isOpen && hasChildren && (
				<div>
					{node.children!.map((child) => (
						<TreeNode key={child.id} node={child} depth={depth + 1} />
					))}
				</div>
			)}
		</div>
	);
}

export function SidebarTree() {
	const { data: session, isPending } = useSession();
	const [documents, setDocuments] = useState<any[]>([]);

	useEffect(() => {
		if (!session?.user?.id) return;

		async function loadDocuments() {
			try {
				const docs = await listDocuments();
				setDocuments(docs || []);
			} catch (err) {
				console.error("Failed to load documents:", err);
			}
		}

		loadDocuments();
	}, [session?.user?.id]);

	// If no auth, return null or empty state
	if (isPending || !session?.user) return null;

	const treeData = buildTree(documents || []);

	return (
		<div className="mt-4 px-2">
			<h4 className="mb-2 px-2 text-xs font-semibold text-muted-foreground tracking-wider uppercase">
				Fichiers
			</h4>
			<div className="space-y-0.5">
				{treeData.map((node) => (
					<TreeNode key={node.id} node={node} />
				))}
			</div>
		</div>
	);
}
