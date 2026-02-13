import { createAction, Property } from "@activepieces/pieces-framework";
import { Client } from "@microsoft/microsoft-graph-client";

export const createCalendarEvent = createAction({
  name: "create_calendar_event",
  displayName: "Create Calendar Event",
  description: "Create an Outlook calendar event",
  props: {
    subject: Property.ShortText({
      displayName: "Subject",
      required: true,
    }),
    startDateTime: Property.ShortText({
      displayName: "Start DateTime",
      required: true,
      description: "ISO 8601 format (e.g., 2026-02-10T14:00:00)",
    }),
    endDateTime: Property.ShortText({
      displayName: "End DateTime",
      required: true,
      description: "ISO 8601 format (e.g., 2026-02-10T15:00:00)",
    }),
    body: Property.LongText({
      displayName: "Body",
      required: false,
    }),
    attendees: Property.ShortText({
      displayName: "Attendees",
      required: false,
      description: "Comma-separated email addresses",
    }),
  },
  async run(context) {
    const client = Client.init({
      authProvider: (done) => {
        done(null, (context.auth as any).access_token);
      },
    });

    const attendeesList = context.propsValue.attendees
      ? context.propsValue.attendees.split(",").map((email) => ({
          emailAddress: { address: email.trim() },
          type: "required",
        }))
      : [];

    const event = {
      subject: context.propsValue.subject,
      start: {
        dateTime: context.propsValue.startDateTime,
        timeZone: "Europe/Paris",
      },
      end: {
        dateTime: context.propsValue.endDateTime,
        timeZone: "Europe/Paris",
      },
      body: context.propsValue.body
        ? {
            contentType: "HTML",
            content: context.propsValue.body,
          }
        : undefined,
      attendees: attendeesList,
    };

    const result = await client.api("/me/events").post(event);

    return result;
  },
});
