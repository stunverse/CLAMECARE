import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * TEMPORARY diagnostic: run the raw case INSERT (and the timeline/audit inserts)
 * as the signed-in user and return the exact DB errors. Visit while logged in.
 * To be removed once the case-creation 500 is fixed.
 */
export async function GET() {
  const out: Record<string, unknown> = {};
  try {
    const supabase = await createClient();
    if (!supabase) return NextResponse.json({ step: "no-supabase" });

    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser();
    out.auth = { userId: user?.id ?? null, authErr: authErr?.message ?? null };
    if (!user) return NextResponse.json({ ...out, step: "no-user" });

    // 1) case insert
    const caseIns = await supabase
      .from("cases")
      .insert({
        user_id: user.id,
        debtor_name: "DIAG Test",
        debtor_email: "diag@test.fr",
        original_amount: 100,
        remaining_amount: 100,
        status: "draft",
        completeness_score: 20,
      })
      .select("id, case_reference")
      .single<{ id: string; case_reference: string }>();
    out.caseInsert = {
      data: caseIns.data,
      error: caseIns.error
        ? {
            message: caseIns.error.message,
            details: caseIns.error.details,
            hint: caseIns.error.hint,
            code: caseIns.error.code,
          }
        : null,
    };
    if (caseIns.error || !caseIns.data)
      return NextResponse.json({ ...out, step: "case-insert-failed" });

    const caseId = caseIns.data.id;

    // 2) timeline insert
    const tl = await supabase.from("case_timeline").insert({
      case_id: caseId,
      event_type: "case_created",
      title: "Dossier créé",
      new_status: "draft",
      source: "client",
    });
    out.timeline = tl.error
      ? { message: tl.error.message, code: tl.error.code, details: tl.error.details }
      : "ok";

    // 3) audit insert
    const au = await supabase.from("audit_logs").insert({
      user_id: user.id,
      case_id: caseId,
      action: "case_created",
      source: "client",
      metadata: { diag: true },
    });
    out.audit = au.error
      ? { message: au.error.message, code: au.error.code, details: au.error.details }
      : "ok";

    return NextResponse.json({ ...out, step: "done", caseId });
  } catch (e) {
    const err = e as Error;
    return NextResponse.json({
      ...out,
      step: "threw",
      message: err?.message ?? String(e),
      stack: (err?.stack ?? "").slice(0, 800),
    });
  }
}
