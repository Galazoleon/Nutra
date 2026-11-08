// Nutra: analyze-meal
// Gets a meal photo from the app and returns a short list of the foods in it,
// e.g. "2 eggs, 1 slice toast, 1 coffee". The app turns that text into foods
// with its own parser, so the person always reviews and edits before saving.
//
// The Claude API key lives ONLY here, as the Supabase secret ANTHROPIC_API_KEY.
// It is never sent to the app.
import Anthropic from "npm:@anthropic-ai/sdk@1.6.0";

// Uses the ANTHROPIC_API_KEY secret. Returns undefined when it hasn't been added yet.
let client: Anthropic | undefined;
function claude(): Anthropic | undefined {
  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!apiKey) return undefined;
  client ??= new Anthropic({ apiKey });
  return client;
}

// About 5 MB of image. The app shrinks photos well below this before sending.
const MAX_BASE64_LENGTH = 7_000_000;

const SYSTEM = `You look at a photo of a meal and list the foods you can see, for a nutrition-education app.
Reply with ONE line only: a comma-separated list, each item starting with a simple amount, for example:
2 eggs, 1 slice toast, 1 cup coffee
Rules:
- Use common, plain food names (e.g. "rice", "chicken breast", "salad", "banana").
- Estimate amounts in everyday portions (pieces, slices, cups). Never give calories or nutrients.
- If you are unsure of an item, give your best plain guess.
- If there is no food or drink in the photo, reply exactly: NO_FOOD`;

Deno.serve(async (req) => {
  if (req.method !== "POST") return reply({ error: "Use POST" }, 405);

  let body: { imageBase64?: unknown };
  try {
    body = await req.json();
  } catch {
    return reply({ error: "Body must be JSON" }, 400);
  }
  const image = typeof body.imageBase64 === "string" ? body.imageBase64 : "";
  if (!image || image.length > MAX_BASE64_LENGTH) {
    return reply({ error: "Image missing or too large" }, 400);
  }

  const api = claude();
  if (!api) return reply({ error: "Server not set up: add the ANTHROPIC_API_KEY secret" }, 500);

  try {
    const response = await api.beta.messages.create({
      model: "claude-opus-5-5",
      max_tokens: 8000,
      // If Claude's safety checks decline, Anthropic retries on a suitable model automatically.
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: { effort: "low" }, // a simple, quick task
      system: SYSTEM,
      messages: [{
        role: "user",
        content: [
          { type: "image", source: { type: "base64", media_type: "image/jpeg", data: image } },
          { type: "text", text: "List the foods in this meal." },
        ],
      }],
    });

    if (response.stop_reason === "refusal") return reply({ error: "Declined" }, 422);

    const text = response.content
      .flatMap((block) => (block.type === "text" ? [block.text] : []))
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();
    if (!text || text.toUpperCase().startsWith("NO_FOOD")) {
      return reply({ error: "No food found" }, 422);
    }
    return reply({ description: text.slice(0, 500) });
  } catch (error) {
    if (error instanceof Anthropic.RateLimitError) return reply({ error: "Busy, try again" }, 429);
    if (error instanceof Anthropic.AuthenticationError) {
      console.error("ANTHROPIC_API_KEY secret is missing or wrong");
      return reply({ error: "Server not set up" }, 500);
    }
    if (error instanceof Anthropic.APIError) {
      console.error(`Claude API error ${error.status}: ${error.message}`);
      return reply({ error: "Upstream error" }, 502);
    }
    console.error(error);
    return reply({ error: "Server error" }, 500);
  }
});

function reply(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
