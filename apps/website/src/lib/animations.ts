/**
 * Animation Variants Library
 *
 * Consistent Framer Motion animations for the admin panel.
 * Import these variants to ensure uniform motion design.
 *
 * WCAG 2.1 AA Compliance: 2.3.3 Animation from Interactions
 * All animations respect prefers-reduced-motion user preference
 */
import { Variants, Transition } from "framer-motion";

// ============================================================================
// REDUCED MOTION SUPPORT
// ============================================================================

/**
 * Helper function to create motion-safe variants
 * Returns instant transitions when user prefers reduced motion
 *
 * Usage in components:
 * const prefersReducedMotion = useReducedMotion();
 * const safeVariants = getReducedMotionVariants(fadeInUp, prefersReducedMotion);
 */
export function getReducedMotionVariants(
	variants: Variants,
	prefersReducedMotion: boolean,
): Variants {
	if (!prefersReducedMotion) {
		return variants;
	}

	// Create reduced motion version - only opacity changes, no movement
	const reducedVariants: Variants = {};

	for (const key in variants) {
		const variant = variants[key];
		if (typeof variant === "object") {
			// Remove all transforms and keep only opacity
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			const { x, y, scale, rotate, ...rest } = variant as any;
			reducedVariants[key] = {
				...rest,
				x: 0,
				y: 0,
				scale: 1,
				rotate: 0,
				transition: { duration: 0.01 }, // Nearly instant
			};
		}
	}

	return reducedVariants;
}

/**
 * Motion-safe transition helper
 * Returns instant transition when user prefers reduced motion
 */
export function getReducedMotionTransition(
	transition: Transition,
	prefersReducedMotion: boolean,
): Transition {
	return prefersReducedMotion ? { duration: 0.01 } : transition;
}

// ============================================================================
// STANDARD TRANSITIONS
// ============================================================================

export const springTransition: Transition = {
	type: "spring",
	stiffness: 400,
	damping: 25,
};

export const smoothTransition: Transition = {
	duration: 0.2,
	ease: [0.4, 0, 0.2, 1],
};

export const slowTransition: Transition = {
	duration: 0.4,
	ease: [0.4, 0, 0.2, 1],
};

// ============================================================================
// FADE ANIMATIONS
// ============================================================================

export const fadeIn: Variants = {
	initial: { opacity: 0 },
	animate: { opacity: 1 },
	exit: { opacity: 0 },
};

export const fadeInUp: Variants = {
	initial: { opacity: 0, y: 20 },
	animate: { opacity: 1, y: 0 },
	exit: { opacity: 0, y: -10 },
};

export const fadeInDown: Variants = {
	initial: { opacity: 0, y: -20 },
	animate: { opacity: 1, y: 0 },
	exit: { opacity: 0, y: 10 },
};

export const fadeInLeft: Variants = {
	initial: { opacity: 0, x: -20 },
	animate: { opacity: 1, x: 0 },
	exit: { opacity: 0, x: 20 },
};

export const fadeInRight: Variants = {
	initial: { opacity: 0, x: 20 },
	animate: { opacity: 1, x: 0 },
	exit: { opacity: 0, x: -20 },
};

// ============================================================================
// SCALE ANIMATIONS
// ============================================================================

export const scaleIn: Variants = {
	initial: { opacity: 0, scale: 0.95 },
	animate: { opacity: 1, scale: 1 },
	exit: { opacity: 0, scale: 0.95 },
};

export const scaleUp: Variants = {
	initial: { opacity: 0, scale: 0.8 },
	animate: { opacity: 1, scale: 1 },
	exit: { opacity: 0, scale: 0.8 },
};

// ============================================================================
// STAGGER CONTAINERS
// ============================================================================

export const staggerContainer: Variants = {
	animate: {
		transition: {
			staggerChildren: 0.05,
		},
	},
};

export const staggerContainerSlow: Variants = {
	animate: {
		transition: {
			staggerChildren: 0.1,
		},
	},
};

export const staggerContainerFast: Variants = {
	animate: {
		transition: {
			staggerChildren: 0.03,
		},
	},
};

// ============================================================================
// CARD ANIMATIONS
// ============================================================================

export const cardVariants: Variants = {
	initial: { opacity: 0, y: 20 },
	animate: { opacity: 1, y: 0 },
	hover: {
		scale: 1.02,
		boxShadow: "0 10px 40px rgba(6, 26, 64, 0.1)",
		transition: springTransition,
	},
	tap: { scale: 0.98 },
};

export const listItemVariants: Variants = {
	initial: { opacity: 0, x: -10 },
	animate: { opacity: 1, x: 0 },
	exit: { opacity: 0, x: 10 },
};

// ============================================================================
// HOVER/TAP PRESETS
// ============================================================================

export const hoverScale = {
	whileHover: { scale: 1.02 },
	whileTap: { scale: 0.98 },
	transition: springTransition,
};

export const hoverLift = {
	whileHover: { y: -4, boxShadow: "0 10px 40px rgba(6, 26, 64, 0.12)" },
	transition: smoothTransition,
};

export const buttonPress = {
	whileHover: { scale: 1.02 },
	whileTap: { scale: 0.95 },
	transition: springTransition,
};

// ============================================================================
// MODAL / OVERLAY ANIMATIONS
// ============================================================================

export const overlayVariants: Variants = {
	initial: { opacity: 0 },
	animate: { opacity: 1 },
	exit: { opacity: 0 },
};

export const modalVariants: Variants = {
	initial: { opacity: 0, scale: 0.95, y: 10 },
	animate: {
		opacity: 1,
		scale: 1,
		y: 0,
		transition: {
			type: "spring",
			damping: 25,
			stiffness: 300,
		},
	},
	exit: {
		opacity: 0,
		scale: 0.95,
		y: 10,
		transition: { duration: 0.15 },
	},
};

export const slideUpVariants: Variants = {
	initial: { opacity: 0, y: "100%" },
	animate: {
		opacity: 1,
		y: 0,
		transition: {
			type: "spring",
			damping: 30,
			stiffness: 300,
		},
	},
	exit: {
		opacity: 0,
		y: "100%",
		transition: { duration: 0.2 },
	},
};

// ============================================================================
// PAGE TRANSITIONS
// ============================================================================

export const pageVariants: Variants = {
	initial: { opacity: 0, y: 20 },
	animate: {
		opacity: 1,
		y: 0,
		transition: {
			duration: 0.3,
			ease: [0.4, 0, 0.2, 1],
		},
	},
	exit: {
		opacity: 0,
		y: -10,
		transition: {
			duration: 0.2,
		},
	},
};

// ============================================================================
// SKELETON / SHIMMER
// ============================================================================

export const shimmer: Variants = {
	initial: { x: "-100%" },
	animate: {
		x: "100%",
		transition: {
			repeat: Infinity,
			duration: 1.5,
			ease: "linear",
		},
	},
};

// ============================================================================
// UTILITY HELPERS
// ============================================================================

/**
 * Creates a delayed variant for staggered children
 */
export function createDelayedVariant(delay: number): Variants {
	return {
		initial: { opacity: 0, y: 20 },
		animate: {
			opacity: 1,
			y: 0,
			transition: {
				delay,
				duration: 0.3,
			},
		},
	};
}

/**
 * Creates stagger children with custom timing
 */
export function createStaggerChildren(stagger: number): Variants {
	return {
		animate: {
			transition: {
				staggerChildren: stagger,
			},
		},
	};
}
