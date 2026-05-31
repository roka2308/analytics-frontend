"use client";

import { useState, useTransition } from "react";
import { changeOwnPasswordAction } from "@/lib/actions/users";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export function ChangePasswordForm() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (formData: FormData) => {
    setError(null);
    setSuccess(null);

    const newPassword = formData.get("newPassword") as string;
    const confirmPassword = formData.get("confirmPassword") as string;
    if (newPassword !== confirmPassword) {
      setError("Die neuen Passwörter stimmen nicht überein.");
      return;
    }

    startTransition(async () => {
      const result = await changeOwnPasswordAction(formData);
      if (!result.ok) {
        setError(result.error ?? "Unbekannter Fehler");
      } else {
        setSuccess("Passwort wurde aktualisiert.");
        (document.getElementById("change-pw-form") as HTMLFormElement)?.reset();
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Eigenes Passwort ändern</CardTitle>
        <CardDescription>
          Aus Sicherheitsgründen brauchst du dein aktuelles Passwort zur Bestätigung.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form id="change-pw-form" action={handleSubmit} className="max-w-md space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="currentPassword">Aktuelles Passwort</Label>
            <Input
              id="currentPassword"
              name="currentPassword"
              type="password"
              required
              autoComplete="current-password"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="newPassword">Neues Passwort (min. 8 Zeichen)</Label>
            <Input
              id="newPassword"
              name="newPassword"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="confirmPassword">Neues Passwort wiederholen</Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
            />
          </div>

          <Button type="submit" disabled={isPending}>
            {isPending ? "Speichern…" : "Passwort ändern"}
          </Button>

          {error && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
          )}
          {success && (
            <p className="rounded-md bg-success/10 px-3 py-2 text-sm text-success">
              {success}
            </p>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
