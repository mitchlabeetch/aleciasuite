"use client";

import { TemplateSelector } from "@/components/templates/TemplateSelector";
import { createDocument } from "@/actions/colab/documents";
import { useSession } from "@alepanel/auth/client";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

// Prevent static generation
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default function NewDocumentPage() {
	const router = useRouter();
	const { data: session, isPending } = useSession();
	const [isCreating, setIsCreating] = useState(false);

	const handleCreate = async (content: string, title = "Sans titre") => {
		if (!session?.user || isCreating) return;

		setIsCreating(true);
		try {
			const docId = await createDocument({
				title,
				content,
			});
			router.replace(`/documents/${docId}`);
		} catch (error) {
			console.error("Failed to create document:", error);
			setIsCreating(false);
		}
	};

	if (isPending) {
		return (
			<div className="flex h-screen items-center justify-center">
				<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
			</div>
		);
	}

	return <TemplateSelector onSelect={handleCreate} isCreating={isCreating} />;
}
