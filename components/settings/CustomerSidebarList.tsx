"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { createCustomerAction } from "@/lib/actions/customers";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Customer {
  id: string;
  name: string;
  slug: string;
  projectCount: number;
}

export function CustomerSidebarList({ customers }: { customers: Customer[] }) {
  const pathname = usePathname();
  const router = useRouter();
  const [name, setName] = useState("");
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [isPending, startTransition] = useTransition();

  const filtered = customers.filter((c) =>
    c.name.toLowerCase().includes(query.trim().toLowerCase()),
  );

  const handleCreate = () => {
    setError(null);
    const fd = new FormData();
    fd.set("name", name);
    startTransition(async () => {
      const r = await createCustomerAction(fd);
      if (!r.ok) setError(r.error ?? "Fehler");
      else {
        setName("");
        setAdding(false);
        router.refresh();
      }
    });
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-4 py-3">
        <h2 className="text-sm font-semibold text-foreground">Kunden</h2>
        <Button size="sm" variant="ghost" onClick={() => setAdding((v) => !v)}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {adding && (
        <div className="space-y-2 px-4 pb-3">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Kundenname"
            autoFocus
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={handleCreate} disabled={isPending || !name.trim()}>
              {isPending ? "…" : "Anlegen"}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setAdding(false)}>
              Abbrechen
            </Button>
          </div>
          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
      )}

      {customers.length > 5 && (
        <div className="px-4 pb-2">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Kunde suchen…"
            className="h-8"
          />
        </div>
      )}

      <nav className="flex-1 overflow-y-auto px-2 pb-4">
        {customers.length === 0 ? (
          <p className="px-2 text-sm text-muted-foreground">Noch keine Kunden.</p>
        ) : filtered.length === 0 ? (
          <p className="px-2 text-sm text-muted-foreground">Keine Treffer.</p>
        ) : (
          <ul className="space-y-0.5">
            {filtered.map((c) => {
              const active = pathname === `/kunden/${c.slug}`;
              return (
                <li key={c.id}>
                  <Link
                    href={`/kunden/${c.slug}`}
                    className={cn(
                      "flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors",
                      active
                        ? "bg-accent/10 font-medium text-accent-text"
                        : "text-foreground hover:bg-muted",
                    )}
                  >
                    <span className="truncate">{c.name}</span>
                    <span className="ml-2 shrink-0 text-xs text-muted-foreground">
                      {c.projectCount}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </nav>
    </div>
  );
}
