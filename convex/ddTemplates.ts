import { v } from "convex/values";
import { internalMutation } from "./_generated/server";

// ============================================
// DEFAULT DUE DILIGENCE CHECKLIST TEMPLATES
// Standard M&A DD categories based on industry best practices
// ============================================

const DD_SECTIONS = {
	LEGAL: "Legal",
	FINANCIAL: "Financial",
	TAX: "Tax",
	HR: "Human Resources",
	IP: "Intellectual Property",
	COMMERCIAL: "Commercial",
	IT: "IT & Technology",
	ENVIRONMENTAL: "Environmental",
	REGULATORY: "Regulatory & Compliance",
};

// Sell-side DD template (preparing for sale)
const SELL_SIDE_TEMPLATE = {
	name: "Sell-Side Due Diligence (Standard)",
	category: "sell_side" as const,
	items: [
		// Legal
		{
			id: "legal-1",
			section: DD_SECTIONS.LEGAL,
			item: "Articles of incorporation and bylaws",
			priority: "critical" as const,
		},
		{
			id: "legal-2",
			section: DD_SECTIONS.LEGAL,
			item: "Shareholder agreements and cap table",
			priority: "critical" as const,
		},
		{
			id: "legal-3",
			section: DD_SECTIONS.LEGAL,
			item: "Board meeting minutes (last 3 years)",
			priority: "important" as const,
		},
		{
			id: "legal-4",
			section: DD_SECTIONS.LEGAL,
			item: "Material contracts list",
			priority: "critical" as const,
		},
		{
			id: "legal-5",
			section: DD_SECTIONS.LEGAL,
			item: "Pending or threatened litigation",
			priority: "critical" as const,
		},
		{
			id: "legal-6",
			section: DD_SECTIONS.LEGAL,
			item: "Insurance policies",
			priority: "important" as const,
		},
		{
			id: "legal-7",
			section: DD_SECTIONS.LEGAL,
			item: "Real estate leases and property documents",
			priority: "important" as const,
		},
		{
			id: "legal-8",
			section: DD_SECTIONS.LEGAL,
			item: "Permits and licenses",
			priority: "important" as const,
		},

		// Financial
		{
			id: "fin-1",
			section: DD_SECTIONS.FINANCIAL,
			item: "Audited financial statements (3 years)",
			priority: "critical" as const,
		},
		{
			id: "fin-2",
			section: DD_SECTIONS.FINANCIAL,
			item: "Monthly management accounts (24 months)",
			priority: "critical" as const,
		},
		{
			id: "fin-3",
			section: DD_SECTIONS.FINANCIAL,
			item: "Current year budget and forecasts",
			priority: "critical" as const,
		},
		{
			id: "fin-4",
			section: DD_SECTIONS.FINANCIAL,
			item: "Revenue breakdown by customer/product",
			priority: "critical" as const,
		},
		{
			id: "fin-5",
			section: DD_SECTIONS.FINANCIAL,
			item: "Accounts receivable aging",
			priority: "important" as const,
		},
		{
			id: "fin-6",
			section: DD_SECTIONS.FINANCIAL,
			item: "Accounts payable aging",
			priority: "important" as const,
		},
		{
			id: "fin-7",
			section: DD_SECTIONS.FINANCIAL,
			item: "Bank statements and credit facilities",
			priority: "important" as const,
		},
		{
			id: "fin-8",
			section: DD_SECTIONS.FINANCIAL,
			item: "Capital expenditure schedule",
			priority: "important" as const,
		},
		{
			id: "fin-9",
			section: DD_SECTIONS.FINANCIAL,
			item: "Working capital analysis",
			priority: "critical" as const,
		},
		{
			id: "fin-10",
			section: DD_SECTIONS.FINANCIAL,
			item: "EBITDA adjustments and normalization",
			priority: "critical" as const,
		},

		// Tax
		{
			id: "tax-1",
			section: DD_SECTIONS.TAX,
			item: "Tax returns (3 years)",
			priority: "critical" as const,
		},
		{
			id: "tax-2",
			section: DD_SECTIONS.TAX,
			item: "Tax audit history and correspondence",
			priority: "important" as const,
		},
		{
			id: "tax-3",
			section: DD_SECTIONS.TAX,
			item: "VAT/sales tax filings",
			priority: "important" as const,
		},
		{
			id: "tax-4",
			section: DD_SECTIONS.TAX,
			item: "Transfer pricing documentation",
			priority: "standard" as const,
		},
		{
			id: "tax-5",
			section: DD_SECTIONS.TAX,
			item: "Tax loss carryforwards",
			priority: "important" as const,
		},

		// HR
		{
			id: "hr-1",
			section: DD_SECTIONS.HR,
			item: "Organization chart",
			priority: "critical" as const,
		},
		{
			id: "hr-2",
			section: DD_SECTIONS.HR,
			item: "Key employee contracts",
			priority: "critical" as const,
		},
		{
			id: "hr-3",
			section: DD_SECTIONS.HR,
			item: "Employee handbook and policies",
			priority: "important" as const,
		},
		{
			id: "hr-4",
			section: DD_SECTIONS.HR,
			item: "Compensation and benefits summary",
			priority: "important" as const,
		},
		{
			id: "hr-5",
			section: DD_SECTIONS.HR,
			item: "Stock option/incentive plans",
			priority: "critical" as const,
		},
		{
			id: "hr-6",
			section: DD_SECTIONS.HR,
			item: "Pending HR disputes or claims",
			priority: "critical" as const,
		},
		{
			id: "hr-7",
			section: DD_SECTIONS.HR,
			item: "Non-compete and confidentiality agreements",
			priority: "important" as const,
		},

		// IP
		{
			id: "ip-1",
			section: DD_SECTIONS.IP,
			item: "Patent portfolio",
			priority: "critical" as const,
		},
		{
			id: "ip-2",
			section: DD_SECTIONS.IP,
			item: "Trademark registrations",
			priority: "important" as const,
		},
		{
			id: "ip-3",
			section: DD_SECTIONS.IP,
			item: "Software licenses (inbound)",
			priority: "important" as const,
		},
		{
			id: "ip-4",
			section: DD_SECTIONS.IP,
			item: "IP assignment agreements",
			priority: "critical" as const,
		},
		{
			id: "ip-5",
			section: DD_SECTIONS.IP,
			item: "Open source software usage",
			priority: "important" as const,
		},

		// Commercial
		{
			id: "com-1",
			section: DD_SECTIONS.COMMERCIAL,
			item: "Top 10 customers analysis",
			priority: "critical" as const,
		},
		{
			id: "com-2",
			section: DD_SECTIONS.COMMERCIAL,
			item: "Customer contracts (material)",
			priority: "critical" as const,
		},
		{
			id: "com-3",
			section: DD_SECTIONS.COMMERCIAL,
			item: "Customer concentration analysis",
			priority: "critical" as const,
		},
		{
			id: "com-4",
			section: DD_SECTIONS.COMMERCIAL,
			item: "Supplier agreements (material)",
			priority: "important" as const,
		},
		{
			id: "com-5",
			section: DD_SECTIONS.COMMERCIAL,
			item: "Sales pipeline and backlog",
			priority: "important" as const,
		},
		{
			id: "com-6",
			section: DD_SECTIONS.COMMERCIAL,
			item: "Marketing materials and strategy",
			priority: "standard" as const,
		},

		// IT
		{
			id: "it-1",
			section: DD_SECTIONS.IT,
			item: "IT infrastructure overview",
			priority: "important" as const,
		},
		{
			id: "it-2",
			section: DD_SECTIONS.IT,
			item: "Software systems inventory",
			priority: "important" as const,
		},
		{
			id: "it-3",
			section: DD_SECTIONS.IT,
			item: "Cybersecurity policies and audits",
			priority: "critical" as const,
		},
		{
			id: "it-4",
			section: DD_SECTIONS.IT,
			item: "Data protection and GDPR compliance",
			priority: "critical" as const,
		},
		{
			id: "it-5",
			section: DD_SECTIONS.IT,
			item: "Disaster recovery plan",
			priority: "important" as const,
		},

		// Environmental
		{
			id: "env-1",
			section: DD_SECTIONS.ENVIRONMENTAL,
			item: "Environmental permits",
			priority: "important" as const,
		},
		{
			id: "env-2",
			section: DD_SECTIONS.ENVIRONMENTAL,
			item: "Environmental audits/assessments",
			priority: "important" as const,
		},
		{
			id: "env-3",
			section: DD_SECTIONS.ENVIRONMENTAL,
			item: "Hazardous materials handling",
			priority: "standard" as const,
		},
	],
};

