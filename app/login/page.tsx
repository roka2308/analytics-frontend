import { redirect } from "next/navigation";
import { countUsers } from "@/lib/auth/users";
import { LoginForm } from "@/components/login/LoginForm";

export default async function LoginPage() {
  // Wenn noch kein Admin existiert → ersten Setup-Lauf erzwingen
  const existing = await countUsers();
  if (existing === 0) {
    redirect("/setup");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold text-slate-900">Analytics Dashboard</h1>
          <p className="mt-2 text-sm text-slate-500">Bitte anmelden</p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
