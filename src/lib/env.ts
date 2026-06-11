/**
 * Centralized, branchable environment configuration.
 *
 * The app is designed to build and run even when external services are not
 * configured yet (placeholders). Callers should check the `is*Configured`
 * flags before using a service and degrade gracefully when it is missing.
 *
 * Never expose server-only secrets to the client: only NEXT_PUBLIC_* values
 * are safe to read in browser code.
 */

export const env = {
  // App
  APP_URL: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",

  // Supabase (public)
  SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  // Supabase (server-only)
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,

  // Storage
  STORAGE_BUCKET_CLAIM_DOCUMENTS:
    process.env.STORAGE_BUCKET_CLAIM_DOCUMENTS ?? "claim-documents",

  // OpenAI (server-only)
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  OPENAI_MODEL: process.env.OPENAI_MODEL ?? "gpt-4o-mini",

  // OCR (server-only). Off by default — enable once the Tesseract model is
  // reachable in your environment (it downloads on first use).
  OCR_ENABLED: process.env.OCR_ENABLED === "true",

  // Email (Resend) — notifications
  RESEND_API_KEY: process.env.RESEND_API_KEY,
  EMAIL_FROM: process.env.EMAIL_FROM ?? "ClaimCare AI <onboarding@resend.dev>",

  // Stripe
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
  STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
} as const;

/** True when Supabase public credentials are present (auth/db/storage usable). */
export const isSupabaseConfigured = Boolean(
  env.SUPABASE_URL && env.SUPABASE_ANON_KEY,
);

/** True when the Supabase service-role key is present (admin/server tasks). */
export const isSupabaseAdminConfigured = Boolean(
  env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY,
);

/** True when an OpenAI key is present (real AI calls; otherwise mocked). */
export const isOpenAIConfigured = Boolean(env.OPENAI_API_KEY);

/** True when image OCR is explicitly enabled. */
export const isOcrEnabled = env.OCR_ENABLED;

/** True when an email provider (Resend) is configured. */
export const isEmailConfigured = Boolean(env.RESEND_API_KEY);

/** True when Stripe is configured (billing live; otherwise placeholder). */
export const isStripeConfigured = Boolean(
  env.STRIPE_SECRET_KEY && env.STRIPE_PUBLISHABLE_KEY,
);
