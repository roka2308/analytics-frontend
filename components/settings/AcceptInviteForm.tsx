"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { acceptInviteAction } from "@/lib/actions/users";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { PasswordField } from "./PasswordField";

export function AcceptInviteForm({ token, email }: { token: string; email: string }) {
  const router = useRouter();
  const [pw, setPw] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [isPending, startTransition] = useTransition();

  const submit = () => {
    setError(null);
    startTransition(async () => {
      const r = await acceptInviteAction(token, pw);
      if (!r.ok) setError(r.error ?? "Fehler");
      else {
        setDone(true);
        setTimeout(() => router.push("/login"), 1500);
      }
    });
  };

  if (done) {
    return (
      <p className="rounded-md bg-success/10 px-3 py-2 text-sm text-success">
        Passwort gesetzt. Du wirst zur Anmeldung weitergeleitet…
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Konto: <span className="font-medium text-foreground">{email}</span>
      </p>
      <div className="space-y-1.5">
        <Label>Neues Passwort (min. 8 Zeichen)</Label>
        <PasswordField value={pw} onChange={setPw} placeholder="Passwort wählen" />
      </div>
      {error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
      )}
      <Button onClick={submit} disabled={isPending || pw.length < 8} className="w-full">
        {isPending ? "Speichern…" : "Passwort setzen & Konto aktivieren"}
      </Button>
    </div>
  );
}
