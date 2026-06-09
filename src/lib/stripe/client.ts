import Stripe from "stripe";
import { env, isStripeConfigured } from "@/lib/env";

/**
 * Server-only Stripe client. Null when Stripe is not configured (placeholder
 * mode), so billing UI degrades gracefully instead of crashing.
 */
export const stripe: Stripe | null = env.STRIPE_SECRET_KEY
  ? new Stripe(env.STRIPE_SECRET_KEY)
  : null;

export { isStripeConfigured };
