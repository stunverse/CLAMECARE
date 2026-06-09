import { createClient } from "@/lib/supabase/server";
import { getNotifications } from "@/lib/data/notifications";
import { AppShell } from "@/components/app/app-shell";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  let name = "Guest";
  let email = "Demo mode — connect Supabase";

  if (supabase) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const meta = user.user_metadata ?? {};
      const fullName = [meta.first_name, meta.last_name]
        .filter(Boolean)
        .join(" ");
      name = fullName || user.email || "Account";
      email = user.email ?? "";
    }
  }

  const { notifications, unread } = await getNotifications();

  return (
    <AppShell user={{ name, email }} notifications={notifications} unread={unread}>
      {children}
    </AppShell>
  );
}
