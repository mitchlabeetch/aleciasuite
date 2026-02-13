"use client";

import { motion } from "framer-motion";
import { pageVariants } from "@/lib/animations";
import { ReactNode } from "react";

/**
 * Page Transition Wrapper
 *
 * Wraps page content with smooth fade-in-up animation.
 * Use this component at the top level of admin pages.
 *
 * @example
 * ```tsx
 * export default function DashboardPage() {
 *   return (
 *     <PageTransition>
 *       <div>Your page content</div>
 *     </PageTransition>
 *   );
 * }
 * ```
 */
export function PageTransition({
	children,
	className = "",
}: {
	children: ReactNode;
	className?: string;
}) {
	return (
		<motion.div
			variants={pageVariants}
			initial="initial"
			animate="animate"
			exit="exit"
			className={className}
		>
			{children}
		</motion.div>
	);
}

/**
 * Animate items as they enter viewport
 */
export function AnimateOnScroll({
	children,
	className = "",
}: {
	children: ReactNode;
	className?: string;
}) {
	return (
		<motion.div
			initial={{ opacity: 0, y: 20 }}
			whileInView={{ opacity: 1, y: 0 }}
			viewport={{ once: true, margin: "-50px" }}
			transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
			className={className}
		>
			{children}
		</motion.div>
	);
}

/**
 * Stagger children animation container
 */
export function StaggerContainer({
	children,
	className = "",
	stagger = 0.05,
}: {
	children: ReactNode;
	className?: string;
	stagger?: number;
}) {
	return (
		<motion.div
			initial="initial"
			animate="animate"
			variants={{
				animate: {
					transition: {
						staggerChildren: stagger,
					},
				},
			}}
			className={className}
		>
			{children}
		</motion.div>
	);
}

/**
 * Stagger item (must be child of StaggerContainer)
 */
export function StaggerItem({
	children,
	className = "",
}: {
	children: ReactNode;
	className?: string;
}) {
	return (
		<motion.div
			variants={{
				initial: { opacity: 0, y: 20 },
				animate: { opacity: 1, y: 0 },
			}}
			className={className}
		>
			{children}
		</motion.div>
	);
}
