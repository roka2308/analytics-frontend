import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/requireUser";
import {
  getOrCreateDefaultOrg,
  getVisibleProjectsForSession,
} from "@/lib/db/queries";

export const dynamic = "force-dynamic";

/**
 * /projekte -> erstes sichtbares Projekt des Users.
 */
export default async function ProjectsIndex({
  searchParams,
}: {
  searchParams: Record<string, string | undefined>;
}) {
  const session = await requireUser();
  // Default-Org sicherstellen
  await getOrCreateDefaultOrg();
  const projects = await getVisibleProjectsForSession(session);

  if (projects.length === 0) {
    redirect("/settings");
  }

  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(searchParams)) {
    if (v) qs.set(k, v);
  }
  const tail = qs.toString() ? `?${qs.toString()}` : "";

  redirect(`/projekte/${projects[0].slug}${tail}`);
}
