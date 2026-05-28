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
    // In Produktion könnte hier ein Logging-Dienst aufgerufen werden
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
      <div className="w-full max-w-md text-center">
        <h1 className="text-3xl font-semibold text-slate-900">
          Da ist etwas schiefgegangen
        </h1>
        <p className="mt-4 text-sm text-slate-600">
          Wir konnten diese Seite nicht laden. Versuche es nochmal – wenn es weiterhin
          Probleme gibt, melde dich kurz beim Admin.
        </p>
        {error.digest && (
          <p className="mt-3 text-xs text-slate-400">
            Fehler-ID: <span className="font-mono">{error.digest}</span>
          </p>
        )}
        <div className="mt-8 flex justify-center gap-3">
          <button
            onClick={() => reset()}
            className="rounded-md bg-slate-900 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-700"
          >
            Erneut versuchen
          </button>
          <a
            href="/dashboard"
            className="rounded-md border border-slate-300 bg-white px-5 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
          >
            Zum Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}
