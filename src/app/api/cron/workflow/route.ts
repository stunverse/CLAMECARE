import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";
import { processDueJobs } from "@/lib/claimguard/workflow/engine";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Workflow tick (cahier des charges §62-5/6). Runs the due job queue:
 * first contacts, reminders, payment-due checks. Intended to be called by a
 * scheduler (Vercel Cron) on a regular cadence. Idempotent per job.
 *
 * Authorized by CRON_SECRET when set (Vercel Cron sends it as a Bearer token);
 * always allowed when no secret is configured (local/demo).
 */
async function run(req: Request): Promise<NextResponse> {
  if (env.CRON_SECRET) {
    const auth = req.headers.get("authorization");
    const url = new URL(req.url);
    const provided =
      auth?.replace(/^Bearer\s+/i, "") ?? url.searchParams.get("secret");
    if (provided !== env.CRON_SECRET) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ ok: false, reason: "admin_not_configured" });
  }

  const result = await processDueJobs(admin, { limit: 50 });
  return NextResponse.json({ ok: true, ...result });
}

export async function GET(req: Request) {
  return run(req);
}

export async function POST(req: Request) {
  return run(req);
}
