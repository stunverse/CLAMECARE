"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import {
  updateRemindersSettings,
  updateThresholdsSettings,
} from "@/lib/admin/automation-settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const DAY_LABELS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

export function AutomationSettingsForm({
  reminders,
  thresholds,
  readOnly,
}: {
  reminders: {
    reminder_days: number[];
    max_reminders: number;
    send_hour_start: number;
    send_hour_end: number;
    send_days: number[];
  };
  thresholds: { auto_send_min_confidence: number; review_min_confidence: number };
  readOnly: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  const [reminderDays, setReminderDays] = useState(reminders.reminder_days.join(", "));
  const [maxReminders, setMaxReminders] = useState(String(reminders.max_reminders));
  const [hourStart, setHourStart] = useState(String(reminders.send_hour_start));
  const [hourEnd, setHourEnd] = useState(String(reminders.send_hour_end));
  const [days, setDays] = useState<number[]>(reminders.send_days);

  const [autoConf, setAutoConf] = useState(String(thresholds.auto_send_min_confidence));
  const [reviewConf, setReviewConf] = useState(String(thresholds.review_min_confidence));

  function toggleDay(d: number) {
    setDays((cur) =>
      cur.includes(d) ? cur.filter((x) => x !== d) : [...cur, d].sort(),
    );
  }

  function saveReminders() {
    setMsg(null);
    startTransition(async () => {
      const res = await updateRemindersSettings({
        reminder_days: reminderDays
          .split(",")
          .map((s) => Number(s.trim()))
          .filter((n) => Number.isFinite(n) && n > 0),
        max_reminders: Number(maxReminders) || 3,
        send_hour_start: Number(hourStart) || 9,
        send_hour_end: Number(hourEnd) || 18,
        send_days: days,
      });
      setMsg(res.error ?? "Réglages de relance enregistrés.");
      if (!res.error) router.refresh();
    });
  }

  function saveThresholds() {
    setMsg(null);
    startTransition(async () => {
      const res = await updateThresholdsSettings({
        auto_send_min_confidence: Number(autoConf),
        review_min_confidence: Number(reviewConf),
      });
      setMsg(res.error ?? "Seuils IA enregistrés.");
      if (!res.error) router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      {msg && (
        <p className="rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm">
          {msg}
        </p>
      )}
      {readOnly && (
        <p className="rounded-lg border border-warning/30 bg-warning/10 px-3 py-2 text-sm text-warning">
          Lecture seule : seuls les administrateurs peuvent modifier ces réglages.
        </p>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Relances</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="reminder-days">Jours de relance (après J0)</Label>
              <Input
                id="reminder-days"
                value={reminderDays}
                onChange={(e) => setReminderDays(e.target.value)}
                placeholder="3, 7, 14"
                disabled={readOnly}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="max-reminders">Nombre maximum de relances</Label>
              <Input
                id="max-reminders"
                value={maxReminders}
                onChange={(e) => setMaxReminders(e.target.value)}
                disabled={readOnly}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="hour-start">Heure d&apos;envoi (début)</Label>
              <Input
                id="hour-start"
                value={hourStart}
                onChange={(e) => setHourStart(e.target.value)}
                disabled={readOnly}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="hour-end">Heure d&apos;envoi (fin)</Label>
              <Input
                id="hour-end"
                value={hourEnd}
                onChange={(e) => setHourEnd(e.target.value)}
                disabled={readOnly}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Jours d&apos;envoi</Label>
            <div className="flex flex-wrap gap-1.5">
              {DAY_LABELS.map((label, i) => {
                const d = i + 1;
                const on = days.includes(d);
                return (
                  <button
                    key={d}
                    type="button"
                    disabled={readOnly}
                    onClick={() => toggleDay(d)}
                    className={
                      on
                        ? "rounded-md border border-brand bg-brand/10 px-3 py-1 text-xs font-medium text-brand"
                        : "rounded-md border border-border px-3 py-1 text-xs text-muted-foreground"
                    }
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
          {!readOnly && (
            <Button type="button" variant="brand" size="sm" onClick={saveReminders} disabled={pending}>
              {pending && <Loader2 className="size-4 animate-spin" />}
              Enregistrer les relances
            </Button>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Seuils de confiance IA</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="auto-conf">Envoi auto si confiance ≥</Label>
              <Input
                id="auto-conf"
                value={autoConf}
                onChange={(e) => setAutoConf(e.target.value)}
                placeholder="0.9"
                disabled={readOnly}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="review-conf">Revue humaine si confiance &lt;</Label>
              <Input
                id="review-conf"
                value={reviewConf}
                onChange={(e) => setReviewConf(e.target.value)}
                placeholder="0.6"
                disabled={readOnly}
              />
            </div>
          </div>
          {!readOnly && (
            <Button type="button" variant="brand" size="sm" onClick={saveThresholds} disabled={pending}>
              {pending && <Loader2 className="size-4 animate-spin" />}
              Enregistrer les seuils
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
