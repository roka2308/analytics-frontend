"use client";

import { useState } from "react";
import { Share2 } from "lucide-react";
import { ShareLinksEditor } from "@/components/settings/ShareLinksEditor";
import { Modal } from "@/components/ui/modal";

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

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        align="top"
        title="Dashboard teilen"
        description="Erzeuge öffentliche, login-freie Links (mit optionalem Ablauf, widerrufbar)."
      >
        <ShareLinksEditor
          dashboardId={dashboardId}
          tokens={tokens}
          sites={sites}
          baseUrl={baseUrl}
        />
      </Modal>
    </>
  );
}
