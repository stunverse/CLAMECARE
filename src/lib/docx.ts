/**
 * Client-side DOCX export. Dynamically imports `docx` so it stays out of the
 * initial bundle. Builds a simple document from plain text (one paragraph per
 * line) and triggers a download.
 */
export async function exportDocx(title: string, text: string): Promise<void> {
  const { Document, Packer, Paragraph, TextRun } = await import("docx");

  const paragraphs = text.split("\n").map(
    (line) =>
      new Paragraph({
        children: [new TextRun(line)],
      }),
  );

  const doc = new Document({ sections: [{ children: paragraphs }] });
  const blob = await Packer.toBlob(doc);

  const safe = title.replace(/[^\w.-]+/g, "_").slice(0, 80) || "document";
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${safe}.docx`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
