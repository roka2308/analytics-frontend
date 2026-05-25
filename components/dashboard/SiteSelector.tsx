"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface SiteSelectorOption {
  matomoSiteId: number;
  label: string;
  orgName: string;
}

interface Props {
  sites: SiteSelectorOption[];
  currentSiteId: number;
  showOrgGroups: boolean; // true für Admins
}

export function SiteSelector({ sites, currentSiteId, showOrgGroups }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  if (sites.length === 0) return null;

  const handleChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("site", value);
    router.push(`${pathname}?${params.toString()}`);
  };

  // Wenn Org-Gruppierung aktiv: nach Org gruppieren
  if (showOrgGroups) {
    const groups = new Map<string, SiteSelectorOption[]>();
    for (const site of sites) {
      if (!groups.has(site.orgName)) groups.set(site.orgName, []);
      groups.get(site.orgName)!.push(site);
    }

    return (
      <Select value={String(currentSiteId)} onValueChange={handleChange}>
        <SelectTrigger className="w-[260px]">
          <SelectValue placeholder="Website wählen" />
        </SelectTrigger>
        <SelectContent>
          {Array.from(groups.entries()).map(([orgName, orgSites]) => (
            <SelectGroup key={orgName}>
              <SelectLabel>{orgName}</SelectLabel>
              {orgSites.map((site) => (
                <SelectItem key={site.matomoSiteId} value={String(site.matomoSiteId)}>
                  {site.label}
                </SelectItem>
              ))}
            </SelectGroup>
          ))}
        </SelectContent>
      </Select>
    );
  }

  // Viewer-Variante ohne Gruppen
  return (
    <Select value={String(currentSiteId)} onValueChange={handleChange}>
      <SelectTrigger className="w-[220px]">
        <SelectValue placeholder="Website wählen" />
      </SelectTrigger>
      <SelectContent>
        {sites.map((site) => (
          <SelectItem key={site.matomoSiteId} value={String(site.matomoSiteId)}>
            {site.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
