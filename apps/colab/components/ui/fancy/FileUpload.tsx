"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Upload, X } from "lucide-react";
import {
	useState,
	useRef,
	type DragEvent,
	type ChangeEvent,
	type KeyboardEvent,
} from "react";
import { generateUploadUrl, saveFile } from "@/actions/colab/files";
import { cn } from "@/lib/utils";

interface FileUploadProps {
	onUploadComplete?: (fileId: string) => void;
	documentId?: string;
	boardId?: string;
	className?: string;
	maxSize?: number; // bytes
}

export function FileUpload({
	onUploadComplete,
	documentId,
	boardId,
	className,
	maxSize = 10 * 1024 * 1024, // 10MB default
}: FileUploadProps) {
	const [isDragging, setIsDragging] = useState(false);
	const [isUploading, setIsUploading] = useState(false);
	const [progress, setProgress] = useState(0);
	const [error, setError] = useState<string | null>(null);

	const fileInputRef = useRef<HTMLInputElement>(null);

	const validateFile = (file: File): boolean => {
		if (file.size > maxSize) {
			const maxSizeMB = Math.floor(maxSize / 1024 / 1024);
			setError(`Fichier trop volumineux (Max ${maxSizeMB} Mo)`);
			return false;
		}
		return true;
	};

	const handleUpload = async (file: File) => {
		setError(null);
		if (!validateFile(file)) return;

		setIsUploading(true);
		setProgress(0);

		try {
			// 1. Get upload URL and file key
			const { uploadUrl, fileKey } = await generateUploadUrl({
				filename: file.name,
				contentType: file.type,
			});

			// 2. Upload file
			// Note: fetch doesn't support upload progress out of the box easily without XMLHttpRequest or streams
			// We will simulate progress for better UX or use XHR if strict progress is needed.
			// Given requirements, visual feedback is key.

			const simulateProgress = setInterval(() => {
				setProgress((prev) => {
					if (prev >= 90) return prev;
					return prev + 10;
				});
			}, 100);

			const result = await fetch(uploadUrl, {
				method: "PUT",
				headers: { "Content-Type": file.type },
				body: file,
			});

			clearInterval(simulateProgress);
			setProgress(100);

			if (!result.ok) {
				throw new Error("Erreur lors du téléversement");
			}

			// 3. Save metadata
			const fileId = await saveFile({
				fileKey,
				fileName: file.name,
				fileType: file.type,
				size: file.size,
				documentId,
				boardId,
			});

			if (onUploadComplete && fileId) {
				onUploadComplete(fileId);
			}

			// Reset after short delay
			setTimeout(() => {
				setIsUploading(false);
				setProgress(0);
			}, 1000);
		} catch (err) {
			console.error(err);
			setError("Erreur lors du téléversement");
			setIsUploading(false);
			setProgress(0);
		}
	};

	const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
		e.preventDefault();
		setIsDragging(true);
	};

	const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
		e.preventDefault();
		setIsDragging(false);
	};

	const handleDrop = (e: DragEvent<HTMLDivElement>) => {
		e.preventDefault();
		setIsDragging(false);

		const file = e.dataTransfer.files[0];
		if (file) {
			handleUpload(file);
		}
	};

	const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) {
			handleUpload(file);
		}
		// Reset input value to allow selecting same file again
		if (fileInputRef.current) {
			fileInputRef.current.value = "";
		}
	};

	const handleClick = () => {
		if (!isUploading) {
			fileInputRef.current?.click();
		}
	};

	const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
		if (!isUploading && (e.key === "Enter" || e.key === " ")) {
			e.preventDefault();
			handleClick();
		}
	};

	return (
		<div className={cn("w-full", className)}>
			<input
				ref={fileInputRef}
				type="file"
				onChange={handleChange}
				className="hidden"
			/>

			<div
				onDragOver={handleDragOver}
				onDragLeave={handleDragLeave}
				onDrop={handleDrop}
				onClick={handleClick}
				onKeyDown={handleKeyDown}
				role={!isUploading ? "button" : undefined}
				tabIndex={!isUploading ? 0 : undefined}
				aria-label={
					!isUploading
						? "Zone de téléversement de fichier. Glissez-déposez ou appuyez sur Entrée pour sélectionner."
						: undefined
				}
				className={cn(
					"relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors duration-200 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
					isDragging
						? "border-primary bg-primary/5 cursor-copy"
						: "border-muted-foreground/25 bg-background",
					!isUploading &&
						"cursor-pointer hover:border-primary hover:bg-accent/50",
					isUploading && "cursor-wait opacity-80",
				)}
			>
				<AnimatePresence mode="wait">
					{isUploading ? (
						<motion.div
							key="uploading"
							initial={{ opacity: 0, scale: 0.95 }}
							animate={{ opacity: 1, scale: 1 }}
							exit={{ opacity: 0, scale: 0.95 }}
							className="w-full flex flex-col items-center gap-4"
						>
							<div
								role="progressbar"
								aria-valuenow={progress}
								aria-valuemin={0}
								aria-valuemax={100}
								tabIndex={0}
								className="w-full h-2 bg-secondary rounded-full overflow-hidden"
							>
								<motion.div
									className="h-full bg-primary"
									initial={{ width: 0 }}
									animate={{ width: `${progress}%` }}
									transition={{ type: "spring", stiffness: 50 }}
								/>
							</div>
							{/* biome-ignore lint/a11y/useSemanticElements: p tag is better here for styling consistency */}
							<p
								role="status"
								aria-live="polite"
								className="text-sm font-medium text-muted-foreground"
							>
								Téléversement en cours...
							</p>
						</motion.div>
					) : (
						<motion.div
							key="idle"
							initial={{ opacity: 0, scale: 0.95 }}
							animate={{ opacity: 1, scale: 1 }}
							exit={{ opacity: 0, scale: 0.95 }}
							className="flex flex-col items-center gap-2 text-center"
						>
							<div className="rounded-full bg-primary/10 p-4">
								<Upload className="h-6 w-6 text-primary" />
							</div>
							<div>
								<p className="text-sm font-medium">
									Glissez-déposez vos fichiers ici
								</p>
								<p className="text-xs text-muted-foreground">
									ou cliquez pour parcourir (Max{" "}
									{Math.floor(maxSize / 1024 / 1024)} Mo)
								</p>
							</div>
						</motion.div>
					)}
				</AnimatePresence>
			</div>

			{error && (
				<motion.div
					initial={{ opacity: 0, y: -10 }}
					animate={{ opacity: 1, y: 0 }}
					className="mt-2 flex items-center gap-2 text-xs text-destructive"
				>
					<X className="h-3 w-3" />
					{error}
				</motion.div>
			)}
		</div>
	);
}
