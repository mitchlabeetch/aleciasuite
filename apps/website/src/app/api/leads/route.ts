import { NextRequest, NextResponse } from "next/server";
import { createLogger } from "@/lib/logger";
import {
	checkRateLimit,
	getClientIp,
	getRateLimitHeaders,
	strictRateLimiter,
} from "@/lib/rate-limit";
import { sanitizeHtml } from "@/lib/sanitize";
import { z } from "zod";
import { createLead } from "@/actions/leads";

const log = createLogger("LeadsAPI");

// Email addresses from environment (contact@alecia.fr for prod, editionsrevel@gmail.com for dev)
const LEAD_EMAIL_TO = process.env.LEAD_EMAIL_TO || "editionsrevel@gmail.com";

// Server-side validation schema for lead submissions
const leadValidationSchema = z.object({
	type: z.enum(["valuation", "sell", "buy", "contact", "exit_intent_guide"], {
		message: "Type de lead invalide",
	}),
	email: z.string().email("Email invalide").max(100, "Email trop long"),
	companyName: z.string().max(100, "Nom d'entreprise trop long").optional(),
	firstName: z.string().max(50, "Prénom trop long").optional(),
	lastName: z.string().max(50, "Nom trop long").optional(),
	phone: z.string().max(20, "Numéro trop long").optional(),
	sector: z.string().max(100, "Secteur trop long").optional(),
	revenue: z.string().max(50, "Valeur de CA invalide").optional(),
	ebe: z.string().max(50, "Valeur d'EBE invalide").optional(),
	ebitda: z.number().optional(),
	valuation: z
		.object({
			low: z
				.number()
				.min(0, "Valorisation basse invalide")
				.max(1_000_000_000_000, "Valorisation trop élevée"),
			mid: z
				.number()
				.min(0, "Valorisation médiane invalide")
				.max(1_000_000_000_000, "Valorisation trop élevée"),
			high: z
				.number()
				.min(0, "Valorisation haute invalide")
				.max(1_000_000_000_000, "Valorisation trop élevée"),
			multiple: z
				.number()
				.min(0, "Multiple invalide")
				.max(1000, "Multiple trop élevé"),
		})
		.optional(),
	message: z.string().max(5000, "Message trop long").optional(),
	timeline: z.string().max(100, "Timeline invalide").optional(),
	motivations: z.array(z.string()).optional(),
	source: z.string().max(50, "Source invalide").optional(),
});

interface LeadEmailData {
	type: string;
	email: string;
	companyName?: string;
	firstName?: string;
	lastName?: string;
	phone?: string;
	sector?: string;
	revenue?: string;
	ebe?: string;
	valuation?: {
		low: number;
		mid: number;
		high: number;
		multiple: number;
	};
	message?: string;
	source?: string;
}

/**
 * Format a lead into a structured HTML email
 */
