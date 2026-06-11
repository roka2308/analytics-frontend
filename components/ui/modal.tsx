"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  /** Breite des Dialogs (max-w-*). Default: max-w-lg */
  className?: string;
  /** Inhalt oben ausrichten (lange/scrollbare Dialoge) statt zentriert */
  align?: "center" | "top";
}

/**
 * Zentrales Modal-Primitive.
 *
 * WICHTIG: Rendert via createPortal direkt an document.body. Damit
 * entkommt der Dialog allen Stacking-Contexts der Vorfahren (z.B. der
 * Topbar mit `backdrop-blur`, die sonst das Modal "hinter den Header"
 * einsperrt). z-Index liegt ueber Sidebar/Drawer (z-40) und Header (z-10).
 *
 * Features: ESC schliesst, Klick auf Backdrop schliesst, Body-Scroll-Lock
 * solange offen, Fokus liegt initial auf dem Dialog.
 */
export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  className,
  align = "center",
}: ModalProps) {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    // Scroll-Lock
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!mounted || !open) return null;

  return createPortal(
    <div
      className={cn(
        "fixed inset-0 z-[100] flex justify-center overflow-y-auto bg-black/50 p-4 sm:p-8",
        align === "center" ? "items-center" : "items-start"
      )}
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className={cn(
          "w-full max-w-lg rounded-lg border border-border bg-card p-5 shadow-xl",
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {(title || description) && (
          <div className="mb-3 flex items-start justify-between gap-4">
            <div className="min-w-0">
              {title && (
                <h3 className="text-base font-semibold text-foreground">{title}</h3>
              )}
              {description && (
                <p className="text-xs text-muted-foreground">{description}</p>
              )}
            </div>
            <button
              onClick={onClose}
              aria-label="Schließen"
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
        {children}
      </div>
    </div>,
    document.body
  );
}
