"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { RotateCcw } from "lucide-react";
import {
  restoreCustomerAction,
  purgeCustomerAction,
} from "@/lib/actions/customers";
import { restoreOrgAction, purgeOrgAction } from "@/lib/actions/organizations";
import { restoreDashboardAction, purgeDashboardAction } from "@/lib/actions/dashboards";
import { Button } from "@/components/ui/button";
import { DangerConfirm } from "./DangerConfirm";

type Kind = "customer" | "project" | "dashboard";

export interface TrashItem {
  id: string;
  label: string;
  sublabel?: string;
  deletedAtLabel?: string;
  kind: Kind;
}

const RESTORE: Record<Kind, (id: string) => Promise<{ ok: boolean; error?: string }>> = {
  customer: restoreCustomerAction,
  project: restoreOrgAction,
  dashboard: restoreDashboardAction,
};
const PURGE: Record<Kind, (id: string) => Promise<{ ok: boolean; error?: string }>> = {
  customer: purgeCustomerAction,
  project: purgeOrgAction,
  dashboard: purgeDashboardAction,
};
const KIND_LABEL: Record<Kind, string> = {
  customer: "Kunde",
  project: "Projekt",
  dashboard: "Dashboard",
};

export function TrashList({ items }: { items: TrashItem[] }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const run = (fn: () => Promise<{ ok: boolean; error?: string }>) => {
    setError(null);
    startTransition(async () => {
      const r = await fn();
      if (!r.ok) setError(r.error ?? "Fehler");
      else router.refresh();
    });
  };

  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">Papierkorb ist leer.</p>;
  }

  return (
    <div className="space-y-2">
      {error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
      )}
      <ul className="divide-y divide-border rounded-md border border-border">
        {items.map((it) => (
          <li
            key={`${it.kind}-${it.id}`}
            className="flex flex-wrap items-center justify-between gap-2 px-3 py-2"
          >
            <div className="min-w-0">
              <p className="truncate text-sm text-foreground">
                <span className="mr-2 rounded bg-muted px-1.5 py-0.5 text-[10px] uppercase text-muted-foreground">
                  {KIND_LABEL[it.kind]}
                </span>
                {it.label}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {it.sublabel ? `${it.sublabel} · ` : ""}
                gelöscht: {it.deletedAtLabel ?? "–"}
              </p>
            </div>
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant="outline"
                disabled={isPending}
                onClick={() => run(() => RESTORE[it.kind](it.id))}
              >
                <RotateCcw className="mr-1 h-3.5 w-3.5" /> Wiederherstellen
              </Button>
              <DangerConfirm
                word={it.label}
                title={`„${it.label}" endgültig löschen`}
                description={
                  <>
                    Endgültiges Löschen kann <b>nicht</b> rückgängig gemacht werden – inkl. aller
                    untergeordneten Daten.
                  </>
                }
                onConfirm={async () => {
                  const r = await PURGE[it.kind](it.id);
                  if (r.ok) router.refresh();
                  return r;
                }}
                trigger={(open) => (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                    disabled={isPending}
                    onClick={open}
                  >
                    Endgültig löschen
                  </Button>
                )}
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
