import {
  Bot,
  UserCog,
  User,
  Cog,
  Sparkles,
  Circle,
} from "lucide-react";
import { formatDateTimeFr } from "@/lib/cases/format";
import type { CaseTimelineEntry } from "@/lib/claimguard/types";
import type { CaseEventSource } from "@/lib/claimguard/enums";

const SOURCE_ICON: Record<CaseEventSource, typeof Circle> = {
  automation: Cog,
  ai: Sparkles,
  admin: UserCog,
  agent: UserCog,
  client: User,
  system: Bot,
};

const SOURCE_LABEL: Record<CaseEventSource, string> = {
  automation: "Automatisation",
  ai: "IA",
  admin: "Équipe",
  agent: "Agent",
  client: "Vous",
  system: "Système",
};

export function CaseTimeline({ entries }: { entries: CaseTimelineEntry[] }) {
  if (entries.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        L&apos;historique des actions apparaîtra ici.
      </p>
    );
  }

  return (
    <ol className="relative space-y-4 border-l border-border pl-5">
      {entries.map((e) => {
        const Icon = SOURCE_ICON[e.source] ?? Circle;
        return (
          <li key={e.id} className="relative">
            <span className="absolute -left-[27px] flex size-5 items-center justify-center rounded-full border border-border bg-card">
              <Icon className="size-3 text-muted-foreground" />
            </span>
            <div className="flex flex-wrap items-baseline justify-between gap-x-3">
              <p className="text-sm font-medium">{e.title}</p>
              <time className="text-xs text-muted-foreground">
                {formatDateTimeFr(e.created_at)}
              </time>
            </div>
            {e.description && (
              <p className="mt-0.5 text-sm text-muted-foreground">
                {e.description}
              </p>
            )}
            <p className="mt-0.5 text-[11px] uppercase tracking-wide text-muted-foreground">
              {SOURCE_LABEL[e.source] ?? e.source}
            </p>
          </li>
        );
      })}
    </ol>
  );
}
