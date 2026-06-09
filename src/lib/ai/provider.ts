import { env } from "@/lib/env";

/**
 * Provider-agnostic JSON completion. Currently backed by the OpenAI REST API
 * (no SDK dependency). Swap the implementation here to use another provider;
 * callers depend only on this function's shape.
 *
 * Throws on transport/HTTP errors so callers can fall back gracefully.
 */
export async function generateJSON({
  system,
  user,
  temperature = 0.2,
}: {
  system: string;
  user: string;
  temperature?: number;
}): Promise<string> {
  if (!env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: env.OPENAI_MODEL,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      response_format: { type: "json_object" },
      temperature,
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`AI provider error ${res.status}: ${detail.slice(0, 200)}`);
  }

  const json = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const content = json.choices?.[0]?.message?.content;
  if (!content) throw new Error("AI provider returned empty content");
  return content;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

/** Free-form text completion (no JSON forcing) for conversational replies. */
export async function generateText({
  system,
  messages,
  temperature = 0.5,
}: {
  system: string;
  messages: ChatMessage[];
  temperature?: number;
}): Promise<string> {
  if (!env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: env.OPENAI_MODEL,
      messages: [{ role: "system", content: system }, ...messages],
      temperature,
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`AI provider error ${res.status}: ${detail.slice(0, 200)}`);
  }

  const json = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const content = json.choices?.[0]?.message?.content;
  if (!content) throw new Error("AI provider returned empty content");
  return content;
}
