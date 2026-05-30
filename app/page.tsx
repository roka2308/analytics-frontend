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
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight text-slate-900">
          Analytics Dashboard
        </h1>
        <p className="mt-4 text-lg text-slate-600">
          Deine Matomo-Daten, klar und fokussiert.
        </p>
        <div className="mt-10">
          <Link
            href="/login"
            className="inline-block rounded-md bg-slate-900 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-slate-700"
          >
            Anmelden
          </Link>
        </div>
      </div>
    </div>
  );
}
