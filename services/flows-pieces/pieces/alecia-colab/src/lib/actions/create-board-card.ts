import { createAction, Property } from "@activepieces/pieces-framework";
import { getPool } from "../db";

export const createBoardCard = createAction({
  name: "create_board_card",
  displayName: "Create Board Card",
  description: "Create a new card in a Kanban board list",
  props: {
    listId: Property.ShortText({ displayName: "List ID", required: true }),
    title: Property.ShortText({ displayName: "Title", required: true }),
    description: Property.LongText({ displayName: "Description", required: false }),
    assigneeId: Property.ShortText({ displayName: "Assignee ID", required: false }),
    dueDate: Property.DateTime({ displayName: "Due Date", required: false }),
  },
  async run(context) {
    const pool = getPool(context.auth as string);
    const { listId, title, description, assigneeId, dueDate } = context.propsValue;

    const sortOrderResult = await pool.query(
      `SELECT COALESCE(MAX(sort_order), 0) + 1 as next_order FROM alecia_colab.cards WHERE list_id = $1`,
      [listId]
    );
    const sortOrder = sortOrderResult.rows[0].next_order;

    const result = await pool.query(
      `INSERT INTO alecia_colab.cards (id, list_id, title, description, assignee_id, due_date, sort_order, created_at, updated_at)
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, NOW(), NOW())
       RETURNING *`,
      [listId, title, description || null, assigneeId || null, dueDate || null, sortOrder]
    );

    return result.rows[0];
  },
});
