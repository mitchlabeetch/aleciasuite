"use client";

import {
	Briefcase,
	Building,
	Calculator,
	ClipboardCheck,
	FileText,
	FolderOpen,
	Plus,
	Search,
	TrendingUp,
} from "lucide-react";
import { useState } from "react";
import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";
import { Separator } from "./ui/separator";

interface DocumentCategory {
	id: string;
	name: string;
	icon: React.ReactNode;
	count: number;
}

const categories: DocumentCategory[] = [
	{
		id: "deals",
		name: "Active Deals",
		icon: <Briefcase className="h-4 w-4" />,
		count: 0,
	},
	{
		id: "companies",
		name: "Target Companies",
		icon: <Building className="h-4 w-4" />,
		count: 0,
	},
	{
		id: "dd",
		name: "Due Diligence",
		icon: <ClipboardCheck className="h-4 w-4" />,
		count: 0,
	},
	{
		id: "valuation",
		name: "Valuations",
		icon: <Calculator className="h-4 w-4" />,
		count: 0,
	},
	{
		id: "integration",
		name: "Integration Plans",
		icon: <TrendingUp className="h-4 w-4" />,
		count: 0,
	},
	{
		id: "research",
		name: "Research & Analysis",
		icon: <FileText className="h-4 w-4" />,
		count: 0,
	},
	{
		id: "all",
		name: "All Documents",
		icon: <FolderOpen className="h-4 w-4" />,
		count: 0,
	},
];

export default function DocumentSidebar() {
	const [selectedCategory, setSelectedCategory] = useState<string>("all");
	const [searchQuery, setSearchQuery] = useState("");

	return (
		<div className="w-64 border-r bg-background h-full flex flex-col">
			<div className="p-4 space-y-4">
				<div className="flex items-center justify-between">
					<h2 className="text-lg font-semibold">Documents</h2>
					<Button size="icon" variant="ghost" className="h-8 w-8">
						<Plus className="h-4 w-4" />
					</Button>
				</div>

				<div className="relative">
					<Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
					<input
						type="text"
						placeholder="Search documents..."
						className="w-full pl-8 pr-4 py-2 text-sm border rounded-md bg-background"
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
					/>
				</div>
			</div>

			<Separator />

			<ScrollArea className="flex-1 px-2">
				<div className="space-y-1 py-2">
					{categories.map((category) => (
						<Button
							key={category.id}
							variant={selectedCategory === category.id ? "secondary" : "ghost"}
							className="w-full justify-start gap-2"
							onClick={() => setSelectedCategory(category.id)}
						>
							{category.icon}
							<span className="flex-1 text-left">{category.name}</span>
							<span className="text-xs text-muted-foreground">
								{category.count}
							</span>
						</Button>
					))}
				</div>
			</ScrollArea>

			<Separator />

			<div className="p-4">
				<Button variant="outline" className="w-full gap-2">
					<Plus className="h-4 w-4" />
					New Document
				</Button>
			</div>
		</div>
	);
}
