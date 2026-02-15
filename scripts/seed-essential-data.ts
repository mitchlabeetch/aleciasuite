import { Pool } from "pg";

const pool = new Pool({
  host: process.env.PG_HOST || "alecia-postgres",
  port: 5432,
  database: process.env.PG_DATABASE || "alecia",
  user: process.env.PG_USER || "alecia",
  password: process.env.POSTGRES_PASSWORD,
});

// Team members from scripts/import-team-data.js
const teamMembers = [
  {
    slug: "gregory-colin",
    name: "Grégory Colin",
    role: "Managing Partner",
    bioFr: "Diplômé de l'ESCP Europe et titulaire d'un Master en Finance, Grégory a débuté sa carrière chez Lazard avant de rejoindre un family office où il a structuré de nombreuses opérations de M&A.",
    bioEn: "Graduate of ESCP Europe with a Master in Finance, Grégory began his career at Lazard before joining a family office where he structured numerous M&A transactions.",
    linkedinUrl: "https://www.linkedin.com/in/gregorycolin",
    email: "gregory.colin@alecia.fr",
    sectorsExpertise: ["Technology", "Services", "Industry"],
    transactionSlugs: [],
    isActive: true,
    displayOrder: 1,
  },
  {
    slug: "christophe-berthon",
    name: "Christophe Berthon",
    role: "Partner",
    bioFr: "Fort de 20 ans d'expérience en conseil M&A, Christophe a accompagné des dizaines d'entreprises dans leurs projets de croissance externe et de transmission.",
    bioEn: "With 20 years of experience in M&A advisory, Christophe has supported dozens of companies in their external growth and succession projects.",
    linkedinUrl: "https://www.linkedin.com/in/christopheberthon",
    email: "christophe.berthon@alecia.fr",
    sectorsExpertise: ["Healthcare", "Retail", "Services"],
    transactionSlugs: [],
    isActive: true,
    displayOrder: 2,
  },
  {
    slug: "martin-egasse",
    name: "Martin Egasse",
    role: "Partner",
    bioFr: "Martin est spécialisé dans les opérations de fusion-acquisition et les levées de fonds dans le secteur technologique.",
    bioEn: "Martin specializes in M&A transactions and fundraising in the technology sector.",
    linkedinUrl: "https://www.linkedin.com/in/martinegasse",
    email: "martin.egasse@alecia.fr",
    sectorsExpertise: ["Technology", "Software", "Digital"],
    transactionSlugs: [],
    isActive: true,
    displayOrder: 3,
  },
  {
    slug: "tristan-cossec",
    name: "Tristan Cossec",
    role: "Senior Advisor",
    bioFr: "Tristan conseille les dirigeants dans la structuration et l'exécution de leurs opérations stratégiques.",
    bioEn: "Tristan advises executives in structuring and executing their strategic transactions.",
    linkedinUrl: "https://www.linkedin.com/in/tristancossec",
    email: "tristan.cossec@alecia.fr",
    sectorsExpertise: ["Industry", "Manufacturing", "B2B"],
    transactionSlugs: [],
    isActive: true,
    displayOrder: 4,
  },
  {
    slug: "serge-de-fay",
    name: "Serge de Faÿ",
    role: "Senior Advisor",
    bioFr: "Expert en valorisation d'entreprises, Serge apporte son expertise dans les opérations complexes.",
    bioEn: "Expert in business valuation, Serge brings his expertise to complex transactions.",
    linkedinUrl: "https://www.linkedin.com/in/sergedefay",
    email: "serge.defay@alecia.fr",
    sectorsExpertise: ["Finance", "Real Estate", "Investment"],
    transactionSlugs: [],
    isActive: true,
    displayOrder: 5,
  },
  {
    slug: "jerome-berthiau",
    name: "Jérôme Berthiau",
    role: "Advisor",
    bioFr: "Jérôme accompagne les PME dans leurs projets de croissance et de transmission.",
    bioEn: "Jérôme supports SMEs in their growth and succession projects.",
    linkedinUrl: "https://www.linkedin.com/in/jeromeberthiau",
    email: "jerome.berthiau@alecia.fr",
    sectorsExpertise: ["SME", "Services", "Commerce"],
    transactionSlugs: [],
    isActive: true,
    displayOrder: 6,
  },
  {
    slug: "louise-pini",
    name: "Louise Pini",
    role: "Analyst",
    bioFr: "Louise réalise les analyses financières et participe à l'ensemble des missions du cabinet.",
    bioEn: "Louise performs financial analyses and participates in all the firm's engagements.",
    linkedinUrl: "https://www.linkedin.com/in/louisepini",
    email: "louise.pini@alecia.fr",
    sectorsExpertise: ["Financial Analysis", "Valuation", "Due Diligence"],
    transactionSlugs: [],
    isActive: true,
    displayOrder: 7,
  },
  {
    slug: "mickael-furet",
    name: "Mickael Furet",
    role: "Analyst",
    bioFr: "Mickael contribue aux analyses sectorielles et à la préparation des dossiers clients.",
    bioEn: "Mickael contributes to sector analyses and client file preparation.",
    linkedinUrl: "https://www.linkedin.com/in/mickaelfuret",
    email: "mickael.furet@alecia.fr",
    sectorsExpertise: ["Market Research", "Financial Modeling", "Reporting"],
    transactionSlugs: [],
    isActive: true,
    displayOrder: 8,
  },
];

