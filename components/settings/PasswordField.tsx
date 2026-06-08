"use client";

import { useState } from "react";
import { Eye, EyeOff, RefreshCw, Copy, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

/** Erzeugt ein starkes Zufallspasswort (kryptografisch). */
export function generatePassword(length = 16): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%&*?";
  const arr = new Uint32Array(length);
  crypto.getRandomValues(arr);
  let out = "";
  for (let i = 0; i < length; i++) out += chars[arr[i] % chars.length];
  return out;
}

/**
 * Passwort-Eingabe (controlled): maskiert mit Anzeigen-Toggle, Generieren- und
 * Kopieren-Button. `name` setzen, damit der Wert in einem FormData-Submit landet.
 */
export function PasswordField({
  value,
  onChange,
  name,
  id,
  placeholder = "Passwort",
}: {
  value: string;
  onChange: (v: string) => void;
  name?: string;
  id?: string;
  placeholder?: string;
}) {
  const [show, setShow] = useState(false);
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard nicht verfuegbar – ignorieren */
    }
  };

  return (
    <div className="flex items-center gap-1.5">
      <div className="relative flex-1">
        <Input
          id={id}
          name={name}
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete="new-password"
          className="pr-9"
        />
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          aria-label={show ? "Passwort verbergen" : "Passwort anzeigen"}
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={() => {
          onChange(generatePassword());
          setShow(true);
        }}
        title="Starkes Passwort generieren"
      >
        <RefreshCw className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={copy}
        disabled={!value}
        title="Kopieren"
      >
        {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
      </Button>
    </div>
  );
}
