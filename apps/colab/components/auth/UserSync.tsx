"use client";

// UserSync is no longer needed — BetterAuth handles user sessions via cookies,
// and user data is stored in PostgreSQL (shared.users table).
export function UserSync() {
	return null;
}

// Keep default export for compatibility
export default UserSync;
