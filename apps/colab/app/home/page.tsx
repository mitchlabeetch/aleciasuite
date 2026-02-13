import nextDynamic from "next/dynamic";

// Force this page to be dynamic (not pre-rendered)
export const dynamic = "force-dynamic";

// Dynamic import the client home page
const ClientHomePage = nextDynamic(() => import("./ClientHomePage"), {
	loading: () => (
		<div className="flex min-h-screen items-center justify-center">
			<div className="animate-pulse text-lg">Chargement...</div>
		</div>
	),
});

export default function HomePage() {
	return <ClientHomePage />;
}
