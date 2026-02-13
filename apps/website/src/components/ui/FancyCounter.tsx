"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";

/**
 * FancyCounter - Animated number counter with scroll trigger
 *
 * Features:
 * - Triggers animation when element enters viewport
 * - Smooth easeOutQuart animation curve
 * - Supports prefix/suffix for units
 * - Tabular-nums for stable width
 */

interface CounterProps {
	value: number;
	prefix?: string;
	suffix?: string;
	duration?: number;
	className?: string;
}

export function Counter({
	value,
	prefix = "",
	suffix = "",
	duration = 2000,
	className = "",
}: CounterProps) {
	const [count, setCount] = useState(0);
	const ref = useRef<HTMLSpanElement>(null);
	const isInView = useInView(ref, { once: true, margin: "-100px" });

	useEffect(() => {
		if (!isInView) return;

		const startTime = Date.now();

		const timer = setInterval(() => {
			const elapsed = Date.now() - startTime;
			const progress = Math.min(elapsed / duration, 1);

			// Easing function for smooth animation (easeOutQuart)
			const easeOutQuart = 1 - Math.pow(1 - progress, 4);
			const currentValue = Math.floor(easeOutQuart * value);

			setCount(currentValue);

			if (progress >= 1) {
				clearInterval(timer);
				setCount(value);
			}
		}, 16);

		return () => clearInterval(timer);
	}, [isInView, value, duration]);

	return (
		<motion.span
			ref={ref}
			initial={{ opacity: 0, y: 10 }}
			animate={isInView ? { opacity: 1, y: 0 } : {}}
			transition={{ duration: 0.5 }}
			className={`tabular-nums ${className}`}
		>
			{prefix}
			{count}
			{suffix}
		</motion.span>
	);
}

export { Counter as FancyCounter };
