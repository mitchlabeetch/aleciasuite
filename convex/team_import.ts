import { mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Upsert team member (insert or update by slug)
 * This is used to import team member data from backups
 */
export const upsertTeamMember = mutation({
	args: {
		slug: v.string(),
		name: v.string(),
		role: v.string(),
		email: v.string(),
		linkedinUrl: v.string(),
		photoUrl: v.optional(v.string()),
		bioFr: v.optional(v.string()),
		bioEn: v.optional(v.string()),
		displayOrder: v.number(),
		isActive: v.boolean(),
		transactionSlugs: v.optional(v.array(v.string())),
		sectorsExpertise: v.optional(v.array(v.string())),
	},
	handler: async (ctx, args) => {
		// Check if member already exists
		const existing = await ctx.db
			.query("team_members")
			.withIndex("by_slug", (q) => q.eq("slug", args.slug))
			.first();

		if (existing) {
			// Update existing member
			await ctx.db.patch(existing._id, {
				name: args.name,
				role: args.role,
				email: args.email,
				linkedinUrl: args.linkedinUrl,
				photoUrl: args.photoUrl,
				photo: args.photoUrl, // Also set photo for backward compatibility
				bioFr: args.bioFr,
				bioEn: args.bioEn,
				displayOrder: args.displayOrder,
				isActive: args.isActive,
				transactionSlugs: args.transactionSlugs || [],
				sectorsExpertise: args.sectorsExpertise || [],
			});
			return { _id: existing._id, action: "updated" };
		} else {
			// Insert new member
			const _id = await ctx.db.insert("team_members", {
				slug: args.slug,
				name: args.name,
				role: args.role,
				email: args.email,
				linkedinUrl: args.linkedinUrl,
				photoUrl: args.photoUrl,
				photo: args.photoUrl, // Also set photo for backward compatibility
				bioFr: args.bioFr,
				bioEn: args.bioEn,
				displayOrder: args.displayOrder,
				isActive: args.isActive,
				transactionSlugs: args.transactionSlugs || [],
				sectorsExpertise: args.sectorsExpertise || [],
			});
			return { _id, action: "inserted" };
		}
	},
});

/**
 * Update all team member photos based on slug
 */
export const updatePhotos = mutation({
	args: {},
	handler: async (ctx) => {
		const photoMap: Record<string, string> = {
			"gregory-colin": "/assets/Equipe_Alecia/team_member_GC_1_cropped.jpg",
			"serge-de-fay": "/assets/Equipe_Alecia/team_member_SF_2_1080.jpg",
			"christophe-berthon":
				"/assets/Equipe_Alecia/team_member_CB_1_cropped_alt_1080.jpg",
			"louise-pini": "/assets/Equipe_Alecia/team_member_LP_2_cropped_1080.jpg",
			"martin-egasse":
				"/assets/Equipe_Alecia/team_member_ME_2_cropped_alt_1080.jpg",
			"tristan-cossec": "/assets/Equipe_Alecia/team_member_TC_2_1080.jpg",
			"mickael-furet": "/assets/Equipe_Alecia/team_member_MF_1080.jpg",
			"jerome-berthiau":
				"/assets/Equipe_Alecia/team_member_JB_1_cropped_alt_1080.jpg",
		};

		const members = await ctx.db.query("team_members").collect();
		let updated = 0;

		for (const member of members) {
			const photoUrl = photoMap[member.slug];
			if (photoUrl) {
				await ctx.db.patch(member._id, {
					photoUrl,
					photo: photoUrl,
				});
				updated++;
			}
		}

		return { updated, total: members.length };
	},
});
