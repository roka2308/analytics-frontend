import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function Home() {
  const session = await getServerSession(authOptions);

  if (session) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight text-foreground">
          Analytics Dashboard
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Deine Matomo-Daten, klar und fokussiert.
        </p>
        <div className="mt-10">
          <Link
            href="/login"
            className="inline-block rounded-md bg-accent px-6 py-3 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
          >
            Anmelden
          </Link>
        </div>
      </div>
    </div>
  );
}
