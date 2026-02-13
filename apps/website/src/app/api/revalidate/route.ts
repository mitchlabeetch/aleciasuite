// apps/website/src/app/api/revalidate/route.ts
// ISR Revalidation webhook — called by Strapi on content changes

import { revalidatePath } from "next/cache";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  const secret = request.headers.get("x-webhook-secret");
  if (secret !== process.env.REVALIDATION_SECRET) {
    return new Response("Unauthorized", { status: 401 });
  }

  // Revalidate all marketing pages
  revalidatePath("/", "layout");

  return Response.json({ revalidated: true, timestamp: Date.now() });
}
