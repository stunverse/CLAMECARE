import { notFound } from "next/navigation";
import {
  FilePlus2,
  Upload,
  Trash2,
  Sparkles,
  FileText,
  ScrollText,
  Landmark,
  Scale,
  Mail,
  History,
  StickyNote,
  RefreshCw,
  Pencil,
  Phone,
  type LucideIcon,
} from "lucide-react";
import { getClaim } from "@/lib/data/claim";
import { getClaimActivity } from "@/lib/data/activity";
import { isSupabaseConfigured } from "@/lib/env";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/empty-state";
import { AddNote } from "@/components/claim/add-note";
import { DisclaimerBanner } from "@/components/disclaimer-banner";
import { formatDate } from "@/lib/format";

const ICONS: Record<string, LucideIcon> = {
  claim_created: FilePlus2,
  document_uploaded: Upload,
  document_deleted: Trash2,
  ai_analysis_completed: Sparkles,
  document_generated: FileText,
  policy_reviewed: ScrollText,
  complaint_prepared: Landmark,
  negotiation_generated: Scale,
  message_saved: Mail,
  note: StickyNote,
  status_changed: RefreshCw,
  claim_updated: Pencil,
  call_prep_generated: Phone,
};

function humanizeType(t: string): string {
  return t.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());
}

export default async function ActivityTab({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const claim = await getClaim(id);
  if (!claim) notFound();

  const entries = await getClaimActivity(id);

  return (
    <div className="space-y-4">
      {isSupabaseConfigured && (
        <div className="flex justify-end">
          <AddNote claimId={id} />
        </div>
      )}
      {entries.length === 0 ? (
        <EmptyState
          icon={History}
          title="No activity yet"
          description="Uploads, AI analyses, generated documents, and status changes will appear here."
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <ul className="divide-y divide-border">
              {entries.map((e) => {
                const Icon = ICONS[e.action_type] ?? History;
                return (
                  <li key={e.id} className="flex items-start gap-3 px-5 py-4">
                    <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent text-brand">
                      <Icon className="size-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">
                        {humanizeType(e.action_type)}
                      </p>
                      {e.action_description && (
                        <p className="text-sm text-muted-foreground">
                          {e.action_description}
                        </p>
                      )}
                    </div>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {formatDate(e.created_at)}
                    </span>
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>
      )}

      <DisclaimerBanner variant="primary" />
    </div>
  );
}
