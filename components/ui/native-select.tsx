import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface NativeSelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  /** Klassen fuer den umschliessenden Container (Breite/Flex), z.B. "flex-1" */
  wrapperClassName?: string;
}

/**
 * Natives <select> im Design-System-Look (identisch zu Input und dem
 * Radix-SelectTrigger: h-11, rounded-lg, border-input, Fokus-Ring in
 * --ring = Scale-Blau, NICHT Magenta).
 *
 * Wir nutzen das native Element bewusst dort, wo die Radix-Variante
 * Overkill waere (einfache Formular-Selects, optgroups, Server-Forms).
 * appearance-none + eigener Chevron sorgt fuer einheitliche Optik.
 *
 * `className` stylt das <select> selbst (z.B. Hoehe fuer kompakte
 * Toolbar-Controls), `wrapperClassName` den Container (Breite/Flex).
 */
export const NativeSelect = React.forwardRef<HTMLSelectElement, NativeSelectProps>(
  ({ className, wrapperClassName, children, ...props }, ref) => {
    return (
      <div className={cn("relative", wrapperClassName)}>
        <select
          ref={ref}
          className={cn(
            "flex h-11 w-full appearance-none rounded-lg border border-input bg-background px-3.5 py-2 pr-9 text-sm text-foreground ring-offset-background transition-colors hover:border-foreground/30 focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            className
          )}
          {...props}
        >
          {children}
        </select>
        <ChevronDown
          aria-hidden
          className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 opacity-50"
        />
      </div>
    );
  }
);
NativeSelect.displayName = "NativeSelect";
