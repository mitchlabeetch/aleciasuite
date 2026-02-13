// services/flows-pieces/pieces/alecia-notifications/src/actions/create-in-app-notification.ts
// Create in-app notification in PostgreSQL

import { createAction, Property } from '@activepieces/pieces-framework';
import { Pool } from 'pg';

export const createInAppNotification = createAction({
  name: 'create-in-app-notification',
  displayName: 'Create In-App Notification',
  description: 'Create a notification in the Alecia app',
  props: {
    userId: Property.ShortText({
      displayName: 'User ID',
      description: 'Target user ID',
      required: true,
    }),
    title: Property.ShortText({
      displayName: 'Title',
      required: true,
    }),
    message: Property.LongText({
      displayName: 'Message',
      required: true,
    }),
    type: Property.StaticDropdown({
      displayName: 'Notification Type',
      required: true,
      options: {
        options: [
          { label: 'Info', value: 'info' },
          { label: 'Success', value: 'success' },
          { label: 'Warning', value: 'warning' },
          { label: 'Error', value: 'error' },
          { label: 'Deal Update', value: 'deal_update' },
          { label: 'Task Assigned', value: 'task_assigned' },
        ],
      },
    }),
    actionUrl: Property.ShortText({
      displayName: 'Action URL',
      description: 'URL to navigate when notification is clicked',
      required: false,
    }),
    metadata: Property.Json({
      displayName: 'Metadata',
      required: false,
    }),
  },
  async run(context) {
    const pool = new Pool({
      host: process.env.DATABASE_HOST || 'alecia-postgres',
      port: 5432,
      database: 'alecia',
      user: 'alecia',
      password: process.env.DATABASE_PASSWORD,
    });

    const result = await pool.query(
      `INSERT INTO shared.notifications (
        user_id, title, message, type, action_url,
        read, metadata, created_at
      ) VALUES ($1, $2, $3, $4, $5, false, $6, NOW())
      RETURNING *`,
      [
        context.propsValue.userId,
        context.propsValue.title,
        context.propsValue.message,
        context.propsValue.type,
        context.propsValue.actionUrl || null,
        context.propsValue.metadata || {},
      ]
    );

    await pool.end();

    return {
      success: true,
      notification: {
        id: result.rows[0].id,
        userId: result.rows[0].user_id,
        title: result.rows[0].title,
        type: result.rows[0].type,
        createdAt: result.rows[0].created_at,
      },
    };
  },
});
