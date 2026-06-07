import { requireAdmin } from "@/lib/auth/requireUser";
import { Building2 } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function KundenIndexPage() {
  await requireAdmin();
  return (
    <div className="flex h-full min-h-[300px] items-center justify-center p-10 text-center">
      <div className="space-y-2">
        <Building2 className="mx-auto h-8 w-8 text-muted-foreground" />
        <p className="text-sm font-medium text-foreground">Kunde auswählen</p>
        <p className="text-sm text-muted-foreground">
          Wähle links einen Kunden aus oder lege über das Plus einen neuen an.
        </p>
      </div>
    </div>
  );
}
