import { NextResponse } from "next/server";
import {
  env,
  isOpenAIConfigured,
  isSupabaseConfigured,
  isSupabaseAdminConfigured,
  isStripeConfigured,
  isEmailConfigured,
} from "@/lib/env";

// Always run fresh (never cached) so it reflects the live server env.
export const dynamic = "force-dynamic";

/**
 * Safe diagnostics: booleans + value lengths only — never the secrets
 * themselves. Lets us confirm which integrations the running server actually
 * sees.
 */
export function GET() {
  return NextResponse.json({
    openaiConfigured: isOpenAIConfigured,
    openaiKeyLength: env.OPENAI_API_KEY?.length ?? 0,
    openaiKeyDirectLength: process.env.OPENAI_API_KEY?.length ?? 0,
    openaiModel: env.OPENAI_MODEL,
    supabaseConfigured: isSupabaseConfigured,
    supabaseAdminConfigured: isSupabaseAdminConfigured,
    stripeConfigured: isStripeConfigured,
    emailConfigured: isEmailConfigured,
    appUrl: env.APP_URL,
  });
}
