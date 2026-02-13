"use client";

import { useState } from "react";
import { ChevronDown, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface OperationsFilterProps {
	options: string[];
	selected: string;
	onChange: (value: string) => void;
	label: string;
}

export function OperationsFilter({
	options,
	selected,
	onChange,
	label,
}: OperationsFilterProps) {
	const [isOpen, setIsOpen] = useState(false);

	const displayValue = selected === "All" ? "Tout" : selected;
	const displayLabel = label === "Sectors" ? "Secteurs" : label;

	return (
		<div className="relative">
			<button
				onClick={() => setIsOpen(!isOpen)}
				className="flex items-center justify-between min-w-[180px] px-4 py-2.5 text-sm font-medium bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--alecia-blue-corporate)]/20 focus:border-[var(--alecia-blue-corporate)]"
			>
				<div className="flex flex-col items-start">
					<span className="text-xs text-gray-500 uppercase tracking-wider">
						{displayLabel}
					</span>
					<span className="text-gray-900">{displayValue}</span>
				</div>
				<ChevronDown
					className={cn(
						"w-4 h-4 text-gray-400 transition-transform duration-200",
						isOpen && "rotate-180",
					)}
				/>
			</button>

			<AnimatePresence>
				{isOpen && (
					<>
						{/* Backdrop */}
						<div
							className="fixed inset-0 z-10"
							onClick={() => setIsOpen(false)}
						/>

						{/* Dropdown */}
						<motion.div
							initial={{ opacity: 0, y: -10, scale: 0.95 }}
							animate={{ opacity: 1, y: 0, scale: 1 }}
							exit={{ opacity: 0, y: -10, scale: 0.95 }}
							transition={{ duration: 0.15, ease: "easeOut" }}
							className="absolute top-full left-0 z-20 mt-2 w-full min-w-[200px] bg-white rounded-lg shadow-lg border border-gray-200 py-2 max-h-60 overflow-y-auto"
						>
							{options.map((option) => {
								const displayOption = option === "All" ? "Tout" : option;
								const isSelected = selected === option;

								return (
									<button
										key={option}
										onClick={() => {
											onChange(option);
											setIsOpen(false);
										}}
										className={cn(
											"flex items-center justify-between w-full px-4 py-2.5 text-sm text-left transition-colors duration-150",
											isSelected
												? "bg-[var(--alecia-blue-corporate)]/10 text-alecia-corporate"
												: "text-gray-700 hover:bg-gray-50",
										)}
									>
										<span>{displayOption}</span>
										{isSelected && (
											<Check className="w-4 h-4 text-alecia-corporate" />
										)}
									</button>
								);
							})}
						</motion.div>
					</>
				)}
			</AnimatePresence>
		</div>
	);
}
