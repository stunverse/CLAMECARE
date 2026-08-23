import type { Metadata } from "next";
import { getAdminContext } from "@/lib/admin/guard";
import { AutomationSettingsForm } from "@/components/admin/automation-settings-form";
import {
  parseRemindersConfig,
  DEFAULT_REMINDERS,
} from "@/lib/claimguard/workflow/schedule";

export const metadata: Metadata = { title: "Admin · Automatisations" };

const DEFAULT_THRESHOLDS = {
  auto_send_min_confidence: 0.9,
  review_min_confidence: 0.6,
};

export default async function AdminAutomationsPage() {
  const { supabase, role } = await getAdminContext();

  let reminders = DEFAULT_REMINDERS;
  let thresholds = DEFAULT_THRESHOLDS;

  if (supabase) {
    const { data } = await supabase
      .from("automation_settings")
      .select("key, value")
      .in("key", ["reminders", "ai_thresholds"])
      .returns<{ key: string; value: unknown }[]>();
    for (const row of data ?? []) {
      if (row.key === "reminders") reminders = parseRemindersConfig(row.value);
      if (row.key === "ai_thresholds") {
        const v = (row.value ?? {}) as Partial<typeof DEFAULT_THRESHOLDS>;
        thresholds = {
          auto_send_min_confidence:
            typeof v.auto_send_min_confidence === "number"
              ? v.auto_send_min_confidence
              : DEFAULT_THRESHOLDS.auto_send_min_confidence,
          review_min_confidence:
            typeof v.review_min_confidence === "number"
              ? v.review_min_confidence
              : DEFAULT_THRESHOLDS.review_min_confidence,
        };
      }
    }
  }

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold tracking-tight">Automatisations</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Cadence des relances, fenêtre d&apos;envoi et seuils de confiance IA.
      </p>
      <AutomationSettingsForm
        reminders={reminders}
        thresholds={thresholds}
        readOnly={role !== "admin"}
      />
    </div>
  );
}
