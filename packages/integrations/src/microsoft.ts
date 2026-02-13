// packages/integrations/src/microsoft.ts
// Microsoft Graph API — OneDrive, Excel, Calendar, SharePoint, Email
// Uses approved Microsoft dev app with read+write permissions
// OAuth handled by BetterAuth (socialProviders.microsoft) — no custom API needed
// Access tokens stored in shared.account table, refreshed automatically
//
// Required Graph API permissions (Delegated):
//   Mail.ReadWrite, Calendars.ReadWrite, Files.ReadWrite, User.Read
//
// TODO: Port implementations from convex/actions/microsoft.ts (~17k chars)

import { Client } from "@microsoft/microsoft-graph-client";

/** Create an authenticated Graph client from a BetterAuth access token */
export function createGraphClient(accessToken: string): Client {
  return Client.init({
    authProvider: (done) => done(null, accessToken),
  });
}

export const microsoft = {
  async browseOneDrive(path: string, accessToken: string) {
    const client = createGraphClient(accessToken);
    const endpoint = path === "/" ? "/me/drive/root/children" : `/me/drive/root:${path}:/children`;
    return client.api(endpoint).get();
  },

  async readExcelRange(
    fileId: string,
    sheetName: string,
    range: string,
    accessToken: string
  ) {
    const client = createGraphClient(accessToken);
    return client
      .api(`/me/drive/items/${fileId}/workbook/worksheets/${sheetName}/range(address='${range}')`)
      .get();
  },

  async writeExcelRange(
    fileId: string,
    sheetName: string,
    range: string,
    values: any[][],
    accessToken: string
  ) {
    const client = createGraphClient(accessToken);
    return client
      .api(`/me/drive/items/${fileId}/workbook/worksheets/${sheetName}/range(address='${range}')`)
      .patch({ values });
  },

  async searchOneDrive(query: string, accessToken: string) {
    const client = createGraphClient(accessToken);
    return client.api(`/me/drive/root/search(q='${query}')`).get();
  },

  async createCalendarEvent(
    event: { subject: string; start: string; end: string; body?: string },
    accessToken: string
  ) {
    const client = createGraphClient(accessToken);
    return client.api("/me/events").post({
      subject: event.subject,
      start: { dateTime: event.start, timeZone: "Europe/Paris" },
      end: { dateTime: event.end, timeZone: "Europe/Paris" },
      body: event.body ? { contentType: "HTML", content: event.body } : undefined,
    });
  },

  async sendEmail(
    to: string,
    subject: string,
    body: string,
    accessToken: string
  ) {
    const client = createGraphClient(accessToken);
    return client.api("/me/sendMail").post({
      message: {
        subject,
        body: { contentType: "HTML", content: body },
        toRecipients: [{ emailAddress: { address: to } }],
      },
    });
  },

  async refreshToken(refreshToken: string) {
    // BetterAuth handles token refresh automatically via the account table
    // This is kept for manual refresh scenarios (e.g., background jobs)
    const response = await fetch(
      `https://login.microsoftonline.com/${process.env.MICROSOFT_TENANT_ID || "common"}/oauth2/v2.0/token`,
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: process.env.MICROSOFT_CLIENT_ID!,
          client_secret: process.env.MICROSOFT_CLIENT_SECRET!,
          refresh_token: refreshToken,
          grant_type: "refresh_token",
          scope: "Mail.ReadWrite Calendars.ReadWrite Files.ReadWrite User.Read offline_access",
        }),
      }
    );
    if (!response.ok) throw new Error(`Token refresh failed: ${response.status}`);
    return response.json();
  },
};
