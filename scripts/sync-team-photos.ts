#!/usr/bin/env tsx
/**
 * Sync Team Member Photos
 * 
 * This script updates team member photo URLs in the PostgreSQL database
 * using the mapping from team.ts.
 * 
 * Run with: pnpm tsx scripts/sync-team-photos.ts [--dry-run]
 */

import { db, shared, eq } from "@alepanel/db";

const photoMap: Record<string, string> = {
  "gregory-colin": "/assets/Equipe_Alecia/team_member_GC_1_cropped.jpg",
  "serge-de-fay": "/assets/Equipe_Alecia/SF_2.jpg",
  "christophe-berthon": "/assets/Equipe_Alecia/CB_1_-_cropped_-_alt.jpg",
  "louise-pini": "/assets/Equipe_Alecia/LP__2__-_cropped.jpg",
  "martin-egasse": "/assets/Equipe_Alecia/ME_2_-_cropped_-_alt.jpg",
  "tristan-cossec": "/assets/Equipe_Alecia/TC_2.jpg",
  "mickael-furet": "/assets/Equipe_Alecia/MF.jpg",
  "jerome-berthiau": "/assets/Equipe_Alecia/JB_1_-_cropped_-_alt.jpg",
};

async function syncTeamMemberPhotos(dryRun: boolean = false) {
  console.log(dryRun ? "DRY RUN - No changes will be written." : "Starting sync...");
  console.log("Fetching team members from database...");
  const members = await db.query.teamMembers.findMany();

  console.log(`Found ${members.length} team members.`);

  let updated = 0;
  for (const member of members) {
    const photoUrl = photoMap[member.slug];
    if (photoUrl) {
      if (dryRun) {
        console.log(`[DRY RUN] Would update ${member.name} (${member.slug}) with ${photoUrl}`);
      } else {
        await db
          .update(shared.teamMembers)
          .set({
            photoUrl,
            photo: photoUrl,
            updatedAt: new Date(),
          })
          .where(eq(shared.teamMembers.id, member.id));
        console.log(`Updated ${member.name} (${member.slug}) with ${photoUrl}`);
      }
      updated++;
    } else {
      console.log(`No photo mapping for slug: ${member.slug}`);
    }
  }

  console.log(`\n${dryRun ? 'DRY RUN' : 'Sync'} completed. ${dryRun ? 'Would update' : 'Updated'} ${updated} team members.`);
}

const dryRun = process.argv.includes('--dry-run');

syncTeamMemberPhotos(dryRun)
  .then(() => {
    console.log("Done.");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });