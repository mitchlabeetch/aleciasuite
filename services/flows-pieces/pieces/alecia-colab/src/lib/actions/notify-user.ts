import { createAction, Property } from "@activepieces/pieces-framework";
import { getPool } from "../db";

export const notifyUser = createAction({
  name: "notify_user",
  displayName: "Notify User",
  description: "Send a notification to a user",
  props: {
    userId: Property.ShortText({ displayName: "User ID", required: true }),
    title: Property.ShortText({ displayName: "Title", required: true }),
    message: Property.LongText({ displayName: "Message", required: true }),
    type: Property.StaticDropdown({
      displayName: "Type",
      required: true,
      options: {
        options: [
          { label: "Info", value: "info" },
          { label: "Warning", value: "warning" },
          { label: "Success", value: "success" },
          { label: "Error", value: "error" },
        ],
      },
    }),
    link: Property.ShortText({ displayName: "Link (optional)", required: false }),
  },
  async run(context) {
    const pool = getPool(context.auth as string);
    const { userId, title, message, type, link } = context.propsValue;

    const result = await pool.query(
      `INSERT INTO shared.notifications (id, user_id, title, message, type, link, is_read, created_at)
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, false, NOW())
       RETURNING *`,
      [userId, title, message, type, link || null]
    );

    return result.rows[0];
  },
});
