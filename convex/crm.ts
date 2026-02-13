import { query, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import { getOptionalUser } from "./auth_utils";
import { Id, Doc } from "./_generated/dataModel";

// Get all companies with their details
export const getCompanies = query({
	args: {},
	handler: async (ctx) => {
		const user = await getOptionalUser(ctx);
		if (!user) return []; // Not authenticated
		const companies = await ctx.db.query("companies").collect();
		return companies;
	},
});

// Get all contacts, optionally filtering or enriching
export const getContacts = query({
	args: {},
	handler: async (ctx) => {
		const user = await getOptionalUser(ctx);
		if (!user) return []; // Not authenticated
		const contacts = await ctx.db.query("contacts").collect();

		// Bolt Optimization: Batch fetch companies to prevent N+1 queries
		// 1. Collect unique company IDs (filter out undefined)
		const uniqueCompanyIds = [
			...new Set(
				contacts
					.map((c) => c.companyId)
					.filter((id): id is Id<"companies"> => id !== undefined),
			),
		];

		// 2. Fetch all companies in parallel (once per company)
		const companies = await Promise.all(
			uniqueCompanyIds.map((id) => ctx.db.get(id)),
		);

		// 3. Create a lookup map
		const companiesMap = new Map(
			uniqueCompanyIds.map((id, index) => [id, companies[index]]),
		);

		// 4. Enrich contacts using the map
		const enriched = contacts.map((c) => {
			const company = c.companyId ? companiesMap.get(c.companyId) : null;
			return {
				...c,
				companyName: company?.name || "Unknown Company",
				companyLogo: company?.logoUrl,
			};
		});

		return enriched;
	},
});

export const getContact = internalQuery({
	args: { contactId: v.id("contacts") },
	handler: async (ctx, args) => {
		const contact = await ctx.db.get(args.contactId);
		if (!contact) return null;

		const company = contact.companyId
			? await ctx.db.get(contact.companyId)
			: null;
		return { ...contact, companyName: company?.name };
	},
});
