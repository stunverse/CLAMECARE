import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * OAuth / email-confirmation callback.
 * Exchanges the `code` for a session, then redirects to `next` (default
 * /dashboard). On failure, returns the user to /login with an error flag.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dossiers";

  if (code) {
    const supabase = await createClient();
    if (supabase) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) {
        let dest = next;

        // Route first-time users (typically Google sign-in, which never sees
        // the signup checkboxes) through onboarding so they accept the legal
        // consents and the intervention mandate before reaching the app.
        // The password-reset flow (next=/settings) is left untouched.
        if (next !== "/settings") {
          const {
            data: { user },
          } = await supabase.auth.getUser();
          if (user) {
            const { data: profile } = await supabase
              .from("profiles")
              .select("terms_accepted_at, mandate_accepted_at")
              .eq("id", user.id)
              .maybeSingle<{
                terms_accepted_at: string | null;
                mandate_accepted_at: string | null;
              }>();
            const needsOnboarding =
              !profile?.terms_accepted_at || !profile?.mandate_accepted_at;
            if (needsOnboarding) dest = "/onboarding";
          }
        }

        return NextResponse.redirect(`${origin}${dest}`);
      }
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback`);
}
