"use server";

import { openai } from "@ai-sdk/openai";
import { streamText } from "ai";
import { createStreamableValue } from "ai/rsc";

export async function generateOutlineAction(prompt: string) {
	const stream = createStreamableValue("");

	(async () => {
		try {
			const systemPrompt = `Tu es un expert en création de présentations M&A. Génère un plan structuré de 5-8 slides. Utilise un ton professionnel.

      IMPORTANT : Tu dois impérativement utiliser le format de balisage suivant pour que le système puisse lire ta réponse :

      <SLIDE>
        <TITLE>Titre de la diapositive (ex: Thèse d'investissement, Aperçu du Marché)</TITLE>
        <BULLET>Point clé 1 avec des données ou une affirmation forte</BULLET>
        <BULLET>Point clé 2</BULLET>
        <IMAGE>Description visuelle précise pour générer une image d'illustration professionnelle (ex: graphique de croissance, bureau moderne, équipe)</IMAGE>
      </SLIDE>

      Génère uniquement le contenu balisé, sans texte d'introduction ni de conclusion.`;

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const { textStream } = await streamText({
				model: openai("gpt-4-turbo") as any, // Type assertion for monorepo version compatibility
				system: systemPrompt,
				prompt: prompt,
				temperature: 0.7,
			});

			for await (const delta of textStream) {
				stream.update(delta);
			}

			stream.done();
		} catch (error) {
			console.error("Erreur lors de la génération de la présentation :", error);
			// We don't want to expose raw error objects to the stream in production usually,
			// but for debugging it helps. Let's send a friendly French message.
			stream.update(
				"\n<SLIDE><TITLE>Erreur</TITLE><BULLET>Une erreur est survenue lors de la génération.</BULLET></SLIDE>",
			);
			stream.done();
		}
	})();

	return { stream: stream.value };
}