// Buy-side DD template (acquiring a company)
const BUY_SIDE_TEMPLATE = {
	name: "Buy-Side Due Diligence (Comprehensive)",
	category: "buy_side" as const,
	items: [
		// All sell-side items plus additional buyer-focused items
		...SELL_SIDE_TEMPLATE.items,

		// Additional buyer-specific items
		{
			id: "buy-1",
			section: DD_SECTIONS.LEGAL,
			item: "Change of control provisions in contracts",
			priority: "critical" as const,
		},
		{
			id: "buy-2",
			section: DD_SECTIONS.LEGAL,
			item: "Anti-bribery and corruption compliance",
			priority: "important" as const,
		},
		{
			id: "buy-3",
			section: DD_SECTIONS.LEGAL,
			item: "Related party transactions",
			priority: "critical" as const,
		},

		{
			id: "buy-4",
			section: DD_SECTIONS.FINANCIAL,
			item: "Quality of earnings analysis",
			priority: "critical" as const,
		},
		{
			id: "buy-5",
			section: DD_SECTIONS.FINANCIAL,
			item: "Net debt confirmation",
			priority: "critical" as const,
		},
		{
			id: "buy-6",
			section: DD_SECTIONS.FINANCIAL,
			item: "Synergy validation",
			priority: "important" as const,
		},

		{
			id: "buy-7",
			section: DD_SECTIONS.HR,
			item: "Management team assessment",
			priority: "critical" as const,
		},
		{
			id: "buy-8",
			section: DD_SECTIONS.HR,
			item: "Key person dependency analysis",
			priority: "critical" as const,
		},
		{
			id: "buy-9",
			section: DD_SECTIONS.HR,
			item: "Retention planning",
			priority: "important" as const,
		},

		{
			id: "buy-10",
			section: DD_SECTIONS.COMMERCIAL,
			item: "Competitive landscape analysis",
			priority: "important" as const,
		},
		{
			id: "buy-11",
			section: DD_SECTIONS.COMMERCIAL,
			item: "Market position validation",
			priority: "important" as const,
		},
		{
			id: "buy-12",
			section: DD_SECTIONS.COMMERCIAL,
			item: "Customer reference calls",
			priority: "important" as const,
		},

		{
			id: "buy-13",
			section: DD_SECTIONS.REGULATORY,
			item: "Antitrust/competition filing requirements",
			priority: "critical" as const,
		},
		{
			id: "buy-14",
			section: DD_SECTIONS.REGULATORY,
			item: "Foreign investment review",
			priority: "important" as const,
		},
		{
			id: "buy-15",
			section: DD_SECTIONS.REGULATORY,
			item: "Sector-specific regulatory approvals",
			priority: "important" as const,
		},
	],
};

