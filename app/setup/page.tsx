import { redirect } from "next/navigation";
import { countUsers } from "@/lib/auth/users";
import { SetupForm } from "@/components/setup/SetupForm";

// Pro Request frisch rendern, nie statisch beim Build vorberechnen
export const dynamic = "force-dynamic";

export default async function SetupPage() {
  const existing = await countUsers();
  if (existing > 0) {
    // Setup ist bereits erfolgt – weiterleiten
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold text-slate-900">Erste Einrichtung</h1>
          <p className="mt-2 text-sm text-slate-500">
            Lege dein Admin-Konto an. Du bist die erste Nutzerin / der erste Nutzer.
          </p>
        </div>
        <SetupForm />
      </div>
    </div>
  );
}
