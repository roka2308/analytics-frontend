import Link from "next/link";
import { Link2Off } from "lucide-react";

export default function ShareNotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="w-full max-w-md text-center">
        <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <Link2Off className="h-6 w-6" />
        </div>
        <h1 className="text-2xl font-semibold text-foreground">
          Link nicht mehr gültig
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Dieser geteilte Link existiert nicht (mehr), wurde widerrufen oder ist
          abgelaufen. Bitte wende dich an die Person, die ihn dir geschickt hat,
          um einen neuen zu erhalten.
        </p>
        <div className="mt-8">
          <Link
            href="/"
            className="inline-block rounded-md border border-border bg-card px-5 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
          >
            Zur Startseite
          </Link>
        </div>
      </div>
    </div>
  );
}