// Merger DD template
const MERGER_TEMPLATE = {
	name: "Merger Due Diligence",
	category: "merger" as const,
	items: [
		...BUY_SIDE_TEMPLATE.items,

		// Merger-specific items
		{
			id: "merger-1",
			section: DD_SECTIONS.LEGAL,
			item: "Mutual NDA and confidentiality terms",
			priority: "critical" as const,
		},
		{
			id: "merger-2",
			section: DD_SECTIONS.LEGAL,
			item: "Merger agreement terms",
			priority: "critical" as const,
		},

		{
			id: "merger-3",
			section: DD_SECTIONS.FINANCIAL,
			item: "Combined entity pro forma financials",
			priority: "critical" as const,
		},
		{
			id: "merger-4",
			section: DD_SECTIONS.FINANCIAL,
			item: "Integration cost estimates",
			priority: "critical" as const,
		},

		{
			id: "merger-5",
			section: DD_SECTIONS.HR,
			item: "Cultural assessment",
			priority: "important" as const,
		},
		{
			id: "merger-6",
			section: DD_SECTIONS.HR,
			item: "Organizational integration plan",
			priority: "important" as const,
		},
		{
			id: "merger-7",
			section: DD_SECTIONS.HR,
			item: "Redundancy analysis",
			priority: "important" as const,
		},

		{
			id: "merger-8",
			section: DD_SECTIONS.IT,
			item: "Systems integration assessment",
			priority: "important" as const,
		},
		{
			id: "merger-9",
			section: DD_SECTIONS.IT,
			item: "Data migration plan",
			priority: "important" as const,
		},
	],
};

