import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Lock } from "lucide-react";
import { getLibraryItem } from "@/lib/data/library";
import { getBillingData } from "@/lib/billing/data";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { DisclaimerBanner } from "@/components/disclaimer-banner";
import {
  KNOWLEDGE_CATEGORY_LABELS,
  INSURANCE_TYPE_LABELS,
} from "@/lib/labels";
import { cn } from "@/lib/utils";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const item = await getLibraryItem(id);
  return { title: item?.title ?? "Library" };
}

export default async function LibraryItemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const item = await getLibraryItem(id);
  if (!item) notFound();

  const { plan } = await getBillingData();
  const hasPremiumAccess = plan === "pro" || plan === "premium";
  const locked = item.is_premium && !hasPremiumAccess;

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 md:px-6">
      <Link
        href="/library"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to library
      </Link>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {item.category && (
          <Badge variant="secondary">
            {KNOWLEDGE_CATEGORY_LABELS[item.category]}
          </Badge>
        )}
        {item.insurance_type && (
          <Badge variant="muted">
            {INSURANCE_TYPE_LABELS[item.insurance_type]}
          </Badge>
        )}
        {item.state && <Badge variant="muted">{item.state}</Badge>}
        {item.is_premium && (
          <Badge variant="warning">
            <Lock className="size-3" />
            Premium
          </Badge>
        )}
      </div>

      <h1 className="text-2xl font-bold tracking-tight">{item.title}</h1>

      <Card className="mt-6">
        <CardContent className="p-6">
          {locked ? (
            <div className="text-center">
              <span className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-accent text-brand">
                <Lock className="size-6" />
              </span>
              <h2 className="text-lg font-semibold">This is a Premium resource</h2>
              <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
                Upgrade to Pro or Premium to unlock the full template, guide, and
                checklist library.
              </p>
              <Link
                href="/billing"
                className={cn(buttonVariants({ variant: "brand" }), "mt-5")}
              >
                See plans
              </Link>
            </div>
          ) : (
            <article className="whitespace-pre-wrap text-sm leading-relaxed">
              {item.content || "No content yet."}
            </article>
          )}
        </CardContent>
      </Card>

      <div className="mt-6">
        <DisclaimerBanner variant="primary" />
      </div>
    </div>
  );
}
