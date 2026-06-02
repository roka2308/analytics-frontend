import { notFound } from "next/navigation";
import { getOrgBySlug } from "@/lib/db/queries";
import { ProjectThemeStyle } from "@/components/providers/ProjectThemeStyle";

/**
 * Layout fuer alle Projekt-Routen.
 * Laedt das Branding des aktuellen Projekts und wendet es als CSS-Variablen
 * auf alle Kind-Komponenten an.
 *
 * Wichtig: Wir holen das Branding hier zentral, damit jede Sub-Seite das
 * korrekte Theme bekommt, ohne sich selbst darum kuemmern zu muessen.
 */
export default async function ProjectLayout({
  params,
  children,
}: {
  params: { orgSlug: string };
  children: React.ReactNode;
}) {
  const project = await getOrgBySlug(params.orgSlug);
  if (!project) notFound();

  return (
    <ProjectThemeStyle accentHsl={project.brandingAccentHsl}>
      {children}
    </ProjectThemeStyle>
  );
}
