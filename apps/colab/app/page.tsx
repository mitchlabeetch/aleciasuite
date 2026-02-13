import { redirect } from "next/navigation";

// Force this page to be dynamic (not pre-rendered)
export const dynamic = "force-dynamic";

export default function Page() {
	// Root colab domain redirects to website admin
	// Only the website (alecia.markets) should be on the root domain
	const websiteAdminUrl = process.env.NEXT_PUBLIC_ALECIA_MARKETING_URL
		? `${process.env.NEXT_PUBLIC_ALECIA_MARKETING_URL}/admin/colab`
		: "https://alecia.markets/admin/colab";

	redirect(websiteAdminUrl);
}
