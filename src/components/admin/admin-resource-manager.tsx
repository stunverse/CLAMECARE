"use client";

import { useState, useTransition } from "react";
import { Plus, Pencil, Trash2, X, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export type Row = Record<string, string | null> & { id: string };

export interface FieldDef {
  name: string;
  label: string;
  type?: "text" | "textarea" | "url" | "email" | "select";
  options?: { value: string; label: string }[];
  required?: boolean;
  fullWidth?: boolean;
}

export interface ListColumn {
  key: string;
  label: string;
}

export function AdminResourceManager({
  resourceName,
  fields,
  listColumns,
  initialRows,
  canEdit,
  upsertAction,
  deleteAction,
}: {
  resourceName: string;
  fields: FieldDef[];
  listColumns: ListColumn[];
  initialRows: Row[];
  canEdit: boolean;
  upsertAction: (
    values: Record<string, string>,
  ) => Promise<{ error?: string; row?: Row }>;
  deleteAction: (id: string) => Promise<{ error?: string }>;
}) {
  const [rows, setRows] = useState<Row[]>(initialRows);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  function openAdd() {
    setValues({});
    setEditingId(null);
    setError(undefined);
    setShowForm(true);
  }
  function openEdit(row: Row) {
    const v: Record<string, string> = {};
    for (const f of fields) v[f.name] = row[f.name] ?? "";
    setValues(v);
    setEditingId(row.id);
    setError(undefined);
    setShowForm(true);
  }

  function save() {
    setError(undefined);
    const payload = { ...values };
    if (editingId) payload.id = editingId;
    startTransition(async () => {
      const res = await upsertAction(payload);
      if (res.error || !res.row) {
        setError(res.error ?? "Could not save.");
        return;
      }
      setRows((r) => {
        const exists = r.some((x) => x.id === res.row!.id);
        return exists
          ? r.map((x) => (x.id === res.row!.id ? res.row! : x))
          : [res.row!, ...r];
      });
      setShowForm(false);
    });
  }

  function remove(id: string) {
    if (!window.confirm(`Delete this ${resourceName}?`)) return;
    startTransition(async () => {
      const res = await deleteAction(id);
      if (!res.error) setRows((r) => r.filter((x) => x.id !== id));
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{rows.length} entries</p>
        {canEdit ? (
          <Button variant="brand" size="sm" onClick={openAdd}>
            <Plus className="size-4" />
            Add {resourceName}
          </Button>
        ) : (
          <span className="rounded-md border border-warning/40 bg-warning/10 px-3 py-1 text-xs text-foreground">
            Connect Supabase to edit
          </span>
        )}
      </div>

      {showForm && (
        <Card>
          <CardContent className="space-y-3 p-5">
            <div className="grid gap-3 sm:grid-cols-2">
              {fields.map((f) => (
                <div
                  key={f.name}
                  className={`space-y-2 ${
                    f.type === "textarea" || f.fullWidth ? "sm:col-span-2" : ""
                  }`}
                >
                  <Label>{f.label}</Label>
                  {f.type === "textarea" ? (
                    <Textarea
                      value={values[f.name] ?? ""}
                      onChange={(e) =>
                        setValues((v) => ({ ...v, [f.name]: e.target.value }))
                      }
                    />
                  ) : f.type === "select" ? (
                    <Select
                      value={values[f.name] ?? ""}
                      onChange={(e) =>
                        setValues((v) => ({ ...v, [f.name]: e.target.value }))
                      }
                    >
                      <option value="">—</option>
                      {f.options?.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </Select>
                  ) : (
                    <Input
                      type={
                        f.type === "email"
                          ? "email"
                          : f.type === "url"
                            ? "url"
                            : "text"
                      }
                      value={values[f.name] ?? ""}
                      onChange={(e) =>
                        setValues((v) => ({ ...v, [f.name]: e.target.value }))
                      }
                    />
                  )}
                </div>
              ))}
            </div>
            {error && <p className="text-sm text-danger">{error}</p>}
            <div className="flex gap-2">
              <Button onClick={save} disabled={pending}>
                {pending && <Loader2 className="size-4 animate-spin" />}
                {editingId ? "Save changes" : "Create"}
              </Button>
              <Button variant="ghost" onClick={() => setShowForm(false)}>
                <X className="size-4" />
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="border-b border-border bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                {listColumns.map((c) => (
                  <th key={c.key} className="px-4 py-3 font-medium">
                    {c.label}
                  </th>
                ))}
                {canEdit && <th className="px-4 py-3" />}
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={listColumns.length + 1}
                    className="px-4 py-6 text-center text-muted-foreground"
                  >
                    No entries yet.
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.id} className="border-b border-border last:border-0">
                    {listColumns.map((c) => (
                      <td key={c.key} className="px-4 py-3">
                        <span className="line-clamp-1">{row[c.key] || "—"}</span>
                      </td>
                    ))}
                    {canEdit && (
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEdit(row)}
                            aria-label="Edit"
                          >
                            <Pencil className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => remove(row.id)}
                            aria-label="Delete"
                          >
                            <Trash2 className="size-4 text-danger" />
                          </Button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
