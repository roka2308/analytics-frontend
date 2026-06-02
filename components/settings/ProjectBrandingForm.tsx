"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import { Upload, Trash2 } from "lucide-react";
import { updateProjectBrandingAction } from "@/lib/actions/branding";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  DEFAULT_ACCENT_HEX,
  MAX_LOGO_BYTES,
  ALLOWED_LOGO_MIME,
} from "@/lib/branding";

interface Project {
  id: string;
  name: string;
  slug: string;
  brandingLogoBase64: string | null;
  brandingAccentHex: string | null;
}

interface Props {
  projects: Project[];
}

export function ProjectBrandingForm({ projects }: Props) {
  return (
    <div className="space-y-4">
      {projects.length === 0 && (
        <p className="text-sm text-muted-foreground">
          Lege zuerst ein Projekt an, dann kannst du dessen Branding bearbeiten.
        </p>
      )}
      {projects.map((p) => (
        <SingleProjectBranding key={p.id} project={p} />
      ))}
    </div>
  );
}

function SingleProjectBranding({ project }: { project: Project }) {
  const [accentHex, setAccentHex] = useState(
    project.brandingAccentHex ?? DEFAULT_ACCENT_HEX
  );
  const [logoPreview, setLogoPreview] = useState<string | null>(
    project.brandingLogoBase64
  );
  const [pendingRemoveLogo, setPendingRemoveLogo] = useState(false);
  const [pendingLogoData, setPendingLogoData] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    setError(null);
    setSuccess(null);
    if (!ALLOWED_LOGO_MIME.has(file.type)) {
      setError(`Dateityp ${file.type} nicht erlaubt. Erlaubt: PNG, JPG, SVG, WebP.`);
      return;
    }
    if (file.size > MAX_LOGO_BYTES) {
      setError(
        `Datei zu groß (${Math.round(file.size / 1024)} KB, max ${Math.round(
          MAX_LOGO_BYTES / 1024
        )} KB).`
      );
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result);
      setLogoPreview(dataUrl);
      setPendingLogoData(dataUrl);
      setPendingRemoveLogo(false);
    };
    reader.onerror = () => setError("Datei konnte nicht gelesen werden.");
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    setLogoPreview(null);
    setPendingLogoData(null);
    setPendingRemoveLogo(true);
  };

  const handleSave = () => {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const r = await updateProjectBrandingAction(project.id, {
        accentHex,
        logoDataUrl: pendingLogoData,
        removeLogo: pendingRemoveLogo,
      });
      if (!r.ok) setError(r.error ?? "Unbekannter Fehler");
      else {
        setSuccess("Branding gespeichert.");
        setPendingLogoData(null);
        setPendingRemoveLogo(false);
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{project.name}</CardTitle>
        <CardDescription className="font-mono text-xs">
          /projekte/{project.slug}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6 sm:grid-cols-[160px_1fr]">
          {/* Logo-Spalte */}
          <div className="space-y-2">
            <Label>Logo</Label>
            <div
              className="flex h-24 w-full items-center justify-center overflow-hidden rounded-md border border-dashed border-border bg-muted/30"
              aria-label="Logo-Vorschau"
            >
              {logoPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={logoPreview}
                  alt="Logo"
                  className="max-h-full max-w-full object-contain"
                />
              ) : (
                <span className="text-xs text-muted-foreground">Kein Logo</span>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <input
                ref={fileRef}
                type="file"
                accept="image/png,image/jpeg,image/svg+xml,image/webp"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFile(f);
                  e.target.value = "";
                }}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileRef.current?.click()}
                disabled={isPending}
              >
                <Upload className="mr-1.5 h-3.5 w-3.5" />
                Hochladen
              </Button>
              {logoPreview && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleRemoveLogo}
                  disabled={isPending}
                  className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                  Entfernen
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              SVG/PNG empfohlen. Max {Math.round(MAX_LOGO_BYTES / 1024)} KB.
            </p>
          </div>

          {/* Akzentfarbe + Speichern */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor={`accent-${project.id}`}>Akzentfarbe</Label>
              <div className="flex items-center gap-3">
                <input
                  id={`accent-${project.id}`}
                  type="color"
                  value={accentHex}
                  onChange={(e) => setAccentHex(e.target.value.toUpperCase())}
                  className="h-10 w-14 cursor-pointer rounded-md border border-border bg-background"
                />
                <input
                  type="text"
                  value={accentHex}
                  onChange={(e) => setAccentHex(e.target.value.toUpperCase())}
                  className="block w-32 rounded-md border border-input bg-background px-3 py-2 font-mono text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  pattern="^#[0-9A-Fa-f]{6}$"
                />
                <button
                  type="button"
                  onClick={() => setAccentHex(DEFAULT_ACCENT_HEX)}
                  className="text-xs text-muted-foreground hover:text-foreground underline-offset-2 hover:underline"
                >
                  Zurücksetzen
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                Wird für Akzente in Buttons, Charts und Highlights verwendet.
                Bitte auf ausreichenden Kontrast achten.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button type="button" onClick={handleSave} disabled={isPending}>
                {isPending ? "Speichern…" : "Branding speichern"}
              </Button>
            </div>

            {error && (
              <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            )}
            {success && (
              <p className="rounded-md bg-success/10 px-3 py-2 text-sm text-success">
                {success}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
