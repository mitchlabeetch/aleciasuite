import { createPiece, PieceAuth } from "@activepieces/pieces-framework";
import { readExcelRange } from "./lib/actions/read-excel-range";
import { writeExcelRange } from "./lib/actions/write-excel-range";
import { listOneDriveFiles } from "./lib/actions/list-onedrive-files";
import { createCalendarEvent } from "./lib/actions/create-calendar-event";
import { sendEmail } from "./lib/actions/send-email";
import { onCalendarEvent } from "./lib/triggers/on-calendar-event";
import { onFileModified } from "./lib/triggers/on-file-modified";

export const aleciaMicrosoft = createPiece({
  displayName: "Alecia Microsoft",
  description: "OneDrive, Excel, Calendar, and Email via Microsoft Graph API",
  auth: PieceAuth.OAuth2({
    required: true,
    authUrl: "https://login.microsoftonline.com/common/oauth2/v2.0/authorize",
    tokenUrl: "https://login.microsoftonline.com/common/oauth2/v2.0/token",
    scope: [
      "Files.ReadWrite.All",
      "Calendars.ReadWrite",
      "Mail.Send",
    ],
  }),
  minimumSupportedRelease: "0.20.0",
  logoUrl: "https://alecia.markets/alecia-microsoft-piece.svg",
  authors: ["alecia"],
  actions: [
    readExcelRange,
    writeExcelRange,
    listOneDriveFiles,
    createCalendarEvent,
    sendEmail,
  ],
  triggers: [
    onCalendarEvent,
    onFileModified,
  ],
});
