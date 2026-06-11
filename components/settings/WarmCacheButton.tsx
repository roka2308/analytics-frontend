"use client";

import { useState, useTransition } from "react";
import { Flame } from "lucide-react";
import { warmCacheAction } from "@/lib/actions/cache";
import { Button } from "@/components/ui/button";

export function WarmCacheButton() {
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        size="sm"
        variant="outline"
        disabled={isPending}
        onClick={() => {
          setMsg(null);
          setErr(null);
          startTransition(async () => {
            const r = await warmCacheAction();
            if (!r.ok) setErr(r.error ?? "Fehler");
            else {
              const s = r.summary;
              setMsg(
                `${s?.warmed}/${s?.widgets} Widgets in ${Math.round((s?.durationMs ?? 0) / 1000)}s vorgewärmt`,
              );
            }
          });
        }}
      >
        <Flame className="mr-1.5 h-4 w-4" />
        {isPending ? "Vorwärmen…" : "Cache jetzt vorwärmen"}
      </Button>
      {msg && <span className="text-xs text-success">{msg}</span>}
      {err && <span className="text-xs text-destructive">{err}</span>}
    </div>
  );
}
