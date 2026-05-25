"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SiteOption {
  matomoSiteId: number;
  label: string;
}

interface Props {
  sites: SiteOption[];
  currentSiteId: number;
}

export function SiteSelector({ sites, currentSiteId }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  if (sites.length === 0) return null;

  const handleChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("site", value);
    router.push(`${pathname}?${params.toString()}`);
  };

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
