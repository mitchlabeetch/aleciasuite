"use client";

import { Button } from "@/components/tailwind/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/tailwind/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import {
	Check,
	ChevronDown,
	ExternalLink,
	FileEdit,
	LayoutDashboard,
} from "lucide-react";
import { useState } from "react";

type WorkspaceContext = "colab" | "admin";

interface WorkspaceSwitcherProps {
	className?: string;
}

const workspaces = [
	{
		id: "colab",
		name: "Alecia Colab",
		description: "Documents & Knowledge Base",
		icon: FileEdit,
		href: "/dashboard",
		internal: true,
	},
	{
		id: "admin",
		name: "Admin Panel",
		description: "CRM & Deal Management",
		icon: LayoutDashboard,
		href: "/admin/dashboard",
		internal: false,
	},
];

export function WorkspaceSwitcher({ className }: WorkspaceSwitcherProps) {
	const [currentWorkspace] = useState<WorkspaceContext>("colab");
	const current = workspaces.find((w) => w.id === currentWorkspace);

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button
					variant="ghost"
					className={cn("w-full justify-between px-3", className)}
				>
					<div className="flex items-center gap-2">
						{current && <current.icon className="h-4 w-4" />}
						<span className="font-medium">{current?.name}</span>
					</div>
					<ChevronDown className="h-4 w-4 text-muted-foreground" />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="start" className="w-64">
				<DropdownMenuLabel>Switch Workspace</DropdownMenuLabel>
				<DropdownMenuSeparator />
				{workspaces.map((workspace) => {
					const Icon = workspace.icon;
					const isActive = workspace.id === currentWorkspace;

					return (
						<DropdownMenuItem
							key={workspace.id}
							asChild
							className="cursor-pointer"
						>
							<a
								href={workspace.href}
								target={workspace.internal ? undefined : "_top"}
								className="flex items-center justify-between w-full"
							>
								<div className="flex items-center gap-3">
									<Icon className="h-4 w-4" />
									<div>
										<p className="text-sm font-medium">{workspace.name}</p>
										<p className="text-xs text-muted-foreground">
											{workspace.description}
										</p>
									</div>
								</div>
								{isActive ? (
									<Check className="h-4 w-4 text-primary" />
								) : !workspace.internal ? (
									<ExternalLink className="h-3 w-3 text-muted-foreground" />
								) : null}
							</a>
						</DropdownMenuItem>
					);
				})}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
