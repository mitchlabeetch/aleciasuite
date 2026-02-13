#!/usr/bin/env node

/**
 * Import team member data to Convex
 * This script reads team member data from the backup and imports it to Convex
 */

const fs = require("fs");
const path = require("path");

// Read team members from backup
const teamMembersFile = path.join(
	__dirname,
	"../backups/convex_2026-01-22/extracted/team_members/documents.jsonl",
);
const teamMembersData = fs.readFileSync(teamMembersFile, "utf-8");
const teamMembers = teamMembersData
	.trim()
	.split("\n")
	.map((line) => JSON.parse(line));

// Map photo files to team members based on initials
const photoMapping = {
	"Grégory Colin": "/assets/Equipe_Alecia/team_member_GC_1_cropped.jpg",
	"Christophe Berthon":
		"/assets/Equipe_Alecia/team_member_CB_1_cropped_alt_1080.jpg",
	"Martin Egasse":
		"/assets/Equipe_Alecia/team_member_ME_2_cropped_alt_1080.jpg",
	"Tristan Cossec": "/assets/Equipe_Alecia/team_member_TC_2_1080.jpg",
	"Serge de Faÿ": "/assets/Equipe_Alecia/team_member_SF_2_1080.jpg",
	"Jérôme Berthiau":
		"/assets/Equipe_Alecia/team_member_JB_1_cropped_alt_1080.jpg",
	"Louise Pini": "/assets/Equipe_Alecia/team_member_LP_2_cropped_1080.jpg",
	"Mickael Furet": "/assets/Equipe_Alecia/team_member_MF_1080.jpg",
};

// Output the data with photo URLs
console.log("Team Members with Photos:");
console.log("========================\n");

teamMembers.forEach((member) => {
	const photoUrl = photoMapping[member.name] || "";
	console.log(`Name: ${member.name}`);
	console.log(`Slug: ${member.slug}`);
	console.log(`Photo: ${photoUrl}`);
	console.log(`Bio (FR): ${member.bioFr?.substring(0, 100)}...`);
	console.log(`Transactions: ${member.transactionSlugs?.join(", ")}`);
	console.log("---\n");
});

// Generate Convex mutations
console.log("\n\nConvex Mutations to Run:");
console.log("========================\n");

teamMembers.forEach((member) => {
	const photoUrl = photoMapping[member.name] || "";
	const mutation = {
		slug: member.slug,
		name: member.name,
		role: member.role,
		email: member.email,
		linkedinUrl: member.linkedinUrl,
		photoUrl: photoUrl,
		bioFr: member.bioFr,
		bioEn: member.bioEn,
		quote: member.quote,
		passion: member.passion,
		displayOrder: member.displayOrder,
		isActive: member.isActive,
		transactionSlugs: member.transactionSlugs || [],
		sectorsExpertise: member.sectorsExpertise || [],
	};

	console.log(`// ${member.name}`);
	console.log(
		`await ctx.db.insert("team_members", ${JSON.stringify(mutation, null, 2)});`,
	);
	console.log("");
});
