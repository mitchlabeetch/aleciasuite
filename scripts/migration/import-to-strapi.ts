// scripts/migration/import-to-strapi.ts
// Imports CMS content from exported JSON files into Strapi REST API

const STRAPI_URL = process.env.STRAPI_URL || "https://cms.alecia.markets";
const STRAPI_TOKEN = process.env.STRAPI_API_TOKEN;

async function importCollection(collectionName: string, data: any[]) {
  let success = 0;
  let failed = 0;

  for (const item of data) {
    const res = await fetch(`${STRAPI_URL}/api/${collectionName}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${STRAPI_TOKEN}`,
      },
      body: JSON.stringify({ data: item }),
    });
    if (!res.ok) {
      console.error(`Failed to import ${collectionName}:`, await res.text());
      failed++;
    } else {
      success++;
    }
  }

  console.log(`${collectionName}: ${success} imported, ${failed} failed`);
}

// Transform functions: Convex field names → Strapi field names
function transformTransaction(t: any) {
  return {
    title: t.title,
    companyName: t.companyName || t.company_name,
    sector: t.sector,
    dealType: t.dealType || t.deal_type,
    year: t.year,
    description: t.description,
    isConfidential: t.isConfidential || false,
    featured: t.featured || false,
  };
}

function transformTeamMember(m: any) {
  return {
    fullName: m.fullName || m.name,
    role: m.role || m.title,
    bioFr: m.bio || m.bioFr,
    bioEn: m.bioEn || "",
    expertise: m.expertise || [],
    linkedinUrl: m.linkedin || m.linkedinUrl,
    email: m.email,
    officeLocation: m.location || m.officeLocation,
    order: m.order || 0,
  };
}

function transformBlogPost(p: any) {
  return {
    title: p.title,
    slug: p.slug,
    content: p.content,
    excerpt: p.excerpt || "",
    category: p.category,
    publishedAt: p.publishedAt || p._creationTime,
    seoTitle: p.seoTitle || p.title,
    seoDescription: p.seoDescription || p.excerpt || "",
  };
}

function transformJobOffer(j: any) {
  return {
    title: j.title,
    slug: j.slug,
    description: j.description,
    location: j.location,
    contractType: j.contractType || j.contract_type,
    department: j.department,
    isActive: j.isActive !== false,
  };
}

function transformKPI(k: any) {
  return {
    label: k.label,
    value: k.value,
    icon: k.icon,
    order: k.order || 0,
  };
}

async function main() {
  const transactions = JSON.parse(
    await Bun.file("scripts/migration/data/cms/transactions.json").text()
  );
  await importCollection("transactions", transactions.map(transformTransaction));

  const team = JSON.parse(
    await Bun.file("scripts/migration/data/cms/team_members.json").text()
  );
  await importCollection("team-members", team.map(transformTeamMember));

  const posts = JSON.parse(
    await Bun.file("scripts/migration/data/cms/blog_posts.json").text()
  );
  await importCollection("blog-posts", posts.map(transformBlogPost));

  const jobs = JSON.parse(
    await Bun.file("scripts/migration/data/cms/job_offers.json").text()
  );
  await importCollection("job-offers", jobs.map(transformJobOffer));

  const kpis = JSON.parse(
    await Bun.file("scripts/migration/data/cms/marketing_kpis.json").text()
  );
  await importCollection("marketing-kpis", kpis.map(transformKPI));

  console.log("Import complete.");
}

main();
