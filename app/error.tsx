"use client";

import { useEffect } from "react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="w-full max-w-md text-center">
        <h1 className="text-3xl font-semibold text-foreground">
          Da ist etwas schiefgegangen
        </h1>
        <p className="mt-4 text-sm text-muted-foreground">
          Wir konnten diese Seite nicht laden. Versuche es nochmal – wenn es weiterhin
          Probleme gibt, melde dich kurz beim Admin.
        </p>
        {error.digest && (
          <p className="mt-3 text-xs text-muted-foreground">
            Fehler-ID: <span className="font-mono">{error.digest}</span>
          </p>
        )}
        <div className="mt-8 flex justify-center gap-3">
          <button
            onClick={() => reset()}
            className="rounded-md bg-accent px-5 py-2 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
          >
            Erneut versuchen
          </button>
          <a
            href="/dashboard"
            className="rounded-md border border-border bg-card px-5 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
          >
            Zum Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}