function formatLeadEmail(data: LeadEmailData): {
	subject: string;
	html: string;
} {
	const typeLabels: Record<string, string> = {
		valuation: "Estimation de Valorisation",
		sell: "Projet de Cession",
		buy: "Projet d'Acquisition",
		contact: "Demande de Contact",
		exit_intent_guide: "Demande de Guide (Exit Intent)",
	};

	const typeLabel = typeLabels[data.type] || data.type;
	const subject = `[Alecia Lead] ${typeLabel} - ${data.companyName || data.email}`;

	const formatCurrency = (val: number) => {
		if (val >= 1000000) return `${(val / 1000000).toFixed(1)} m€`;
		if (val >= 1000) return `${(val / 1000).toFixed(0)} k€`;
		return `${val} €`;
	};

	let html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
    .header { background: linear-gradient(135deg, #061A40 0%, #19354e 100%); color: white; padding: 24px; border-radius: 8px 8px 0 0; }
    .header h1 { margin: 0; font-size: 20px; }
    .header .badge { display: inline-block; background: #D4AF37; color: #061A40; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; margin-top: 8px; }
    .content { background: #f8f9fa; padding: 24px; border: 1px solid #e9ecef; }
    .field { margin-bottom: 16px; }
    .field-label { font-size: 12px; color: #666; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
    .field-value { font-size: 16px; font-weight: 500; color: #061A40; }
    .valuation-box { background: linear-gradient(135deg, #061A40 0%, #19354e 100%); color: white; padding: 20px; border-radius: 8px; text-align: center; margin: 16px 0; }
    .valuation-range { font-size: 24px; font-weight: 700; }
    .valuation-median { font-size: 14px; opacity: 0.8; margin-top: 8px; }
    .message-box { background: white; border-left: 4px solid #D4AF37; padding: 16px; margin: 16px 0; }
    .footer { background: #061A40; color: white; padding: 16px; text-align: center; border-radius: 0 0 8px 8px; font-size: 12px; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Nouveau Lead - ${typeLabel}</h1>
    <span class="badge">${data.source || "Website"}</span>
  </div>
  <div class="content">
    <div class="grid">
      <div class="field">
        <div class="field-label">Email</div>
        <div class="field-value">${data.email}</div>
      </div>
      ${
				data.companyName
					? `
      <div class="field">
        <div class="field-label">Entreprise</div>
        <div class="field-value">${data.companyName}</div>
      </div>`
					: ""
			}
      ${
				data.firstName || data.lastName
					? `
      <div class="field">
        <div class="field-label">Nom</div>
        <div class="field-value">${data.firstName || ""} ${data.lastName || ""}</div>
      </div>`
					: ""
			}
      ${
				data.phone
					? `
      <div class="field">
        <div class="field-label">Téléphone</div>
        <div class="field-value">${data.phone}</div>
      </div>`
					: ""
			}
      ${
				data.sector
					? `
      <div class="field">
        <div class="field-label">Secteur</div>
        <div class="field-value">${data.sector}</div>
      </div>`
					: ""
			}
      ${
				data.revenue
					? `
      <div class="field">
        <div class="field-label">Chiffre d'Affaires</div>
        <div class="field-value">${data.revenue} k€</div>
      </div>`
					: ""
			}
      ${
				data.ebe
					? `
      <div class="field">
        <div class="field-label">EBE</div>
        <div class="field-value">${data.ebe} k€</div>
      </div>`
					: ""
			}
    </div>
`;

	// Add valuation box if available
	if (data.valuation) {
		html += `
    <div class="valuation-box">
      <div class="valuation-range">${formatCurrency(data.valuation.low)} - ${formatCurrency(data.valuation.high)}</div>
      <div class="valuation-median">Valorisation médiane: ${formatCurrency(data.valuation.mid)} (multiple: ${data.valuation.multiple}x)</div>
    </div>
`;
	}

	// Add message if available (FIX: SEC-004 - sanitize to prevent HTML injection)
	if (data.message) {
		const safeMessage = sanitizeHtml(data.message);
		html += `
    <div class="message-box">
      <div class="field-label">Message</div>
      <p style="margin: 8px 0 0 0;">${safeMessage}</p>
    </div>
`;
	}

	html += `
  </div>
  <div class="footer">
    <p>Alecia Partners - Banque d'Affaires</p>
    <p>Ce lead a été généré automatiquement via ${data.source || "le site web"}</p>
  </div>
</body>
</html>
`;

	return { subject, html };
}

export async function POST(request: NextRequest) {
	try {
		// FIX: DEP-001 - Add rate limiting to prevent spam
		const clientIp = getClientIp(request.headers);
		const rateLimitResult = await checkRateLimit(clientIp, strictRateLimiter);

		if (rateLimitResult && !rateLimitResult.success) {
			log.warn("Rate limit exceeded for leads API", { ip: clientIp });
			return NextResponse.json(
				{
					error: "Trop de requêtes. Veuillez réessayer dans quelques minutes.",
				},
				{
					status: 429,
					headers: getRateLimitHeaders(rateLimitResult),
				},
			);
		}

		const body = await request.json();

		// Server-side validation to prevent invalid data
		const validationResult = leadValidationSchema.safeParse(body);

		if (!validationResult.success) {
			const errors = validationResult.error.issues
				.map((e) => `${e.path.join(".")}: ${e.message}`)
				.join(", ");
			log.warn("Lead validation failed", { errors, ip: clientIp });
			return NextResponse.json(
				{ error: "Données invalides", details: errors },
				{ status: 400 },
			);
		}

		const validatedData = validationResult.data;

		// Additional basic validation
		if (!validatedData.email || !validatedData.type) {
			return NextResponse.json(
				{ error: "Email et type de lead requis" },
				{ status: 400 },
			);
		}

		// Prepare lead data for database (using validated data)
		const leadData = {
			type: validatedData.type,
			email: validatedData.email,
			companyName: validatedData.companyName || null,
			firstName: validatedData.firstName || null,
			lastName: validatedData.lastName || null,
			phone: validatedData.phone || null,
			sector: validatedData.sector || null,
			revenue: validatedData.revenue || null,
			ebe: validatedData.ebe || null,
			ebitda: validatedData.ebitda || null,
			valuation: validatedData.valuation || null,
			message: validatedData.message || null,
			timeline: validatedData.timeline || null,
			motivations: validatedData.motivations || null,
			source: validatedData.source || "website",
			createdAt: new Date().toISOString(),
			status: "new",
		};

		// Submit to database via server action
		const leadId = await createLead(leadData);
		log.info(`Lead créé avec succès: ${leadId}`);

		// Send structured email notification (using validated data)
		try {
			const { subject, html } = formatLeadEmail(validatedData);

			// Use Resend API if available, otherwise log
			if (process.env.RESEND_API_KEY) {
				const emailResponse = await fetch("https://api.resend.com/emails", {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
					},
					body: JSON.stringify({
						from: "Alecia Leads <leads@alecia.markets>",
						to: LEAD_EMAIL_TO,
						subject,
						html,
					}),
				});

				if (emailResponse.ok) {
					log.info(`Email notification sent to ${LEAD_EMAIL_TO}`);
				} else {
					log.warn(`Email notification failed: ${await emailResponse.text()}`);
				}
			} else {
				log.info(
					`Email notification would be sent to ${LEAD_EMAIL_TO} (RESEND_API_KEY not configured)`,
				);
				log.info(`Subject: ${subject}`);
			}
		} catch (emailError) {
			// Don't fail the request if email fails
			log.warn("Email notification error:", emailError);
		}

		return NextResponse.json({ success: true, id: leadId });
	} catch (error: unknown) {
		log.error("Erreur lors de la création du lead:", error);
		const errorMessage =
			error instanceof Error ? error.message : "Erreur interne";
		return NextResponse.json({ error: errorMessage }, { status: 500 });
	}
}
