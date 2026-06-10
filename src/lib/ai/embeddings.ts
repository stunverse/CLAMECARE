import { env, isOpenAIConfigured } from "@/lib/env";

const EMBEDDING_MODEL = "text-embedding-3-small"; // 1536 dimensions

/**
 * Generate an embedding for a piece of text. Returns null when OpenAI is not
 * configured or on any error (RAG then gracefully degrades to no retrieval).
 */
export async function embed(text: string): Promise<number[] | null> {
  if (!isOpenAIConfigured || !text.trim()) return null;

  try {
    const res = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: EMBEDDING_MODEL,
        input: text.slice(0, 8000),
      }),
    });
    if (!res.ok) return null;
    const json = (await res.json()) as {
      data?: { embedding?: number[] }[];
    };
    return json.data?.[0]?.embedding ?? null;
  } catch {
    return null;
  }
}

/** pgvector input format: "[0.1,0.2,…]". */
export function toVectorLiteral(embedding: number[]): string {
  return `[${embedding.join(",")}]`;
}

/** Split text into overlapping chunks (~1000 chars) for indexing. */
export function chunkText(
  text: string,
  size = 1000,
  overlap = 150,
): string[] {
  const clean = text.replace(/\r/g, "").trim();
  if (clean.length <= size) return clean ? [clean] : [];

  const chunks: string[] = [];
  let start = 0;
  while (start < clean.length) {
    let end = Math.min(start + size, clean.length);
    // Prefer to break on a paragraph or sentence boundary.
    if (end < clean.length) {
      const slice = clean.slice(start, end);
      const lastBreak = Math.max(
        slice.lastIndexOf("\n\n"),
        slice.lastIndexOf(". "),
      );
      if (lastBreak > size * 0.5) end = start + lastBreak + 1;
    }
    chunks.push(clean.slice(start, end).trim());
    start = end - overlap;
    if (start < 0) start = 0;
    if (end >= clean.length) break;
  }
  return chunks.filter(Boolean);
}
