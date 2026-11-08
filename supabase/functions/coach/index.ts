// Nutra: coach
// Answers a food, habit or training question with short, safe, educational text.
// The app only calls this when its 14 built-in answers don't cover the question,
// and it has already routed safety topics (diagnosis, eating disorders, etc.) to a
// "please see a professional" reply before getting here.
//
// The Claude API key lives ONLY here, as the Supabase secret ANTHROPIC_API_KEY.
import Anthropic from "npm:@anthropic-ai/sdk@1.6.0";

// Uses the ANTHROPIC_API_KEY secret. Returns undefined when it hasn't been added yet.
let client: Anthropic | undefined;
function claude(): Anthropic | undefined {
  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!apiKey) return undefined;
  client ??= new Anthropic({ apiKey });
  return client;
}

const MAX_QUESTION_LENGTH = 1000;

const BASE_RULES = `You are Nutra's coach inside an educational nutrition and fitness app.
Answer in plain, warm, simple English, in 120 words or fewer, as plain text with no markdown, headings or lists.
Rules you always follow:
- Educational only. Never diagnose, never suggest treatment or medication changes, never promise weight loss or cures.
- If the question is about symptoms, illness, injury that is getting worse, pregnancy complications, eating disorders,
  or anything urgent, gently say a doctor or other health professional is the right person to ask, and stop there.
- Never shame, never use pressure or guilt, never call foods good or bad. No food is forbidden.
- Never suggest eating very little, skipping meals to lose weight, fasting, or cutting weight fast.
- Do not recommend specific supplements, brands or diets by name.
- If you are not sure, say so briefly.`;

const GENTLE_RULES = `
This person uses gentle mode: do not mention any numbers at all (no calories, grams, percentages, weights or amounts).
Talk about food groups, variety, and how meals feel instead.`;

Deno.serve(async (req) => {
  if (req.method !== "POST") return reply({ error: "Use POST" }, 405);

  let body: { question?: unknown; context?: unknown; gentle?: unknown };
  try {
    body = await req.json();
  } catch {
    return reply({ error: "Body must be JSON" }, 400);
  }
  const question = typeof body.question === "string" ? body.question.trim() : "";
  const context = typeof body.context === "string" ? body.context.slice(0, 300) : "";
  const gentle = body.gentle === "true" || body.gentle === true;
  if (!question || question.length > MAX_QUESTION_LENGTH) {
    return reply({ error: "Question missing or too long" }, 400);
  }

  const api = claude();
  if (!api) return reply({ error: "Server not set up: add the ANTHROPIC_API_KEY secret" }, 500);

  try {
    const response = await api.beta.messages.create({
      model: "claude-opus-5-5",
      max_tokens: 8000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: { effort: "medium" },
      system: BASE_RULES + (gentle ? GENTLE_RULES : ""),
      messages: [{
        role: "user",
        content: `About me (from the app): ${context || "no details"}\n\nMy question: ${question}`,
      }],
    });

    if (response.stop_reason === "refusal") {
      return reply({
        answer: "I can't help with that one. A doctor or other health professional is the best person to ask.",
      });
    }

    const answer = response.content
      .flatMap((block) => (block.type === "text" ? [block.text] : []))
      .join("\n")
      .trim();
    if (!answer) return reply({ error: "Empty answer" }, 502);
    return reply({ answer });
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
