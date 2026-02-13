import { openai } from "@ai-sdk/openai";
import { streamText } from "ai";

// Important: Set the runtime to edge
export const runtime = "edge";

export async function POST(req: Request): Promise<Response> {
  try {
    const body = await req.json();

    if (!body || typeof body.prompt !== "string") {
      return new Response(
        JSON.stringify({ error: "Invalid request: prompt is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    const { prompt } = body;

    if (!prompt.trim()) {
      return new Response(
        JSON.stringify({ error: "Invalid request: prompt cannot be empty" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    const result = await streamText({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      model: openai("gpt-4-turbo") as any, // Type assertion for monorepo version compatibility
      messages: [
        {
          role: "system",
          content: `You are a helpful AI writing assistant embedded in a rich text editor.
        Your goal is to help the user write, edit, and improve their text.
        You can improve, summarize, expand, translate, or simplify text based on the user's request.
        Always reply in the language of the prompt or as requested.
        Output valid markdown.`,
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error("Generate API error:", error);

    // Handle specific error types
    if (error instanceof SyntaxError) {
      return new Response(
        JSON.stringify({ error: "Invalid JSON in request body" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    // Check for API key issues
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (
      errorMessage.includes("API key") ||
      errorMessage.includes("authentication")
    ) {
      return new Response(
        JSON.stringify({ error: "AI service configuration error" }),
        { status: 503, headers: { "Content-Type": "application/json" } },
      );
    }

    // Check for rate limiting
    if (errorMessage.includes("rate limit") || errorMessage.includes("429")) {
      return new Response(
        JSON.stringify({
          error: "Rate limit exceeded. Please try again later.",
        }),
        { status: 429, headers: { "Content-Type": "application/json" } },
      );
    }

    // Generic error
    return new Response(
      JSON.stringify({
        error: "An unexpected error occurred while generating content",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
}
