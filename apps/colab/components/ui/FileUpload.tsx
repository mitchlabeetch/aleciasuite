"use client";

/**
 * FileUpload Component - French file upload interface
 * Drag and drop with French text
 */

import { Button } from "@/components/tailwind/ui/button";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { File, Upload, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { type ChangeEvent, type DragEvent, useRef, useState } from "react";

interface FileUploadProps {
	onFileSelect?: (file: File) => void;
	accept?: string;
	maxSize?: number; // in bytes
	className?: string;
}

export function FileUpload({
	onFileSelect,
	accept,
	maxSize = 10 * 1024 * 1024, // 10MB default
	className,
}: FileUploadProps) {
	const [isDragging, setIsDragging] = useState(false);
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const [error, setError] = useState<string | null>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const handleFile = (file: File) => {
		setError(null);

		if (maxSize && file.size > maxSize) {
			const maxSizeMB = (maxSize / 1024 / 1024).toFixed(0);
			setError(`Fichier trop volumineux (max: ${maxSizeMB}MB)`);
			return;
		}

		setSelectedFile(file);
		onFileSelect?.(file);
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
			handleFile(file);
		}
	};

	const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) {
			handleFile(file);
		}
	};

	const handleClick = () => {
		fileInputRef.current?.click();
	};

	const handleRemove = () => {
		setSelectedFile(null);
		setError(null);
		if (fileInputRef.current) {
			fileInputRef.current.value = "";
		}
	};

	return (
		<div className={cn("w-full", className)}>
			<input
				ref={fileInputRef}
				type="file"
				accept={accept}
				onChange={handleFileChange}
				className="hidden"
			/>

			<AnimatePresence mode="wait">
				{!selectedFile ? (
					<motion.div
						key="upload"
						initial={{ opacity: 0, scale: 0.95 }}
						animate={{ opacity: 1, scale: 1 }}
						exit={{ opacity: 0, scale: 0.95 }}
						onDragOver={handleDragOver}
						onDragLeave={handleDragLeave}
						onDrop={handleDrop}
						onClick={handleClick}
						className={cn(
							"relative cursor-pointer rounded-lg border-2 border-dashed p-8",
							"transition-colors duration-200",
							isDragging
								? "border-primary bg-primary/5"
								: "border-muted-foreground/25 hover:border-primary hover:bg-accent/50",
							"flex flex-col items-center justify-center gap-4",
						)}
					>
						<div className="rounded-full bg-primary/10 p-4">
							<Upload className="h-8 w-8 text-primary" />
						</div>
						<div className="text-center">
							<p className="text-sm font-medium">
								{t("upload.dragDrop")}{" "}
								<span className="text-primary">{t("upload.uploadFile")}</span>
							</p>
							<p className="mt-1 text-xs text-muted-foreground">
								{t("upload.dragDropHere")}
							</p>
						</div>
					</motion.div>
				) : (
					<motion.div
						key="file"
						initial={{ opacity: 0, scale: 0.95 }}
						animate={{ opacity: 1, scale: 1 }}
						exit={{ opacity: 0, scale: 0.95 }}
						className="rounded-lg border border-border bg-card p-4"
					>
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-3">
								<div className="rounded-lg bg-primary/10 p-2">
									<File className="h-5 w-5 text-primary" />
								</div>
								<div>
									<p className="text-sm font-medium">{selectedFile.name}</p>
									<p className="text-xs text-muted-foreground">
										{(selectedFile.size / 1024).toFixed(2)} KB
									</p>
								</div>
							</div>
							<Button variant="ghost" size="icon" onClick={handleRemove}>
								<X className="h-4 w-4" />
							</Button>
						</div>
					</motion.div>
				)}
			</AnimatePresence>

			{error && (
				<motion.p
					initial={{ opacity: 0, y: -10 }}
					animate={{ opacity: 1, y: 0 }}
					className="mt-2 text-xs text-destructive"
				>
					{error}
				</motion.p>
			)}
		</div>
	);
}
