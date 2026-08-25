import type { Metadata } from "next";
import { getAllNotifications } from "@/lib/data/notifications";
import { NotificationsList } from "@/components/notifications/notifications-list";

export const metadata: Metadata = { title: "Notifications" };

export default async function NotificationsPage() {
  const { notifications, unread } = await getAllNotifications();

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 md:px-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
        <p className="text-sm text-muted-foreground">
          {unread > 0
            ? `${unread} notification${unread === 1 ? "" : "s"} non lue${unread === 1 ? "" : "s"}`
            : "Vous êtes à jour."}
        </p>
      </div>
      <NotificationsList notifications={notifications} unread={unread} />
    </div>
  );
}
