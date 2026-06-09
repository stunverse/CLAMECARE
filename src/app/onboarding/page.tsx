import { redirect } from "next/navigation";

// Canonical onboarding lives at /claims/new (inside the app shell).
export default function OnboardingPage() {
  redirect("/claims/new");
}
