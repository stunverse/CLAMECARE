import type { ClaimStatus } from "@/lib/types/enums";

/**
 * Recommended "next action" per claim status (cahier des charges §9/§10).
 * Returns a short label and the workspace tab to open.
 */
const NEXT_ACTION: Record<ClaimStatus, { label: string; tab: string }> = {
  draft: { label: "Finish claim details", tab: "" },
  documents_missing: { label: "Upload missing documents", tab: "/documents" },
  ready_for_analysis: { label: "Run AI analysis", tab: "/analysis" },
  ai_analysis_completed: { label: "Review AI analysis", tab: "/analysis" },
  ready_to_send: { label: "Generate appeal letter", tab: "/letters" },
  sent_to_insurer: { label: "Track insurer response", tab: "" },
  waiting_for_response: { label: "Send a follow-up", tab: "/letters" },
  response_received: { label: "Review the response", tab: "" },
  in_appeal: { label: "Continue your appeal", tab: "/letters" },
  escalated: { label: "Prepare a complaint", tab: "/complaint" },
  complaint_prepared: { label: "File your complaint", tab: "/complaint" },
  complaint_filed: { label: "Track your complaint", tab: "/complaint" },
  resolved: { label: "View resolution", tab: "" },
  abandoned: { label: "Reopen this claim", tab: "" },
};

export function getNextAction(claim: {
  id: string;
  current_status: ClaimStatus;
}): { label: string; href: string } {
  const action = NEXT_ACTION[claim.current_status];
  return {
    label: action.label,
    href: `/claims/${claim.id}${action.tab}`,
  };
}

const ACTIVE_EXCLUDED: ClaimStatus[] = ["resolved", "abandoned"];

export function isActiveClaim(status: ClaimStatus): boolean {
  return !ACTIVE_EXCLUDED.includes(status);
}
