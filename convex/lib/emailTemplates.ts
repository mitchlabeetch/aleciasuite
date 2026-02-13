// Email Templates for Alecia M&A Platform
// HTML templates for various notification types

import { escapeHtml } from "./sanitizeEmail";

// Site URL for unsubscribe links
const SITE_URL =
	process.env.NEXT_PUBLIC_SITE_URL || "https://panel.alecia.markets";

// Base layout wrapper
export function emailLayout(
	content: string,
	options?: {
		previewText?: string;
		unsubscribeUrl?: string;
		unsubscribeToken?: string;
	},
): string {
	// Build unsubscribe URL from token or use provided URL
	const unsubscribeUrl = options?.unsubscribeToken
		? `${SITE_URL}/unsubscribe?token=${encodeURIComponent(options.unsubscribeToken)}`
		: options?.unsubscribeUrl;
	return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  ${options?.previewText ? `<meta name="x-apple-disable-message-reformatting"><!--[if !mso]><!--><meta http-equiv="X-UA-Compatible" content="IE=edge"><!--<![endif]--><span class="preheader" style="display:none;font-size:1px;color:#ffffff;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">${escapeHtml(options.previewText)}</span>` : ""}
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      font-size: 16px;
      line-height: 1.5;
      color: #1a1a2e;
      background-color: #f3f4f6;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background: #ffffff;
    }
    .header {
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      color: white;
      padding: 32px 24px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 600;
    }
    .header p {
      margin: 8px 0 0;
      opacity: 0.9;
      font-size: 14px;
    }
    .content {
      padding: 32px 24px;
    }
    .card {
      background: #f8fafc;
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 16px;
      border-left: 4px solid #4f46e5;
    }
    .card-title {
      font-weight: 600;
      margin-bottom: 8px;
      color: #1a1a2e;
    }
    .card-meta {
      font-size: 13px;
      color: #6b7280;
    }
    .btn {
      display: inline-block;
      padding: 12px 24px;
      background: #4f46e5;
      color: white;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 500;
      margin-top: 16px;
    }
    .btn:hover {
      background: #4338ca;
    }
    .btn-secondary {
      background: #f3f4f6;
      color: #374151;
    }
    .footer {
      background: #f8fafc;
      padding: 24px;
      text-align: center;
      font-size: 12px;
      color: #6b7280;
      border-top: 1px solid #e5e7eb;
    }
    .footer a {
      color: #4f46e5;
      text-decoration: none;
    }
    .badge {
      display: inline-block;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 500;
    }
    .badge-critical { background: #fef2f2; color: #dc2626; }
    .badge-important { background: #fefce8; color: #ca8a04; }
    .badge-standard { background: #f3f4f6; color: #6b7280; }
    .badge-success { background: #f0fdf4; color: #16a34a; }
    .badge-info { background: #eff6ff; color: #2563eb; }
    .divider {
      height: 1px;
      background: #e5e7eb;
      margin: 24px 0;
    }
    .stat-grid {
      display: flex;
      gap: 16px;
      margin: 16px 0;
    }
    .stat-item {
      flex: 1;
      text-align: center;
      padding: 16px;
      background: #f8fafc;
      border-radius: 8px;
    }
    .stat-value {
      font-size: 28px;
      font-weight: 700;
      color: #4f46e5;
    }
    .stat-label {
      font-size: 12px;
      color: #6b7280;
      margin-top: 4px;
    }
    @media (max-width: 600px) {
      .container { width: 100% !important; }
      .content { padding: 24px 16px !important; }
      .stat-grid { flex-direction: column; }
    }
  </style>
</head>
<body>
  <div class="container">
    ${content}
    <div class="footer">
      <p><strong>Alecia</strong> - M&A Operating System</p>
      <p>
        <a href="https://panel.alecia.markets">Panel</a> ·
        <a href="https://panel.alecia.markets/admin/notifications">Notifications</a>
        ${unsubscribeUrl ? ` · <a href="${escapeHtml(unsubscribeUrl)}">Se désabonner</a>` : ""}
      </p>
      <p style="margin-top: 16px; opacity: 0.7;">
        © ${new Date().getFullYear()} Alecia. Tous droits réservés.
      </p>
    </div>
  </div>
</body>
</html>`;
}

// ============================================
// DD CHECKLIST TEMPLATES
// ============================================

export interface DDItemUpdateData {
	itemName: string;
	checklistName: string;
	dealName: string;
	oldStatus: string;
	newStatus: string;
	updatedBy: string;
	notes?: string;
	issueDescription?: string;
	issueSeverity?: string;
	viewUrl: string;
	unsubscribeToken?: string; // Added for unsubscribe link
}

export function ddItemStatusChanged(data: DDItemUpdateData): string {
	const statusLabels: Record<string, string> = {
		pending: "En attente",
		in_progress: "En cours",
		received: "Reçu",
		reviewed: "Vérifié",
		issue_found: "Problème détecté",
		not_applicable: "Non applicable",
	};

	const isIssue = data.newStatus === "issue_found";

	const content = `
    <div class="header">
      <h1>${isIssue ? "⚠️" : "📋"} Mise à jour DD</h1>
      <p>${escapeHtml(data.checklistName)}</p>
    </div>
    <div class="content">
      <p>Bonjour,</p>
      <p>Un élément de due diligence a été mis à jour sur le dossier <strong>${escapeHtml(data.dealName)}</strong>.</p>

      <div class="card" style="border-left-color: ${isIssue ? "#dc2626" : "#4f46e5"}">
        <div class="card-title">${escapeHtml(data.itemName)}</div>
        <div class="card-meta">
          <span class="badge ${isIssue ? "badge-critical" : "badge-success"}">
            ${statusLabels[data.newStatus] || escapeHtml(data.newStatus)}
          </span>
          <span style="margin-left: 8px;">← ${statusLabels[data.oldStatus] || escapeHtml(data.oldStatus)}</span>
        </div>
        ${data.notes ? `<p style="margin-top: 12px; font-size: 14px;">${escapeHtml(data.notes)}</p>` : ""}
        ${
					isIssue && data.issueDescription
						? `
          <div style="margin-top: 12px; padding: 12px; background: #fef2f2; border-radius: 6px;">
            <strong style="color: #dc2626;">
              ${data.issueSeverity === "blocker" ? "🔴 Bloquant" : data.issueSeverity === "major" ? "🟠 Majeur" : "🟡 Mineur"}
            </strong>
            <p style="margin: 8px 0 0; font-size: 14px; color: #7f1d1d;">${escapeHtml(data.issueDescription)}</p>
          </div>
        `
						: ""
				}
      </div>

      <p class="card-meta">Mis à jour par ${escapeHtml(data.updatedBy)}</p>

      <a href="${escapeHtml(data.viewUrl)}" class="btn">Voir le détail</a>
    </div>
  `;

	return emailLayout(content, {
		previewText: `DD Update: ${escapeHtml(data.itemName)} - ${statusLabels[data.newStatus] || escapeHtml(data.newStatus)}`,
		unsubscribeToken: data.unsubscribeToken,
	});
}

export interface DDChecklistSummaryData {
	checklistName: string;
	dealName: string;
	progress: number;
	stats: {
		total: number;
		pending: number;
		inProgress: number;
		completed: number;
		issues: number;
		overdue: number;
	};
	recentUpdates: Array<{
		item: string;
		status: string;
		updatedBy: string;
		updatedAt: number;
	}>;
	viewUrl: string;
	unsubscribeToken?: string; // Added for unsubscribe link
}

export function ddChecklistSummary(data: DDChecklistSummaryData): string {
	const content = `
    <div class="header">
      <h1>📊 Résumé DD</h1>
      <p>${escapeHtml(data.checklistName)}</p>
    </div>
    <div class="content">
      <p>Voici le statut actuel de la due diligence pour <strong>${escapeHtml(data.dealName)}</strong>.</p>

      <div style="text-align: center; margin: 24px 0;">
        <div style="font-size: 48px; font-weight: 700; color: ${data.progress === 100 ? "#16a34a" : "#4f46e5"};">
          ${data.progress}%
        </div>
        <div style="color: #6b7280;">Progression globale</div>
      </div>

      <div class="stat-grid">
        <div class="stat-item">
          <div class="stat-value">${data.stats.total}</div>
          <div class="stat-label">Total</div>
        </div>
        <div class="stat-item">
          <div class="stat-value" style="color: #16a34a;">${data.stats.completed}</div>
          <div class="stat-label">Complétés</div>
        </div>
        <div class="stat-item">
          <div class="stat-value" style="color: ${data.stats.issues > 0 ? "#dc2626" : "#6b7280"};">${data.stats.issues}</div>
          <div class="stat-label">Problèmes</div>
        </div>
        <div class="stat-item">
          <div class="stat-value" style="color: ${data.stats.overdue > 0 ? "#f59e0b" : "#6b7280"};">${data.stats.overdue}</div>
          <div class="stat-label">En retard</div>
        </div>
      </div>

      ${
				data.recentUpdates.length > 0
					? `
        <div class="divider"></div>
        <h3 style="margin-bottom: 16px;">Mises à jour récentes</h3>
        ${data.recentUpdates
					.map(
						(u) => `
          <div class="card">
            <div class="card-title">${escapeHtml(u.item)}</div>
            <div class="card-meta">${escapeHtml(u.status)} · ${escapeHtml(u.updatedBy)} · ${formatDate(u.updatedAt)}</div>
          </div>
        `,
					)
					.join("")}
      `
					: ""
			}

      <a href="${escapeHtml(data.viewUrl)}" class="btn">Voir la checklist</a>
    </div>
  `;

	return emailLayout(content, {
		previewText: `DD ${escapeHtml(data.dealName)}: ${data.progress}% complete`,
		unsubscribeToken: data.unsubscribeToken,
	});
}

// ============================================
// VDR TEMPLATES
// ============================================

export interface VDRAccessNotificationData {
	roomName: string;
	dealName: string;
	accessorName: string;
	accessorEmail: string;
	accessorCompany?: string;
	action: "view" | "download" | "question";
	documentName?: string;
	question?: string;
	timestamp: number;
	viewUrl: string;
	unsubscribeToken?: string; // Added for unsubscribe link
}

export function vdrAccessNotification(data: VDRAccessNotificationData): string {
	const actionLabels = {
		view: "a consulté",
		download: "a téléchargé",
		question: "a posé une question sur",
	};

	const content = `
    <div class="header">
      <h1>📁 Activité Data Room</h1>
      <p>${escapeHtml(data.roomName)}</p>
    </div>
    <div class="content">
      <p><strong>${escapeHtml(data.accessorName)}</strong> ${actionLabels[data.action]} ${data.documentName ? `le document <em>"${escapeHtml(data.documentName)}"</em>` : "la data room"}.</p>

      <div class="card">
        <div class="card-title">${escapeHtml(data.accessorName)}</div>
        <div class="card-meta">
          ${escapeHtml(data.accessorEmail)}
          ${data.accessorCompany ? ` · ${escapeHtml(data.accessorCompany)}` : ""}
        </div>
        ${
					data.question
						? `
          <div style="margin-top: 12px; padding: 12px; background: #eff6ff; border-radius: 6px;">
            <strong>Question:</strong>
            <p style="margin: 8px 0 0;">${escapeHtml(data.question)}</p>
          </div>
        `
						: ""
				}
        <div class="card-meta" style="margin-top: 8px;">${formatDate(data.timestamp)}</div>
      </div>

      <a href="${escapeHtml(data.viewUrl)}" class="btn">Voir l'activité</a>
    </div>
  `;

	return emailLayout(content, {
		previewText: `VDR: ${escapeHtml(data.accessorName)} ${actionLabels[data.action]} ${escapeHtml(data.documentName || data.roomName)}`,
		unsubscribeToken: data.unsubscribeToken,
	});
}

export interface VDRInvitationData {
	roomName: string;
	dealName: string;
	inviterName: string;
	inviterCompany: string;
	accessLevel: string;
	expiresAt?: number;
	acceptUrl: string;
	message?: string;
	unsubscribeToken?: string; // Added for unsubscribe link
}

export function vdrInvitation(data: VDRInvitationData): string {
	const accessLabels: Record<string, string> = {
		viewer: "Consultation uniquement",
		downloader: "Consultation et téléchargement",
		questioner: "Consultation, téléchargement et questions",
	};

	const content = `
    <div class="header">
      <h1>📨 Invitation Data Room</h1>
      <p>${escapeHtml(data.roomName)}</p>
    </div>
    <div class="content">
      <p>Bonjour,</p>
      <p><strong>${escapeHtml(data.inviterName)}</strong> (${escapeHtml(data.inviterCompany)}) vous invite à accéder à la data room pour le dossier <strong>${escapeHtml(data.dealName)}</strong>.</p>

      ${
				data.message
					? `
        <div class="card" style="border-left-color: #6b7280;">
          <em>"${escapeHtml(data.message)}"</em>
          <div class="card-meta" style="margin-top: 8px;">— ${escapeHtml(data.inviterName)}</div>
        </div>
      `
					: ""
			}

      <div style="text-align: center; margin: 32px 0;">
        <a href="${escapeHtml(data.acceptUrl)}" class="btn" style="font-size: 18px; padding: 16px 32px;">
          Accéder à la Data Room
        </a>
      </div>

      <div class="card" style="background: #f8fafc;">
        <div class="card-meta">
          <strong>Niveau d'accès:</strong> ${accessLabels[data.accessLevel] || escapeHtml(data.accessLevel)}
        </div>
        ${
					data.expiresAt
						? `
          <div class="card-meta" style="margin-top: 8px;">
            <strong>Expire le:</strong> ${formatDate(data.expiresAt)}
          </div>
        `
						: ""
				}
      </div>

      <p style="font-size: 13px; color: #6b7280; margin-top: 24px;">
        Si vous n'attendiez pas cette invitation, vous pouvez ignorer cet email.
      </p>
    </div>
  `;

	return emailLayout(content, {
		previewText: `${escapeHtml(data.inviterName)} vous invite à accéder à la data room ${escapeHtml(data.roomName)}`,
		unsubscribeToken: data.unsubscribeToken,
	});
}

// ============================================
// DEAL TEMPLATES
// ============================================

export interface DealUpdateData {
	dealName: string;
	updateType: "stage_change" | "new_comment" | "mention" | "assignment";
	updatedBy: string;
	details: {
		oldStage?: string;
		newStage?: string;
		commentPreview?: string;
		mentionContext?: string;
	};
	viewUrl: string;
	unsubscribeToken?: string; // Added for unsubscribe link
}

export function dealUpdate(data: DealUpdateData): string {
	const stageLabels: Record<string, string> = {
		sourcing: "Sourcing",
		qualification: "Qualification",
		initial_meeting: "Premier RDV",
		analysis: "Analyse",
		valuation: "Valorisation",
		due_diligence: "Due Diligence",
		negotiation: "Négociation",
		closing: "Closing",
		closed_won: "Gagné",
		closed_lost: "Perdu",
	};

	let title = "Mise à jour dossier";
	let description = "";

	switch (data.updateType) {
		case "stage_change":
			title = "📈 Changement de phase";
			description = `Le dossier est passé de <strong>${stageLabels[data.details.oldStage!] || escapeHtml(data.details.oldStage!)}</strong> à <strong>${stageLabels[data.details.newStage!] || escapeHtml(data.details.newStage!)}</strong>.`;
			break;
		case "new_comment":
			title = "💬 Nouveau commentaire";
			description = `${escapeHtml(data.updatedBy)} a ajouté un commentaire.`;
			break;
		case "mention":
			title = "👋 Vous êtes mentionné";
			description = `${escapeHtml(data.updatedBy)} vous a mentionné dans un commentaire.`;
			break;
		case "assignment":
			title = "👤 Nouveau responsable";
			description = `Vous avez été assigné comme responsable de ce dossier.`;
			break;
	}

	const content = `
    <div class="header">
      <h1>${title}</h1>
      <p>${escapeHtml(data.dealName)}</p>
    </div>
    <div class="content">
      <p>${description}</p>

      ${
				data.details.commentPreview
					? `
        <div class="card">
          <p style="font-style: italic;">"${escapeHtml(data.details.commentPreview)}"</p>
          <div class="card-meta">— ${escapeHtml(data.updatedBy)}</div>
        </div>
      `
					: ""
			}

      <a href="${escapeHtml(data.viewUrl)}" class="btn">Voir le dossier</a>
    </div>
  `;

	return emailLayout(content, {
		previewText: `${escapeHtml(data.dealName)}: ${title}`,
		unsubscribeToken: data.unsubscribeToken,
	});
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function formatDate(timestamp: number): string {
	const date = new Date(timestamp);
	return date.toLocaleDateString("fr-FR", {
		day: "numeric",
		month: "long",
		year: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	});
}
