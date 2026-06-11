import { env, isEmailConfigured } from "@/lib/env";

/**
 * Send a transactional email via Resend. Branchable: a no-op when no provider
 * is configured (RESEND_API_KEY). Best-effort — never throws into callers.
 */
export async function sendEmail(input: {
  to: string;
  subject: string;
  html: string;
}): Promise<void> {
  if (!isEmailConfigured || !input.to) return;

  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: env.EMAIL_FROM,
        to: [input.to],
        subject: input.subject,
        html: input.html,
      }),
    });
  } catch {
    // best-effort
  }
}

/** Minimal branded HTML wrapper for notification emails. */
export function notificationEmailHtml(
  title: string,
  message: string,
  actionUrl?: string,
): string {
  const link = actionUrl
    ? `<p style="margin-top:16px"><a href="${env.APP_URL}${actionUrl}" style="background:#2563eb;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none;display:inline-block">Open in ClaimCare AI</a></p>`
    : "";
  return `<div style="font-family:system-ui,Arial,sans-serif;max-width:520px;margin:0 auto;padding:24px;color:#0f1b2d">
    <p style="font-weight:600;font-size:18px">ClaimCare AI</p>
    <h1 style="font-size:18px">${title}</h1>
    <p style="color:#5b6b80">${message}</p>
    ${link}
    <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0" />
    <p style="font-size:12px;color:#94a3b8">ClaimCare AI provides informational assistance only and is not a law firm.</p>
  </div>`;
}
