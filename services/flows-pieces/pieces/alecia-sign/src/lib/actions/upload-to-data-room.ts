import { createAction, Property } from "@activepieces/pieces-framework";
import { Client } from "pg";

export const uploadToDataRoom = createAction({
  name: "upload_to_data_room",
  displayName: "Upload to Data Room",
  description: "Upload document reference to data room (PostgreSQL)",
  props: {
    dbConnectionString: Property.ShortText({
      displayName: "Database Connection String",
      required: true,
    }),
    roomId: Property.ShortText({
      displayName: "Room ID",
      required: true,
    }),
    folderId: Property.ShortText({
      displayName: "Folder ID",
      required: true,
    }),
    filename: Property.ShortText({
      displayName: "Filename",
      required: true,
    }),
    fileUrl: Property.ShortText({
      displayName: "File URL",
      required: true,
    }),
    uploadedById: Property.ShortText({
      displayName: "Uploaded By User ID",
      required: true,
    }),
  },
  async run(context) {
    const client = new Client({
      connectionString: context.propsValue.dbConnectionString,
    });

    await client.connect();

    const result = await client.query(
      `INSERT INTO alecia_sign.deal_room_documents
       (room_id, folder_id, filename, file_url, uploaded_by_id, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       RETURNING *`,
      [
        context.propsValue.roomId,
        context.propsValue.folderId,
        context.propsValue.filename,
        context.propsValue.fileUrl,
        context.propsValue.uploadedById,
      ]
    );

    await client.end();

    return result.rows[0];
  },
});
