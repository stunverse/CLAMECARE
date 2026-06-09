import type { Metadata } from "next";
import { getLibraryItems } from "@/lib/data/library";
import { LibraryBrowser } from "@/components/library/library-browser";

export const metadata: Metadata = { title: "Library" };

export default async function LibraryPage() {
  const { items, isDemo } = await getLibraryItems();

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 md:px-6">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Resource library</h1>
          <p className="text-sm text-muted-foreground">
            Guides, templates, checklists, and explanations to help with your
            claim.
          </p>
        </div>
        {isDemo && (
          <span className="rounded-full border border-warning/40 bg-warning/10 px-3 py-1 text-xs font-medium text-foreground">
            Sample content
          </span>
        )}
      </div>

      <LibraryBrowser items={items} />
    </div>
  );
}
