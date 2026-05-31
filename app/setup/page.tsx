import { redirect } from "next/navigation";
import { countUsers } from "@/lib/auth/users";
import { SetupForm } from "@/components/setup/SetupForm";

export const dynamic = "force-dynamic";

export default async function SetupPage() {
  const existing = await countUsers();
  if (existing > 0) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold text-foreground">Erste Einrichtung</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Lege dein Admin-Konto an. Du bist die erste Nutzerin / der erste Nutzer.
          </p>
        </div>
        <SetupForm />
      </div>
    </div>
  );
}