// Seed function to create default templates
export const seedDefaultTemplates = internalMutation({
	args: {
		userId: v.id("users"),
	},
	handler: async (ctx, args) => {
		// Check if templates already exist
		const existing = await ctx.db
			.query("dd_checklist_templates")
			.withIndex("by_isDefault", (q) => q.eq("isDefault", true))
			.collect();

		if (existing.length > 0) {
			return {
				message: "Default templates already exist",
				count: existing.length,
			};
		}

		// Create templates
		const templates = [SELL_SIDE_TEMPLATE, BUY_SIDE_TEMPLATE, MERGER_TEMPLATE];
		const createdIds = [];

		for (const template of templates) {
			const id = await ctx.db.insert("dd_checklist_templates", {
				name: template.name,
				category: template.category,
				items: template.items,
				createdBy: args.userId,
				isDefault: true,
				createdAt: Date.now(),
			});
			createdIds.push(id);
		}

		return {
			message: "Created default templates",
			count: createdIds.length,
			ids: createdIds,
		};
	},
});

// Public mutation to seed templates (for admin use)
export const initializeDefaultTemplates = internalMutation({
	args: {},
	handler: async (ctx) => {
		// Get any admin user
		const adminUser = await ctx.db
			.query("users")
			.filter((q) => q.eq(q.field("role"), "sudo"))
			.first();

		if (!adminUser) {
			// Get any user as fallback
			const anyUser = await ctx.db.query("users").first();
			if (!anyUser) {
				return { error: "No users found to create templates" };
			}

			// Check if templates already exist
			const existing = await ctx.db
				.query("dd_checklist_templates")
				.withIndex("by_isDefault", (q) => q.eq("isDefault", true))
				.collect();

			if (existing.length > 0) {
				return {
					message: "Default templates already exist",
					count: existing.length,
				};
			}

			// Create templates
			const templates = [
				SELL_SIDE_TEMPLATE,
				BUY_SIDE_TEMPLATE,
				MERGER_TEMPLATE,
			];
			const createdIds = [];

			for (const template of templates) {
				const id = await ctx.db.insert("dd_checklist_templates", {
					name: template.name,
					category: template.category,
					items: template.items,
					createdBy: anyUser._id,
					isDefault: true,
					createdAt: Date.now(),
				});
				createdIds.push(id);
			}

			return { message: "Created default templates", count: createdIds.length };
		}

		// Check if templates already exist
		const existing = await ctx.db
			.query("dd_checklist_templates")
			.withIndex("by_isDefault", (q) => q.eq("isDefault", true))
			.collect();

		if (existing.length > 0) {
			return {
				message: "Default templates already exist",
				count: existing.length,
			};
		}

		// Create templates
		const templates = [SELL_SIDE_TEMPLATE, BUY_SIDE_TEMPLATE, MERGER_TEMPLATE];
		const createdIds = [];

		for (const template of templates) {
			const id = await ctx.db.insert("dd_checklist_templates", {
				name: template.name,
				category: template.category,
				items: template.items,
				createdBy: adminUser._id,
				isDefault: true,
				createdAt: Date.now(),
			});
			createdIds.push(id);
		}

		return { message: "Created default templates", count: createdIds.length };
	},
});
