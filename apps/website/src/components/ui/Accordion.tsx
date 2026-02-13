"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface AccordionItemProps {
	title: string;
	children: React.ReactNode;
	isOpen?: boolean;
	onToggle?: () => void;
}

export function AccordionItem({
	title,
	children,
	isOpen,
	onToggle,
}: AccordionItemProps) {
	return (
		<div className="border-b border-[var(--border)] overflow-hidden">
			<button
				onClick={onToggle}
				className={cn(
					"w-full flex items-center justify-between py-6 text-left transition-colors duration-200 group",
					isOpen
						? "text-[var(--alecia-midnight)] dark:text-white"
						: "text-muted-foreground hover:text-[var(--foreground)]",
				)}
			>
				<span className="text-lg font-medium">{title}</span>
				<motion.span
					animate={{ rotate: isOpen ? 180 : 0 }}
					transition={{ duration: 0.2 }}
					className={cn(
						"p-1 rounded-full border transition-colors",
						isOpen
							? "bg-[var(--alecia-midnight)] border-[var(--alecia-midnight)] text-white"
							: "border-[var(--border)] group-hover:border-[var(--foreground)]",
					)}
				>
					<ChevronDown className="w-4 h-4" />
				</motion.span>
			</button>
			<AnimatePresence initial={false}>
				{isOpen && (
					<motion.div
						initial={{ height: 0, opacity: 0 }}
						animate={{ height: "auto", opacity: 1 }}
						exit={{ height: 0, opacity: 0 }}
						transition={{ duration: 0.3, ease: "easeInOut" }}
					>
						<div className="pb-6 text-muted-foreground leading-relaxed">
							{children}
						</div>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
}

export function Accordion({
	children,
	className,
}: { children: React.ReactNode; className?: string }) {
	return <div className={cn("w-full", className)}>{children}</div>;
}
