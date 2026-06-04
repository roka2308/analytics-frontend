"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, BarChart3 } from "lucide-react";
import { ThemeToggle } from "@/components/dashboard/ThemeToggle";
import {
  SidebarNav,
  type SidebarProject,
  type SidebarDashboard,
} from "./SidebarNav";
import { cn } from "@/lib/utils";

interface Props {
  projects: SidebarProject[];
  currentProjectSlug?: string;
  currentProjectLogo?: string | null;
  dashboards: SidebarDashboard[];
  currentDashboardSlug?: string;
}

export function Sidebar(props: Props) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  // Drawer bei Routenwechsel schliessen
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Body-Scroll sperren, wenn Drawer offen
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  return (
    <>
      {/* Desktop-Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-60 flex-col border-r border-border bg-card md:flex">
        <SidebarNav {...props} />
      </aside>

      {/* Mobile-Topbar mit Hamburger */}
      <div className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-background/95 px-4 backdrop-blur md:hidden">
        <button
          onClick={() => setMobileOpen(true)}
          aria-label="Menü öffnen"
          className="inline-flex h-9 w-9 items-center justify-center rounded-md text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          <Menu className="h-5 w-5" />
        </button>
        <Link href="/" className="flex items-center gap-2">
          <span
            aria-hidden
            className="flex h-7 w-7 items-center justify-center rounded-md bg-accent text-accent-foreground"
          >
            <BarChart3 className="h-4 w-4" />
          </span>
          <span className="text-sm font-semibold text-foreground">Analytics</span>
        </Link>
        <ThemeToggle />
      </div>

      {/* Mobile-Drawer */}
      <div
        className={cn(
          "fixed inset-0 z-40 md:hidden",
          mobileOpen ? "pointer-events-auto" : "pointer-events-none"
        )}
        aria-hidden={!mobileOpen}
      >
        {/* Backdrop */}
        <div
          onClick={() => setMobileOpen(false)}
          className={cn(
            "absolute inset-0 bg-foreground/40 backdrop-blur-sm transition-opacity duration-200",
            mobileOpen ? "opacity-100" : "opacity-0"
          )}
        />
        {/* Drawer-Panel */}
        <div
          className={cn(
            "absolute inset-y-0 left-0 w-72 max-w-[85%] border-r border-border bg-card shadow-xl transition-transform duration-200 ease-out",
            mobileOpen ? "translate-x-0" : "-translate-x-full"
          )}
          role="dialog"
          aria-modal="true"
          aria-label="Navigation"
        >
          <button
            onClick={() => setMobileOpen(false)}
            aria-label="Menü schließen"
            className="absolute right-3 top-3.5 z-10 inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
          <SidebarNav {...props} onNavigate={() => setMobileOpen(false)} />
        </div>
      </div>
    </>
  );
}
