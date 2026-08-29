import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { env, isSupabaseConfigured, isStripeConfigured } from "@/lib/env";

/** Route prefixes that require an authenticated session. */
const PROTECTED_PREFIXES = [
  "/dashboard",
  "/dossiers",
  "/clients",
  "/notifications",
  "/claims",
  "/packet",
  "/library",
  "/onboarding",
  "/settings",
  "/billing",
  "/support",
  "/admin",
];

/**
 * Route prefixes that require an ACTIVE PAID subscription (the actual app
 * usage). Excludes /billing, /settings, /onboarding and /admin so a subscriber-
 * less user can still reach the subscription page, manage their account, finish
 * onboarding, and staff can administer.
 */
const PAID_PREFIXES = [
  "/dashboard",
  "/dossiers",
  "/clients",
  "/notifications",
  "/claims",
  "/packet",
  "/library",
  "/support",
];

function matchesPrefix(pathname: string, prefixes: string[]): boolean {
  return prefixes.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}

function isProtected(pathname: string): boolean {
  return matchesPrefix(pathname, PROTECTED_PREFIXES);
}

function requiresSubscription(pathname: string): boolean {
  return matchesPrefix(pathname, PAID_PREFIXES);
}

/**
 * Refresh the Supabase session on every request and guard protected routes.
 *
 * When Supabase is not configured (placeholder mode) this is a no-op pass
 * through, so the app keeps working without keys.
 *
 * IMPORTANT: do not run logic between creating the client and calling
 * getUser() — it must stay adjacent to avoid hard-to-debug session bugs.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  if (!isSupabaseConfigured) return response;

  const supabase = createServerClient(env.SUPABASE_URL!, env.SUPABASE_ANON_KEY!, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  if (!user && isProtected(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(url);
  }

  // Paywall: MyDueGuard has no free plan — an active paid subscription is
  // required to use the app. Enforced only once Stripe is configured, so the
  // app stays usable before billing is wired. Staff (non-"user" roles) and the
  // billing/settings/onboarding pages are exempt.
  if (user && isStripeConfigured && requiresSubscription(pathname)) {
    const [{ data: profile }, { data: sub }] = await Promise.all([
      supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle<{ role: string | null }>(),
      supabase
        .from("subscriptions")
        .select("status")
        .eq("user_id", user.id)
        .maybeSingle<{ status: string | null }>(),
    ]);

    const isStaff = Boolean(profile?.role && profile.role !== "user");
    const hasActiveSub =
      sub?.status === "active" || sub?.status === "trialing";

    if (!isStaff && !hasActiveSub) {
      const url = request.nextUrl.clone();
      url.pathname = "/billing";
      url.search = "";
      url.searchParams.set("subscribe", "1");
      return NextResponse.redirect(url);
    }
  }

  return response;
}
