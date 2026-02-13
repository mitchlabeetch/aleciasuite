"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import { useState, useCallback } from "react";
import {
	Bold,
	Italic,
	List,
	ListOrdered,
	Quote,
	Heading2,
	Heading3,
	Undo,
	Redo,
	Code,
	Link as LinkIcon,
	Image as ImageIcon,
	Minus,
	Unlink,
} from "lucide-react";

interface RichTextEditorProps {
	content: string;
	onChange: (content: string) => void;
	placeholder?: string;
}

export function RichTextEditor({
	content,
	onChange,
	placeholder,
}: RichTextEditorProps) {
	const [showLinkModal, setShowLinkModal] = useState(false);
	const [showImageModal, setShowImageModal] = useState(false);
	const [linkUrl, setLinkUrl] = useState("");
	const [imageUrl, setImageUrl] = useState("");
	const [imageAlt, setImageAlt] = useState("");

	const editor = useEditor({
		extensions: [
			StarterKit.configure({
				heading: {
					levels: [2, 3],
				},
			}),
			Placeholder.configure({
				placeholder: placeholder || "Commencez à écrire...",
			}),
			Link.configure({
				openOnClick: false,
				HTMLAttributes: {
					class: "text-blue-600 underline hover:text-blue-800",
				},
			}),
			Image.configure({
				HTMLAttributes: {
					class: "max-w-full h-auto rounded-lg my-4",
				},
			}),
		],
		content,
		onUpdate: ({ editor }) => {
			onChange(editor.getHTML());
		},
		editorProps: {
			attributes: {
				class:
					"prose prose-sm max-w-none focus:outline-none min-h-[300px] p-4 border rounded-md",
			},
		},
	});

	const setLink = useCallback(() => {
		if (!editor) return;

		if (linkUrl === "") {
			editor.chain().focus().extendMarkRange("link").unsetLink().run();
		} else {
			editor
				.chain()
				.focus()
				.extendMarkRange("link")
				.setLink({ href: linkUrl })
				.run();
		}
		setShowLinkModal(false);
		setLinkUrl("");
	}, [editor, linkUrl]);

	const addImage = useCallback(() => {
		if (!editor || !imageUrl) return;

		editor.chain().focus().setImage({ src: imageUrl, alt: imageAlt }).run();
		setShowImageModal(false);
		setImageUrl("");
		setImageAlt("");
	}, [editor, imageUrl, imageAlt]);

	const openLinkModal = useCallback(() => {
		if (!editor) return;
		const previousUrl = editor.getAttributes("link").href;
		setLinkUrl(previousUrl || "");
		setShowLinkModal(true);
	}, [editor]);

	if (!editor) {
		return null;
	}

	return (
		<div className="border rounded-lg overflow-hidden">
			{/* Toolbar */}
			<div className="flex flex-wrap gap-1 p-2 border-b bg-muted/50">
				<button
					type="button"
					onClick={() => editor.chain().focus().toggleBold().run()}
					className={`p-2 rounded hover:bg-muted ${editor.isActive("bold") ? "bg-muted" : ""}`}
					title="Gras (Ctrl+B)"
				>
					<Bold className="w-4 h-4" />
				</button>

				<button
					type="button"
					onClick={() => editor.chain().focus().toggleItalic().run()}
					className={`p-2 rounded hover:bg-muted ${editor.isActive("italic") ? "bg-muted" : ""}`}
					title="Italique (Ctrl+I)"
				>
					<Italic className="w-4 h-4" />
				</button>

				<button
					type="button"
					onClick={() => editor.chain().focus().toggleCode().run()}
					className={`p-2 rounded hover:bg-muted ${editor.isActive("code") ? "bg-muted" : ""}`}
					title="Code inline"
				>
					<Code className="w-4 h-4" />
				</button>

				<div className="w-px h-6 bg-border mx-1" />

				<button
					type="button"
					onClick={() =>
						editor.chain().focus().toggleHeading({ level: 2 }).run()
					}
					className={`p-2 rounded hover:bg-muted ${editor.isActive("heading", { level: 2 }) ? "bg-muted" : ""}`}
					title="Titre 2"
				>
					<Heading2 className="w-4 h-4" />
				</button>

				<button
					type="button"
					onClick={() =>
						editor.chain().focus().toggleHeading({ level: 3 }).run()
					}
					className={`p-2 rounded hover:bg-muted ${editor.isActive("heading", { level: 3 }) ? "bg-muted" : ""}`}
					title="Titre 3"
				>
					<Heading3 className="w-4 h-4" />
				</button>

				<div className="w-px h-6 bg-border mx-1" />

				<button
					type="button"
					onClick={() => editor.chain().focus().toggleBulletList().run()}
					className={`p-2 rounded hover:bg-muted ${editor.isActive("bulletList") ? "bg-muted" : ""}`}
					title="Liste à puces"
				>
					<List className="w-4 h-4" />
				</button>

				<button
					type="button"
					onClick={() => editor.chain().focus().toggleOrderedList().run()}
					className={`p-2 rounded hover:bg-muted ${editor.isActive("orderedList") ? "bg-muted" : ""}`}
					title="Liste numérotée"
				>
					<ListOrdered className="w-4 h-4" />
				</button>

				<button
					type="button"
					onClick={() => editor.chain().focus().toggleBlockquote().run()}
					className={`p-2 rounded hover:bg-muted ${editor.isActive("blockquote") ? "bg-muted" : ""}`}
					title="Citation"
				>
					<Quote className="w-4 h-4" />
				</button>

				<button
					type="button"
					onClick={() => editor.chain().focus().setHorizontalRule().run()}
					className="p-2 rounded hover:bg-muted"
					title="Ligne horizontale"
				>
					<Minus className="w-4 h-4" />
				</button>

				<div className="w-px h-6 bg-border mx-1" />

				<button
					type="button"
					onClick={openLinkModal}
					className={`p-2 rounded hover:bg-muted ${editor.isActive("link") ? "bg-muted" : ""}`}
					title="Ajouter un lien"
				>
					<LinkIcon className="w-4 h-4" />
				</button>

				{editor.isActive("link") && (
					<button
						type="button"
						onClick={() => editor.chain().focus().unsetLink().run()}
						className="p-2 rounded hover:bg-muted text-red-500"
						title="Supprimer le lien"
					>
						<Unlink className="w-4 h-4" />
					</button>
				)}

				<button
					type="button"
					onClick={() => setShowImageModal(true)}
					className="p-2 rounded hover:bg-muted"
					title="Ajouter une image"
				>
					<ImageIcon className="w-4 h-4" />
				</button>

				<div className="w-px h-6 bg-border mx-1" />

				<button
					type="button"
					onClick={() => editor.chain().focus().undo().run()}
					disabled={!editor.can().undo()}
					className="p-2 rounded hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
					title="Annuler (Ctrl+Z)"
				>
					<Undo className="w-4 h-4" />
				</button>

				<button
					type="button"
					onClick={() => editor.chain().focus().redo().run()}
					disabled={!editor.can().redo()}
					className="p-2 rounded hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
					title="Refaire (Ctrl+Y)"
				>
					<Redo className="w-4 h-4" />
				</button>
			</div>

			{/* Editor */}
			<EditorContent editor={editor} />

			{/* Link Modal */}
			{showLinkModal && (
				<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
					<div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4 shadow-xl">
						<h3 className="text-lg font-semibold mb-4">Ajouter un lien</h3>
						<input
							type="url"
							value={linkUrl}
							onChange={(e) => setLinkUrl(e.target.value)}
							placeholder="https://exemple.com"
							className="w-full px-3 py-2 border rounded-md mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
							autoFocus
						/>
						<div className="flex justify-end gap-2">
							<button
								type="button"
								onClick={() => {
									setShowLinkModal(false);
									setLinkUrl("");
								}}
								className="px-4 py-2 text-sm rounded-md hover:bg-muted"
							>
								Annuler
							</button>
							<button
								type="button"
								onClick={setLink}
								className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
							>
								Appliquer
							</button>
						</div>
					</div>
				</div>
			)}

			{/* Image Modal */}
			{showImageModal && (
				<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
					<div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4 shadow-xl">
						<h3 className="text-lg font-semibold mb-4">Ajouter une image</h3>
						<input
							type="url"
							value={imageUrl}
							onChange={(e) => setImageUrl(e.target.value)}
							placeholder="URL de l'image"
							className="w-full px-3 py-2 border rounded-md mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
							autoFocus
						/>
						<input
							type="text"
							value={imageAlt}
							onChange={(e) => setImageAlt(e.target.value)}
							placeholder="Description de l'image (alt)"
							className="w-full px-3 py-2 border rounded-md mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
						/>
						<div className="flex justify-end gap-2">
							<button
								type="button"
								onClick={() => {
									setShowImageModal(false);
									setImageUrl("");
									setImageAlt("");
								}}
								className="px-4 py-2 text-sm rounded-md hover:bg-muted"
							>
								Annuler
							</button>
							<button
								type="button"
								onClick={addImage}
								disabled={!imageUrl}
								className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
							>
								Ajouter
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
