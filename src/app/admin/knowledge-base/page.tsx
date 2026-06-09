import type { Metadata } from "next";
import { BookOpen } from "lucide-react";
import { getAdminContext } from "@/lib/admin/guard";
import { ComingSoon } from "@/components/claim/coming-soon";

export const metadata: Metadata = { title: "Admin · Knowledge base" };

export default async function AdminKnowledgeBasePage() {
  await getAdminContext();
  return (
    <ComingSoon
      icon={BookOpen}
      title="Knowledge base"
      description="Manage RAG entries, guides, denial-reason explanations, and templates."
      bullets={[
        "Create and edit knowledge base entries",
        "Tag by state, insurance type, and company",
        "Chunk and embed content for retrieval",
      ]}
    />
  );
}
