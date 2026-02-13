import { createAction, Property } from "@activepieces/pieces-framework";
import { callGroq } from "../groq-client";

export const summarizeDocument = createAction({
  name: "summarize_document",
  displayName: "Summarize Document",
  description: "Generate a concise summary of a document using AI",
  props: {
    content: Property.LongText({ displayName: "Document Content", required: true }),
    language: Property.StaticDropdown({
      displayName: "Language",
      required: false,
      options: {
        options: [
          { label: "Français", value: "fr" },
          { label: "English", value: "en" },
        ],
      },
    }),
  },
  async run(context) {
    const lang = context.propsValue.language || "fr";
    const systemPrompt = lang === "fr"
      ? "Génère un résumé concis du document suivant. Capture les points clés et informations essentielles."
      : "Generate a concise summary of the following document. Capture key points and essential information.";
    const userPrompt = context.propsValue.content;
    const summary = await callGroq(process.env.GROQ_API_KEY || "", systemPrompt, userPrompt);
    return { summary };
  },
});