// Marketing KPIs
const kpis = [
  { label: "Transactions réalisées", value: "+50", icon: "briefcase", order: 0 },
  { label: "Associés", value: "12", icon: "users", order: 1 },
  { label: "Volumes gérés", value: "€2Mds+", icon: "trending-up", order: 2 },
  { label: "Bureaux en France", value: "5", icon: "map-pin", order: 3 },
];

async function main() {
  console.log("🌱 Seeding essential data...\n");

  try {
    // Insert team members
    for (const m of teamMembers) {
      await pool.query(
        `INSERT INTO shared.team_members (slug, name, role, bio_fr, bio_en, linkedin_url, email, sectors_expertise, transaction_slugs, is_active, display_order, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
         ON CONFLICT (slug) DO UPDATE SET 
           name = EXCLUDED.name, 
           role = EXCLUDED.role, 
           bio_fr = EXCLUDED.bio_fr, 
           bio_en = EXCLUDED.bio_en,
           linkedin_url = EXCLUDED.linkedin_url,
           email = EXCLUDED.email,
           sectors_expertise = EXCLUDED.sectors_expertise,
           is_active = EXCLUDED.is_active,
           display_order = EXCLUDED.display_order,
           updated_at = NOW()`,
        [
          m.slug,
          m.name,
          m.role,
          m.bioFr,
          m.bioEn,
          m.linkedinUrl,
          m.email,
          m.sectorsExpertise || [],
          m.transactionSlugs || [],
          m.isActive,
          m.displayOrder,
        ]
      );
    }
    console.log(`✓ Seeded ${teamMembers.length} team members`);

    // Marketing KPIs
    for (const k of kpis) {
      await pool.query(
        `INSERT INTO shared.marketing_kpis (label, value, icon, "order", created_at, updated_at)
         VALUES ($1, $2, $3, $4, NOW(), NOW())
         ON CONFLICT (label) DO UPDATE SET 
           value = EXCLUDED.value,
           icon = EXCLUDED.icon,
           "order" = EXCLUDED."order",
           updated_at = NOW()`,
        [k.label, k.value, k.icon, k.order]
      );
    }
    console.log(`✓ Seeded ${kpis.length} marketing KPIs`);

    console.log("\n✅ Essential data seeding complete!");
  } catch (error) {
    console.error("❌ Error seeding data:", error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
