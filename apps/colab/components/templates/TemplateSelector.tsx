import {
	Card,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/tailwind/ui/card";
import { ScrollArea } from "@/components/tailwind/ui/scroll-area";
import { DOCUMENTS_TEMPLATES } from "@/lib/templates";
import { FilePlus, Loader2 } from "lucide-react";

interface TemplateSelectorProps {
	onSelect: (content: string, title?: string) => void;
	isCreating: boolean;
}

export function TemplateSelector({
	onSelect,
	isCreating,
}: TemplateSelectorProps) {
	return (
		<div className="flex h-screen w-full flex-col items-center justify-center bg-muted/30 p-4">
			<div className="w-full max-w-4xl space-y-6">
				<div className="space-y-2 text-center">
					<h1 className="text-3xl font-bold tracking-tight">
						Créer un nouveau document
					</h1>
					<p className="text-muted-foreground">
						Choisissez un modèle pour commencer ou partez d'une page blanche.
					</p>
				</div>

				<ScrollArea className="h-[600px] w-full rounded-md border bg-background p-4 shadow-sm">
					<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
						{/* Blank Document */}
						<Card
							className="cursor-pointer transition-all hover:border-primary hover:shadow-md"
							onClick={() => onSelect("", "Sans titre")}
						>
							<CardHeader>
								<div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
									<FilePlus className="h-6 w-6 text-primary" />
								</div>
								<CardTitle className="text-lg">Document vierge</CardTitle>
								<CardDescription>
									Commencez avec une page blanche.
								</CardDescription>
							</CardHeader>
						</Card>

						{/* Templates */}
						{DOCUMENTS_TEMPLATES.map((template) => (
							<Card
								key={template.id}
								className="cursor-pointer transition-all hover:border-primary hover:shadow-md"
								onClick={() => onSelect(template.content, template.title)}
							>
								<CardHeader>
									<div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
										<FilePlus className="h-6 w-6 text-muted-foreground" />
									</div>
									<CardTitle className="text-lg">{template.title}</CardTitle>
									<CardDescription className="line-clamp-2">
										{template.description}
									</CardDescription>
								</CardHeader>
							</Card>
						))}
					</div>
				</ScrollArea>

				{isCreating && (
					<div className="flex items-center justify-center gap-2 text-muted-foreground">
						<Loader2 className="h-4 w-4 animate-spin" />
						<span>Création du document...</span>
					</div>
				)}
			</div>
		</div>
	);
}
