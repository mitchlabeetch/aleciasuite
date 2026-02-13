import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getTranslations, getLocale } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
	const locale = await getLocale();
	const t = await getTranslations({ locale, namespace: "AdminPage" });

	return {
		title: t("title"),
		description: t("description"),
	};
}

/**
 * Admin root page - redirects to dashboard
 */
export default async function AdminPage() {
	const locale = await getLocale();
	redirect(`/${locale}/admin/dashboard`);
}
