import { ThemeToggle } from "@/components/dashboard/ThemeToggle";

interface Props {
  title: string;
  subtitle?: React.ReactNode;
  right?: React.ReactNode;
}

/**
 * Topbar fuer das App-Shell-Layout.
 *
 * Desktop: einzeilig, Theme-Toggle rechts.
 * Mobile: gestapelt (Titel oben, Actions darunter). Der Theme-Toggle
 *         liegt auf Mobile schon in der Sidebar-Mobile-Navbar und wird
 *         hier ausgeblendet.
 */
export function Topbar({ title, subtitle, right }: Props) {
  return (
    <header className="sticky top-14 z-10 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:top-0">
      <div className="flex flex-col gap-3 px-4 py-3 sm:px-6 md:h-16 md:flex-row md:items-center md:justify-between md:gap-4 md:py-0">
        <div className="min-w-0">
          <h1 className="heading-display truncate text-lg text-foreground sm:text-xl">
            {title}
          </h1>
          {subtitle && (
            <div className="mt-0.5 flex flex-wrap items-center text-xs text-muted-foreground">
              {subtitle}
            </div>
          )}
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {right}
          <span className="hidden md:inline-flex">
            <ThemeToggle />
          </span>
        </div>
      </div>
    </header>
  );
}
