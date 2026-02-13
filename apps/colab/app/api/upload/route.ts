import { auth } from "@alepanel/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { s3, BUCKET_NAME, generateFileKey } from "@/lib/s3";
import { PutObjectCommand } from "@aws-sdk/client-s3";

// Security: Whitelist allowed MIME types
const ALLOWED_CONTENT_TYPES = [
	"image/jpeg",
	"image/png",
	"image/gif",
	"image/webp",
	"application/pdf",
	"text/plain",
];

// Security: Limit file size to 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024;

export async function POST(req: Request) {
	// Check authentication with BetterAuth
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (!session?.user) {
		return new Response("Unauthorized - Please sign in to upload files.", {
			status: 401,
		});
	}

	const contentType = req.headers.get("content-type") || "text/plain";
	const contentLength = Number(req.headers.get("content-length") || 0);
	const filename = req.headers.get("x-filename") || "file.txt";

	// Validate Content-Type
	if (!ALLOWED_CONTENT_TYPES.includes(contentType)) {
		return new Response(
			`Invalid content type. Allowed: ${ALLOWED_CONTENT_TYPES.join(", ")}`,
			{ status: 400 },
		);
	}

	// Validate File Size
	if (contentLength > MAX_FILE_SIZE) {
		return new Response(
			`File too large. Max size is ${MAX_FILE_SIZE / 1024 / 1024}MB.`,
			{ status: 400 },
		);
	}

	try {
		const buffer = Buffer.from(await req.arrayBuffer());
		const fileKey = generateFileKey(session.user.id, filename);

		await s3.send(
			new PutObjectCommand({
				Bucket: BUCKET_NAME,
				Key: fileKey,
				Body: buffer,
				ContentType: contentType,
			}),
		);

		return NextResponse.json({
			url: fileKey,
			key: fileKey,
			size: buffer.length,
		});
	} catch (error) {
		console.error("Upload error:", error);
		return new Response("Upload failed.", { status: 500 });
	}
}
