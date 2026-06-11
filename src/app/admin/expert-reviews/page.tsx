import type { Metadata } from "next";
import { getAdminContext } from "@/lib/admin/guard";
import { getAllExpertReviews } from "@/lib/data/expert";
import { AdminExpertReviews } from "@/components/admin/admin-expert-reviews";
import type { ExpertReview } from "@/lib/types";

export const metadata: Metadata = { title: "Admin · Expert reviews" };

const day = 86_400_000;
const iso = (o: number) => new Date(Date.now() + o * day).toISOString();

const DEMO: ExpertReview[] = [
  {
    id: "r1",
    claim_id: "demo-1",
    user_id: "demo",
    expert_id: null,
    review_type: "appeal_letter",
    status: "requested",
    user_note: "Please check the tone and the reference to my policy.",
    expert_summary: null,
    expert_recommendations: null,
    created_at: iso(-1),
    updated_at: iso(-1),
    completed_at: null,
  },
];

export default async function AdminExpertReviewsPage() {
  const { supabase, isDemo } = await getAdminContext();

  let reviews: ExpertReview[] = DEMO;
  if (supabase) {
    reviews = await getAllExpertReviews(supabase);
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">Expert reviews</h1>
      <p className="text-sm text-muted-foreground">
        Human review requests from users. Assign and update status as you
        process them.
      </p>
      <AdminExpertReviews reviews={reviews} canEdit={!isDemo} />
    </div>
  );
}
