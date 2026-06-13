"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { ChevronDown, LayoutDashboard } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface DashboardLink {
  slug: string;
  name: string;
}

interface Props {
  dashboards: DashboardLink[];
  currentSlug?: string;
}

export function DashboardPicker({ dashboards, currentSlug }: Props) {
  const params = useParams();
  const searchParams = useSearchParams();
  const orgSlug = (params?.orgSlug as string | undefined) ?? null;

  // Query-Params beim Wechsel mitnehmen (range, compare, site).
  const qs = searchParams.toString();
  const tail = qs ? `?${qs}` : "";

  const buildHref = (dashSlug: string) =>
    orgSlug
      ? `/projekte/${orgSlug}/dashboards/${dashSlug}${tail}`
      : `/dashboards/${dashSlug}${tail}`;

  const current = dashboards.find((d) => d.slug === currentSlug);
  const displayName = current?.name ?? "Dashboards";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
        <LayoutDashboard className="h-4 w-4 text-muted-foreground" />
        <span className="truncate max-w-[200px]">{displayName}</span>
        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-[220px]">
        <DropdownMenuLabel>Dashboards</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {dashboards.map((d) => (
          <DropdownMenuItem key={d.slug} asChild>
            <Link
              href={buildHref(d.slug)}
              className={d.slug === currentSlug ? "bg-muted" : ""}
            >
              {d.name}
            </Link>
          </DropdownMenuItem>
        ))}
        {dashboards.length === 0 && (
          <DropdownMenuItem disabled>Keine Dashboards</DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/kunden" className="text-muted-foreground">
            Dashboards verwalten…
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
