"use client";

import { Navbar } from "@/components/layout/Navbar";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import {
	CheckCircle2,
	ArrowRight,
	Users,
	Target,
	Award,
	TrendingUp,
	Shield,
	Sparkles,
	BarChart3,
	Briefcase,
} from "lucide-react";

// Animation variants
const fadeInUp = {
	hidden: { opacity: 0, y: 30 },
	visible: {
		opacity: 1,
		y: 0,
		transition: { duration: 0.6, ease: "easeOut" as const },
	},
} as const;

const staggerContainer = {
	hidden: { opacity: 0 },
	visible: {
		opacity: 1,
		transition: { staggerChildren: 0.15 },
	},
} as const;

const cardVariant = {
	hidden: { opacity: 0, y: 20 },
	visible: {
		opacity: 1,
		y: 0,
		transition: { duration: 0.5, ease: "backOut" as const },
	},
} as const;

export default function AboutPage() {
	const t = useTranslations("AboutPage");

	return (
		<>
			<Navbar />
			<main className="min-h-screen pt-24 pb-20 bg-[var(--background)]">
				{/* Hero Section */}
				<motion.section
					initial="hidden"
					animate="visible"
					variants={fadeInUp}
					className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-alecia-midnight to-[var(--alecia-blue-light)] text-white relative overflow-hidden"
				>
					<div className="absolute inset-0 opacity-10">
						<div className="absolute top-20 right-20 w-96 h-96 bg-white rounded-full blur-3xl" />
						<div className="absolute bottom-10 left-10 w-72 h-72 bg-[var(--alecia-gold)] rounded-full blur-3xl" />
					</div>
					<div className="max-w-6xl mx-auto relative z-10">
						<Breadcrumbs />
						<h1 className="font-playfair text-5xl md:text-6xl font-bold mb-6 mt-8">
							{t("hero.title")}
						</h1>
						<p className="text-xl md:text-2xl max-w-3xl text-white/90 leading-relaxed">
							{t("hero.subtitle")}
						</p>
					</div>
				</motion.section>

				{/* Mission & Values Section */}
				<motion.section
					initial="hidden"
					whileInView="visible"
					viewport={{ once: true, margin: "-100px" }}
					variants={fadeInUp}
					className="py-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto"
				>
					<div className="text-center mb-16">
						<h2 className="font-playfair text-4xl md:text-5xl font-bold text-[var(--foreground)] mb-6">
							{t("mission.title")}
						</h2>
						<p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
							{t("mission.description")}
						</p>
					</div>

					{/* Core Values Grid */}
					<motion.div
						initial="hidden"
						whileInView="visible"
						viewport={{ once: true, margin: "-50px" }}
						variants={staggerContainer}
						className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-12"
					>
						{[
							{ icon: Shield, key: "honesty" },
							{ icon: Award, key: "excellence" },
							{ icon: Users, key: "humility" },
							{ icon: Target, key: "engagement" },
						].map((value) => (
							<motion.div
								key={value.key}
								variants={cardVariant}
								className="bg-secondary rounded-2xl p-8 text-center hover:shadow-xl transition-all duration-300 border border-[var(--border)] hover:border-[var(--alecia-blue-light)]/50"
							>
								<div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gradient-to-br from-alecia-midnight to-[var(--alecia-blue-light)] flex items-center justify-center">
									<value.icon className="w-8 h-8 text-white" />
								</div>
								<h3 className="font-bold text-xl text-[var(--foreground)] mb-3">
									{t(`mission.values.${value.key}.title`)}
								</h3>
								<p className="text-muted-foreground leading-relaxed">
									{t(`mission.values.${value.key}.description`)}
								</p>
							</motion.div>
						))}
					</motion.div>
				</motion.section>

				{/* Unique Methodology Section */}
				<section className="py-20 px-4 sm:px-6 lg:px-8 bg-secondary">
					<motion.div
						initial="hidden"
						whileInView="visible"
						viewport={{ once: true, margin: "-100px" }}
						variants={fadeInUp}
						className="max-w-6xl mx-auto"
					>
						<div className="text-center mb-16">
							<h2 className="font-playfair text-4xl md:text-5xl font-bold text-[var(--foreground)] mb-6">
								{t("methodology.title")}
							</h2>
							<p className="text-xl text-muted-foreground max-w-3xl mx-auto">
								{t("methodology.subtitle")}
							</p>
						</div>

						<div className="grid grid-cols-1 md:grid-cols-3 gap-8">
							{/* Differentiator 1 */}
							<motion.div
								initial="hidden"
								whileInView="visible"
								viewport={{ once: true }}
								variants={cardVariant}
								className="bg-white dark:bg-slate-800/50 rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-[var(--border)]"
							>
								<div className="w-12 h-12 mb-6 rounded-xl bg-[var(--alecia-blue-midnight)]/10 flex items-center justify-center">
									<Users className="w-6 h-6 text-alecia-midnight" />
								</div>
								<h3 className="font-bold text-2xl text-[var(--foreground)] mb-4">
									{t("methodology.differentiators.seniorAttention.title")}
								</h3>
								<p className="text-muted-foreground leading-relaxed mb-4">
									{t("methodology.differentiators.seniorAttention.description")}
								</p>
								<ul className="space-y-2">
									{(
										t.raw(
											"methodology.differentiators.seniorAttention.points",
										) as string[]
									).map((point) => (
										<li
											key={point}
											className="flex items-start gap-2 text-sm text-muted-foreground"
										>
											<CheckCircle2 className="w-4 h-4 text-[var(--alecia-blue-light)] mt-0.5 flex-shrink-0" />
											<span>{point}</span>
										</li>
									))}
								</ul>
							</motion.div>

							{/* Differentiator 2 */}
							<motion.div
								initial="hidden"
								whileInView="visible"
								viewport={{ once: true }}
								variants={cardVariant}
								className="bg-white dark:bg-slate-800/50 rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-[var(--border)]"
							>
								<div className="w-12 h-12 mb-6 rounded-xl bg-[var(--alecia-gold)]/10 flex items-center justify-center">
									<TrendingUp className="w-6 h-6 text-alecia-gold" />
								</div>
								<h3 className="font-bold text-2xl text-[var(--foreground)] mb-4">
									{t("methodology.differentiators.alignedFees.title")}
								</h3>
								<p className="text-muted-foreground leading-relaxed mb-4">
									{t("methodology.differentiators.alignedFees.description")}
								</p>
								<ul className="space-y-2">
									{(
										t.raw(
											"methodology.differentiators.alignedFees.points",
										) as string[]
									).map((point) => (
										<li
											key={point}
											className="flex items-start gap-2 text-sm text-muted-foreground"
										>
											<CheckCircle2 className="w-4 h-4 text-alecia-gold mt-0.5 flex-shrink-0" />
											<span>{point}</span>
										</li>
									))}
								</ul>
							</motion.div>

							{/* Differentiator 3 */}
							<motion.div
								initial="hidden"
								whileInView="visible"
								viewport={{ once: true }}
								variants={cardVariant}
								className="bg-white dark:bg-slate-800/50 rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-[var(--border)]"
							>
								<div className="w-12 h-12 mb-6 rounded-xl bg-[var(--alecia-blue-light)]/10 flex items-center justify-center">
									<Sparkles className="w-6 h-6 text-[var(--alecia-blue-light)]" />
								</div>
								<h3 className="font-bold text-2xl text-[var(--foreground)] mb-4">
									{t("methodology.differentiators.integratedTeam.title")}
								</h3>
								<p className="text-muted-foreground leading-relaxed mb-4">
									{t("methodology.differentiators.integratedTeam.description")}
								</p>
								<ul className="space-y-2">
									{(
										t.raw(
											"methodology.differentiators.integratedTeam.points",
										) as string[]
									).map((point) => (
										<li
											key={point}
											className="flex items-start gap-2 text-sm text-muted-foreground"
										>
											<CheckCircle2 className="w-4 h-4 text-[var(--alecia-blue-light)] mt-0.5 flex-shrink-0" />
											<span>{point}</span>
										</li>
									))}
								</ul>
							</motion.div>
						</div>
					</motion.div>
				</section>

				{/* Team Credentials Section */}
				<motion.section
					initial="hidden"
					whileInView="visible"
					viewport={{ once: true, margin: "-100px" }}
					variants={fadeInUp}
					className="py-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto"
				>
					<div className="text-center mb-16">
						<h2 className="font-playfair text-4xl md:text-5xl font-bold text-[var(--foreground)] mb-6">
							{t("credentials.title")}
						</h2>
						<p className="text-xl text-muted-foreground max-w-3xl mx-auto">
							{t("credentials.subtitle")}
						</p>
					</div>

					<motion.div
						initial="hidden"
						whileInView="visible"
						viewport={{ once: true }}
						variants={staggerContainer}
						className="grid grid-cols-2 md:grid-cols-4 gap-8"
					>
						{[
							{ value: "350M€+", label: t("credentials.stats.valuations") },
							{ value: "30+", label: t("credentials.stats.operations") },
							{ value: "10+", label: t("credentials.stats.sectors") },
							{ value: "5", label: t("credentials.stats.offices") },
						].map((stat, i) => (
							<motion.div
								key={`stat-${i}-${stat.value}`}
								variants={cardVariant}
								className="text-center p-6 rounded-2xl bg-gradient-to-br from-alecia-midnight/5 to-[var(--alecia-blue-light)]/5 border border-[var(--border)] hover:border-[var(--alecia-blue-light)]/50 transition-all duration-300"
							>
								<div className="text-4xl md:text-5xl font-bold text-alecia-midnight mb-2">
									{stat.value}
								</div>
								<div className="text-sm text-muted-foreground">
									{stat.label}
								</div>
							</motion.div>
						))}
					</motion.div>

					<div className="mt-12 text-center">
						<Button asChild size="lg" className="btn-gold">
							<Link href="/equipe">
								{t("credentials.cta")}
								<ArrowRight className="ml-2 h-5 w-5" />
							</Link>
						</Button>
					</div>
				</motion.section>

				{/* Process/How We Work - 4-Step Timeline */}
				<section className="py-20 px-4 sm:px-6 lg:px-8 bg-secondary">
					<motion.div
						initial="hidden"
						whileInView="visible"
						viewport={{ once: true, margin: "-100px" }}
						variants={fadeInUp}
						className="max-w-6xl mx-auto"
					>
						<div className="text-center mb-16">
							<h2 className="font-playfair text-4xl md:text-5xl font-bold text-[var(--foreground)] mb-6">
								{t("process.title")}
							</h2>
							<p className="text-xl text-muted-foreground max-w-3xl mx-auto">
								{t("process.subtitle")}
							</p>
						</div>

						<div className="relative">
							{/* Timeline connector (desktop only) */}
							<div className="hidden md:block absolute top-24 left-0 right-0 h-0.5 bg-gradient-to-r from-alecia-midnight via-[var(--alecia-blue-light)] to-[var(--alecia-blue-midnight)]" />

							<div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
								{[
									{
										icon: Target,
										step: "step1",
										color: "from-alecia-midnight to-[var(--alecia-blue-light)]",
									},
									{
										icon: BarChart3,
										step: "step2",
										color:
											"from-[var(--alecia-blue-light)] to-[var(--alecia-gold)]",
									},
									{
										icon: Users,
										step: "step3",
										color:
											"from-[var(--alecia-gold)] to-[var(--alecia-blue-light)]",
									},
									{
										icon: Briefcase,
										step: "step4",
										color:
											"from-[var(--alecia-blue-light)] to-[var(--alecia-blue-midnight)]",
									},
								].map((item, i) => (
									<motion.div
										key={`process-step-${i}-${item.step}`}
										initial="hidden"
										whileInView="visible"
										viewport={{ once: true }}
										variants={cardVariant}
										className="relative"
									>
										{/* Icon Circle */}
										<div className="flex justify-center mb-6">
											<div
												className={`w-20 h-20 rounded-full bg-gradient-to-br ${item.color} flex items-center justify-center shadow-lg relative z-10`}
											>
												<item.icon className="w-10 h-10 text-white" />
											</div>
										</div>

										{/* Content */}
										<div className="bg-white dark:bg-slate-800/50 rounded-2xl p-6 shadow-lg border border-[var(--border)] hover:border-[var(--alecia-blue-light)]/50 transition-all duration-300">
											<div className="text-sm font-semibold text-alecia-midnight mb-2">
												{t(`process.steps.${item.step}.label`)}
											</div>
											<h3 className="font-bold text-xl text-[var(--foreground)] mb-3">
												{t(`process.steps.${item.step}.title`)}
											</h3>
											<p className="text-sm text-muted-foreground leading-relaxed">
												{t(`process.steps.${item.step}.description`)}
											</p>
										</div>
									</motion.div>
								))}
							</div>
						</div>
					</motion.div>
				</section>

				{/* Client Success Stories Preview */}
				<motion.section
					initial="hidden"
					whileInView="visible"
					viewport={{ once: true, margin: "-100px" }}
					variants={fadeInUp}
					className="py-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto"
				>
					<div className="text-center mb-12">
						<h2 className="font-playfair text-4xl md:text-5xl font-bold text-[var(--foreground)] mb-6">
							{t("successStories.title")}
						</h2>
						<p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
							{t("successStories.subtitle")}
						</p>
						<Button
							asChild
							size="lg"
							variant="outline"
							className="border-2 border-[var(--alecia-blue-midnight)] text-alecia-midnight hover:bg-alecia-midnight hover:text-white"
						>
							<Link href="/operations">
								{t("successStories.cta")}
								<ArrowRight className="ml-2 h-5 w-5" />
							</Link>
						</Button>
					</div>
				</motion.section>

				{/* Final CTA Section */}
				<motion.section
					initial="hidden"
					whileInView="visible"
					viewport={{ once: true }}
					variants={fadeInUp}
					className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-alecia-midnight to-[var(--alecia-blue-light)] text-white relative overflow-hidden"
				>
					<div className="absolute inset-0 opacity-10">
						<div className="absolute top-10 left-20 w-96 h-96 bg-white rounded-full blur-3xl" />
						<div className="absolute bottom-20 right-10 w-72 h-72 bg-[var(--alecia-gold)] rounded-full blur-3xl" />
					</div>
					<div className="max-w-4xl mx-auto text-center relative z-10">
						<h2 className="font-playfair text-4xl md:text-5xl font-bold mb-6">
							{t("cta.title")}
						</h2>
						<p className="text-xl mb-8 text-white/90 leading-relaxed">
							{t("cta.subtitle")}
						</p>
						<div className="flex flex-col sm:flex-row gap-4 justify-center">
							<Button
								asChild
								size="lg"
								className="bg-white text-alecia-midnight hover:bg-white/90"
							>
								<Link href="/contact">
									{t("cta.primaryButton")}
									<ArrowRight className="ml-2 h-5 w-5" />
								</Link>
							</Button>
							<Button
								asChild
								size="lg"
								variant="outline"
								className="border-2 border-white text-white hover:bg-white/10"
							>
								<Link href="/expertises">{t("cta.secondaryButton")}</Link>
							</Button>
						</div>
					</div>
				</motion.section>
			</main>
		</>
	);
}
