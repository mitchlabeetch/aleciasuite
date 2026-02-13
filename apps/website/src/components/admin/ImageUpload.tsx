"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { files, uploadDocument } from "@/actions";
import { Upload, X, Loader2, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";

interface ImageUploadProps {
	value?: string;
	onChange: (url: string) => void;
	onClear: () => void;
	label?: string;
	accept?: string;
}

export function ImageUpload({
	value,
	onChange,
	onClear,
	label = "Télécharger une image",
	accept = "image/*",
}: ImageUploadProps) {
	const fileInputRef = useRef<HTMLInputElement>(null);
	const [isUploading, setIsUploading] = useState(false);
	const [uploadProgress, setUploadProgress] = useState(0);
	const router = useRouter();

	const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;

		// Validate file type
		if (!file.type.startsWith("image/")) {
			alert("Veuillez sélectionner une image");
			return;
		}

		// Validate file size (max 5MB)
		if (file.size > 5 * 1024 * 1024) {
			alert("L'image ne doit pas dépasser 5MB");
			return;
		}

		try {
			setIsUploading(true);
			setUploadProgress(30);

			// Get upload URL from server action
			const { uploadUrl, key } = await files.generateUploadUrl(file.name, file.type);
			setUploadProgress(50);

			// Upload file to storage
			const result = await fetch(uploadUrl, {
				method: "PUT",
				headers: { "Content-Type": file.type },
				body: file,
			});

			if (!result.ok) {
				throw new Error("Upload failed");
			}

			setUploadProgress(100);
			// Use the storage key to construct the public URL
			const publicUrl = uploadUrl.split('?')[0]; // Remove query params from presigned URL
			onChange(publicUrl);
			router.refresh();
		} catch (error) {
			console.error("Upload error:", error);
			alert("Erreur lors du téléchargement de l'image");
		} finally {
			setIsUploading(false);
			setUploadProgress(0);
			if (fileInputRef.current) {
				fileInputRef.current.value = "";
			}
		}
	};

	return (
		<div className="space-y-2">
			<input
				ref={fileInputRef}
				type="file"
				accept={accept}
				onChange={handleFileSelect}
				className="hidden"
				disabled={isUploading}
			/>

			{value ? (
				<div className="relative group">
					<div className="relative w-full h-48 rounded-lg overflow-hidden border border-border">
						<Image src={value} alt="Preview" fill className="object-cover" />
					</div>
					<Button
						type="button"
						variant="destructive"
						size="icon"
						className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
						onClick={onClear}
					>
						<X className="w-4 h-4" />
					</Button>
				</div>
			) : (
				<button
					type="button"
					onClick={() => fileInputRef.current?.click()}
					disabled={isUploading}
					className="w-full h-48 border-2 border-dashed border-border rounded-lg hover:border-[var(--alecia-mid-blue)] hover:bg-muted/50 transition-colors flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
				>
					{isUploading ? (
						<>
							<Loader2 className="w-8 h-8 animate-spin" />
							<span className="text-sm">
								Téléchargement... {uploadProgress}%
							</span>
						</>
					) : (
						<>
							<ImageIcon className="w-8 h-8" />
							<Upload className="w-5 h-5" />
							<span className="text-sm font-medium">{label}</span>
							<span className="text-xs">PNG, JPG, GIF jusqu&apos;à 5MB</span>
						</>
					)}
				</button>
			)}
		</div>
	);
}
