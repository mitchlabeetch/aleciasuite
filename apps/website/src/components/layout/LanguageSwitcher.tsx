"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { useParams } from "next/navigation";
import { startTransition } from "react";

export function LanguageSwitcher() {
	const locale = useLocale();
	const router = useRouter();
	const pathname = usePathname();
	const params = useParams();

	function onLocaleChange(nextLocale: string) {
		startTransition(() => {
			// @ts-expect-error -- known issue with params type in next-intl
			router.replace({ pathname, params }, { locale: nextLocale });
		});
	}

	return (
		<div className="flex items-center gap-2 text-sm font-medium">
			<button
				onClick={() => onLocaleChange("fr")}
				disabled={locale === "fr"}
				className={`${
					locale === "fr"
						? "text-[var(--foreground)] font-bold"
						: "text-muted-foreground hover:text-[var(--foreground)]"
				} transition-colors disabled:cursor-default`}
			>
				FR
			</button>
			<span className="text-muted-foreground">|</span>
			<button
				onClick={() => onLocaleChange("en")}
				disabled={locale === "en"}
				className={`${
					locale === "en"
						? "text-[var(--foreground)] font-bold"
						: "text-muted-foreground hover:text-[var(--foreground)]"
				} transition-colors disabled:cursor-default`}
			>
				EN
			</button>
		</div>
	);
}
