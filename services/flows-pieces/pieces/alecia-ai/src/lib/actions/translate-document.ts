import { createAction, Property } from "@activepieces/pieces-framework";
import { callGroq } from "../groq-client";

export const translateDocument = createAction({
  name: "translate_document",
  displayName: "Translate Document",
  description: "Translate document content between French and English",
  props: {
    content: Property.LongText({ displayName: "Document Content", required: true }),
    direction: Property.StaticDropdown({
      displayName: "Translation Direction",
      required: true,
      options: {
        options: [
          { label: "Français → English", value: "fr-en" },
          { label: "English → Français", value: "en-fr" },
        ],
      },
    }),
  },
  async run(context) {
    const systemPrompt = context.propsValue.direction === "fr-en"
      ? "Translate the following French text to English. Maintain professional tone and technical accuracy."
      : "Traduis le texte anglais suivant en français. Maintiens un ton professionnel et une précision technique.";
    const userPrompt = context.propsValue.content;
    const translated = await callGroq(process.env.GROQ_API_KEY || "", systemPrompt, userPrompt);
    return { translated };
  },
});
