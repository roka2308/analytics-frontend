import { getServerSession } from "next-auth";
import { authOptions } from "./config";
import { redirect } from "next/navigation";

export async function requireUser() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  return session;
}

export async function assertSiteAccess(
  _userId: string,
  _siteId: number
): Promise<void> {
  // M4: Hier kommt die echte Autorisierungs-Prüfung gegen die DB.
  // Vorerst: Jeder eingeloggte Nutzer hat Zugriff.
}
