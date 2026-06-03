"use client";

import { useState, useTransition } from "react";
import { updateWidgetConfigAction } from "@/lib/actions/widgets";
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
import type { WidgetConfigField } from "@/lib/widgets/types";

interface Props {
  widgetId: string;
  initialTitle: string | null;
  initialConfig: Record<string, unknown>;
  schema: WidgetConfigField[];
  onSaved?: () => void;
}

/**
 * Generischer Config-Form fuer ein Widget.
 * Rendert pro Eintrag im Schema das passende Input-Element.
 * Speichert via updateWidgetConfigAction.
 */
export function WidgetConfigForm({
  widgetId,
  initialTitle,
  initialConfig,
  schema,
  onSaved,
}: Props) {
  const [title, setTitle] = useState(initialTitle ?? "");
  const [values, setValues] = useState<Record<string, unknown>>({ ...initialConfig });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const setField = (key: string, value: unknown) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const r = await updateWidgetConfigAction({
        widgetId,
        config: values,
        title: title.trim() || null,
      });
      if (!r.ok) setError(r.error ?? "Unbekannter Fehler");
      else {
        setSuccess("Gespeichert.");
        onSaved?.();
      }
    });
  };

  return (
    <div className="space-y-3 rounded-md border border-border bg-muted/20 p-3">
      <div className="space-y-1">
        <Label className="text-xs" htmlFor={`title-${widgetId}`}>
          Titel (optional)
        </Label>
        <Input
          id={`title-${widgetId}`}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Eigener Titel (sonst Default)"
        />
      </div>

      {schema.map((field) => {
        const v = values[field.key] ?? field.defaultValue;
        const id = `field-${widgetId}-${field.key}`;
        switch (field.type) {
          case "text":
            return (
              <div key={field.key} className="space-y-1">
                <Label className="text-xs" htmlFor={id}>
                  {field.label}
                </Label>
                <Input
                  id={id}
                  value={String(v ?? "")}
                  onChange={(e) => setField(field.key, e.target.value)}
                />
                {field.description && (
                  <p className="text-xs text-muted-foreground">{field.description}</p>
                )}
              </div>
            );
          case "number":
            return (
              <div key={field.key} className="space-y-1">
                <Label className="text-xs" htmlFor={id}>
                  {field.label}
                </Label>
                <Input
                  id={id}
                  type="number"
                  value={Number(v ?? 0)}
                  onChange={(e) => setField(field.key, parseInt(e.target.value, 10))}
                />
              </div>
            );
          case "select":
            return (
              <div key={field.key} className="space-y-1">
                <Label className="text-xs" htmlFor={id}>
                  {field.label}
                </Label>
                <Select
                  value={String(v ?? "")}
                  onValueChange={(val) => setField(field.key, val)}
                >
                  <SelectTrigger id={id}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(field.options ?? []).map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            );
          case "checkbox":
            return (
              <div key={field.key} className="flex items-start gap-2">
                <input
                  id={id}
                  type="checkbox"
                  checked={Boolean(v)}
                  onChange={(e) => setField(field.key, e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-input"
                />
                <div className="space-y-0.5">
                  <Label htmlFor={id} className="text-xs">
                    {field.label}
                  </Label>
                  {field.description && (
                    <p className="text-xs text-muted-foreground">
                      {field.description}
                    </p>
                  )}
                </div>
              </div>
            );
        }
      })}

      <div className="flex items-center gap-2 pt-1">
        <Button size="sm" onClick={handleSave} disabled={isPending}>
          {isPending ? "Speichern…" : "Speichern"}
        </Button>
        {error && (
          <span className="rounded-md bg-destructive/10 px-2 py-0.5 text-xs text-destructive">
            {error}
          </span>
        )}
        {success && (
          <span className="rounded-md bg-success/10 px-2 py-0.5 text-xs text-success">
            {success}
          </span>
        )}
      </div>
    </div>
  );
}
