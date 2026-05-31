import Link from "next/link";
import { SignOutButton } from "./SignOutButton";
import { ThemeToggle } from "./ThemeToggle";
import { DashboardPicker, type DashboardLink } from "./DashboardPicker";

interface Props {
  dashboards?: DashboardLink[];
  currentDashboardSlug?: string;
}

export function Header({ dashboards, currentDashboardSlug }: Props = {}) {
  return (
    <header className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="text-xl font-semibold text-foreground hover:text-accent-text transition-colors"
          >
            Analytics
          </Link>
          {dashboards && dashboards.length > 0 && (
            <>
              <span aria-hidden className="text-muted-foreground">/</span>
              <DashboardPicker
                dashboards={dashboards}
                currentSlug={currentDashboardSlug}
              />
            </>
          )}
        </div>
        <nav className="flex items-center gap-1 sm:gap-2">
          {!dashboards && (
            <Link
              href="/dashboard"
              className="rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              Dashboard
            </Link>
          )}
          <Link
            href="/settings"
            className="rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            Einstellungen
          </Link>
          <div className="ml-1 flex items-center gap-1 border-l border-border pl-2">
            <ThemeToggle />
            <SignOutButton />
          </div>
        </nav>
      </div>
    </header>
  );
}
