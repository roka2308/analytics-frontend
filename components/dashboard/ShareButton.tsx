"use client";

import { useState } from "react";
import { Share2, X } from "lucide-react";
import { ShareLinksEditor } from "@/components/settings/ShareLinksEditor";

interface ShareToken {
  id: string;
  token: string;
  label: string | null;
  matomoSiteId: number | null;
  expiresAt: Date | null;
  revokedAt: Date | null;
  createdAt: Date;
}

interface Props {
  dashboardId: string;
  tokens: ShareToken[];
  sites: { matomoSiteId: number; label: string }[];
  baseUrl: string;
}

/**
 * "Teilen"-Button im Dashboard-Header: oeffnet einen Dialog mit der
 * Share-Link-Verwaltung (ohne Login teilbar).
 */
export function ShareButton({ dashboardId, tokens, sites, baseUrl }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        title="Dashboard ohne Login teilen"
      >
        <Share2 className="h-3.5 w-3.5" />
        Teilen
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 sm:p-8"
          role="dialog"
          aria-modal="true"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-lg rounded-lg border border-border bg-card p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-foreground">Dashboard teilen</h3>
                <p className="text-xs text-muted-foreground">
                  Erzeuge öffentliche, login-freie Links (mit optionalem Ablauf, widerrufbar).
                </p>
              </div>
              <button
                onClick={() => setOpen(false)}
                aria-label="Schließen"
                className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <ShareLinksEditor
              dashboardId={dashboardId}
              tokens={tokens}
              sites={sites}
              baseUrl={baseUrl}
            />
          </div>
        </div>
      )}
    </>
  );
}
