import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="w-full max-w-md text-center">
        <p className="text-sm font-medium text-accent-text">404</p>
        <h1 className="mt-2 text-3xl font-semibold text-foreground">
          Seite nicht gefunden
        </h1>
        <p className="mt-4 text-sm text-muted-foreground">
          Die Seite, die du gesucht hast, existiert nicht oder wurde verschoben.
        </p>
        <div className="mt-8">
          <Link
            href="/dashboard"
            className="inline-block rounded-md bg-accent px-5 py-2 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
          >
            Zum Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
