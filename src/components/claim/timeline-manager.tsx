"use client";

import { useMemo, useState, useTransition } from "react";
import { Plus, Pencil, Trash2, AlertTriangle, Sparkles, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/empty-state";
import {
  addTimelineEvent,
  updateTimelineEvent,
  deleteTimelineEvent,
  generateTimelineFromClaim,
} from "@/lib/timeline/actions";
import { detectTimelineIssues } from "@/lib/timeline/insights";
import { TIMELINE_EVENT_TYPE_LABELS } from "@/lib/labels";
import { TIMELINE_EVENT_TYPES } from "@/lib/types/enums";
import { formatDate } from "@/lib/format";
import type { TimelineEntry } from "@/lib/timeline/types";
import type { TimelineEventType } from "@/lib/types/enums";

const EMPTY = {
  event_type: "" as TimelineEventType | "",
  event_date: "",
  title: "",
  description: "",
};

export function TimelineManager({
  claimId,
  canPersist,
  initialEvents,
  appealDeadline,
}: {
  claimId: string;
  canPersist: boolean;
  initialEvents: TimelineEntry[];
  appealDeadline: string | null;
}) {
  const [events, setEvents] = useState<TimelineEntry[]>(initialEvents);
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  const sorted = useMemo(
    () =>
      [...events].sort((a, b) =>
        (a.event_date ?? "9999").localeCompare(b.event_date ?? "9999"),
      ),
    [events],
  );
  const issues = useMemo(
    () => detectTimelineIssues(events, appealDeadline),
    [events, appealDeadline],
  );

  function openAdd() {
    setForm(EMPTY);
    setEditingId(null);
    setShowForm(true);
    setError(undefined);
  }
  function openEdit(e: TimelineEntry) {
    setForm({
      event_type: e.event_type ?? "",
      event_date: e.event_date ?? "",
      title: e.title,
      description: e.description ?? "",
    });
    setEditingId(e.id);
    setShowForm(true);
    setError(undefined);
  }

  function save() {
    const input = {
      title:
        form.title.trim() ||
        (form.event_type
          ? TIMELINE_EVENT_TYPE_LABELS[form.event_type]
          : ""),
      description: form.description.trim() || null,
      event_date: form.event_date || null,
      event_type: form.event_type || null,
    };
    if (!input.title) {
      setError("Add a title or choose an event type.");
      return;
    }

    startTransition(async () => {
      if (editingId) {
        if (canPersist && !editingId.startsWith("seed-")) {
          const res = await updateTimelineEvent(editingId, input);
          if (res.error || !res.event) {
            setError(res.error ?? "Failed.");
            return;
          }
          setEvents((ev) =>
            ev.map((x) => (x.id === editingId ? res.event! : x)),
          );
        } else {
          setEvents((ev) =>
            ev.map((x) => (x.id === editingId ? { ...x, ...input } : x)),
          );
        }
      } else if (canPersist) {
        const res = await addTimelineEvent(claimId, input);
        if (res.error || !res.event) {
          setError(res.error ?? "Failed.");
          return;
        }
        setEvents((ev) => [...ev, res.event!]);
      } else {
        setEvents((ev) => [
          ...ev,
          { id: crypto.randomUUID(), ...input },
        ]);
      }
      setShowForm(false);
    });
  }

  function remove(id: string) {
    if (!window.confirm("Delete this event?")) return;
    startTransition(async () => {
      if (canPersist && !id.startsWith("seed-")) {
        await deleteTimelineEvent(id);
      }
      setEvents((ev) => ev.filter((x) => x.id !== id));
    });
  }

  function generate() {
    startTransition(async () => {
      const res = await generateTimelineFromClaim(claimId);
      if (res.events) setEvents((ev) => [...ev, ...res.events!]);
    });
  }

  return (
    <div className="space-y-4">
      {issues.length > 0 && (
        <Card className="border-warning/40 bg-warning/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <AlertTriangle className="size-4 text-warning" />
              Things to check
            </div>
            <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
              {issues.map((w, i) => (
                <li key={i}>• {w}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-wrap gap-2">
        <Button variant="brand" size="sm" onClick={openAdd}>
          <Plus className="size-4" />
          Add event
        </Button>
        {canPersist && (
          <Button
            variant="outline"
            size="sm"
            onClick={generate}
            disabled={pending}
          >
            <Sparkles className="size-4" />
            Generate from claim dates
          </Button>
        )}
      </div>

      {showForm && (
        <Card>
          <CardContent className="space-y-3 p-5">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Event type</Label>
                <Select
                  value={form.event_type}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      event_type: e.target.value as TimelineEventType,
                      title:
                        f.title ||
                        (e.target.value
                          ? TIMELINE_EVENT_TYPE_LABELS[
                              e.target.value as TimelineEventType
                            ]
                          : ""),
                    }))
                  }
                >
                  <option value="">Custom event…</option>
                  {TIMELINE_EVENT_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {TIMELINE_EVENT_TYPE_LABELS[t]}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Date</Label>
                <Input
                  type="date"
                  value={form.event_date}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, event_date: e.target.value }))
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                value={form.title}
                onChange={(e) =>
                  setForm((f) => ({ ...f, title: e.target.value }))
                }
                placeholder="What happened"
              />
            </div>
            <div className="space-y-2">
              <Label>Notes (optional)</Label>
              <Textarea
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
              />
            </div>
            {error && <p className="text-sm text-danger">{error}</p>}
            <div className="flex gap-2">
              <Button onClick={save} disabled={pending}>
                {editingId ? "Save changes" : "Add event"}
              </Button>
              <Button variant="ghost" onClick={() => setShowForm(false)}>
                <X className="size-4" />
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {sorted.length === 0 ? (
        <EmptyState
          icon={Plus}
          title="No events yet"
          description="Add the key dates of your claim to build a clear timeline."
        />
      ) : (
        <div className="relative space-y-4 pl-6">
          <span className="absolute left-2 top-2 bottom-2 w-px bg-border" />
          {sorted.map((e) => (
            <div key={e.id} className="relative">
              <span className="absolute -left-[18px] top-2 size-3 rounded-full border-2 border-background bg-brand" />
              <Card>
                <CardContent className="flex items-start justify-between gap-3 p-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-medium">{e.title}</span>
                      {e.event_type && (
                        <Badge variant="muted">
                          {TIMELINE_EVENT_TYPE_LABELS[e.event_type]}
                        </Badge>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {formatDate(e.event_date)}
                    </p>
                    {e.description && (
                      <p className="mt-1 text-sm text-muted-foreground">
                        {e.description}
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEdit(e)}
                      aria-label="Edit"
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => remove(e.id)}
                      aria-label="Delete"
                    >
                      <Trash2 className="size-4 text-danger" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
