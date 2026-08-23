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
function pickEmail(payload: any): {
  to: string | null;
  from: string | null;
  subject: string | null;
  text: string | null;
  externalId: string | null;
} {
  const d = payload?.data ?? payload ?? {};
  const toRaw = d.to ?? d.To ?? d.recipient ?? null;
  const to = Array.isArray(toRaw) ? toRaw.join(", ") : toRaw;
  const fromRaw = d.from ?? d.From ?? d.sender ?? null;
  const from =
    typeof fromRaw === "object" && fromRaw
      ? (fromRaw.email ?? fromRaw.address ?? null)
      : fromRaw;
  return {
    to: to ?? null,
    from: from ?? null,
    subject: d.subject ?? d.Subject ?? null,
    text: d.text ?? d.plain ?? d["body-plain"] ?? d.html ?? null,
    externalId: d.email_id ?? d.id ?? payload?.id ?? null,
  };
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

  const email = pickEmail(payload);
  const result = await processInboundEmail(admin, email);

  // Always 200 for handled-but-unrouted so the provider doesn't hammer retries.
  return NextResponse.json(result);
}
