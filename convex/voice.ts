"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import OpenAI from "openai";
import { logger } from "./lib/logger";
import {
	checkIntegration,
	actionError,
	actionSuccess,
	type ActionResult,
} from "./lib/env";

// Lazy initialization - client created only when action is called
function getOpenAIClient(): OpenAI | null {
	const apiKey = process.env.OPENAI_API_KEY;
	if (!apiKey) {
		return null;
	}
	return new OpenAI({ apiKey });
}

// Note: generateUploadUrl and saveVoiceNote mutations are in voice_db.ts
// Import them from api.voice_db instead of api.voice

export const transcribeAction = action({
	args: { storageId: v.string() },
	handler: async (ctx, args): Promise<ActionResult<string>> => {
		// Check if OpenAI is configured
		const integrationError = checkIntegration("openai");
		if (integrationError) return integrationError;

		const openai = getOpenAIClient();
		if (!openai) {
			return actionError(
				"OpenAI API key is not configured. Voice transcription is unavailable.",
				"INTEGRATION_DISABLED",
			);
		}

		try {
			const fileUrl = await ctx.storage.getUrl(args.storageId);
			if (!fileUrl) {
				return actionError("Audio file not found", "NOT_FOUND");
			}

			const response = await fetch(fileUrl);
			const blob = await response.blob();
			const file = new File([blob], "recording.webm", { type: "audio/webm" });

			const transcription = await openai.audio.transcriptions.create({
				file: file,
				model: "whisper-1",
			});

			return actionSuccess(transcription.text);
		} catch (error) {
			logger.error("Voice transcription failed", { error: String(error) });
			return actionError(
				"Failed to transcribe audio. Please try again.",
				"API_ERROR",
			);
		}
	},
});
