import type { Variants } from "framer-motion";

export const fadeVariants: Variants = {
	initial: { opacity: 0 },
	animate: { opacity: 1 },
	exit: { opacity: 0 },
};

export const slideUpVariants: Variants = {
	initial: { y: 20, opacity: 0 },
	animate: { y: 0, opacity: 1 },
	exit: { y: 20, opacity: 0 },
};

export const staggerContainerVariants: Variants = {
	initial: {},
	animate: {
		transition: {
			staggerChildren: 0.05,
		},
	},
};

export const buttonTapVariants: Variants = {
	tap: { scale: 0.98 },
};
