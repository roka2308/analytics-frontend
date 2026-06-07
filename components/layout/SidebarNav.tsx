"use client";

import Link from "next/link";
import { usePathname, useParams } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  LayoutDashboard,
  BarChart3,
  Briefcase,
  Building2,
  KeyRound,
  ChevronDown,
  LogOut,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export interface SidebarProject {
  slug: string;
  name: string;
}

export interface SidebarDashboard {
  slug: string;
  name: string;
  isDefault: boolean;
}

interface Props {
  projects: SidebarProject[];
  currentProjectSlug?: string;
  currentProjectLogo?: string | null;
  dashboards: SidebarDashboard[];
  currentDashboardSlug?: string;
  /** Wird bei Navigation aufgerufen – auf Mobile zum Schliessen des Drawers */
  onNavigate?: () => void;
}

export function SidebarNav({
  projects,
  currentProjectSlug,
  currentProjectLogo,
  dashboards,
  currentDashboardSlug,
  onNavigate,
}: Props) {
  const pathname = usePathname();
  const params = useParams();
  const orgSlug = (params?.orgSlug as string | undefined) ?? currentProjectSlug;
  const { data: session } = useSession();

  const currentProject = projects.find((p) => p.slug === currentProjectSlug);
  const userName = session?.user?.name ?? session?.user?.email ?? "Nutzer";
  const role = session?.user?.role;
  const isAdmin = role === "admin";
  const userRole = role === "admin" ? "Admin" : role === "creator" ? "Creator" : "Viewer";

  return (
    <div className="flex h-full flex-col">
      {/* Brand */}
      <div className="flex h-16 items-center gap-2.5 border-b border-border px-5">
        {currentProjectLogo ? (
          <span
            aria-hidden
            className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-lg border border-border bg-muted/40"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={currentProjectLogo}
              alt=""
              className="max-h-full max-w-full object-contain"
            />
          </span>
        ) : (
          <span
            aria-hidden
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-accent-foreground shadow-sm"
          >
            <BarChart3 className="h-4.5 w-4.5" />
          </span>
        )}
        <Link
          href="/"
          onClick={onNavigate}
          className="text-base font-semibold tracking-tight text-foreground transition-colors hover:text-accent-text"
        >
          Analytics
        </Link>
      </div>

      {/* Project-Selector */}
      <div className="border-b border-border px-3 py-3">
        {projects.length <= 1 ? (
          <div className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm">
            <Briefcase className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="truncate text-foreground">
              {currentProject?.name ?? "Projekt"}
            </span>
          </div>
        ) : (
          <DropdownMenu>
            <DropdownMenuTrigger className="flex w-full items-center gap-2 rounded-lg border border-border bg-background/50 px-2.5 py-2 text-sm text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">
              <Briefcase className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="flex-1 truncate text-left">
                {currentProject?.name ?? "Projekt"}
              </span>
              <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="min-w-[220px]">
              <DropdownMenuLabel>Projekte</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {projects.map((p) => (
                <DropdownMenuItem key={p.slug} asChild>
                  <Link
                    href={`/projekte/${p.slug}`}
                    onClick={onNavigate}
                    className={p.slug === currentProjectSlug ? "bg-muted" : ""}
                  >
                    {p.name}
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Hauptnavigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {dashboards.length > 0 && (
          <>
            <p className="px-2.5 pb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Dashboards
            </p>
            <ul className="space-y-0.5">
              {dashboards.map((d) => {
                const href = orgSlug
                  ? `/projekte/${orgSlug}/dashboards/${d.slug}`
                  : `/dashboards/${d.slug}`;
                const isActive =
                  pathname?.includes(`/dashboards/${d.slug}`) ||
                  currentDashboardSlug === d.slug;
                return (
                  <li key={d.slug}>
                    <Link
                      href={href}
                      onClick={onNavigate}
                      className={cn(
                        "group flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors",
                        isActive
                          ? "bg-accent/10 font-medium text-accent-text"
                          : "text-foreground hover:bg-muted"
                      )}
                    >
                      <LayoutDashboard
                        className={cn(
                          "h-4 w-4 shrink-0 transition-colors",
                          isActive
                            ? "text-accent-text"
                            : "text-muted-foreground group-hover:text-foreground"
                        )}
                      />
                      <span className="truncate">{d.name}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </>
        )}

        <p className="mt-6 px-2.5 pb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Verwaltung
        </p>
        <ul className="space-y-0.5">
          {isAdmin && (
            <li>
              <Link
                href="/kunden"
                onClick={onNavigate}
                className={cn(
                  "group flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors",
                  pathname?.startsWith("/kunden")
                    ? "bg-accent/10 font-medium text-accent-text"
                    : "text-foreground hover:bg-muted",
                )}
              >
                <Building2
                  className={cn(
                    "h-4 w-4 shrink-0 transition-colors",
                    pathname?.startsWith("/kunden")
                      ? "text-accent-text"
                      : "text-muted-foreground group-hover:text-foreground",
                  )}
                />
                Kunden
              </Link>
            </li>
          )}
          {isAdmin && (
            <li>
              <Link
                href="/zugriffe"
                onClick={onNavigate}
                className={cn(
                  "group flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors",
                  pathname?.startsWith("/zugriffe")
                    ? "bg-accent/10 font-medium text-accent-text"
                    : "text-foreground hover:bg-muted",
                )}
              >
                <KeyRound
                  className={cn(
                    "h-4 w-4 shrink-0 transition-colors",
                    pathname?.startsWith("/zugriffe")
                      ? "text-accent-text"
                      : "text-muted-foreground group-hover:text-foreground",
                  )}
                />
                Zugriffsrechte
              </Link>
            </li>
          )}
        </ul>
      </nav>

      {/* User-Footer */}
      <div className="border-t border-border px-3 py-3">
        <DropdownMenu>
          <DropdownMenuTrigger className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">
            <span
              aria-hidden
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-semibold text-accent-foreground"
            >
              {(userName || "U").charAt(0).toUpperCase()}
            </span>
            <div className="min-w-0 flex-1 text-left">
              <p className="truncate text-sm font-medium text-foreground">
                {userName}
              </p>
              <p className="truncate text-xs text-muted-foreground">{userRole}</p>
            </div>
            <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-[200px]">
            <DropdownMenuLabel>Konto</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/konto" onClick={onNavigate}>
                Mein Konto
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/" })}>
              <LogOut className="mr-2 h-4 w-4" />
              Abmelden
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
