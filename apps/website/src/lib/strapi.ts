// apps/website/src/lib/strapi.ts
// Strapi CMS REST API client for the marketing site
// Replaces Convex queries for public CMS content

const STRAPI_URL = process.env.STRAPI_URL || "https://cms.alecia.fr";
const STRAPI_TOKEN = process.env.STRAPI_API_TOKEN;

// Strapi response types
interface StrapiResponse<T> {
  data: T;
  meta: {
    pagination?: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    };
  };
}

interface StrapiEntry<T> {
  id: number;
  attributes: T;
}

// Generic fetch helper with ISR revalidation
export async function fetchStrapi<T>(
  path: string,
  params?: Record<string, string>
): Promise<T> {
  const url = new URL(`/api${path}`, STRAPI_URL);
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  }
  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${STRAPI_TOKEN}`,
    },
    next: { revalidate: 60 }, // ISR: revalidate every 60 seconds
  });
  if (!res.ok) throw new Error(`Strapi fetch failed: ${res.status}`);
  return res.json();
}

// --- Typed Collection Helpers ---

export interface Transaction {
  title: string;
  companyName: string;
  sector: string;
  dealType: string;
  year: number;
  logo?: { url: string };
  description?: string;
  isConfidential: boolean;
  featured: boolean;
}

export interface TeamMember {
  fullName: string;
  role: string;
  bioFr?: string;
  bioEn?: string;
  photo?: { url: string };
  expertise: string[];
  linkedinUrl?: string;
  email?: string;
  officeLocation?: string;
  order: number;
}

export interface BlogPost {
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  coverImage?: { url: string };
  category: string;
  author?: { fullName: string };
  publishedAt: string;
  seoTitle?: string;
  seoDescription?: string;
}

export interface JobOffer {
  title: string;
  slug: string;
  description: string;
  location: string;
  contractType: string;
  department: string;
  isActive: boolean;
}

export interface MarketingKPI {
  label: string;
  value: string;
  icon?: string;
  order: number;
}

// Collection fetchers
export const getTransactions = () =>
  fetchStrapi<StrapiResponse<StrapiEntry<Transaction>[]>>(
    "/transactions?populate=*&sort=year:desc"
  );

export const getTeamMembers = () =>
  fetchStrapi<StrapiResponse<StrapiEntry<TeamMember>[]>>(
    "/team-members?populate=*&sort=order:asc"
  );

export const getBlogPosts = () =>
  fetchStrapi<StrapiResponse<StrapiEntry<BlogPost>[]>>(
    "/blog-posts?populate=*&sort=publishedAt:desc"
  );

export const getJobOffers = () =>
  fetchStrapi<StrapiResponse<StrapiEntry<JobOffer>[]>>(
    "/job-offers?filters[isActive][$eq]=true"
  );

export const getKPIs = () =>
  fetchStrapi<StrapiResponse<StrapiEntry<MarketingKPI>[]>>(
    "/marketing-kpis?sort=order:asc"
  );
