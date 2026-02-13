import { createAction, Property } from "@activepieces/pieces-framework";
import { getPool } from "../db";

export const updateCardStatus = createAction({
  name: "update_card_status",
  displayName: "Update Card Status",
  description: "Move a card to a different list",
  props: {
    cardId: Property.ShortText({ displayName: "Card ID", required: true }),
    targetListId: Property.ShortText({ displayName: "Target List ID", required: true }),
  },
  async run(context) {
    const pool = getPool(context.auth as string);
    const { cardId, targetListId } = context.propsValue;

    const sortOrderResult = await pool.query(
      `SELECT COALESCE(MAX(sort_order), 0) + 1 as next_order FROM alecia_colab.cards WHERE list_id = $1`,
      [targetListId]
    );
    const sortOrder = sortOrderResult.rows[0].next_order;

    const result = await pool.query(
      `UPDATE alecia_colab.cards SET list_id = $1, sort_order = $2, updated_at = NOW() WHERE id = $3 RETURNING *`,
      [targetListId, sortOrder, cardId]
    );

    return result.rows[0];
  },
});
