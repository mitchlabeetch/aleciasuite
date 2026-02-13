"use client";

import type { ReactNode } from "react";

// Convex has been replaced by PostgreSQL + Drizzle ORM server actions.
// This component is kept temporarily for compatibility but does nothing.
export function ConvexClientProvider({ children }: { children: ReactNode }) {
	return <>{children}</>;
}
