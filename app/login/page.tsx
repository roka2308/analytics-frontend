import { redirect } from "next/navigation";
import { countUsers } from "@/lib/auth/users";
import { LoginForm } from "@/components/login/LoginForm";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const existing = await countUsers();
  if (existing === 0) {
    redirect("/setup");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold text-foreground">Analytics Dashboard</h1>
          <p className="mt-2 text-sm text-muted-foreground">Bitte anmelden</p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
