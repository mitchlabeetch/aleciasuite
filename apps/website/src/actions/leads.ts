"use server";

import { db, shared } from "@alepanel/db";
import { revalidatePath } from "next/cache";

/**
 * Lead Management Server Actions
 *
 * Handles lead capture from website forms (valuation, contact, etc.)
 * Stores structured lead data for follow-up in CRM
 */

interface LeadData {
  type: string;
  email: string;
  companyName?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  sector?: string | null;
  revenue?: string | null;
  ebe?: string | null;
  ebitda?: number | null;
  valuation?: {
    low: number;
    mid: number;
    high: number;
    multiple: number;
  } | null;
  message?: string | null;
  timeline?: string | null;
  motivations?: string[] | null;
  source?: string;
  createdAt: string;
  status: string;
}

/**
 * Create a new lead from website form submission
 * Stores in contacts table with appropriate tags and source
 */
export async function createLead(data: LeadData) {
  const fullName = [data.firstName, data.lastName].filter(Boolean).join(" ") || data.email;

  const tags = ["lead", `lead-type:${data.type}`];
  if (data.sector) {
    tags.push(`sector:${data.sector}`);
  }

  const [contact] = await db
    .insert(shared.contacts)
    .values({
      fullName,
      email: data.email,
      phone: data.phone || null,
      role: data.firstName || data.lastName ? null : "Lead",
      tags,
      source: data.source || "website",
      createdAt: new Date(data.createdAt),
      updatedAt: new Date(data.createdAt),
    })
    .returning();

  revalidatePath("/contacts");

  return contact.id;
}
