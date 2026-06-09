/**
 * Server-side document text extraction (§11).
 * Supports PDF (pdf-parse), DOCX (mammoth), and plain text. Images and legacy
 * .doc are not extracted here (OCR is a separate future step).
 */

const DOCX_MIME =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

export async function extractText(
  buffer: Buffer,
  mime: string,
): Promise<string> {
  try {
    if (mime === "application/pdf") {
      const { PDFParse } = await import("pdf-parse");
      const parser = new PDFParse({ data: new Uint8Array(buffer) });
      try {
        const result = await parser.getText();
        // Strip pdf-parse page separators like "-- 1 of 3 --".
        return (result.text ?? "")
          .replace(/\n*--\s*\d+\s+of\s+\d+\s*--\n*/g, "\n")
          .trim();
      } finally {
        await parser.destroy().catch(() => {});
      }
    }

    if (mime === DOCX_MIME) {
      const mammoth = await import("mammoth");
      const { value } = await mammoth.extractRawText({ buffer });
      return (value ?? "").trim();
    }

    if (mime.startsWith("text/")) {
      return buffer.toString("utf8").trim();
    }
  } catch {
    return "";
  }

  // Images, legacy .doc, etc. — no text available without OCR.
  return "";
}

const MONTHS =
  "January|February|March|April|May|June|July|August|September|October|November|December";

/** Pull simple dates and dollar amounts out of extracted text. */
export function extractEntities(text: string): {
  dates: string[];
  amounts: string[];
} {
  const dates = new Set<string>();
  const amounts = new Set<string>();

  for (const m of text.matchAll(/\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/g)) {
    dates.add(m[0]);
  }
  for (const m of text.matchAll(
    new RegExp(`\\b(?:${MONTHS})\\s+\\d{1,2}(?:,\\s*\\d{4})?\\b`, "gi"),
  )) {
    dates.add(m[0]);
  }
  for (const m of text.matchAll(/\$\s?\d[\d,]*(?:\.\d{2})?/g)) {
    amounts.add(m[0]);
  }

  return {
    dates: Array.from(dates).slice(0, 20),
    amounts: Array.from(amounts).slice(0, 20),
  };
}
