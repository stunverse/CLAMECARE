import type { Metadata } from "next";
import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";

export const metadata: Metadata = { title: "Start a new claim" };

export default function NewClaimPage() {
  return <OnboardingWizard />;
}
