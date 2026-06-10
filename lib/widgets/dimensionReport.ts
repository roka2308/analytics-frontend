// =============================================================
//  Aufloesung der Dimension/Metrik-Konfiguration fuer die katalog-faehigen
//  Breakdown-/Donut-/Bar-Widgets.
//
//  Unterstuetzt:
//   - NEU: { apiModule, apiAction, metric, limit, reportLabel }
//   - ALT (abwaertskompatibel): { source: "device-type" | ... }
//  -> kein bestehendes Widget bricht; neue nutzen den vollen Report-Katalog.
// =============================================================

export interface ResolvedDimension {
  apiModule: string;
  apiAction: string;
  metric: string;
  limit: number;
  label: string;
}

/** Alte Breakdown-Quellen -> Matomo-Report (fuer gespeicherte Widgets). */
const LEGACY_SOURCE: Record<string, { module: string; action: string; label: string }> = {
  "device-type": { module: "DevicesDetection", action: "getType", label: "Gerätetyp" },
  "device-brand": { module: "DevicesDetection", action: "getBrand", label: "Gerätemarke" },
  browser: { module: "DevicesDetection", action: "getBrowsers", label: "Browser" },
  os: { module: "DevicesDetection", action: "getOsFamilies", label: "Betriebssystem" },
  country: { module: "UserCountry", action: "getCountry", label: "Land" },
  "referrer-type": { module: "Referrers", action: "getReferrerType", label: "Traffic-Quelle" },
  "search-engine": { module: "Referrers", action: "getSearchEngines", label: "Suchmaschine" },
  "social-network": { module: "Referrers", action: "getSocials", label: "Soziales Netzwerk" },
  "event-category": { module: "Events", action: "getCategory", label: "Event-Kategorie" },
  "event-action": { module: "Events", action: "getAction", label: "Event-Aktion" },
};

export function resolveDimensionConfig(config: Record<string, unknown>): ResolvedDimension {
  const limit = typeof config.limit === "number" ? config.limit : 10;
  const apiModule = config.apiModule as string | undefined;
  const apiAction = config.apiAction as string | undefined;
  if (apiModule && apiAction) {
    return {
      apiModule,
      apiAction,
      metric: (config.metric as string) || "nb_visits",
      limit,
      label: (config.reportLabel as string) || "",
    };
  }
  const legacy = LEGACY_SOURCE[config.source as string];
  if (legacy) {
    return { apiModule: legacy.module, apiAction: legacy.action, metric: "nb_visits", limit, label: legacy.label };
  }
  // Fallback
  return { apiModule: "UserCountry", apiAction: "getCountry", metric: "nb_visits", limit, label: "Länder" };
}
