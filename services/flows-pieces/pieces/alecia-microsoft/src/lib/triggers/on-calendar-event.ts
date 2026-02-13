import { createTrigger, TriggerStrategy } from "@activepieces/pieces-framework";
import { Client } from "@microsoft/microsoft-graph-client";

export const onCalendarEvent = createTrigger({
  name: "on_calendar_event",
  displayName: "On Calendar Event",
  description: "Triggers when a new calendar event is created",
  type: TriggerStrategy.POLLING,
  props: {},
  async onEnable(context) {
    await context.store.put("lastChecked", new Date().toISOString());
  },
  async onDisable(context) {
    await context.store.delete("lastChecked");
  },
  async run(context) {
    const client = Client.init({
      authProvider: (done) => {
        done(null, (context.auth as any).access_token);
      },
    });

    const lastChecked = await context.store.get<string>("lastChecked");
    const now = new Date().toISOString();

    const result = await client
      .api("/me/calendarView")
      .query({
        startDateTime: lastChecked || now,
        endDateTime: now,
      })
      .get();

    await context.store.put("lastChecked", now);

    return result.value || [];
  },
  sampleData: {
    id: "AAMkAGI2TG9ib",
    subject: "Sample Meeting",
    start: {
      dateTime: "2026-02-10T14:00:00",
      timeZone: "Europe/Paris",
    },
    end: {
      dateTime: "2026-02-10T15:00:00",
      timeZone: "Europe/Paris",
    },
  },
});
