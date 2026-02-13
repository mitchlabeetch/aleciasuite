// services/flows-pieces/pieces/alecia-calendar/src/actions/schedule-meeting.ts
// Schedule meeting via Microsoft Calendar

import { createAction, Property } from '@activepieces/pieces-framework';
import { Client } from '@microsoft/microsoft-graph-client';

export const scheduleMeeting = createAction({
  name: 'schedule-meeting',
  displayName: 'Schedule Meeting',
  description: 'Create meeting via Microsoft Calendar',
  props: {
    subject: Property.ShortText({
      displayName: 'Meeting Subject',
      required: true,
    }),
    attendees: Property.Array({
      displayName: 'Attendee Emails',
      required: true,
    }),
    startTime: Property.DateTime({
      displayName: 'Start Time',
      required: true,
    }),
    duration: Property.Number({
      displayName: 'Duration (minutes)',
      defaultValue: 60,
      required: false,
    }),
    location: Property.ShortText({
      displayName: 'Location',
      required: false,
    }),
    body: Property.LongText({
      displayName: 'Meeting Description',
      required: false,
    }),
  },
  async run(context) {
    const accessToken = process.env.MICROSOFT_ACCESS_TOKEN || '';
    const client = Client.init({
      authProvider: (done) => done(null, accessToken),
    });

    const startDate = new Date(context.propsValue.startTime);
    const endDate = new Date(
      startDate.getTime() + (context.propsValue.duration || 60) * 60000
    );

    const event = {
      subject: context.propsValue.subject,
      body: {
        contentType: 'HTML',
        content: context.propsValue.body || '',
      },
      start: {
        dateTime: startDate.toISOString(),
        timeZone: 'Europe/Paris',
      },
      end: {
        dateTime: endDate.toISOString(),
        timeZone: 'Europe/Paris',
      },
      location: {
        displayName: context.propsValue.location || 'Microsoft Teams',
      },
      attendees: ((context.propsValue.attendees || []) as unknown[]).map((email) => ({
        emailAddress: { address: String(email) },
        type: 'required',
      })),
      isOnlineMeeting: true,
      onlineMeetingProvider: 'teamsForBusiness',
    };

    const result = await client.api('/me/events').post(event);

    return {
      success: true,
      eventId: result.id,
      joinUrl: result.onlineMeeting?.joinUrl,
      startTime: result.start.dateTime,
      endTime: result.end.dateTime,
      attendees: result.attendees.map((a: any) => a.emailAddress.address),
    };
  },
});
