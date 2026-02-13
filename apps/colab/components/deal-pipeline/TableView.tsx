"use client";

import {
	type ColumnFiltersState,
	type SortingState,
	createColumnHelper,
	flexRender,
	getCoreRowModel,
	getFilteredRowModel,
	getSortedRowModel,
	useReactTable,
} from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ArrowUpDown, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { Badge } from "../tailwind/ui/badge";
import { Button } from "../tailwind/ui/button";
import { Input } from "../tailwind/ui/input";
import { type DealStage } from "@/actions/deals";

type Priority = "high" | "medium" | "low";

interface Deal {
	id: string;
	title: string;
	stage: DealStage;
	amount?: string | null; // DB returns string | null
	leadName?: string;
	createdAt: number;
	updatedAt: number;
	expectedCloseDate?: number;
	priority?: Priority;
	tags?: string[];
}

interface TableViewProps {
	deals: Deal[];
	onDealClick?: (dealId: string) => void;
}

const stageColors: Record<string, string> = {
	sourcing: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100",
	qualification:
		"bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-100",
	initial_meeting:
		"bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-100",
	analysis:
		"bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-100",
	valuation:
		"bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-100",
	due_diligence:
		"bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100",
	negotiation:
		"bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100",
	closing:
		"bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100",
	closed_won:
		"bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
	closed_lost: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100",
	// Legacy stages
	Lead: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100",
	"NDA Signed": "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-100",
	"Offer Received":
		"bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100",
	"Due Diligence":
		"bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100",
	Closing:
		"bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100",
	completed:
		"bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
};

const priorityColors: Record<Priority, string> = {
	high: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100",
	medium:
		"bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100",
	low: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100",
};

const columnHelper = createColumnHelper<Deal>();

export function TableView({ deals, onDealClick }: TableViewProps) {
	const [sorting, setSorting] = useState<SortingState>([]);
	const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
	const [globalFilter, setGlobalFilter] = useState("");

	const columns = useMemo(
		() => [
			columnHelper.accessor("title", {
				header: ({ column }) => (
					<Button
						variant="ghost"
						onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
						className="flex items-center gap-1 -ml-4"
					>
						Company
						{column.getIsSorted() === "asc" ? (
							<ArrowUp className="h-4 w-4" />
						) : column.getIsSorted() === "desc" ? (
							<ArrowDown className="h-4 w-4" />
						) : (
							<ArrowUpDown className="h-4 w-4" />
						)}
					</Button>
				),
				cell: (info) => <span className="font-medium">{info.getValue()}</span>,
			}),
			columnHelper.accessor("stage", {
				header: "Stage",
				cell: (info) => (
					<Badge className={stageColors[info.getValue()] || "bg-gray-100"}>
						{info.getValue().replace(/_/g, " ")}
					</Badge>
				),
			}),
			columnHelper.accessor("amount", {
				header: ({ column }) => (
					<Button
						variant="ghost"
						onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
						className="flex items-center gap-1 -ml-4"
					>
						Amount
						<ArrowUpDown className="h-4 w-4" />
					</Button>
				),
			cell: (info) => {
				const amount = info.getValue();
				if (!amount) return "—";
				const num = parseFloat(amount);
				if (isNaN(num)) return "—";
				if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M€`;
				if (num >= 1000) return `${(num / 1000).toFixed(0)}K€`;
				return `${num}€`;
			},
			}),
			columnHelper.accessor("expectedCloseDate", {
				header: ({ column }) => (
					<Button
						variant="ghost"
						onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
						className="flex items-center gap-1 -ml-4"
					>
						Expected Close
						<ArrowUpDown className="h-4 w-4" />
					</Button>
				),
				cell: (info) => {
					const date = info.getValue();
					if (!date) return "—";
					return new Date(date).toLocaleDateString();
				},
			}),
			columnHelper.accessor("createdAt", {
				header: ({ column }) => (
					<Button
						variant="ghost"
						onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
						className="flex items-center gap-1 -ml-4"
					>
						Created
						<ArrowUpDown className="h-4 w-4" />
					</Button>
				),
				cell: (info) => new Date(info.getValue()).toLocaleDateString(),
			}),
			columnHelper.accessor("tags", {
				header: "Tags",
				cell: (info) => {
					const tags = info.getValue();
					if (!tags || tags.length === 0) return "—";
					return (
						<div className="flex gap-1 flex-wrap">
							{tags.slice(0, 3).map((tag) => (
								<Badge key={tag} variant="outline" className="text-xs">
									{tag}
								</Badge>
							))}
							{tags.length > 3 && (
								<Badge variant="outline" className="text-xs">
									+{tags.length - 3}
								</Badge>
							)}
						</div>
					);
				},
			}),
		],
		[],
	);

	const table = useReactTable({
		data: deals,
		columns,
		state: {
			sorting,
			columnFilters,
			globalFilter,
		},
		onSortingChange: setSorting,
		onColumnFiltersChange: setColumnFilters,
		onGlobalFilterChange: setGlobalFilter,
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
	});

	return (
		<div className="space-y-4">
			{/* Search */}
			<div className="relative max-w-sm">
				<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
				<Input
					placeholder="Search deals..."
					value={globalFilter}
					onChange={(e) => setGlobalFilter(e.target.value)}
					className="pl-9"
				/>
			</div>

			{/* Table */}
			<div className="rounded-md border">
				<table className="w-full">
					<thead className="bg-muted/50">
						{table.getHeaderGroups().map((headerGroup) => (
							<tr key={headerGroup.id}>
								{headerGroup.headers.map((header) => (
									<th
										key={header.id}
										className="px-4 py-3 text-left text-sm font-medium text-muted-foreground"
									>
										{header.isPlaceholder
											? null
											: flexRender(
													header.column.columnDef.header,
													header.getContext(),
												)}
									</th>
								))}
							</tr>
						))}
					</thead>
					<tbody>
						{table.getRowModel().rows.length === 0 ? (
							<tr>
								<td
									colSpan={columns.length}
									className="px-4 py-8 text-center text-muted-foreground"
								>
									No deals found
								</td>
							</tr>
						) : (
							table.getRowModel().rows.map((row) => (
								<tr
									key={row.id}
									className="border-t hover:bg-muted/50 cursor-pointer transition-colors"
									onClick={() => onDealClick?.(row.original.id)}
								>
									{row.getVisibleCells().map((cell) => (
										<td key={cell.id} className="px-4 py-3 text-sm">
											{flexRender(
												cell.column.columnDef.cell,
												cell.getContext(),
											)}
										</td>
									))}
								</tr>
							))
						)}
					</tbody>
				</table>
			</div>

			{/* Footer */}
			<div className="text-sm text-muted-foreground">
				{table.getFilteredRowModel().rows.length} deal(s)
			</div>
		</div>
	);
}
