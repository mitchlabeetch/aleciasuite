"use client";

import {
	Briefcase,
	Building,
	Check,
	Download,
	FileText,
	Menu as MenuIcon,
	Monitor,
	Moon,
	Share2,
	SunDim,
} from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "./button";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { Separator } from "./separator";

import { fr } from "@/lib/i18n";

const appearances = [
	{
		theme: "System",
		icon: <Monitor className="h-4 w-4" />,
		label: fr.theme.system,
	},
	{
		theme: "Light",
		icon: <SunDim className="h-4 w-4" />,
		label: fr.theme.light,
	},
	{
		theme: "Dark",
		icon: <Moon className="h-4 w-4" />,
		label: fr.theme.dark,
	},
];

const quickActions = [
	{
		label: fr.actions.newDeal,
		icon: <Briefcase className="h-4 w-4" />,
		action: "deal",
	},
	{
		label: fr.actions.newCompanyProfile,
		icon: <Building className="h-4 w-4" />,
		action: "company",
	},
	{
		label: fr.actions.newDocument,
		icon: <FileText className="h-4 w-4" />,
		action: "document",
	},
];

export default function Menu() {
	const { theme: currentTheme, setTheme } = useTheme();

	const handleQuickAction = (_action: string) => {
		// TODO: Implement document creation based on templates
	};

	const handleExport = () => {
		const _content = window.localStorage.getItem("novel-content");
		const markdown = window.localStorage.getItem("markdown");

		if (markdown) {
			const blob = new Blob([markdown], { type: "text/markdown" });
			const url = URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = url;
			a.download = `alecia-document-${new Date().toISOString().split("T")[0]}.md`;
			a.click();
			URL.revokeObjectURL(url);
		}
	};

	return (
		<Popover>
			<PopoverTrigger asChild>
				<Button variant="ghost" size="icon">
					<MenuIcon width={16} />
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-56 p-2" align="end">
				<div className="space-y-1">
					<p className="p-2 text-xs font-medium text-muted-foreground">
						{fr.actions.quickActions}
					</p>
					{quickActions.map(({ label, icon, action }) => (
						<Button
							key={action}
							variant="ghost"
							className="flex w-full items-center justify-start gap-2 px-2 py-1.5 text-sm"
							onClick={() => handleQuickAction(action)}
						>
							<div className="rounded-sm border p-1">{icon}</div>
							<span>{label}</span>
						</Button>
					))}
				</div>

				<Separator className="my-2" />

				<div className="space-y-1">
					<Button
						variant="ghost"
						className="flex w-full items-center justify-start gap-2 px-2 py-1.5 text-sm"
						onClick={handleExport}
					>
						<div className="rounded-sm border p-1">
							<Download className="h-4 w-4" />
						</div>
						<span>{fr.actions.exportAsMarkdown}</span>
					</Button>
					<Button
						variant="ghost"
						className="flex w-full items-center justify-start gap-2 px-2 py-1.5 text-sm"
						disabled
					>
						<div className="rounded-sm border p-1">
							<Share2 className="h-4 w-4" />
						</div>
						<span>{fr.actions.shareDocument}</span>
					</Button>
				</div>

				<Separator className="my-2" />

				<p className="p-2 text-xs font-medium text-muted-foreground">
					{fr.theme.appearance}
				</p>
				{appearances.map(({ theme, icon, label }) => (
					<Button
						variant="ghost"
						key={theme}
						className="flex w-full items-center justify-between rounded px-2 py-1.5 text-sm"
						onClick={() => {
							setTheme(theme.toLowerCase());
						}}
					>
						<div className="flex items-center space-x-2">
							<div className="rounded-sm border p-1">{icon}</div>
							<span>{label}</span>
						</div>
						{currentTheme === theme.toLowerCase() && (
							<Check className="h-4 w-4" />
						)}
					</Button>
				))}
			</PopoverContent>
		</Popover>
	);
}
