import type { SupabaseClient } from "@supabase/supabase-js";
import { embed, chunkText, toVectorLiteral } from "@/lib/ai/embeddings";
import { isOpenAIConfigured } from "@/lib/env";
import type { InsuranceType } from "@/lib/types/enums";

export interface RetrievedChunk {
  chunk_text: string;
  title: string;
  source_url: string | null;
  similarity: number;
}

/**
 * Re-embed a knowledge base entry: delete its old chunks, chunk the content,
 * embed each chunk, and insert them. Best-effort — silently no-ops when OpenAI
 * is unavailable. Admin RLS permits writing chunks.
 */
export async function reindexEntry(
  supabase: SupabaseClient,
  entryId: string,
  content: string | null,
): Promise<void> {
  if (!isOpenAIConfigured) return;

  try {
    await supabase
      .from("knowledge_base_chunks")
      .delete()
      .eq("entry_id", entryId);

    const chunks = chunkText(content ?? "");
    for (const chunk of chunks) {
      const vec = await embed(chunk);
      if (!vec) continue;
      await supabase.from("knowledge_base_chunks").insert({
        entry_id: entryId,
        chunk_text: chunk,
        embedding: toVectorLiteral(vec),
        metadata: {},
      });
    }
  } catch {
    // best-effort indexing
  }
}

/**
 * Retrieve the most relevant knowledge base chunks for a query, optionally
 * filtered by state / insurance type. Returns [] when retrieval is unavailable.
 */
export async function retrieveContext(
  supabase: SupabaseClient,
  query: string,
  filters: { state?: string | null; insuranceType?: InsuranceType | null } = {},
  matchCount = 5,
  minSimilarity = 0.2,
): Promise<RetrievedChunk[]> {
  const vec = await embed(query);
  if (!vec) return [];

  try {
    const { data } = await supabase.rpc("match_knowledge_chunks", {
      query_embedding: toVectorLiteral(vec),
      match_count: matchCount,
      filter_state: filters.state ?? null,
      filter_insurance_type: filters.insuranceType ?? null,
    });
    const rows = (data ?? []) as RetrievedChunk[];
    return rows.filter((r) => (r.similarity ?? 0) >= minSimilarity);
  } catch {
    return [];
  }
}
