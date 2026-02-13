/**
 * Due Diligence Templates Server Actions
 *
 * Pre-built DD checklist templates for different M&A scenarios.
 * Templates can be used to quickly create checklists for new deals.
 *
 * Note: The Convex version stored templates in the database.
 * For simplicity, we'll provide default templates as constants here,
 * but you could also store them in the database if needed.
 */

"use server";

import { getAuthenticatedUser } from "./lib/auth";
import { createChecklist, addItem } from "./dd-checklists";

// ============================================
// TYPES
// ============================================

export interface DDTemplateItem {
  label: string;
  category: string;
  priority: "critical" | "important" | "standard";
  notes?: string;
}

export interface DDTemplate {
  name: string;
  category: "legal" | "financial" | "tax" | "hr" | "ip" | "commercial" | "it" | "environmental" | "regulatory" | "other";
  description: string;
  items: DDTemplateItem[];
}

// ============================================
// DEFAULT TEMPLATES
// ============================================

const LEGAL_TEMPLATE: DDTemplate = {
  name: "Legal Due Diligence",
  category: "legal",
  description: "Standard legal DD checklist for M&A transactions",
  items: [
    {
      label: "Articles of incorporation and bylaws",
      category: "Corporate",
      priority: "critical",
    },
    {
      label: "Shareholder agreements and cap table",
      category: "Corporate",
      priority: "critical",
    },
    {
      label: "Board meeting minutes (last 3 years)",
      category: "Corporate",
      priority: "important",
    },
    {
      label: "Material contracts list",
      category: "Contracts",
      priority: "critical",
    },
    {
      label: "Pending or threatened litigation",
      category: "Litigation",
      priority: "critical",
    },
    {
      label: "Insurance policies",
      category: "Insurance",
      priority: "important",
    },
    {
      label: "Real estate leases and property documents",
      category: "Real Estate",
      priority: "important",
    },
    {
      label: "Permits and licenses",
      category: "Regulatory",
      priority: "important",
    },
  ],
};

const FINANCIAL_TEMPLATE: DDTemplate = {
  name: "Financial Due Diligence",
  category: "financial",
  description: "Comprehensive financial DD checklist",
  items: [
    {
      label: "Audited financial statements (3 years)",
      category: "Financials",
      priority: "critical",
    },
    {
      label: "Monthly management accounts (24 months)",
      category: "Financials",
      priority: "critical",
    },
    {
      label: "Current year budget and forecasts",
      category: "Planning",
      priority: "critical",
    },
    {
      label: "Revenue breakdown by customer/product",
      category: "Revenue",
      priority: "critical",
    },
    {
      label: "Accounts receivable aging",
      category: "Working Capital",
      priority: "important",
    },
    {
      label: "Accounts payable aging",
      category: "Working Capital",
      priority: "important",
    },
    {
      label: "Bank statements and credit facilities",
      category: "Debt",
      priority: "important",
    },
    {
      label: "Capital expenditure schedule",
      category: "CapEx",
      priority: "important",
    },
    {
      label: "Working capital analysis",
      category: "Working Capital",
      priority: "critical",
    },
    {
      label: "EBITDA adjustments and normalization",
      category: "Profitability",
      priority: "critical",
    },
  ],
};

const TAX_TEMPLATE: DDTemplate = {
  name: "Tax Due Diligence",
  category: "tax",
  description: "Tax compliance and planning checklist",
  items: [
    {
      label: "Tax returns (3 years)",
      category: "Returns",
      priority: "critical",
    },
    {
      label: "Tax audit history and correspondence",
      category: "Compliance",
      priority: "important",
    },
    {
      label: "VAT/sales tax filings",
      category: "Returns",
      priority: "important",
    },
    {
      label: "Transfer pricing documentation",
      category: "International",
      priority: "standard",
    },
    {
      label: "Tax loss carryforwards",
      category: "Planning",
      priority: "important",
    },
  ],
};

const HR_TEMPLATE: DDTemplate = {
  name: "HR Due Diligence",
  category: "hr",
  description: "Human resources and employment DD checklist",
  items: [
    {
      label: "Organization chart",
      category: "Structure",
      priority: "critical",
    },
    {
      label: "Key employee contracts",
      category: "Contracts",
      priority: "critical",
    },
    {
      label: "Employee handbook and policies",
      category: "Policies",
      priority: "important",
    },
    {
      label: "Compensation and benefits summary",
      category: "Compensation",
      priority: "important",
    },
    {
      label: "Stock option/incentive plans",
      category: "Equity",
      priority: "critical",
    },
    {
      label: "Pending HR disputes or claims",
      category: "Litigation",
      priority: "critical",
    },
    {
      label: "Non-compete and confidentiality agreements",
      category: "Contracts",
      priority: "important",
    },
  ],
};

const IP_TEMPLATE: DDTemplate = {
  name: "IP Due Diligence",
  category: "ip",
  description: "Intellectual property checklist",
  items: [
    {
      label: "Patent portfolio",
      category: "Patents",
      priority: "critical",
    },
    {
      label: "Trademark registrations",
      category: "Trademarks",
      priority: "important",
    },
    {
      label: "Software licenses (inbound)",
      category: "Software",
      priority: "important",
    },
    {
      label: "IP assignment agreements",
      category: "Ownership",
      priority: "critical",
    },
    {
      label: "Open source software usage",
      category: "Software",
      priority: "important",
    },
  ],
};

