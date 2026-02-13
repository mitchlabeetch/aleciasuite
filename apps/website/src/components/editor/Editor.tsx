"use client";

/**
 * Editor - TipTap Rich Text Editor Component
 *
 * A placeholder implementation for the document editor.
 * Full TipTap integration planned for Batch 11: Performance Optimization.
 *
 * @see LazyEditor for dynamic loading wrapper
 */

import { useState } from "react";
import {
	Bold,
	Italic,
	Underline,
	List,
	ListOrdered,
	Heading1,
	Heading2,
} from "lucide-react";

interface EditorProps {
	initialContent?: string;
	onChange?: (content: string) => void;
	placeholder?: string;
	className?: string;
}

export function Editor({
	initialContent = "",
	onChange,
	placeholder,
	className,
}: EditorProps) {
	const [content, setContent] = useState(initialContent);

	const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
		const newContent = e.target.value;
		setContent(newContent);
		onChange?.(newContent);
	};

	return (
		<div className={`space-y-2 ${className || ""}`}>
			{/* Simple Toolbar */}
			<div className="flex items-center gap-1 p-2 border border-border rounded-lg bg-muted/30">
				<button
					type="button"
					className="p-2 hover:bg-muted rounded transition-colors"
					title="Gras"
				>
					<Bold className="w-4 h-4" />
				</button>
				<button
					type="button"
					className="p-2 hover:bg-muted rounded transition-colors"
					title="Italique"
				>
					<Italic className="w-4 h-4" />
				</button>
				<button
					type="button"
					className="p-2 hover:bg-muted rounded transition-colors"
					title="Souligné"
				>
					<Underline className="w-4 h-4" />
				</button>
				<div className="w-px h-6 bg-border mx-2" />
				<button
					type="button"
					className="p-2 hover:bg-muted rounded transition-colors"
					title="Titre 1"
				>
					<Heading1 className="w-4 h-4" />
				</button>
				<button
					type="button"
					className="p-2 hover:bg-muted rounded transition-colors"
					title="Titre 2"
				>
					<Heading2 className="w-4 h-4" />
				</button>
				<div className="w-px h-6 bg-border mx-2" />
				<button
					type="button"
					className="p-2 hover:bg-muted rounded transition-colors"
					title="Liste à puces"
				>
					<List className="w-4 h-4" />
				</button>
				<button
					type="button"
					className="p-2 hover:bg-muted rounded transition-colors"
					title="Liste numérotée"
				>
					<ListOrdered className="w-4 h-4" />
				</button>
			</div>

			{/* Content Area */}
			<textarea
				value={content}
				onChange={handleChange}
				placeholder={placeholder || "Commencez à écrire..."}
				className="w-full min-h-[300px] p-4 border border-border rounded-lg bg-background resize-y focus:ring-2 focus:ring-[var(--alecia-mid-blue)] focus:border-transparent transition-all"
			/>

			{/* Note about full editor */}
			<p className="text-xs text-muted-foreground text-center">
				Éditeur simplifié • L&apos;éditeur TipTap complet sera disponible
				prochainement
			</p>
		</div>
	);
}

export default Editor;
