"use client";
import { motion } from "framer-motion";
import type { ReactNode } from "react";

export function AnimatedCard({
	children,
	className,
}: { children: ReactNode; className?: string }) {
	return (
		<motion.div
			whileHover={{
				y: -5,
				boxShadow:
					"0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
			}}
			className={className}
		>
			{children}
		</motion.div>
	);
}
