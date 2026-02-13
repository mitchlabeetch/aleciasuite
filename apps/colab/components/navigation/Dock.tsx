"use client";

import { Button } from "@/components/tailwind/ui/button";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/tailwind/ui/tooltip";
import { useCommandMenu } from "@/components/command-menu-provider";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { Calendar, FileText, Home, Layout, Settings } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export function Dock() {
	const pathname = usePathname();
	const { open, setOpen: setCommandOpen } = useCommandMenu();
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		setMounted(true);
	}, []);

	if (!mounted) return null;

	const items = [
		{
			label: t("nav.home"),
			icon: Home,
			href: "/",
			isActive: pathname === "/",
		},
		{
			label: t("nav.documents"),
			icon: FileText,
			href: "/documents",
			isActive: pathname.startsWith("/documents"),
		},
		{
			label: t("nav.pipeline"),
			icon: Layout,
			href: "/pipeline",
			isActive: pathname.startsWith("/pipeline"),
		},
		{
			label: t("nav.calendar"),
			icon: Calendar,
			href: "/calendar",
			isActive: pathname.startsWith("/calendar"),
		},
		{
			label: t("nav.settings"),
			icon: Settings,
			href: "/settings",
			isActive: pathname.startsWith("/settings"),
		},
	];

	return (
		<div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
			<div className="flex items-center gap-2 p-2 rounded-2xl bg-background/80 backdrop-blur-md border border-border shadow-lg">
				<TooltipProvider>
					{items.map((item) => (
						<Tooltip key={item.href}>
							<TooltipTrigger asChild>
								<Link href={item.href}>
									<Button
										variant={item.isActive ? "secondary" : "ghost"}
										size="icon"
										className={cn(
											"rounded-xl h-10 w-10 transition-all duration-200 hover:scale-110",
											item.isActive && "bg-secondary text-primary shadow-sm",
										)}
									>
										<item.icon className="h-5 w-5" />
										<span className="sr-only">{item.label}</span>
									</Button>
								</Link>
							</TooltipTrigger>
							<TooltipContent side="top" className="mb-2">
								<p>{item.label}</p>
							</TooltipContent>
						</Tooltip>
					))}
				</TooltipProvider>
			</div>
		</div>
	);
}
