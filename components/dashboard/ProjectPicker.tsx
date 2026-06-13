"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Briefcase, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface ProjectLink {
  slug: string;
  name: string;
}

interface Props {
  projects: ProjectLink[];
  currentSlug?: string;
}

export function ProjectPicker({ projects, currentSlug }: Props) {
  const searchParams = useSearchParams();
  // Range/Compare/Site sollen beim Wechsel erhalten bleiben.
  // Site-IDs sind allerdings projekt-spezifisch — beim Projekt-Wechsel sollten
  // wir die "site" raussparen, damit das neue Projekt sauber initialisiert.
  const qs = new URLSearchParams();
  for (const k of ["range", "from", "to", "compare"] as const) {
    const v = searchParams.get(k);
    if (v) qs.set(k, v);
  }
  const tail = qs.toString() ? `?${qs.toString()}` : "";

  const current = projects.find((p) => p.slug === currentSlug);
  const displayName = current?.name ?? "Projekt";

  // Nur ein Projekt → kein Dropdown, statisches Label
  if (projects.length <= 1) {
    return (
      <div className="inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm text-foreground">
        <Briefcase className="h-4 w-4 text-muted-foreground" />
        <span className="truncate max-w-[180px]">{displayName}</span>
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
        <Briefcase className="h-4 w-4 text-muted-foreground" />
        <span className="truncate max-w-[180px]">{displayName}</span>
        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-[220px]">
        <DropdownMenuLabel>Projekte</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {projects.map((p) => (
          <DropdownMenuItem key={p.slug} asChild>
            <Link
              href={`/projekte/${p.slug}${tail}`}
              className={p.slug === currentSlug ? "bg-muted" : ""}
            >
              {p.name}
            </Link>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/kunden" className="text-muted-foreground">
            Projekte verwalten…
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
