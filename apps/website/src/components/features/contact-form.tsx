"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { contactSchema, type ContactFormData } from "@/lib/validations";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { createLogger } from "@/lib/logger";

const log = createLogger("ContactForm");

export function ContactForm() {
	const [isSubmitting, setIsSubmitting] = useState(false);
	const t = useTranslations("ContactPage.form");

	const {
		register,
		handleSubmit,
		reset,
		formState: { errors },
	} = useForm<ContactFormData>({
		resolver: zodResolver(contactSchema as any),
	});

	const onSubmit = async (data: ContactFormData) => {
		setIsSubmitting(true);
		try {
			// Submit to leads API (FIX: 3RD-001 - was using mock)
			const response = await fetch("/api/leads", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					type: "contact",
					email: data.email,
					companyName: data.company || "Non renseigné",
					firstName: data.firstName,
					lastName: data.lastName,
					phone: data.phone,
					message: data.message,
					source: "website_contact_form",
				}),
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || "Erreur lors de l'envoi");
			}

			toast.success(
				t("success", { defaultMessage: "Message envoyé avec succès !" }),
			);
			reset();
		} catch (error: unknown) {
			log.error("Contact form submission failed:", error);
			const message =
				error instanceof Error ? error.message : "Une erreur est survenue.";
			toast.error(t("error", { defaultMessage: message }));
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<Card className="bg-[var(--card)] border-[var(--border)] shadow-xl">
			<CardHeader>
				<CardTitle className="text-[var(--foreground)] font-playfair text-2xl">
					{t("title", { defaultMessage: "Envoyez-nous un message" })}
				</CardTitle>
			</CardHeader>
			<CardContent>
				<form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
					{/* Using a simplified schema where firstName and lastName are combined to fullName for brevity in schema,
              but checking if the schema I wrote uses fullName. Yes it does.
              However, the UI has two inputs. I should update the UI to match schema or schema to match UI.
              The existing UI had firstName/lastName. The schema has fullName.
              I'll update the schema to match the UI which is better for granularity.
          */}

					{/* Wait, I should update the schema to match the UI if I want to keep firstName/lastName fields.
              Let me check the schema I just wrote.
              `fullName` in schema.
              I will update the schema quickly to `firstName` and `lastName` because it's better UX.
           */}

					{/* Actually, I'll stick to the existing form structure and update the schema inline or in a separate step if needed.
               But wait, I already wrote the schema file. I should update it.
           */}
					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label htmlFor="firstName" className="text-[var(--foreground)]">
								{t("firstName", { defaultMessage: "Prénom" })} *
							</Label>
							<Input
								id="firstName"
								placeholder="Jean"
								{...register("firstName")}
								className={cn(
									"bg-[var(--input)] border-[var(--border)]",
									errors.firstName && "border-red-500",
								)}
							/>
							{errors.firstName && (
								<p className="text-xs text-red-500">
									{errors.firstName.message}
								</p>
							)}
						</div>
						<div className="space-y-2">
							<Label htmlFor="lastName" className="text-[var(--foreground)]">
								{t("lastName", { defaultMessage: "Nom" })} *
							</Label>
							<Input
								id="lastName"
								placeholder="Dupont"
								{...register("lastName")}
								className={cn(
									"bg-[var(--input)] border-[var(--border)]",
									errors.lastName && "border-red-500",
								)}
							/>
							{errors.lastName && (
								<p className="text-xs text-red-500">
									{errors.lastName.message}
								</p>
							)}
						</div>
					</div>

					<div className="space-y-2">
						<Label htmlFor="email" className="text-[var(--foreground)]">
							{t("email", { defaultMessage: "Email" })} *
						</Label>
						<Input
							id="email"
							type="email"
							placeholder="jean.dupont@entreprise.fr"
							{...register("email")}
							className={cn(
								"bg-[var(--input)] border-[var(--border)]",
								errors.email && "border-red-500",
							)}
						/>
						{errors.email && (
							<p className="text-xs text-red-500">{errors.email.message}</p>
						)}
					</div>

					<div className="space-y-2">
						<Label htmlFor="company" className="text-[var(--foreground)]">
							{t("company", { defaultMessage: "Société" })}
						</Label>
						<Input
							id="company"
							placeholder={t("companyPlaceholder", {
								defaultMessage: "Votre entreprise",
							})}
							{...register("company")}
							className={cn(
								"bg-[var(--input)] border-[var(--border)]",
								errors.company && "border-red-500",
							)}
						/>
						{errors.company && (
							<p className="text-xs text-red-500">{errors.company.message}</p>
						)}
					</div>

					<div className="space-y-2">
						<Label htmlFor="phone" className="text-[var(--foreground)]">
							Téléphone
						</Label>
						<Input
							id="phone"
							placeholder="06 00 00 00 00"
							{...register("phone")}
							className={cn(
								"bg-[var(--input)] border-[var(--border)]",
								errors.phone && "border-red-500",
							)}
						/>
						{errors.phone && (
							<p className="text-xs text-red-500">{errors.phone.message}</p>
						)}
					</div>

					<div className="space-y-2">
						<Label htmlFor="message" className="text-[var(--foreground)]">
							{t("message", { defaultMessage: "Message" })} *
						</Label>
						<Textarea
							id="message"
							placeholder="Décrivez votre projet..."
							rows={5}
							{...register("message")}
							className={cn(
								"bg-[var(--input)] border-[var(--border)] resize-none",
								errors.message && "border-red-500",
							)}
						/>
						{errors.message && (
							<p className="text-xs text-red-500">{errors.message.message}</p>
						)}
					</div>

					<Button
						type="submit"
						className="btn-gold w-full rounded-lg"
						disabled={isSubmitting}
					>
						{isSubmitting ? (
							<>
								<Loader2 className="w-4 h-4 mr-2 animate-spin" />
								Envoi en cours...
							</>
						) : (
							t("submit", { defaultMessage: "Envoyer" })
						)}
					</Button>
					<p className="text-xs text-muted-foreground text-center">
						En soumettant ce formulaire, vous acceptez notre{" "}
						<Link href="/politique-de-confidentialite" className="underline">
							politique de confidentialité
						</Link>
						.
					</p>
				</form>
			</CardContent>
		</Card>
	);
}
