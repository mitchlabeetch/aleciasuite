import { createAction, Property } from "@activepieces/pieces-framework";
import { Pool } from "pg";

export const semanticSearch = createAction({
  name: "semantic_search",
  displayName: "Semantic Search",
  description: "Perform semantic search using pgvector embeddings",
  props: {
    query: Property.ShortText({ displayName: "Search Query", required: true }),
    dbConnectionString: Property.ShortText({ displayName: "Database URL", required: true }),
    openaiApiKey: Property.ShortText({ displayName: "OpenAI API Key", required: true }),
    limit: Property.Number({
      displayName: "Max Results",
      required: false,
      defaultValue: 5,
    }),
  },
  async run(context) {
    const embeddingRes = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${context.propsValue.openaiApiKey}`,
      },
      body: JSON.stringify({
        model: "text-embedding-3-small",
        input: context.propsValue.query,
      }),
    });
    if (!embeddingRes.ok) throw new Error(`OpenAI API error: ${embeddingRes.status}`);
    const embeddingData = await embeddingRes.json();
    const embedding = embeddingData.data[0].embedding;

    const pool = new Pool({ connectionString: context.propsValue.dbConnectionString });
    try {
      const limit = context.propsValue.limit || 5;
      const result = await pool.query(
        "SELECT id, content, 1-(embedding <=> $1::vector) as score FROM alecia_bi.document_embeddings ORDER BY embedding <=> $1::vector LIMIT $2",
        [JSON.stringify(embedding), limit]
      );
      return { query: context.propsValue.query, results: result.rows };
    } finally {
      await pool.end();
    }
  },
});
