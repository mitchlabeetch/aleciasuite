import { mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * One-time mutation to update team member photo URLs
 * Run with: npx convex run updateTeamPhotos:updateAllPhotos --prod
 */
export const updateAllPhotos = mutation({
	args: {},
	handler: async (ctx) => {
		const photoMappings = {
			"christophe-berthon":
				"/assets/Equipe_Alecia/team_member_CB_1_cropped_alt_1080.jpg",
			"louise-pini": "/assets/Equipe_Alecia/team_member_LP_2_cropped_1080.jpg",
			"tristan-cossec": "/assets/Equipe_Alecia/team_member_TC_2_1080.jpg",
			"mickael-furet": "/assets/Equipe_Alecia/team_member_MF_1080.jpg",
			"gregory-colin": "/assets/Equipe_Alecia/team_member_GC_1_cropped.jpg",
			"martin-egasse":
				"/assets/Equipe_Alecia/team_member_ME_2_cropped_alt_1080.jpg",
			"serge-de-fay": "/assets/Equipe_Alecia/team_member_SF_2_1080.jpg",
			"jerome-berthiau":
				"/assets/Equipe_Alecia/team_member_JB_1_cropped_alt_1080.jpg",
		};

		const updates = [];

		for (const [slug, photoUrl] of Object.entries(photoMappings)) {
			const member = await ctx.db
				.query("team_members")
				.withIndex("by_slug", (q) => q.eq("slug", slug))
				.first();

			if (member) {
				await ctx.db.patch(member._id, { photoUrl });
				updates.push({ slug, photoUrl, status: "updated" });
			} else {
				updates.push({ slug, photoUrl, status: "not_found" });
			}
		}

		return {
			message: "Team photos updated successfully",
			updates,
		};
	},
});
