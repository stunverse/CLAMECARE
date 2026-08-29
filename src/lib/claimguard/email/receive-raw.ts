import { env, isEmailConfigured } from "@/lib/env";

/**
 * Resend Inbound delivers only the envelope (from/to/subject/email_id) in the
 * webhook; the body must be fetched from the Receiving API with the email_id.
 * We try the known REST shapes and return the first that yields content, plus a
 * short debug trail of the status codes so a wrong path is easy to spot.
 */
export async function fetchInboundEmail(emailId: string): Promise<{
  text: string | null;
  html: string | null;
  debug: string;
}> {
  if (!isEmailConfigured || !emailId) {
    return { text: null, html: null, debug: "no-key-or-id" };
  }

  const endpoints = [
    `https://api.resend.com/emails/receiving/${emailId}`,
    `https://api.resend.com/receiving/emails/${emailId}`,
    `https://api.resend.com/emails/${emailId}`,
  ];

  const notes: string[] = [];
  for (const url of endpoints) {
    const path = url.slice("https://api.resend.com".length);
    try {
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${env.RESEND_API_KEY}` },
      });
      notes.push(`${path}->${res.status}`);
      if (res.ok) {
        const json = (await res.json()) as Record<string, unknown>;
        const text = typeof json.text === "string" ? json.text : null;
        const html = typeof json.html === "string" ? json.html : null;
        if ((text && text.trim()) || (html && html.trim())) {
          return { text, html, debug: notes.join(" | ") };
        }
      }
    } catch (e) {
      notes.push(`${path}->ERR:${(e as Error).message.slice(0, 40)}`);
    }
  }
  return { text: null, html: null, debug: notes.join(" | ") };
}
