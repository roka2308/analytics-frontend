import { Sidebar } from "./Sidebar";
import type { SidebarProject, SidebarDashboard } from "./SidebarNav";

interface Props {
  projects: SidebarProject[];
  currentProjectSlug?: string;
  currentProjectLogo?: string | null;
  dashboards: SidebarDashboard[];
  currentDashboardSlug?: string;
  children: React.ReactNode;
}

/**
 * Standard-Layout fuer eingeloggte Bereiche.
 * - Sidebar links (240px breit, fixed)
 * - Content rechts daneben
 *
 * Auf Mobile: Sidebar wird ausgeblendet (md:flex). Mobile-Menu kommt
 * in einer spaeteren Iteration – im aktuellen Design-Refinement
 * fokussieren wir Desktop.
 */
export function AppShell({
  projects,
  currentProjectSlug,
  currentProjectLogo,
  dashboards,
  currentDashboardSlug,
  children,
}: Props) {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar
        projects={projects}
        currentProjectSlug={currentProjectSlug}
        currentProjectLogo={currentProjectLogo}
        dashboards={dashboards}
        currentDashboardSlug={currentDashboardSlug}
      />
      <div className="md:pl-60">{children}</div>
    </div>
  );
}
