import type { Metadata } from "next";
import { getAdminContext } from "@/lib/admin/guard";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = { title: "Admin · Users" };

interface AdminUserRow {
  id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  state: string | null;
  role: string;
  created_at: string;
}

const DEMO_USERS: AdminUserRow[] = [
  { id: "1", email: "jane.doe@example.com", first_name: "Jane", last_name: "Doe", state: "TX", role: "user", created_at: new Date(Date.now() - 2 * 864e5).toISOString() },
  { id: "2", email: "mike.ross@example.com", first_name: "Mike", last_name: "Ross", state: "CA", role: "user", created_at: new Date(Date.now() - 9 * 864e5).toISOString() },
  { id: "3", email: "admin@claimcare.ai", first_name: "Site", last_name: "Admin", state: "NY", role: "admin", created_at: new Date(Date.now() - 30 * 864e5).toISOString() },
];

export default async function AdminUsersPage() {
  const { supabase } = await getAdminContext();

  let users: AdminUserRow[] = DEMO_USERS;
  if (supabase) {
    const { data } = await supabase
      .from("profiles")
      .select("id, email, first_name, last_name, state, role, created_at")
      .order("created_at", { ascending: false })
      .limit(100)
      .returns<AdminUserRow[]>();
    users = data ?? [];
  }

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold tracking-tight">Users</h1>
      <p className="mb-6 text-sm text-muted-foreground">{users.length} users</p>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="border-b border-border bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">State</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Joined</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 font-medium">
                    {[u.first_name, u.last_name].filter(Boolean).join(" ") ||
                      "—"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {u.email ?? "—"}
                  </td>
                  <td className="px-4 py-3">{u.state ?? "—"}</td>
                  <td className="px-4 py-3">
                    <Badge variant={u.role === "admin" ? "info" : "muted"}>
                      {u.role}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatDate(u.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
