// scripts/migration/migrate-files-to-minio.ts
// Downloads files from Convex storage URLs and uploads to Minio S3 buckets
// Uses the id-map.json from CRM import to update PostgreSQL records with new URLs

import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { Pool } from "pg";
import { readFileSync } from "fs";

const s3 = new S3Client({
  endpoint: process.env.MINIO_ENDPOINT || "https://s3.alecia.markets",
  region: "us-east-1",
  credentials: {
    accessKeyId: process.env.MINIO_ROOT_USER!,
    secretAccessKey: process.env.MINIO_ROOT_PASSWORD!,
  },
  forcePathStyle: true,
});

const pool = new Pool({
  host: process.env.PG_HOST || "localhost",
  port: 5432,
  database: "alecia",
  user: "alecia",
  password: process.env.POSTGRES_PASSWORD,
});

// Load ID mapping from CRM import
const idMap: Record<string, string> = JSON.parse(
  readFileSync("scripts/migration/data/id-map.json", "utf-8")
);

async function migrateFile(
  convexUrl: string,
  bucket: string,
  key: string
): Promise<string> {
  const response = await fetch(convexUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${convexUrl}: ${response.status}`);
  }
  const buffer = await response.arrayBuffer();
  const contentType =
    response.headers.get("content-type") || "application/octet-stream";

  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: Buffer.from(buffer),
      ContentType: contentType,
    })
  );

  return `https://s3.alecia.markets/${bucket}/${key}`;
}

async function migrateDataRoomDocuments() {
  console.log("Migrating data room documents...");

  const documents = JSON.parse(
    readFileSync(
      "scripts/migration/data/crm/deal_room_documents.json",
      "utf-8"
    )
  );

  let migrated = 0;
  let failed = 0;

  for (const doc of documents) {
    if (!doc.storageUrl && !doc.url) continue;

    const sourceUrl = doc.storageUrl || doc.url;
    const pgId = idMap[doc._id];
    if (!pgId) continue;

    const key = `data-rooms/${doc.roomId || "unknown"}/${doc.filename || doc._id}`;

    try {
      const newUrl = await migrateFile(sourceUrl, "alecia-documents", key);

      // Update PostgreSQL record with new Minio URL
      await pool.query(
        `UPDATE alecia_sign.deal_room_documents SET minio_key = $1 WHERE id = $2`,
        [key, pgId]
      );

      migrated++;
      if (migrated % 10 === 0) console.log(`  → ${migrated} files migrated`);
    } catch (err) {
      console.error(`  ✗ Failed: ${doc.filename}`, err);
      failed++;
    }
  }

  console.log(`Data room documents: ${migrated} migrated, ${failed} failed`);
}

async function migrateCompanyLogos() {
  console.log("Migrating company logos...");

  const companies = JSON.parse(
    readFileSync("scripts/migration/data/crm/companies.json", "utf-8")
  );

  let migrated = 0;

  for (const company of companies) {
    if (!company.logoUrl || !company.logoUrl.startsWith("http")) continue;

    const pgId = idMap[company._id];
    if (!pgId) continue;

    const ext = company.logoUrl.split(".").pop()?.split("?")[0] || "png";
    const key = `logos/${pgId}.${ext}`;

    try {
      const newUrl = await migrateFile(company.logoUrl, "alecia-media", key);

      await pool.query(
        `UPDATE shared.companies SET logo_url = $1 WHERE id = $2`,
        [newUrl, pgId]
      );

      migrated++;
    } catch {
      // Logo migration is non-critical, skip failures silently
    }
  }

  console.log(`Company logos: ${migrated} migrated`);
}

async function main() {
  console.log("=== Alecia File Migration: Convex → Minio ===\n");

  await migrateDataRoomDocuments();
  await migrateCompanyLogos();

  console.log("\n=== File migration complete ===");
  await pool.end();
}

main();
