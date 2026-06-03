"use client";

import { useState, useTransition } from "react";
import { Copy, Trash2, Ban, Check, ExternalLink } from "lucide-react";
import {
  createShareTokenAction,
  deleteShareTokenAction,
  revokeShareTokenAction,
} from "@/lib/actions/sharing";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ShareToken {
  id: string;
  token: string;
  label: string | null;
  matomoSiteId: number | null;
  expiresAt: Date | null;
  revokedAt: Date | null;
  createdAt: Date;
}

interface Site {
  matomoSiteId: number;
  label: string;
}

interface Props {
  dashboardId: string;
  tokens: ShareToken[];
  sites: Site[];
  baseUrl: string;
}

const EXPIRY_OPTIONS = [
  { value: "0", label: "Kein Ablauf" },
  { value: "7", label: "7 Tage" },
  { value: "30", label: "30 Tage" },
  { value: "90", label: "90 Tage" },
  { value: "365", label: "1 Jahr" },
];

function tokenStatus(t: ShareToken): {
  state: "active" | "revoked" | "expired";
  label: string;
} {
  if (t.revokedAt) return { state: "revoked", label: "Widerrufen" };
  if (t.expiresAt && new Date(t.expiresAt).getTime() < Date.now()) {
    return { state: "expired", label: "Abgelaufen" };
  }
  return { state: "active", label: "Aktiv" };
}

function formatDate(d: Date | null): string {
  if (!d) return "–";
  return new Date(d).toLocaleDateString("de-DE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function ShareLinksEditor({
  dashboardId,
  tokens,
  sites,
  baseUrl,
}: Props) {
  const [label, setLabel] = useState("");
  const [siteId, setSiteId] = useState<string>("__any__");
  const [expiresInDays, setExpiresInDays] = useState<string>("30");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleCreate = () => {
    setError(null);
    setSuccess(null);
    const days = parseInt(expiresInDays, 10);
    startTransition(async () => {
      const r = await createShareTokenAction({
        dashboardId,
        label: label.trim() || null,
        matomoSiteId: siteId === "__any__" ? null : parseInt(siteId, 10),
        expiresInDays: days > 0 ? days : null,
      });
      if (!r.ok) setError(r.error ?? "Unbekannter Fehler");
      else {
        setSuccess("Link erstellt.");
        setLabel("");
      }
    });
  };

  const handleRevoke = (tokenId: string) => {
    if (!confirm("Diesen Link wirklich widerrufen? Bestehende URLs werden ungültig.")) return;
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const r = await revokeShareTokenAction(tokenId);
      if (!r.ok) setError(r.error ?? "Unbekannter Fehler");
      else setSuccess("Link widerrufen.");
    });
  };

  const handleDelete = (tokenId: string) => {
    if (!confirm("Diesen Link endgültig löschen?")) return;
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const r = await deleteShareTokenAction(tokenId);
      if (!r.ok) setError(r.error ?? "Unbekannter Fehler");
      else setSuccess("Link gelöscht.");
    });
  };

  const handleCopy = async (token: ShareToken) => {
    const url = `${baseUrl}/share/${token.token}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(token.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      setError("Konnte nicht in die Zwischenablage kopieren.");
    }
  };

  return (
    <div className="space-y-4">
      {/* Bestehende Links */}
      {tokens.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Noch keine Share-Links für dieses Dashboard.
        </p>
      ) : (
        <div className="space-y-2">
          {tokens.map((t) => {
            const status = tokenStatus(t);
            const fullUrl = `${baseUrl}/share/${t.token}`;
            const fixedSite = sites.find(
              (s) => s.matomoSiteId === t.matomoSiteId
            );
            return (
              <div
                key={t.id}
                className="rounded-md border border-border bg-muted/30 p-3"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-medium text-foreground">
                        {t.label ?? "(Ohne Bezeichnung)"}
                      </span>
                      <span
                        className={
                          status.state === "active"
                            ? "inline-flex items-center rounded-md bg-success/10 px-1.5 py-0.5 text-xs font-medium text-success"
                            : status.state === "revoked"
                            ? "inline-flex items-center rounded-md bg-destructive/10 px-1.5 py-0.5 text-xs font-medium text-destructive"
                            : "inline-flex items-center rounded-md bg-warning/10 px-1.5 py-0.5 text-xs font-medium text-warning"
                        }
                      >
                        {status.label}
                      </span>
                    </div>
                    <p className="mt-1 break-all font-mono text-xs text-muted-foreground">
                      {fullUrl}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Erstellt {formatDate(t.createdAt)}
                      {t.expiresAt && (
                        <>
                          {" "}· Läuft ab {formatDate(t.expiresAt)}
                        </>
                      )}
                      {fixedSite && (
                        <>
                          {" "}· Site: {fixedSite.label}
                        </>
                      )}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    {status.state === "active" && (
                      <>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleCopy(t)}
                          disabled={isPending}
                          title="URL kopieren"
                        >
                          {copiedId === t.id ? (
                            <>
                              <Check className="mr-1.5 h-3.5 w-3.5" />
                              Kopiert
                            </>
                          ) : (
                            <>
                              <Copy className="mr-1.5 h-3.5 w-3.5" />
                              Kopieren
                            </>
                          )}
                        </Button>
                        <a
                          href={fullUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex h-8 items-center gap-1 rounded-md px-2 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
                          title="Öffnen"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleRevoke(t.id)}
                          disabled={isPending}
                          title="Widerrufen"
                          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                        >
                          <Ban className="h-3.5 w-3.5" />
                        </Button>
                      </>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(t.id)}
                      disabled={isPending}
                      title="Löschen"
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Neuer Link */}
      <div className="rounded-md border border-border bg-muted/10 p-3 space-y-3">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Neuen Share-Link erzeugen
        </p>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="space-y-1 sm:col-span-3">
            <Label htmlFor={`share-label-${dashboardId}`} className="text-xs">
              Bezeichnung (optional)
            </Label>
            <Input
              id={`share-label-${dashboardId}`}
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="z.B. GF-Wochenbericht, Kunde XY"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor={`share-site-${dashboardId}`} className="text-xs">
              Website
            </Label>
            <Select value={siteId} onValueChange={setSiteId}>
              <SelectTrigger id={`share-site-${dashboardId}`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__any__">Erste verfügbare</SelectItem>
                {sites.map((s) => (
                  <SelectItem
                    key={s.matomoSiteId}
                    value={String(s.matomoSiteId)}
                  >
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1 sm:col-span-2">
            <Label htmlFor={`share-expiry-${dashboardId}`} className="text-xs">
              Ablauf
            </Label>
            <Select value={expiresInDays} onValueChange={setExpiresInDays}>
              <SelectTrigger id={`share-expiry-${dashboardId}`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {EXPIRY_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <Button size="sm" onClick={handleCreate} disabled={isPending}>
          {isPending ? "Erstelle…" : "Share-Link erstellen"}
        </Button>
      </div>

      {error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {error}
        </p>
      )}
      {success && (
        <p className="rounded-md bg-success/10 px-3 py-2 text-xs text-success">
          {success}
        </p>
      )}
    </div>
  );
}
