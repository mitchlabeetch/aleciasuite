/**
 * Fix Grégory Colin Photo
 * 
 * This script updates the team_members record for Grégory Colin
 * to use the correct photo URL.
 * 
 * Run with: npx convex run scripts/fix-gregory-photo
 */

import { mutation } from "../convex/_generated/server";
import { v } from "convex/values";

// This is a one-time fix mutation
export const fixGregoryPhoto = mutation({
  args: {},
  handler: async (ctx) => {
    // Find Grégory Colin by slug
    const member = await ctx.db
      .query("team_members")
      .withIndex("by_slug", (q) => q.eq("slug", "gregory-colin"))
      .first();
    
    if (!member) {
      throw new Error("Grégory Colin not found in team_members");
    }
    
    // Update with correct photo URL
    await ctx.db.patch(member._id, {
      photo: "/assets/Equipe_Alecia/team_member_GC_1_cropped.jpg",
      photoUrl: "/assets/Equipe_Alecia/team_member_GC_1_cropped.jpg",
    });
    
    return { success: true, memberId: member._id };
  },
});
