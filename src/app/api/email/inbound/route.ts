import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { env } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";
import { processInboundEmail } from "@/lib/claimguard/email/inbound";

export const runtime = "nodejs";

/**
 * Inbound email webhook (Resend Inbound / Svix).
 *
 * Verifies the Svix signature when INBOUND_WEBHOOK_SECRET is set, then routes
 * the email to its case by the `case+CG-YYYY-NNNNNN@` reply address. Uses the
 * service-role client because there is no user session on a webhook.
 */

function verifySvix(
  secret: string,
  headers: Headers,
  rawBody: string,
): boolean {
  const id = headers.get("svix-id");
  const timestamp = headers.get("svix-timestamp");
  const signatureHeader = headers.get("svix-signature");
  if (!id || !timestamp || !signatureHeader) return false;

  // Secret is "whsec_<base64>"; the HMAC key is the decoded base64.
  const key = secret.startsWith("whsec_") ? secret.slice(6) : secret;
  const signedContent = `${id}.${timestamp}.${rawBody}`;
  const expected = crypto
    .createHmac("sha256", Buffer.from(key, "base64"))
    .update(signedContent)
    .digest("base64");

  // Header is space-separated "v1,<sig> v1,<sig>"
  for (const part of signatureHeader.split(" ")) {
    const sig = part.includes(",") ? part.split(",")[1] : part;
    try {
      if (
        sig.length === expected.length &&
        crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))
      ) {
        return true;
      }
    } catch {
      // length mismatch → not equal
    }
  }
  return false;
}

/* eslint-disable @typescript-eslint/no-explicit-any */

/** First value that is a non-empty (non-whitespace) string. */
function firstNonEmpty(...vals: any[]): string | null {
  for (const v of vals) {
    if (typeof v === "string" && v.trim()) return v;
  }
  return null;
}

/** One address from a string or an object ({email|address|value}). */
function addr(v: any): string | null {
  if (!v) return null;
  if (typeof v === "string") return v;
  if (typeof v === "object") return v.email ?? v.address ?? v.value ?? null;
  return null;
}

/** A recipient/sender field: string, object, or array of either. */
function addrList(v: any): string | null {
  if (Array.isArray(v)) {
    const joined = v.map(addr).filter(Boolean).join(", ");
    return joined || null;
  }
  return addr(v);
}

/** Convert an HTML body to readable plain text. */
function stripHtml(html: string | null): string | null {
  if (!html) return null;
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|tr|li|h[1-6])>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Drop the quoted original below common reply separators. */
function stripQuoted(text: string | null): string | null {
  if (!text) return text;
  const markers = [
    /^\s*On .+ wrote:\s*$/im,
    /^\s*Le .+ a écrit\s*:\s*$/im,
    /^\s*-{2,}\s*(Original Message|Message d'origine)\s*-{2,}/im,
    /^\s*De\s*:.+$/im,
  ];
  let cut = text.length;
  for (const re of markers) {
    const m = text.match(re);
    if (m && m.index !== undefined && m.index < cut) cut = m.index;
  }
  const body = text
    .slice(0, cut)
    .split("\n")
    .filter((line) => !/^\s*>/.test(line))
    .join("\n")
    .trim();
  return body || text.trim();
}

function pickEmail(payload: any): {
  to: string | null;
  from: string | null;
  subject: string | null;
  text: string | null;
  externalId: string | null;
} {
  const d = payload?.data ?? payload ?? {};
  const html = stripHtml(
    firstNonEmpty(d.html, d.Html, d.body_html, d["body-html"]),
  );
  const rawText = firstNonEmpty(
    d.text,
    d.plain,
    d["body-plain"],
    d.Text,
    d.body,
    html,
  );
  return {
    to: addrList(d.to ?? d.To ?? d.recipient),
    from: addrList(d.from ?? d.From ?? d.sender),
    subject: firstNonEmpty(d.subject, d.Subject),
    text: stripQuoted(rawText),
    externalId: firstNonEmpty(d.email_id, d.id, payload?.id),
  };
}

const DEBUG_BUCKET = "claim-documents";
const DEBUG_PATH = "debug/last-inbound.json";

/**
 * Diagnostic: return the last raw inbound payload we captured, so we can see
 * exactly what Resend sends. Protected by CRON_SECRET: `?key=<secret>&debug=1`.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  if (!searchParams.get("debug")) {
    return NextResponse.json({ ok: true, hint: "POST inbound webhook here." });
  }
  if (!env.CRON_SECRET || searchParams.get("key") !== env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "no admin client" }, { status: 400 });
  }
  const { data, error } = await admin.storage
    .from(DEBUG_BUCKET)
    .download(DEBUG_PATH);
  if (error || !data) {
    return NextResponse.json(
      { error: "no capture yet", detail: error?.message ?? null },
      { status: 404 },
    );
  }
  const text = await data.text();
  return new NextResponse(text, {
    status: 200,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

export async function POST(req: Request) {
  const rawBody = await req.text();

  if (env.INBOUND_WEBHOOK_SECRET) {
    if (!verifySvix(env.INBOUND_WEBHOOK_SECRET, req.headers, rawBody)) {
      return NextResponse.json({ error: "invalid signature" }, { status: 401 });
    }
  }

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const admin = createAdminClient();
  if (!admin) {
    // Accept so the provider doesn't retry forever; nothing to persist.
    return NextResponse.json({ ok: true, stored: false });
  }

  // Best-effort capture of the raw payload for diagnostics (never blocks).
  try {
    await admin.storage
      .from(DEBUG_BUCKET)
      .upload(DEBUG_PATH, new Blob([rawBody], { type: "application/json" }), {
        upsert: true,
        contentType: "application/json",
      });
  } catch {
    // ignore capture failures
  }

  const email = pickEmail(payload);
  const result = await processInboundEmail(admin, email);

  // Always 200 for handled-but-unrouted so the provider doesn't hammer retries.
  return NextResponse.json(result);
}
