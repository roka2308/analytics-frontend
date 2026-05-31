import Link from "next/link";
import { SignOutButton } from "./SignOutButton";
import { ThemeToggle } from "./ThemeToggle";

export function Header() {
  return (
    <header className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link
          href="/dashboard"
          className="text-xl font-semibold text-foreground hover:text-accent-text transition-colors"
        >
          Analytics
        </Link>
        <nav className="flex items-center gap-1 sm:gap-4">
          <Link
            href="/dashboard"
            className="rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            Dashboard
          </Link>
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
