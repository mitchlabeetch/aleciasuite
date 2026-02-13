import { mutation } from "./_generated/server";

export const initialSetup = mutation({
	args: {},
	handler: async (ctx) => {
		// 1. Initialize Global Settings if missing
		const settings = await ctx.db.query("global_settings").first();
		if (!settings) {
			await ctx.db.insert("global_settings", {
				theme: {
					primaryColor: "222.2 47.4% 11.2%",
					radius: 0.5,
					font: "Inter",
				},
				governance: {
					quorumPercentage: 50,
				},
			});
			console.log("Global settings initialized.");
		} else {
			console.log("Global settings already exist.");
		}
	},
});

export const bootstrapSudo = mutation({
	args: {},
	handler: async (ctx) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) throw new Error("Unauthorized: Please log in first.");

		// Check if ANY sudo user exists
		const existingSudo = await ctx.db
			.query("users")
			.filter((q) => q.eq(q.field("role"), "sudo"))
			.first();

		if (existingSudo) {
			throw new Error("Bootstrap failed: A Sudo admin already exists.");
		}

		// Check if the current user record exists (Clerk sync should handle this,
		// but if we are manually bootstrapping, we might need to find/create)
		const user = await ctx.db
			.query("users")
			.withIndex("by_token", (q) =>
				q.eq("tokenIdentifier", identity.tokenIdentifier),
			)
			.first();

		if (!user) {
			// Auto-create user record if it doesn't exist yet (first login scenario)
			const newUserId = await ctx.db.insert("users", {
				tokenIdentifier: identity.tokenIdentifier,
				name: identity.name || identity.email || "Unknown",
				email: identity.email || "",
				avatarUrl: identity.pictureUrl,
				role: "sudo", // PROMOTE TO SUDO
			});
			console.log(`User ${newUserId} created and promoted to Sudo.`);
		} else {
			// Promote existing user
			await ctx.db.patch(user._id, { role: "sudo" });
			console.log(`User ${user._id} promoted to Sudo.`);
		}
	},
});

export const seedTeam = mutation({
	args: {},
	handler: async (ctx) => {
		// List of core team members to auto-promote if found
		const TEAM = [
			{ email: "christophe.berthon@alecia.fr", role: "sudo" as const },
			{ email: "micou@alecia.fr", role: "sudo" as const }, // Dev
		];

		for (const member of TEAM) {
			const user = await ctx.db
				.query("users")
				.withIndex("by_email", (q) => q.eq("email", member.email))
				.first();

			if (user) {
				if (user.role !== member.role) {
					await ctx.db.patch(user._id, { role: member.role });
					console.log(`Updated ${member.email} to ${member.role}`);
				} else {
					console.log(`${member.email} is already ${member.role}`);
				}
			} else {
				console.log(
					`Skipping ${member.email} - User not found (Wait for sign-up)`,
				);
			}
		}
	},
});

export const seedV3Data = mutation({
	args: {},
	handler: async (ctx) => {
		// 1. UPDATE TEAM MEMBERS (Passions & Quotes)
		const teamUpdates = [
			{ slug: "christophe-berthon" },
			{ slug: "rodolphe-besson" },
			{ slug: "stephane-villard" },
			{ slug: "thibault-richet" },
			{ slug: "gregoire-toulouse" },
			{ slug: "guillaume-farges" },
			{ slug: "antoine-khouzami" },
			{ slug: "clement-morisot" },
		];

		for (const update of teamUpdates) {
			const member = await ctx.db
				.query("team_members")
				.withIndex("by_slug", (q) => q.eq("slug", update.slug))
				.first();

			if (member) {
				// Member exists - no updates needed for passion/quote
				console.log(`Team member found: ${update.slug}`);
			} else {
				console.log(`Team member not found: ${update.slug}`);
			}
		}

		// 2. TAG TRANSACTIONS AS CASE STUDIES
		const sectors = ["Industrie", "TMT", "Agroalimentaire", "Santé"];

		for (const sectorName of sectors) {
			const deal = await ctx.db
				.query("transactions")
				.withIndex("by_sector", (q) => q.eq("sector", sectorName))
				.first();

			if (deal) {
				await ctx.db.patch(deal._id, { isCaseStudy: true });
				console.log(
					`Marked deal as Case Study: ${deal.clientName} (${sectorName})`,
				);
			}
		}
	},
});
