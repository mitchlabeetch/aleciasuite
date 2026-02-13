/**
 * MotionSafe Component
 *
 * WCAG 2.1 AA Compliance: 2.3.3 Animation from Interactions
 * Wrapper around Framer Motion that automatically respects prefers-reduced-motion
 *
 * Usage:
 * <MotionSafe.div
 *   initial={{ opacity: 0, y: 20 }}
 *   animate={{ opacity: 1, y: 0 }}
 * >
 *   Content
 * </MotionSafe.div>
 */

"use client";

import { motion, HTMLMotionProps } from "framer-motion";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { forwardRef, ElementType } from "react";

function createMotionSafeComponent<T extends ElementType>(component: T) {
	return forwardRef<any, any>((props, ref) => {
		const prefersReducedMotion = useReducedMotion();
		const Component = component as any;

		// If user prefers reduced motion, strip out motion props
		if (prefersReducedMotion) {
			const {
				initial,
				animate,
				exit,
				variants,
				transition,
				whileHover,
				whileTap,
				whileFocus,
				whileInView,
				drag,
				...restProps
			} = props;

			// Return regular element with minimal animation
			return (
				<Component
					ref={ref}
					{...restProps}
					initial={false}
					animate={false}
					transition={{ duration: 0 }}
				/>
			);
		}

		// Return full motion component
		return <Component ref={ref} {...props} />;
	});
}

// Export motion-safe versions of common HTML elements
export const MotionSafe = {
	div: createMotionSafeComponent(motion.div),
	section: createMotionSafeComponent(motion.section),
	article: createMotionSafeComponent(motion.article),
	header: createMotionSafeComponent(motion.header),
	footer: createMotionSafeComponent(motion.footer),
	nav: createMotionSafeComponent(motion.nav),
	main: createMotionSafeComponent(motion.main),
	aside: createMotionSafeComponent(motion.aside),
	h1: createMotionSafeComponent(motion.h1),
	h2: createMotionSafeComponent(motion.h2),
	h3: createMotionSafeComponent(motion.h3),
	h4: createMotionSafeComponent(motion.h4),
	h5: createMotionSafeComponent(motion.h5),
	h6: createMotionSafeComponent(motion.h6),
	p: createMotionSafeComponent(motion.p),
	span: createMotionSafeComponent(motion.span),
	a: createMotionSafeComponent(motion.a),
	button: createMotionSafeComponent(motion.button),
	ul: createMotionSafeComponent(motion.ul),
	ol: createMotionSafeComponent(motion.ol),
	li: createMotionSafeComponent(motion.li),
	img: createMotionSafeComponent(motion.img),
	svg: createMotionSafeComponent(motion.svg),
	path: createMotionSafeComponent(motion.path),
	form: createMotionSafeComponent(motion.form),
	input: createMotionSafeComponent(motion.input),
	label: createMotionSafeComponent(motion.label),
};