const COMMERCIAL_TEMPLATE: DDTemplate = {
  name: "Commercial Due Diligence",
  category: "commercial",
  description: "Market and customer analysis checklist",
  items: [
    {
      label: "Top 10 customers analysis",
      category: "Customers",
      priority: "critical",
    },
    {
      label: "Customer contracts (material)",
      category: "Contracts",
      priority: "critical",
    },
    {
      label: "Customer concentration analysis",
      category: "Risk",
      priority: "critical",
    },
    {
      label: "Supplier agreements (material)",
      category: "Suppliers",
      priority: "important",
    },
    {
      label: "Sales pipeline and backlog",
      category: "Sales",
      priority: "important",
    },
    {
      label: "Marketing materials and strategy",
      category: "Marketing",
      priority: "standard",
    },
  ],
};

const IT_TEMPLATE: DDTemplate = {
  name: "IT Due Diligence",
  category: "it",
  description: "Technology and systems checklist",
  items: [
    {
      label: "IT infrastructure overview",
      category: "Infrastructure",
      priority: "important",
    },
    {
      label: "Software systems inventory",
      category: "Systems",
      priority: "important",
    },
    {
      label: "Cybersecurity policies and audits",
      category: "Security",
      priority: "critical",
    },
    {
      label: "Data protection and GDPR compliance",
      category: "Compliance",
      priority: "critical",
    },
    {
      label: "Disaster recovery plan",
      category: "BCP",
      priority: "important",
    },
  ],
};

const ENVIRONMENTAL_TEMPLATE: DDTemplate = {
  name: "Environmental Due Diligence",
  category: "environmental",
  description: "Environmental compliance checklist",
  items: [
    {
      label: "Environmental permits",
      category: "Permits",
      priority: "important",
    },
    {
      label: "Environmental audits/assessments",
      category: "Audits",
      priority: "important",
    },
    {
      label: "Hazardous materials handling",
      category: "Safety",
      priority: "standard",
    },
  ],
};

const REGULATORY_TEMPLATE: DDTemplate = {
  name: "Regulatory Due Diligence",
  category: "regulatory",
  description: "Regulatory and compliance checklist",
  items: [
    {
      label: "Antitrust/competition filing requirements",
      category: "Antitrust",
      priority: "critical",
    },
    {
      label: "Foreign investment review",
      category: "FDI",
      priority: "important",
    },
    {
      label: "Sector-specific regulatory approvals",
      category: "Industry",
      priority: "important",
    },
  ],
};

const ALL_TEMPLATES = [
  LEGAL_TEMPLATE,
  FINANCIAL_TEMPLATE,
  TAX_TEMPLATE,
  HR_TEMPLATE,
  IP_TEMPLATE,
  COMMERCIAL_TEMPLATE,
  IT_TEMPLATE,
  ENVIRONMENTAL_TEMPLATE,
  REGULATORY_TEMPLATE,
];

// ============================================
// TEMPLATE FUNCTIONS
// ============================================

/**
 * Get all available DD templates
 */
export async function listTemplates() {
  // For now, return static templates
  // If you want database-stored templates, query from numbers.ddTemplates
  return ALL_TEMPLATES;
}

/**
 * Get a specific template by category
 */
export async function getTemplate(
  category: DDTemplate["category"]
): Promise<DDTemplate | null> {
  const template = ALL_TEMPLATES.find((t) => t.category === category);
  return template || null;
}

/**
 * Create a checklist from a template
 */
export async function createChecklistFromTemplate(
  dealId: string,
  templateCategory: DDTemplate["category"],
  checklistName?: string
) {
  const user = await getAuthenticatedUser();

  const template = await getTemplate(templateCategory);
  if (!template) {
    throw new Error("Template not found");
  }

  // Create the checklist
  const checklist = await createChecklist({
    dealId,
    name: checklistName || template.name,
    category: template.category,
  });

  // Add all items from the template
  for (let i = 0; i < template.items.length; i++) {
    const templateItem = template.items[i];
    await addItem({
      checklistId: checklist.id,
      label: templateItem.label,
      notes: templateItem.notes || `Category: ${templateItem.category} | Priority: ${templateItem.priority}`,
      sortOrder: i,
    });
  }

  return checklist;
}

/**
 * Create all standard DD checklists for a deal
 */
export async function createStandardDDPackage(dealId: string) {
  const user = await getAuthenticatedUser();

  const createdChecklists = [];

  // Create the most common DD checklists
  const standardCategories: DDTemplate["category"][] = [
    "legal",
    "financial",
    "tax",
    "hr",
    "commercial",
  ];

  for (const category of standardCategories) {
    const checklist = await createChecklistFromTemplate(dealId, category);
    createdChecklists.push(checklist);
  }

  return createdChecklists;
}

/**
 * Get template by name (case-insensitive search)
 */
export async function findTemplateByName(name: string) {
  const normalized = name.toLowerCase();
  const template = ALL_TEMPLATES.find((t) =>
    t.name.toLowerCase().includes(normalized)
  );
  return template || null;
}

/**
 * Get template item count
 */
export async function getTemplateStats() {
  const stats = ALL_TEMPLATES.map((template) => ({
    name: template.name,
    category: template.category,
    itemCount: template.items.length,
    criticalItems: template.items.filter((i) => i.priority === "critical")
      .length,
    importantItems: template.items.filter((i) => i.priority === "important")
      .length,
    standardItems: template.items.filter((i) => i.priority === "standard")
      .length,
  }));

  return stats;
}
