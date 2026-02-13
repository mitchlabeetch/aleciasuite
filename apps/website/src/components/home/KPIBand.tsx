"use client";

import React, { memo, useState, useEffect } from "react";
import { motion, useInView } from "framer-motion";
import {
	Building2,
	Briefcase,
	MapPin,
	TrendingUp,
	BarChart3,
	Users,
	Globe,
	Award,
	Target,
	Zap,
	Rocket,
	Shield,
	DollarSign,
	Euro,
	Percent,
	Calendar,
	Clock,
	Star,
	Heart,
	Handshake,
	Factory,
	Landmark,
	PieChart,
	Activity,
	type LucideIcon,
} from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import { getMarketingKPIs, getAllMarketingKPIs } from "@/actions";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

/**
 * KPIBand - Admin Configurable (Board Requirement)
 *
 * Features:
 * - Fetches KPIs from Convex marketing_kpis table
 * - Falls back to hardcoded values if no data
 * - 4 animated KPI counters with scroll trigger
 * - Dynamic icons based on database configuration
 * - WCAG 2.1 AA compliant with reduced motion support
 *
 * Admin Configuration:
 * - Run `npx convex run marketing:seedMarketingKPIs` to populate defaults
 * - Use admin panel at /admin/kpis to modify values
 */

// Comprehensive icon mapping for dynamic icon selection
const iconMap: Record<string, LucideIcon> = {
	// Default KPIs
	TrendingUp,
	Briefcase,
	Building2,
	MapPin,
	// Business & Finance
	BarChart3,
	DollarSign,
	Euro,
	Percent,
	PieChart,
	Activity,
	// People & Relationships
	Users,
	Handshake,
	Heart,
	// Achievement & Goals
	Award,
	Target,
	Star,
	Rocket,
	Zap,
	Shield,
	// Industry
	Factory,
	Landmark,
	Globe,
	// Time
	Calendar,
	Clock,
};

interface KPI {
	icon: LucideIcon;
	value: number;
	suffix?: string;
	prefix?: string;
	label: string;
}

export const KPIBand = memo(function KPIBand() {
	const t = useTranslations("KPIBand");
	const locale = useLocale();
	const ref = React.useRef(null);
	const isInView = useInView(ref, { once: true, amount: 0.8 });
	const prefersReducedMotion = useReducedMotion();

	// Fetch KPIs from server actions
	const [convexKPIs, setConvexKPIs] = useState<any[] | null>(null);

	useEffect(() => {
		getMarketingKPIs(locale).then((data) => {
			setConvexKPIs(data);
		});
	}, [locale]);

	// Transform server data to KPI format, or use fallback
	const kpis: KPI[] = React.useMemo(() => {
		// Fallback hardcoded KPIs (used when Convex data unavailable)
		const fallbackKPIs: KPI[] = [
			{
				icon: TrendingUp,
				value: 50,
				suffix: " m€+",
				label: t("valuations"),
			},
			{
				icon: Briefcase,
				value: 45,
				suffix: "+",
				label: t("operations"),
			},
			{
				icon: Building2,
				value: 9,
				label: t("sectors"),
			},
			{
				icon: MapPin,
				value: 5,
				label: t("offices"),
			},
		];

		if (!convexKPIs || convexKPIs.length === 0) {
			return fallbackKPIs;
		}

		return convexKPIs.map(
			(kpi: {
				icon: string;
				value: number;
				suffix?: string;
				prefix?: string;
				label: string;
			}) => ({
				icon: iconMap[kpi.icon] || Building2,
				value: kpi.value,
				suffix: kpi.suffix,
				prefix: kpi.prefix,
				label: kpi.label,
			}),
		);
	}, [convexKPIs, t]);

	return (
		<section
			ref={ref}
			className="relative bg-linear-to-r from-[#061a40] to-[#19354e] dark:from-alecia-midnight dark:to-alecia-corporate"
			aria-label={t("valuations") ? "Nos chiffres clés" : "Key figures"}
		>
			<div className="py-16">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
						{kpis.map((kpi, index) => (
							<motion.div
								key={kpi.label}
								initial={
									prefersReducedMotion
										? { opacity: 1, y: 0 }
										: { opacity: 0, y: 20 }
								}
								animate={
									isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }
								}
								transition={
									prefersReducedMotion
										? { duration: 0 }
										: { duration: 0.5, delay: index * 0.1 }
								}
								className="text-center"
							>
								{/* Icon */}
								<div
									className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-white/10 text-white dark:bg-white/5 dark:text-white mb-4"
									aria-hidden="true"
								>
									<kpi.icon className="w-6 h-6" />
								</div>

								{/* Animated Value */}
								<div className="text-4xl md:text-5xl font-bold text-white dark:text-white mb-2 flex justify-center items-baseline">
									<span className="sr-only">{`${kpi.prefix || ""}${kpi.value}${kpi.suffix || ""} ${kpi.label}`}</span>
									{kpi.prefix && <span aria-hidden="true">{kpi.prefix}</span>}
									<span aria-hidden="true">
										<AnimatedNumber
											value={
												isInView && !prefersReducedMotion
													? kpi.value
													: isInView
														? kpi.value
														: 0
											}
											skipAnimation={prefersReducedMotion}
										/>
									</span>
									{kpi.suffix && (
										<span
											className="text-3xl md:text-4xl ml-1"
											aria-hidden="true"
										>
											{kpi.suffix}
										</span>
									)}
								</div>

								{/* Label */}
								<p className="text-sm text-white/70 dark:text-white/60 uppercase tracking-wider">
									{kpi.label}
								</p>
							</motion.div>
						))}
					</div>
				</div>
			</div>
		</section>
	);
});

/**
 * Optimized animated number component using requestAnimationFrame
 * Respects user's reduced motion preference
 */
function AnimatedNumber({
	value,
	skipAnimation = false,
}: { value: number; skipAnimation?: boolean }) {
	const [displayValue, setDisplayValue] = React.useState(
		skipAnimation ? value : 0,
	);
	const frameRef = React.useRef<number | undefined>(undefined);
	const startTimeRef = React.useRef<number | undefined>(undefined);

	React.useEffect(() => {
		if (value === 0) {
			setDisplayValue(0);
			return;
		}

		// If reduced motion, set value immediately
		if (skipAnimation) {
			setDisplayValue(value);
			return;
		}

		const duration = 2000; // Reduced from 2500ms

		const animate = (currentTime: number) => {
			if (!startTimeRef.current) {
				startTimeRef.current = currentTime;
			}

			const elapsed = currentTime - startTimeRef.current;
			const progress = Math.min(elapsed / duration, 1);

			// Easing function for smoother animation
			const easeOutQuad = (t: number) => t * (2 - t);
			const easedProgress = easeOutQuad(progress);

			setDisplayValue(Math.floor(value * easedProgress));

			if (progress < 1) {
				frameRef.current = requestAnimationFrame(animate);
			} else {
				setDisplayValue(value);
			}
		};

		frameRef.current = requestAnimationFrame(animate);

		return () => {
			if (frameRef.current) {
				cancelAnimationFrame(frameRef.current);
			}
			startTimeRef.current = undefined;
		};
	}, [value, skipAnimation]);

	return <span>{displayValue}</span>;
}
