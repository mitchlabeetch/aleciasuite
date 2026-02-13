/**
 * Catch-all Route for 404 Pages
 *
 * This catches all unmatched routes within the [locale] segment.
 * Instead of using notFound() which triggers SSG issues, we redirect
 * to the Pages Router 404 page directly.
 */
import { redirect } from "next/navigation";

// Force dynamic to prevent SSG issues
export const dynamic = "force-dynamic";

export default function CatchAllPage() {
	// Redirect to root which will show 404
	redirect("/404");
}
