import { env, isEmailConfigured } from "@/lib/env";

/**
 * Low-level Resend send for case correspondence. Supports a plain-text body
 * and a Reply-To (the per-case inbound address). Branchable: returns a
 * synthetic id when no provider is configured so the flow stays demoable.
 */
export async function sendRawEmail(input: {
  from: string;
  to: string;
  replyTo?: string | null;
  subject: string;
  text: string;
}): Promise<{ id: string | null; sent: boolean; error?: string }> {
  if (!isEmailConfigured) {
    return { id: null, sent: false };
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: input.from,
        to: [input.to],
        subject: input.subject,
        text: input.text,
        ...(input.replyTo ? { reply_to: input.replyTo } : {}),
      }),
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      return { id: null, sent: false, error: `Resend ${res.status}: ${detail.slice(0, 160)}` };
    }
    const json = (await res.json()) as { id?: string };
    return { id: json.id ?? null, sent: true };
  } catch (e) {
    return { id: null, sent: false, error: (e as Error).message };
  }
}
