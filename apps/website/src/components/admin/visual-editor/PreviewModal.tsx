"use client";

import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Monitor, Tablet, Smartphone, X } from "lucide-react";
import { useState } from "react";
import { SectionRenderer } from "@/components/sections";
import type { Section } from "./SectionEditor";

interface PreviewModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	sections: Section[];
	pagePath: string;
}

type DeviceType = "desktop" | "tablet" | "mobile";

const DEVICE_WIDTHS: Record<DeviceType, string> = {
	desktop: "100%",
	tablet: "768px",
	mobile: "375px",
};

/**
 * PreviewModal - Shows a live preview of sections as they would appear on the site
 */
export function PreviewModal({
	open,
	onOpenChange,
	sections,
	pagePath,
}: PreviewModalProps) {
	const [device, setDevice] = useState<DeviceType>("desktop");

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-[95vw] w-full h-[90vh] flex flex-col p-0">
				{/* Header */}
				<DialogHeader className="flex-shrink-0 px-6 py-4 border-b bg-white dark:bg-gray-900">
					<div className="flex items-center justify-between">
						<div>
							<DialogTitle className="text-lg font-semibold">
								Aperçu de la page
							</DialogTitle>
							<p className="text-sm text-muted-foreground mt-1">
								{pagePath} •{" "}
								{sections.filter((s) => s.visible !== false).length} section(s)
								visible(s)
							</p>
						</div>

						{/* Device Selector */}
						<div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
							<Button
								variant={device === "desktop" ? "secondary" : "ghost"}
								size="sm"
								onClick={() => setDevice("desktop")}
								className="h-8 w-8 p-0"
								title="Bureau"
							>
								<Monitor className="w-4 h-4" />
							</Button>
							<Button
								variant={device === "tablet" ? "secondary" : "ghost"}
								size="sm"
								onClick={() => setDevice("tablet")}
								className="h-8 w-8 p-0"
								title="Tablette"
							>
								<Tablet className="w-4 h-4" />
							</Button>
							<Button
								variant={device === "mobile" ? "secondary" : "ghost"}
								size="sm"
								onClick={() => setDevice("mobile")}
								className="h-8 w-8 p-0"
								title="Mobile"
							>
								<Smartphone className="w-4 h-4" />
							</Button>
						</div>

						<Button
							variant="ghost"
							size="sm"
							onClick={() => onOpenChange(false)}
							className="h-8 w-8 p-0"
						>
							<X className="w-4 h-4" />
						</Button>
					</div>
				</DialogHeader>

				{/* Preview Area */}
				<div className="flex-1 overflow-auto bg-gray-100 dark:bg-gray-950 p-4">
					<div
						className="mx-auto bg-white dark:bg-gray-900 min-h-full shadow-2xl transition-all duration-300 overflow-hidden"
						style={{
							maxWidth: DEVICE_WIDTHS[device],
							borderRadius:
								device === "mobile"
									? "24px"
									: device === "tablet"
										? "16px"
										: "8px",
						}}
					>
						{/* Simulated browser bar for desktop */}
						{device === "desktop" && (
							<div className="h-10 bg-gray-200 dark:bg-gray-800 flex items-center px-4 gap-2 border-b">
								<div className="flex gap-1.5">
									<div className="w-3 h-3 rounded-full bg-red-400" />
									<div className="w-3 h-3 rounded-full bg-yellow-400" />
									<div className="w-3 h-3 rounded-full bg-green-400" />
								</div>
								<div className="flex-1 ml-4">
									<div className="bg-white dark:bg-gray-700 rounded-md px-3 py-1 text-xs text-muted-foreground max-w-md">
										alecia.fr{pagePath}
									</div>
								</div>
							</div>
						)}

						{/* Mobile/Tablet notch */}
						{device === "mobile" && (
							<div className="h-8 bg-black flex items-end justify-center pb-1">
								<div className="w-24 h-5 bg-gray-900 rounded-b-xl" />
							</div>
						)}
						{device === "tablet" && (
							<div className="h-6 bg-gray-300 dark:bg-gray-700" />
						)}

						{/* Page Content */}
						<div className="relative">
							{sections.length === 0 ? (
								<div className="py-20 text-center text-muted-foreground">
									<p className="text-lg font-medium">Aucune section</p>
									<p className="text-sm mt-2">
										Ajoutez des sections pour voir l&apos;aperçu
									</p>
								</div>
							) : (
								<SectionRenderer
									sections={sections.map((s) => ({
										...s,
										content: s.content as Record<string, unknown>,
									}))}
								/>
							)}
						</div>

						{/* Mobile/Tablet home bar */}
						{device === "mobile" && (
							<div className="h-8 bg-black flex items-center justify-center pt-1">
								<div className="w-32 h-1 bg-gray-600 rounded-full" />
							</div>
						)}
					</div>
				</div>

				{/* Footer info */}
				<div className="flex-shrink-0 px-6 py-3 border-t bg-gray-50 dark:bg-gray-900 text-xs text-muted-foreground text-center">
					Ceci est un aperçu. Le rendu final peut légèrement différer selon le
					navigateur et l&apos;appareil.
				</div>
			</DialogContent>
		</Dialog>
	);
}
