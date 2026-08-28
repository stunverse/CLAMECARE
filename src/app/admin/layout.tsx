import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { getAdminContext } from "@/lib/admin/guard";
import { AdminNav } from "@/components/admin/admin-nav";
import { Badge } from "@/components/ui/badge";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isDemo } = await getAdminContext();

  return (
    <div className="flex min-h-screen flex-1 flex-col bg-secondary/30">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-3 md:px-6">
          <div className="flex items-center gap-2">
            <BrandLogo className="text-xl" />
            <Badge variant="info">Admin</Badge>
            {isDemo && <Badge variant="warning">Demo data</Badge>}
          </div>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Back to app
          </Link>
        </div>
        <AdminNav />
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 md:px-6">
        {children}
      </main>
    </div>
  );
}
