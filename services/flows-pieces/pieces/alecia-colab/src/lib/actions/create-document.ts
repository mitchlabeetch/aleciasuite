import { createAction, Property } from "@activepieces/pieces-framework";
import { getPool } from "../db";

export const createDocument = createAction({
  name: "create_document",
  displayName: "Create Document",
  description: "Create a new collaborative document",
  props: {
    title: Property.ShortText({ displayName: "Title", required: true }),
    content: Property.LongText({ displayName: "Content (JSON)", required: false }),
    ownerId: Property.ShortText({ displayName: "Owner ID", required: true }),
    dealId: Property.ShortText({ displayName: "Deal ID (optional)", required: false }),
  },
  async run(context) {
    const pool = getPool(context.auth as string);
    const { title, content, ownerId, dealId } = context.propsValue;

    const result = await pool.query(
      `INSERT INTO alecia_colab.documents (id, title, content, owner_id, deal_id, created_at, updated_at)
       VALUES (gen_random_uuid(), $1, $2, $3, $4, NOW(), NOW())
       RETURNING *`,
      [title, content || null, ownerId, dealId || null]
    );

    return result.rows[0];
  },
});
