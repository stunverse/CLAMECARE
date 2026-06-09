import type { Metadata } from "next";
import { getUserTickets } from "@/lib/data/support";
import { SupportClient } from "@/components/support/support-client";
import { Card, CardContent } from "@/components/ui/card";
import { DisclaimerBanner } from "@/components/disclaimer-banner";

export const metadata: Metadata = { title: "Support" };

const FAQ = [
  {
    q: "Is ClaimCare AI a law firm?",
    a: "No. ClaimCare AI provides informational, documentary, and administrative assistance only. It is not a law firm and does not provide legal advice. For legal advice, consult a licensed attorney.",
  },
  {
    q: "How does the AI analysis work?",
    a: "It reviews the claim details and documents you provide to detect the likely denial reason, surface strengths and weaknesses, score your file, and suggest next steps. It never guarantees an outcome.",
  },
  {
    q: "How do I export a letter as a PDF?",
    a: "Generate a letter in the Letters tab, then click ‘Print / Save as PDF’ and choose ‘Save as PDF’ in your browser's print dialog.",
  },
  {
    q: "Will my documents stay private?",
    a: "Your documents are stored securely and isolated to your account, with access restricted by row-level security and short-lived signed URLs.",
  },
  {
    q: "Can I cancel my subscription?",
    a: "Yes. Go to Billing and open ‘Manage billing’ to upgrade, downgrade, or cancel at any time.",
  },
];

export default async function SupportPage() {
  const { tickets, isDemo } = await getUserTickets();

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 md:px-6">
      <h1 className="mb-1 text-2xl font-bold tracking-tight">Help &amp; support</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Find answers or contact our team.
      </p>

      <div className="mb-8">
        <h2 className="mb-3 text-sm font-semibold">Frequently asked questions</h2>
        <div className="grid gap-3 md:grid-cols-2">
          {FAQ.map((item) => (
            <Card key={item.q}>
              <CardContent className="p-4">
                <p className="text-sm font-medium">{item.q}</p>
                <p className="mt-1 text-sm text-muted-foreground">{item.a}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <SupportClient initialTickets={tickets} canSubmit={!isDemo} />

      <div className="mt-8">
        <DisclaimerBanner variant="primary" />
      </div>
    </div>
  );
}
