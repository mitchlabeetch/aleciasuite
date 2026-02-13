import { ReactNode } from "react";

/**
 * Sign-in page layout - bypasses admin auth check
 */
export default function SignInLayout({ children }: { children: ReactNode }) {
	return children;
}
