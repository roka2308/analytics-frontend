"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Responsive Master-Detail-Huelle.
 * - Desktop (md+): Liste links (feste Breite) + Detail rechts, nebeneinander.
 * - Mobile: entweder Liste ODER Detail. Ist ein Element ausgewaehlt
 *   (Route unterhalb von basePath), wird das Detail mit "Zurueck"-Leiste
 *   gezeigt; sonst die Liste.
 */
export function MasterDetailShell({
  basePath,
  backLabel = "Zurück zur Liste",
  list,
  children,
}: {
  basePath: string;
  backLabel?: string;
  list: React.ReactNode;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const hasSelection = !!pathname && pathname !== basePath && pathname.startsWith(`${basePath}/`);

  return (
    <div className="md:flex md:min-h-[calc(100vh-8rem)]">
      <aside
        className={cn(
          "border-border md:block md:w-72 md:shrink-0 md:border-r",
          hasSelection ? "hidden" : "block",
        )}
      >
        {list}
      </aside>
      <div className={cn("min-w-0 flex-1", hasSelection ? "block" : "hidden md:block")}>
        {hasSelection && (
          <div className="border-b border-border px-4 py-2 md:hidden">
            <Link
              href={basePath}
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              {backLabel}
            </Link>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
