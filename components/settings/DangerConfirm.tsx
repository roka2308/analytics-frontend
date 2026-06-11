"use client";

import { useState, useTransition } from "react";
import { AlertTriangle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";

/**
 * Destruktive Bestaetigung mit Tipp-Schutz: der Nutzer muss das exakte
 * Schluesselwort (z.B. den Namen) eintippen, bevor geloescht werden kann.
 */
export function DangerConfirm({
  word,
  title,
  description,
  confirmLabel = "Endgültig löschen",
  trigger,
  onConfirm,
}: {
  word: string;
  title: string;
  description: React.ReactNode;
  confirmLabel?: string;
  trigger: (open: () => void) => React.ReactNode;
  onConfirm: () => Promise<{ ok: boolean; error?: string }>;
}) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const close = () => {
    setOpen(false);
    setValue("");
    setError(null);
  };

  const confirm = () => {
    setError(null);
    startTransition(async () => {
      const r = await onConfirm();
      if (!r.ok) setError(r.error ?? "Fehler");
      else close();
    });
  };

  return (
    <>
      {trigger(() => setOpen(true))}
      <Modal open={open} onClose={close} className="max-w-md">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 text-destructive">
            <AlertTriangle className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-semibold text-foreground">{title}</h3>
            <div className="mt-1 text-sm text-muted-foreground">{description}</div>
          </div>
        </div>

        <div className="mt-4 space-y-2">
          <p className="text-sm text-foreground">
            Tippe zur Bestätigung{" "}
            <span className="font-mono font-medium text-destructive">{word}</span> ein:
          </p>
          <Input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            autoFocus
            placeholder={word}
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" onClick={close} disabled={isPending}>
            Abbrechen
          </Button>
          <Button
            className="bg-destructive text-white hover:bg-destructive/90"
            disabled={isPending || value !== word}
            onClick={confirm}
          >
            {isPending ? "Löschen…" : confirmLabel}
          </Button>
        </div>
      </Modal>
    </>
  );
}
