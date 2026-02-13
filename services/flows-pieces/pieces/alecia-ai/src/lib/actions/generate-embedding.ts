import { createAction, Property } from "@activepieces/pieces-framework";

export const generateEmbedding = createAction({
  name: "generate_embedding",
  displayName: "Generate Embedding",
  description: "Generate text embeddings using OpenAI text-embedding-3-small",
  props: {
    text: Property.LongText({ displayName: "Text", required: true }),
    openaiApiKey: Property.ShortText({ displayName: "OpenAI API Key", required: true }),
  },
  async run(context) {
    const res = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${context.propsValue.openaiApiKey}`,
      },
      body: JSON.stringify({
        model: "text-embedding-3-small",
        input: context.propsValue.text,
      }),
    });
    if (!res.ok) throw new Error(`OpenAI API error: ${res.status}`);
    const data = await res.json();
    return { embedding: data.data[0].embedding };
  },
});
