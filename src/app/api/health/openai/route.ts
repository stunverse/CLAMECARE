import { NextResponse } from "next/server";
import { env, isOpenAIConfigured } from "@/lib/env";

export const dynamic = "force-dynamic";

/**
 * Live OpenAI connectivity test. Makes a tiny request and reports the exact
 * status/error so misconfigurations (bad key, model access, quota) are
 * diagnosable. Never returns the key itself.
 */
export async function GET() {
  if (!isOpenAIConfigured) {
    return NextResponse.json({ ok: false, reason: "no_key_on_server" });
  }

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: env.OPENAI_MODEL,
        messages: [{ role: "user", content: "ping" }],
        max_tokens: 5,
      }),
    });

    const body = await res.text();
    return NextResponse.json({
      ok: res.ok,
      status: res.status,
      model: env.OPENAI_MODEL,
      body: body.slice(0, 600),
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message });
  }
}
